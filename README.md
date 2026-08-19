# La Chimère — site web du club

Site web du club de figurines et de jeux **La Chimère** : programme des évènements, gestion des clés du local, communautés de jeu et classement.

Ce dépôt est **public** simplement pour rester gratuit à héberger (dépôt public GitHub, hébergement Vercel gratuit) — aucune donnée sensible n'y est stockée. Il n'y a pas de licence open source attachée : c'est le code d'un outil interne au club, pas un projet destiné à être réutilisé ailleurs.

## État du projet

Le projet est actuellement en phase de conception. Le cahier des charges et les maquettes interactives (voir `docs/`) documentent l'ensemble des règles de fonctionnement décidées avec le porteur du projet ; le développement du POC (voir section 8 du cahier des charges) n'a pas encore démarré.

## Contenu de ce dépôt

- `docs/cahier-des-charges-la-chimere.docx` — cahier des charges complet : contexte, périmètre, rôles, fonctionnalités, architecture technique recommandée, modèle de données, plan de déploiement, budget, et une annexe détaillée de toutes les règles de comportement (UI/UX) définies au fil des itérations de la maquette.
- `docs/maquette-principale.html` — maquette interactive de l'application (programme, leaderboard, communautés, admin, paramètres...). À ouvrir directement dans un navigateur.
- `docs/maquette-creation-compte.html` — maquette interactive du parcours d'arrivée et de création de compte. À ouvrir directement dans un navigateur.

## Stack technique prévue

- **Frontend** : Next.js (React), mobile-first
- **Hébergement** : Vercel
- **Base de données + comptes** : Supabase (Postgres + Auth)

Voir la section 6 du cahier des charges pour le détail et le raisonnement derrière ces choix, et la section 6.1 pour les questions de gouvernance, de sécurité et de continuité (organisations GitHub/Supabase, compte de service Vercel, Row Level Security, réinitialisation de mot de passe, etc.).

## Gouvernance

Ce dépôt vit dans une organisation GitHub dédiée au club plutôt que sur un compte personnel, afin que le comité puisse en reprendre la main à tout moment (voir section 6.1 du cahier des charges).
