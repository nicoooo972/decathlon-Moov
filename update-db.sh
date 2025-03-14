#!/bin/bash

# Script pour mettre à jour la base de données Supabase avec les lieux du 92

echo "Installation des dépendances..."
cd src/scripts
npm install

echo "Exécution du script de mise à jour de la base de données..."
node update-database.js

echo "Mise à jour terminée!" 