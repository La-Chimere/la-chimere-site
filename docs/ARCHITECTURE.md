# Architecture technique — La Chimère

Ce document décrit le fonctionnement interne du site web du club La Chimère, à
l'intention d'un·e développeur·se qui reprend ou modifie le code. Ce n'est
**pas** un guide utilisateur — pour les règles de comportement fonctionnelles
(qui peut faire quoi, textes exacts, etc.), voir `docs/cahier-des-charges-la-chimere.docx`.

## Sommaire

1. [Stack et principes généraux](#1-stack-et-principes-généraux)
2. [Arborescence](#2-arborescence)
3. [Modèle de données et migrations](#3-modèle-de-données-et-migrations)
4. [Authentification par pseudo](#4-authentification-par-pseudo)
5. [Les trois clients Supabase](#5-les-trois-clients-supabase)
6. [Modèle d'autorisation (RLS + service_role)](#6-modèle-dautorisation-rls--service_role)
7. [Convention Server Actions](#7-convention-server-actions)
8. [Internationalisation (i18n)](#8-internationalisation-i18n)
9. [Pattern page serveur / composant client](#9-pattern-page-serveur--composant-client)
10. [Composants UI réutilisés](#10-composants-ui-réutilisés)
11. [Développement local](#11-développement-local)
12. [Limitations connues et points d'attention sécurité](#12-limitations-connues-et-points-dattention-sécurité)

---

## 1. Stack et principes généraux

- **Next.js 16** (App Router, Server Components par défaut, Turbopack), **React 19**, **TypeScript strict**.
- **Supabase** : Postgres + Auth + Storage. Row Level Security (RLS) activée sur toutes les tables.
- **Tailwind v4** installé mais peu utilisé : la quasi-totalité du style vient de `src/app/globals.css` (classes portées depuis la maquette HTML d'origine — `.section-card`, `.chip`, `.modal-btn`, `.fab`, etc.). Ne pas chercher de design system Tailwind-first ici.
- **`date-fns`** pour toute la logique de dates (fuseau implicite : le serveur et les navigateurs des membres tournent en heure locale, pas de gestion multi-fuseau).
- Pas de framework de test installé. Pas de génération de types Supabase (`supabase gen types`) — les lignes retournées par les requêtes sont typées manuellement dans `lib/*-types.ts`.
- Convention de nommage : colonnes DB en `snake_case`, tout le code TypeScript en `camelCase`. Chaque page Server Component fait le mapping à la main (pas d'ORM).

### Next.js 16 — pièges spécifiques à cette version

- Le fichier middleware s'appelle **`proxy.ts`** (racine du repo), pas `middleware.ts`, et exporte une fonction `proxy()`, pas `middleware()`.
- `cookies()` (dans `next/headers`) est **asynchrone** — toujours `await cookies()`.
- `params` dans les pages et Route Handlers est une **Promise** (`PageProps<"/route/[id]">` généré automatiquement dans `.next/types`).

## 2. Arborescence

```
src/
  app/
    (app)/            # routes derrière l'auth : layout.tsx fait office de garde
      admin/ announcements/ cgu/ communities/ faq/ keys/
      leaderboard/ members/[id]/ profile/ programme/ settings/
    (auth)/            # login/signup, layout sans Header/BottomNav
    api/admin/reset-password/route.ts   # stub, 501 (non implémenté)
    layout.tsx         # layout racine : police, LocaleProvider, ThemeInit
    page.tsx           # "/" redirige vers /programme ou /login
  components/
    ui/                # primitives génériques (Button, Modal, Chip, MemberPicker, ...)
    events/ announcements/ admin/ communities/ keys/ leaderboard/ profile/ settings/ signup/
    i18n/              # LocaleProvider, LanguageToggle
  lib/
    supabase/{client,server,admin,proxy}.ts
    admin-guard.ts     # requireAdmin / requireSuperAdmin
    slug.ts            # pseudo -> email technique
    *-actions.ts       # Server Actions, un fichier par domaine fonctionnel
    *-types.ts         # DTOs TypeScript (snake_case DB -> camelCase app)
    i18n/              # dictionnaires fr/en + helpers serveur et client
proxy.ts               # racine — l'équivalent middleware.ts en Next 16
migrations/            # SQL brut, numéroté, appliqué à la main via le SQL Editor Supabase
docs/
  cahier-des-charges-la-chimere.docx
  maquette-principale.html          # maquette HTML statique d'origine
  maquette-creation-compte.html
```

Chaque route de `app/(app)/*` suit le même schéma : `page.tsx` est un **Server
Component** qui fait toutes les lectures Supabase (en parallèle via
`Promise.all`), transforme les lignes en DTOs, puis passe des props déjà
prêtes à un unique `components/<domaine>/<Domaine>Client.tsx` qui porte toute
l'interactivité (state, modals, appels aux Server Actions). Voir §9.

## 3. Modèle de données et migrations

Le schéma vit entièrement dans `migrations/*.sql`, appliqué **manuellement**
dans le SQL Editor du dashboard Supabase (pas de CLI/migration runner
automatisé). Chaque fichier est numéroté et additif — ne jamais modifier un
fichier déjà appliqué en production, toujours en ajouter un nouveau.

| Migration | Contenu |
|---|---|
| `0001_init.sql` | Schéma initial : `communities`, `profiles` (étend `auth.users`), `profile_communities`, `events`, `event_communities`, `event_participants`, `club_settings` (ligne singleton), `announcements`, `polls`, `poll_options`, `poll_votes`, `notifications`. RLS activée partout. Trigger `prevent_privileged_self_update` bloquant l'auto-élévation de privilèges. |
| `0002_login_slug.sql` | `profiles.login_slug` (unique) — voir §4. |
| `0003_poll_votes_surrogate_key.sql` | Remplace la clé primaire composite de `poll_votes` par une clé de substitution (nécessaire pour les sondages de type `rating` où `option_id` est `NULL`). |
| `0004_announcement_reads.sql` | Table `announcement_reads` (lu/pas lu par membre). |
| `0005_profile_email_and_avatars.sql` | Colonne `profiles.email` + bucket Storage public `avatars`. |
| `0006_notification_prefs.sql` | `profiles.notification_prefs jsonb`. |
| `0007_communities_anon_read.sql` | Lecture anonyme des communautés non masquées (nécessaire pour l'étape 2 du signup, avant connexion). |
| `0008_signup_validation_toggle.sql` | `club_settings.require_signup_validation` (validation admin des nouveaux comptes, optionnelle). |
| `0009_key_alert_sends.sql` | `key_alert_sends` + fonction d'incrémentation atomique (plafond d'alertes WhatsApp clé/jour). |
| `0010_backfill_dispo_participants.sql` | Migration de rattrapage de données (pas de changement de schéma). |
| `0011_security_hardening.sql` | Voir §12 — durcissement pré-lancement. |
| `0012_participant_can_set_others_result.sql` | Assouplit la policy UPDATE de `event_participants` : un participant peut désormais saisir le résultat de n'importe quel autre participant du même évènement (pas seulement le sien). |

**Convention RLS du projet** (posée dans `0001`, à respecter dans toute
nouvelle migration) : chaque table a RLS activé, mais les mutations
réservées aux admins ne passent **pas** par des policies RLS complexes —
elles passent par le client `service_role` (qui contourne RLS), après
vérification explicite du rôle de l'appelant côté Server Action
(`admin-guard.ts`). Les policies RLS n'ont donc, en général, qu'à couvrir :
(a) ce qu'un membre normal peut lire/écrire sur ses propres données, et
(b) bloquer l'auto-élévation de privilèges (trigger `prevent_privileged_self_update`).

## 4. Authentification par pseudo

Supabase Auth n'accepte qu'un email (ou téléphone) comme identifiant ; le
club veut une connexion par pseudo, sans email obligatoire. Pont réalisé
dans `src/lib/slug.ts` :

- `slugify(pseudo)` → normalise (NFD, suppression des diacritiques),
  minuscule, remplace tout ce qui n'est pas `[a-z0-9]` par `-`.
- `loginEmailFromSlug(slug)` → `` `${slug}@chimere.internal` ``, un email
  **synthétique**, jamais affiché ni utilisé pour un envoi réel.
- `profiles.login_slug` (migration `0002`) stocke ce slug, protégé contre
  l'auto-modification par le trigger `prevent_privileged_self_update` (sinon
  un membre pourrait changer son propre `login_slug` via la policy RLS
  normale d'update de son profil, et se verrouiller hors de son compte).

Flux (`src/lib/auth-actions.ts`) :

- **Inscription** (`completeSignup`) : slugifie le pseudo, retente jusqu'à
  10 fois avec un suffixe numérique en cas de collision, crée l'utilisateur
  Auth via `admin.auth.admin.createUser(...)` (email confirmé d'office,
  puisque l'email est fictif), insère la ligne `profiles` (`status`
  `"active"` ou `"pending"` selon `club_settings.require_signup_validation`),
  puis les appartenances aux communautés choisies.
- **Connexion** (`login`) : résout pseudo → `login_slug` via le client
  `service_role` (RLS interdit la lecture de `profiles` avant connexion),
  avec le pseudo échappé par `escapeLikePattern` (voir §12) avant le
  `.ilike()`, puis appelle `signInWithPassword` avec l'email synthétique sur
  le client de session normal (pose les cookies).

## 5. Les trois clients Supabase

| Fichier | Factory | Contexte | RLS |
|---|---|---|---|
| `lib/supabase/client.ts` | `createClient()` (`createBrowserClient`) | Composants `"use client"` (upload Storage direct, etc.) | Appliquée, en tant qu'utilisateur connecté |
| `lib/supabase/server.ts` | `async createClient()` (`createServerClient`, cookies via `next/headers`) | Server Components, Server Actions, Route Handlers | Appliquée, en tant qu'utilisateur connecté |
| `lib/supabase/admin.ts` | `createAdminClient()` (`createClient` de `@supabase/supabase-js`, clé `service_role`) | Server Actions/Route Handlers uniquement | **Contournée entièrement** |

`admin.ts` est marqué `import "server-only"` : toute tentative de
l'importer depuis un composant client fait échouer le build. Il ne doit
**jamais** être appelé sans qu'`admin-guard.ts` ait d'abord vérifié les
droits de l'appelant (voir §6).

**Rafraîchissement de session** : `proxy.ts` (racine, l'équivalent
`middleware.ts` renommé en Next 16) délègue à
`updateSession()` dans `lib/supabase/proxy.ts`, exécuté sur chaque requête
(sauf assets statiques, cf. `config.matcher`). Cette fonction construit un
client de session scopé à la requête, dont le callback `setAll` reconstruit
`NextResponse.next()` et réapplique les cookies rafraîchis sur la requête et
la réponse (pattern standard `@supabase/ssr`). Elle vérifie ensuite
`supabase.auth.getClaims()` : redirige vers `/login` si pas de session hors
des pages publiques (`/login`, `/signup`), et vers `/programme` si une
session existe sur une page publique.

## 6. Modèle d'autorisation (RLS + service_role)

`src/lib/admin-guard.ts` expose deux fonctions utilisées au début de
(quasi) toute Server Action réservée aux admins :

- `requireAdmin()` : vérifie la session (client serveur), lit
  `profiles.is_admin` pour l'utilisateur courant, lève une erreur sinon.
  Retourne `{ userId, isSuperAdmin, admin }` où `admin` est le client
  `service_role` — remis à l'appelant **seulement après** vérification.
- `requireSuperAdmin()` : même chose mais sur `is_super_admin`. Utilisé
  uniquement pour les actions les plus sensibles (attribution du rôle
  admin, modification/suppression d'un compte super-admin), afin que le
  super-admin garde ce niveau d'accès même s'il désactive `is_admin` sur
  son propre compte pour tester l'app comme un membre normal.

Toute nouvelle Server Action qui touche à des données d'un autre membre
(pas les siennes) doit commencer par un appel à l'une des deux, puis
utiliser le client `admin` retourné pour l'opération elle-même.

## 7. Convention Server Actions

Chaque domaine fonctionnel a son fichier `lib/<domaine>-actions.ts`
(`"use server"` en tête) :

- `auth-actions.ts` — `signOut`, `login`, `completeSignup`.
- `admin-actions.ts` — validation de membres, gestion des clés/communautés,
  reset de mot de passe, attribution du rôle admin.
- `announcements-actions.ts` — CRUD annonces (admin), sondages, lu/non lu,
  notifications.
- `events-actions.ts` — rejoindre/quitter un évènement, saisir un résultat,
  créer/supprimer un évènement ou une dispo, transformer une dispo en
  évènement, ajouter un participant.
- `key-alert-actions.ts` — alerte WhatsApp clé (plafonnée via RPC atomique).
- `keys-actions.ts` — transfert/perte de clé, emprunt de clé de sortie.
- `profile-actions.ts` — édition du profil, mot de passe, préférences de
  notification, suppression de compte.

Convention systématique : après une mutation qui affecte des données
affichées ailleurs, appeler `revalidatePath(...)` sur la route concernée
plutôt que de gérer un état client synchronisé à la main. Les actions
« optimistes » (retour instantané avant confirmation serveur) utilisent
`useOptimistic` côté client (voir `EventModal.tsx` pour join/leave/résultat)
— c'est l'exception, pas la règle : la plupart des actions attendent
simplement la réponse serveur puis `revalidatePath` rafraîchit l'UI.

## 8. Internationalisation (i18n)

Pas de routing par locale (`/en/...`) : la langue est un cookie
(`chimere-locale`, `fr` par défaut) + un dictionnaire plat.

- `lib/i18n/dictionaries/{fr,en}.ts` — `Record<string, string>` à clés
  pointées (`"admin.error.maxKeysReached"`), interpolation `{param}` simple.
- `lib/i18n/server.ts` (`server-only`) — `getLocale()` lit le cookie,
  `serverT(key, params)` traduit côté serveur (pages, messages d'erreur de
  Server Actions), avec repli FR puis repli sur la clé brute si absente.
- `components/i18n/LocaleProvider.tsx` — contexte React côté client,
  `useT()` expose `{ locale, t }` à tous les Client Components, initialisé
  avec la locale résolue côté serveur (évite un flash d'hydratation).
- `components/i18n/LanguageToggle.tsx` — change le cookie puis
  `router.refresh()` pour que les Server Components se re-rendent dans la
  nouvelle langue immédiatement.

Toute nouvelle chaîne de texte visible doit avoir sa clé dans **les deux**
dictionnaires (`fr.ts` et `en.ts`), jamais de texte en dur dans le JSX.

## 9. Pattern page serveur / composant client

Toutes les routes de `app/(app)/*` suivent le même schéma :

```
page.tsx (Server Component)
  → Promise.all([...lectures Supabase...])
  → mapping snake_case → camelCase (lib/*-types.ts)
  → <XxxClient {...props} />   (Client Component, "use client")
       → state local, modals, useTransition
       → appelle les Server Actions de lib/xxx-actions.ts
       → revalidatePath() côté serveur rafraîchit les props au prochain rendu
```

Exemple représentatif : `app/(app)/programme/page.tsx` charge évènements +
communautés + membres + compteurs d'alerte en parallèle, les transforme, et
les passe à `ProgrammeClient.tsx`, qui gère filtre par communauté, bascule
semaine/mois, modal de détail (`EventModal.tsx`), et formulaire de création
(`EventForm.tsx`).

Ce pattern signifie concrètement : si une donnée doit être ajoutée à une
page, elle se rajoute dans le `Promise.all` du `page.tsx`, pas via un fetch
côté client.

## 10. Composants UI réutilisés

Dans `components/ui/` :

- **`Modal`** — bottom-sheet mobile / dialog centré ≥640px, ferme sur clic
  du fond ou bouton "×" intégré. Utilisé par toutes les modales de l'app.
- **`MemberPicker`** — recherche + sélection de membres par chip, réutilisé
  tel quel pour : ajout de participant à un évènement, cible d'un transfert
  de clé, attribution du rôle admin. Props notables :
  `disallowRemovingLast` (empêche de retirer le dernier participant),
  `hideSelectedChips` (l'appelant affiche lui-même la sélection).
- **`Button`** — variantes `primary | danger | outline | gray | ghost`,
  seul composant bouton stylé de l'app (pas de boutons ad hoc).
- **`Chip`** — filtre/tag, variantes `solid | outline`.
- **`DangerConfirmButton`** — pattern « armer puis confirmer » en deux
  clics pour les suppressions, se désarme tout seul au clic extérieur.
- **`RichText`** (`StrongText`) — rendu sécurisé de `<strong>` dans les
  chaînes i18n, sans `dangerouslySetInnerHTML` (parsing par découpage,
  jamais d'injection HTML arbitraire).

Attention en modifiant un composant qui reçoit une prop du type
`editing?: T | null` pour basculer entre création et édition (ex.
`AnnouncementForm`) : si ce composant reste monté en permanence dans l'arbre
(seul son `Modal` interne retourne `null` quand fermé), son `useState(...)`
initial ne se ré-exécute **pas** quand la prop change — il faut soit un
`key={editing?.id ?? "new"}` sur l'instance pour forcer un remount, soit un
`useEffect` qui resynchronise l'état à l'ouverture.

## 11. Développement local

```bash
npm install
npm run dev     # Turbopack, http://localhost:3000
npm run build   # build de prod + vérification TypeScript/ESLint
npm run lint
```

Variables d'environnement requises dans `.env.local` (jamais commité) :
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. Aucune clé ne doit apparaître ailleurs que
dans ce fichier — voir §12.

Les migrations SQL (`migrations/*.sql`) ne sont **pas** appliquées
automatiquement : chaque nouveau fichier doit être exécuté à la main dans
le SQL Editor du dashboard Supabase, dans l'ordre, avant que le code qui en
dépend fonctionne en base réelle.

## 12. Limitations connues et points d'attention sécurité

Un audit de sécurité a été mené avant la mise en production (voir migration
`0011_security_hardening.sql`). Résumé de ce qui a été corrigé et de ce qui
reste en attente :

**Corrigé :**
- Dépendances à jour (`next` en particulier — CVE RCE connues sur les
  versions antérieures).
- Toute valeur utilisateur passée à `.ilike()` (recherche par pseudo côté
  login/signup, vérification d'unicité du pseudo) est échappée via
  `escapeLikePattern()` (`lib/text.ts`) avant d'être insérée dans le motif
  LIKE, pour éviter qu'un pseudo contenant `%` ou `_` ne se comporte comme
  un joker.
- Longueur minimale de mot de passe (8 caractères) appliquée côté serveur
  sur inscription, reset admin et changement de mot de passe (l'UI ne
  suffit pas, un appel direct à la Server Action pouvait la contourner).
- Un admin simple ne peut plus modifier/désactiver un compte super-admin
  (`deleteMember`, `resetMemberPassword` vérifient explicitement ce cas).
- L'URL d'avatar envoyée par le client est validée côté serveur : elle doit
  pointer vers le dossier Storage de l'utilisateur courant, sinon elle est
  rejetée silencieusement (empêche d'assigner l'avatar d'un autre membre).
- Plus d'usage du client `service_role` dans une page accessible sans
  authentification (page signup) : remplacé par une fonction Postgres
  `security definer` (`get_community_member_counts`) qui n'expose que des
  compteurs agrégés, jamais de lignes brutes.
- En-têtes de sécurité HTTP de base (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`) sur toutes les routes.

**Non corrigé, limitation acceptée consciemment :**
- La visibilité des champs `phone` / `email` / `location` d'un profil
  (contrôlée par les flags `*_visible` que chaque membre règle lui-même)
  n'est appliquée **qu'au niveau applicatif** (la page `members/[id]`
  masque les champs non visibles), pas au niveau des policies RLS sur la
  table `profiles`. Un membre authentifié qui interrogerait directement
  l'API REST Supabase sur cette table pourrait donc, en théorie, lire ces
  colonnes pour d'autres profils indépendamment du flag de visibilité.
  Ce n'est pas exploitable par un visiteur non authentifié (RLS bloque bien
  tout accès anonyme), seulement par un membre du club déjà connu et
  authentifié. Corriger proprement nécessite soit une restructuration des
  policies au niveau colonne (`REVOKE`/`GRANT` par colonne, ce qui impose
  de ré-auditer chaque requête existante sur `profiles`), soit une vue
  `security definer` dédiée touchant plusieurs points d'appel. Repoussé
  volontairement faute de temps avant une démo, à traiter dans une
  prochaine itération avant d'ouvrir l'app à un usage plus large.

Aucune clé (`SUPABASE_SERVICE_ROLE_KEY` en particulier) n'est écrite en dur
dans le code : elle n'existe que dans `.env.local` (non commité) et dans la
configuration d'environnement Vercel en production. `lib/supabase/admin.ts`
lève une erreur explicite si la variable est absente plutôt que de se
rabattre sur une valeur par défaut.
