#!/bin/bash

# Afficher la version de Node.js
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# Exécuter svelte-kit sync pour générer les fichiers nécessaires
npx svelte-kit sync

# Exécuter le build
npm run build 