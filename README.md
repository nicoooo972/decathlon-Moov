## Technologies utilisées

- **Frontend** : SvelteKit, Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **PWA** : Service Workers, Manifest, Workbox
- **Déploiement** : Vercel/Netlify (à déterminer)

## Installation et développement

### Prérequis

- Node.js (v20.9.0 ou supérieur)
- npm ou pnpm
- Compte Supabase

### Installation

1. Cloner le dépôt
```bash
git clone <url-du-repo>
cd decathlon-urban-trek
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
Créer un fichier `.env` à la racine du projet avec les variables suivantes :
```
PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

4. Lancer le serveur de développement
```bash
npm run dev
```

### Configuration de Supabase

1. Créer un projet sur [Supabase](https://supabase.com)
2. Exécuter le script SQL de migration dans l'éditeur SQL de Supabase :
   - Le script se trouve dans `supabase/migrations/20250311_init.sql`

## Structure du projet

```
├── src/
│   ├── lib/
│   │   ├── components/     # Composants réutilisables
│   │   ├── services/       # Services (auth, preferences, etc.)
│   │   ├── stores/         # Stores Svelte
│   │   ├── types.ts        # Types TypeScript
│   │   └── supabase.ts     # Client Supabase
│   ├── routes/             # Pages de l'application
│   └── app.css             # Styles globaux
├── static/                 # Fichiers statiques (images, icônes)
├── supabase/               # Configuration Supabase
└── pwa-config.ts           # Configuration PWA
```

## Déploiement

### Préparation au déploiement

```bash
npm run build
```

### Déploiement sur Vercel/Netlify

Suivre les instructions de déploiement de la plateforme choisie en pointant vers le dépôt Git.

## Licence

Ce projet est sous licence [MIT](LICENSE).
