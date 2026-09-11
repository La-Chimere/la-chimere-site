# La Chimère — site web du club

Site web du club de figurines et de jeux **La Chimère** : programme des évènements, gestion des clés du local, communautés de jeu et classement.

Ce dépôt est **public** simplement pour rester gratuit à héberger (dépôt public GitHub, hébergement Vercel gratuit) — aucune donnée sensible n'y est stockée. Il n'y a pas de licence open source attachée : c'est le code d'un outil interne au club, pas un projet destiné à être réutilisé ailleurs.

## État du projet

Le POC est développé et fonctionnel (Next.js + Supabase, voir `docs/ARCHITECTURE.md`). Le cahier des charges et les maquettes interactives (voir `docs/`) restent la référence pour les règles de comportement fonctionnelles.

## Contenu de ce dépôt

- `docs/ARCHITECTURE.md` — documentation technique du fonctionnement interne de l'application, à l'intention d'un·e développeur·se qui reprend ou modifie le code (pas un guide utilisateur).
- `docs/cahier-des-charges-la-chimere.docx` — cahier des charges complet : contexte, périmètre, rôles, fonctionnalités, architecture technique recommandée, modèle de données, plan de déploiement, budget, et une annexe détaillée de toutes les règles de comportement (UI/UX) définies au fil des itérations de la maquette.
- `docs/maquette-principale.html` — maquette interactive d'origine de l'application (programme, leaderboard, communautés, admin, paramètres...). À ouvrir directement dans un navigateur. Le vrai code vit dans `src/` ; ces maquettes ne sont conservées que comme référence historique des décisions de design.
- `docs/maquette-creation-compte.html` — maquette interactive d'origine du parcours d'arrivée et de création de compte. Idem, référence historique.

## Stack technique

- **Frontend** : Next.js (React), mobile-first
- **Hébergement** : Vercel
- **Base de données + comptes** : Supabase (Postgres + Auth)

Voir la section 6 du cahier des charges pour le détail et le raisonnement derrière ces choix, et la section 6.1 pour les questions de gouvernance, de sécurité et de continuité (organisations GitHub/Supabase, compte de service Vercel, Row Level Security, réinitialisation de mot de passe, etc.).

## Gouvernance

Ce dépôt vit dans une organisation GitHub dédiée au club plutôt que sur un compte personnel, afin que le comité puisse en reprendre la main à tout moment (voir section 6.1 du cahier des charges).
