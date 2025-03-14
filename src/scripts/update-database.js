// Script pour mettre à jour la base de données Supabase
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { join, dirname } = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: '../../.env' });

// Créer le client Supabase
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement Supabase ne sont pas définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour exécuter le fichier SQL de migration
async function runMigration() {
  try {
    console.log('Exécution de la migration SQL...');
    
    // Lire le fichier SQL
    const sqlPath = join(__dirname, '../../supabase/migrations/20240313_create_distance_function.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Exécuter le SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Erreur lors de l\'exécution de la migration:', error);
      console.log('Tentative d\'exécution des fonctions séparément...');
      
      // Essayer d'exécuter les fonctions séparément
      const statements = sqlContent.split(';');
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.error('Erreur lors de l\'exécution de la requête:', error);
          }
        }
      }
    } else {
      console.log('Migration SQL exécutée avec succès!');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Importer et exécuter le script d'ajout de lieux
async function importAndRunAddLocations() {
  try {
    console.log('Exécution du script d\'ajout de lieux...');
    
    // Exécuter le script directement
    require('./add-92-locations.js');
    
    console.log('Script exécuté avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'exécution du script:', error);
  }
}

// Fonction principale
async function main() {
  try {
    // Exécuter la migration SQL
    await runMigration();
    
    // Importer et exécuter le script d'ajout de lieux
    await importAndRunAddLocations();
    
    console.log('Mise à jour de la base de données terminée!');
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la base de données:', error);
  }
}

// Exécuter la fonction principale
main(); 