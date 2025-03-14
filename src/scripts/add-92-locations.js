// Script pour ajouter des lieux dans le département 92 (Hauts-de-Seine) à la base de données Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

// Créer le client Supabase
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement Supabase ne sont pas définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lieux dans le 92 (Hauts-de-Seine)
const locations92 = [
  {
    name: 'Parc de Sceaux',
    description: 'Magnifique parc à la française avec château et jardins',
    distance_km: 2.8,
    duration_minutes: 90,
    difficulty: 'facile',
    activity_type: 'nature',
    suitable_ages: ['tout-petit', 'enfant', 'adolescent', 'adulte'],
    accessibility: true,
    start_point: { lat: 48.7702, lng: 2.2962 },
    end_point: { lat: 48.7702, lng: 2.2962 },
    waypoints: [],
    points_of_interest: [
      {
        position: { lat: 48.7702, lng: 2.2962 },
        name: 'Château de Sceaux',
        description: 'Château du XVIIe siècle entouré de jardins à la française',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ch%C3%A2teau_de_Sceaux_001.JPG/800px-Ch%C3%A2teau_de_Sceaux_001.JPG',
        recommended_products: [],
        opening_hours: '10h-17h',
        website: 'https://domaine-de-sceaux.hauts-de-seine.fr/'
      }
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Ch%C3%A2teau_de_Sceaux_001.JPG/800px-Ch%C3%A2teau_de_Sceaux_001.JPG',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'La Défense',
    description: 'Découvrez le quartier d\'affaires moderne de Paris',
    distance_km: 3.5,
    duration_minutes: 120,
    difficulty: 'moyen',
    activity_type: 'culture',
    suitable_ages: ['adolescent', 'adulte'],
    accessibility: true,
    start_point: { lat: 48.8918, lng: 2.2362 },
    end_point: { lat: 48.8918, lng: 2.2362 },
    waypoints: [],
    points_of_interest: [
      {
        position: { lat: 48.8918, lng: 2.2362 },
        name: 'Grande Arche',
        description: 'Monument emblématique de La Défense',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Grande_Arche_de_la_D%C3%A9fense_-_20051220.jpg/800px-Grande_Arche_de_la_D%C3%A9fense_-_20051220.jpg',
        recommended_products: [],
        opening_hours: '10h-19h',
        website: 'https://www.lagrandearche.fr/'
      }
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Grande_Arche_de_la_D%C3%A9fense_-_20051220.jpg/800px-Grande_Arche_de_la_D%C3%A9fense_-_20051220.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Parc de l\'Île Saint-Germain',
    description: 'Balade nature sur une île de la Seine à Issy-les-Moulineaux',
    distance_km: 2.2,
    duration_minutes: 70,
    difficulty: 'facile',
    activity_type: 'nature',
    suitable_ages: ['tout-petit', 'enfant', 'adolescent', 'adulte'],
    accessibility: true,
    start_point: { lat: 48.8242, lng: 2.2606 },
    end_point: { lat: 48.8242, lng: 2.2606 },
    waypoints: [],
    points_of_interest: [
      {
        position: { lat: 48.8242, lng: 2.2606 },
        name: 'Tour aux figures',
        description: 'Sculpture monumentale de Jean Dubuffet',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Tour_aux_Figures_Dubuffet.jpg/800px-Tour_aux_Figures_Dubuffet.jpg',
        recommended_products: [],
        opening_hours: 'Accès libre',
        website: 'https://www.hauts-de-seine.fr/patrimoine-culturel/les-sites-departementaux/le-parc-de-lile-saint-germain'
      }
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Tour_aux_Figures_Dubuffet.jpg/800px-Tour_aux_Figures_Dubuffet.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Colombes - Parc Lagravère',
    description: 'Promenade le long de la Seine dans un parc départemental',
    distance_km: 2.5,
    duration_minutes: 80,
    difficulty: 'facile',
    activity_type: 'sport',
    suitable_ages: ['enfant', 'adolescent', 'adulte'],
    accessibility: true,
    start_point: { lat: 48.9242, lng: 2.2372 },
    end_point: { lat: 48.9242, lng: 2.2372 },
    waypoints: [],
    points_of_interest: [
      {
        position: { lat: 48.9242, lng: 2.2372 },
        name: 'Stade Yves-du-Manoir',
        description: 'Stade olympique des JO de 1924, rénové pour les JO 2024',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Stade_olympique_Yves-du-Manoir_-_Colombes.jpg/800px-Stade_olympique_Yves-du-Manoir_-_Colombes.jpg',
        recommended_products: [],
        opening_hours: 'Selon événements',
        website: 'https://www.hauts-de-seine.fr/stade-yves-du-manoir'
      }
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Stade_olympique_Yves-du-Manoir_-_Colombes.jpg/800px-Stade_olympique_Yves-du-Manoir_-_Colombes.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Nanterre - Parc André Malraux',
    description: 'Grand parc urbain avec lac et espaces verts',
    distance_km: 2.0,
    duration_minutes: 60,
    difficulty: 'facile',
    activity_type: 'nature',
    suitable_ages: ['tout-petit', 'enfant', 'adolescent', 'adulte'],
    accessibility: true,
    start_point: { lat: 48.8956, lng: 2.2142 },
    end_point: { lat: 48.8956, lng: 2.2142 },
    waypoints: [],
    points_of_interest: [
      {
        position: { lat: 48.8956, lng: 2.2142 },
        name: 'Terrasses de Nanterre',
        description: 'Aménagement paysager reliant La Défense à la Seine',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Parc_Andre_Malraux_Nanterre.jpg/800px-Parc_Andre_Malraux_Nanterre.jpg',
        recommended_products: [],
        opening_hours: 'Accès libre',
        website: 'https://www.nanterre.fr/1584-parc-andre-malraux.htm'
      }
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Parc_Andre_Malraux_Nanterre.jpg/800px-Parc_Andre_Malraux_Nanterre.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Bois de Boulogne - Jardin d\'Acclimatation',
    description: 'Parc d\'attractions et jardin à la lisière de Neuilly-sur-Seine',
    distance_km: 3.0,
    duration_minutes: 120,
    difficulty: 'facile',
    activity_type: 'aventure',
    suitable_ages: ['tout-petit', 'enfant', 'adolescent'],
    accessibility: true,
    start_point: { lat: 48.8790, lng: 2.2635 },
    end_point: { lat: 48.8790, lng: 2.2635 },
    waypoints: [],
    points_of_interest: [
      {
        position: { lat: 48.8790, lng: 2.2635 },
        name: 'Fondation Louis Vuitton',
        description: 'Musée d\'art contemporain conçu par Frank Gehry',
        image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Fondation_Louis_Vuitton%2C_Paris_16e_2.jpg/800px-Fondation_Louis_Vuitton%2C_Paris_16e_2.jpg',
        recommended_products: [],
        opening_hours: '10h-20h',
        website: 'https://www.fondationlouisvuitton.fr/'
      }
    ],
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Fondation_Louis_Vuitton%2C_Paris_16e_2.jpg/800px-Fondation_Louis_Vuitton%2C_Paris_16e_2.jpg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Fonction pour ajouter les lieux à la base de données
async function addLocations() {
  try {
    console.log('Ajout des lieux du 92 à la base de données...');
    
    // Vérifier si les lieux existent déjà
    const { data: existingRoutes, error: checkError } = await supabase
      .from('routes')
      .select('name')
      .in('name', locations92.map(loc => loc.name));
      
    if (checkError) {
      console.error('Erreur lors de la vérification des lieux existants:', checkError);
      return;
    }
    
    // Filtrer les lieux qui n'existent pas encore
    const existingNames = existingRoutes.map(route => route.name);
    const newLocations = locations92.filter(loc => !existingNames.includes(loc.name));
    
    if (newLocations.length === 0) {
      console.log('Tous les lieux existent déjà dans la base de données.');
      return;
    }
    
    // Ajouter les nouveaux lieux
    const { data, error } = await supabase
      .from('routes')
      .insert(newLocations);
      
    if (error) {
      console.error('Erreur lors de l\'ajout des lieux:', error);
      return;
    }
    
    console.log(`${newLocations.length} lieux du 92 ajoutés avec succès!`);
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécuter la fonction
addLocations(); 