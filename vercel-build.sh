#!/bin/bash

# Afficher la version de Node.js
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# Installer svelte explicitement
npm install svelte@5.0.0 --no-save --legacy-peer-deps

# Exécuter svelte-kit sync pour générer les fichiers nécessaires
npx svelte-kit sync

# Exécuter le build
npm run build 