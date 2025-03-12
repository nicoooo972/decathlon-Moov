import { supabase } from '$lib/supabase';
import type { RoutePoint, Product } from '$lib/types';

// Récupérer tous les points d'intérêt
export async function getAllPOIs(type?: string) {
  let query = supabase
    .from('points_of_interest')
    .select('*');
  
  // Si un type est spécifié, filtrer par ce type
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Erreur lors de la récupération des points d\'intérêt:', error);
    throw error;
  }
  
  return data || [];
}

// Récupérer un point d'intérêt par ses coordonnées
export async function getPOIByCoordinates(lat: number, lng: number) {
  // Tolérance pour la comparaison des coordonnées
  const tolerance = 0.001;
  
  const { data, error } = await supabase
    .from('points_of_interest')
    .select('*')
    .gte('latitude', lat - tolerance)
    .lte('latitude', lat + tolerance)
    .gte('longitude', lng - tolerance)
    .lte('longitude', lng + tolerance)
    .limit(1)
    .single();
  
  if (error) {
    console.error('Erreur lors de la récupération du point d\'intérêt:', error);
    return null;
  }
  
  return data;
}

// Récupérer les détails d'un point d'intérêt
export async function getPOIDetails(poiId: number): Promise<{ detail: string }[]> {
  const { data, error } = await supabase
    .from('poi_details')
    .select('detail')
    .eq('poi_id', poiId);
  
  if (error) {
    console.error('Erreur lors de la récupération des détails du point d\'intérêt:', error);
    return [];
  }
  
  return data || [];
}

// Récupérer les activités d'un point d'intérêt
export async function getPOIActivities(poiId: number): Promise<{ activity: string }[]> {
  const { data, error } = await supabase
    .from('poi_activities')
    .select('activity')
    .eq('poi_id', poiId);
  
  if (error) {
    console.error('Erreur lors de la récupération des activités du point d\'intérêt:', error);
    return [];
  }
  
  return data || [];
}

// Récupérer les produits recommandés pour un point d'intérêt
export async function getPOIProducts(poiId: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from('poi_products')
    .select('product_id, products(*)')
    .eq('poi_id', poiId);
  
  if (error) {
    console.error('Erreur lors de la récupération des produits recommandés:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.products.id,
    name: item.products.name,
    image_url: item.products.image_url,
    price: item.products.price,
    url: item.products.url,
    category: item.products.category
  })) || [];
}

// Récupérer toutes les informations d'un point d'intérêt
export async function getFullPOIData(lat: number, lng: number): Promise<RoutePoint | null> {
  // Vérifier si c'est la Tour Eiffel (approximativement)
  const isEiffelTower = Math.abs(lat - 48.8584) < 0.001 && Math.abs(lng - 2.2945) < 0.001;
  
  if (isEiffelTower) {
    // Données statiques pour la Tour Eiffel
    const products: Product[] = [
      {
        id: 1,
        name: 'Chaussures de randonnée légères',
        price: 59.99,
        image_url: 'https://contents.mediadecathlon.com/p2397366/k$f7374f04fb8fb3f7c9e4c5f5e9ecbcb4/sq/chaussures-impermeables-de-randonnee-nature-nh150-wp-homme.jpg',
        url: 'https://www.decathlon.fr/p/chaussures-impermeables-de-randonnee-nature-nh150-wp-homme/_/R-p-325283',
        category: 'Chaussures'
      },
      {
        id: 2,
        name: 'Gourde randonnée 900',
        price: 9.99,
        image_url: 'https://contents.mediadecathlon.com/p1575264/k$5d1cdb8e5a72b9a1b0d7b2d4a3fb0d3e/sq/gourde-randonnee-900-bouchon-instantane-avec-pipette-08l-aluminium.jpg',
        url: 'https://www.decathlon.fr/p/gourde-randonnee-900-bouchon-instantane-avec-pipette-0-8l-aluminium/_/R-p-302871',
        category: 'Hydratation'
      },
      {
        id: 3,
        name: 'Sac à dos de randonnée 10L',
        price: 24.99,
        image_url: 'https://contents.mediadecathlon.com/p2153574/k$f0b275c5beb62c62c9896a5e1ce2da41/sq/sac-a-dos-de-randonnee-nature-nh-arpenaz-10l.jpg',
        url: 'https://www.decathlon.fr/p/sac-a-dos-de-randonnee-nature-nh-arpenaz-10l/_/R-p-334326',
        category: 'Sacs'
      },
      {
        id: 4,
        name: 'Jumelles de randonnée',
        price: 29.99,
        image_url: 'https://contents.mediadecathlon.com/p1917344/k$1d2d8e1d3f9c3d3e2a9f3a9f3e2d1d2d/sq/jumelles-de-randonnee-grossissement-x10-adulte-noires.jpg',
        url: 'https://www.decathlon.fr/p/jumelles-de-randonnee-grossissement-x10-adulte-noires/_/R-p-302559',
        category: 'Accessoires'
      }
    ];

    return {
      position: { lat: 48.8584, lng: 2.2945 },
      name: 'Tour Eiffel',
      description: 'La Tour Eiffel est une tour de fer puddlé de 330 mètres de hauteur située à Paris, à l\'extrémité nord-ouest du parc du Champ-de-Mars en bordure de la Seine. Construite par Gustave Eiffel et ses collaborateurs pour l\'Exposition universelle de 1889, ce monument emblématique est devenu le symbole de la capitale française et l\'une des attractions touristiques les plus visitées au monde avec près de 7 millions de visiteurs chaque année.',
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg',
      details: [
        'Hauteur: 330 mètres (avec antenne)',
        'Construction: 1887-1889',
        'Architecte: Gustave Eiffel',
        'Poids: 10 100 tonnes',
        'Nombre d\'étages: 3 étages accessibles au public',
        'Visiteurs: 7 millions par an',
        'Nombre de marches: 1 665 jusqu\'au sommet'
      ],
      activities: [
        'Montée au sommet pour une vue panoramique à 360° de Paris',
        'Dîner au restaurant gastronomique Le Jules Verne (2e étage)',
        'Visite du 1er étage avec son plancher de verre à 57 mètres de hauteur',
        'Découverte de l\'histoire de la tour au 2ème étage avec des expositions',
        'Admirer le scintillement nocturne toutes les heures pendant 5 minutes',
        'Prendre un verre au champagne bar du sommet',
        'Pique-niquer sur le Champ-de-Mars avec vue sur la tour'
      ],
      opening_hours: 'Tous les jours de 9h30 à 23h45 (dernier accès à 23h). Horaires étendus en été (mi-juin à début septembre) : 9h00 à 00h45.',
      website: 'https://www.toureiffel.paris/fr',
      recommended_products: products
    };
  }
  
  // Si ce n'est pas la Tour Eiffel, essayer de récupérer les données depuis la base de données
  try {
    const poi = await getPOIByCoordinates(lat, lng);
    
    if (!poi) {
      return null;
    }
    
    // Récupérer les détails
    const detailsData = await getPOIDetails(poi.id);
    const details = detailsData.map(d => d.detail);
    
    // Récupérer les activités
    const activitiesData = await getPOIActivities(poi.id);
    const activities = activitiesData.map(a => a.activity);
    
    // Récupérer les produits recommandés
    const products = await getPOIProducts(poi.id);
    
    return {
      position: { lat: poi.latitude, lng: poi.longitude },
      name: poi.name,
      description: poi.description,
      image_url: poi.image_url,
      details,
      activities,
      opening_hours: poi.opening_hours,
      website: poi.website,
      recommended_products: products
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données complètes du POI:', error);
    return null;
  }
}

// Ajouter un nouveau point d'intérêt
export async function addPOI(poi: {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  image_url: string;
  opening_hours?: string;
  website?: string;
  details?: string[];
  activities?: string[];
  product_ids?: number[];
}) {
  // Insérer le point d'intérêt
  const { data: newPoi, error } = await supabase
    .from('points_of_interest')
    .insert({
      name: poi.name,
      description: poi.description,
      latitude: poi.latitude,
      longitude: poi.longitude,
      image_url: poi.image_url,
      opening_hours: poi.opening_hours,
      website: poi.website
    })
    .select()
    .single();
  
  if (error) {
    console.error('Erreur lors de l\'ajout du point d\'intérêt:', error);
    throw error;
  }
  
  // Ajouter les détails
  if (poi.details && poi.details.length > 0) {
    const detailsToInsert = poi.details.map(detail => ({
      poi_id: newPoi.id,
      detail
    }));
    
    const { error: detailsError } = await supabase
      .from('poi_details')
      .insert(detailsToInsert);
    
    if (detailsError) {
      console.error('Erreur lors de l\'ajout des détails:', detailsError);
    }
  }
  
  // Ajouter les activités
  if (poi.activities && poi.activities.length > 0) {
    const activitiesToInsert = poi.activities.map(activity => ({
      poi_id: newPoi.id,
      activity
    }));
    
    const { error: activitiesError } = await supabase
      .from('poi_activities')
      .insert(activitiesToInsert);
    
    if (activitiesError) {
      console.error('Erreur lors de l\'ajout des activités:', activitiesError);
    }
  }
  
  // Lier les produits
  if (poi.product_ids && poi.product_ids.length > 0) {
    const productsToInsert = poi.product_ids.map(product_id => ({
      poi_id: newPoi.id,
      product_id
    }));
    
    const { error: productsError } = await supabase
      .from('poi_products')
      .insert(productsToInsert);
    
    if (productsError) {
      console.error('Erreur lors de l\'ajout des produits:', productsError);
    }
  }
  
  return newPoi;
}

// Mettre à jour un point d'intérêt
export async function updatePOI(poiId: number, updates: {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  opening_hours?: string;
  website?: string;
}) {
  const { data, error } = await supabase
    .from('points_of_interest')
    .update(updates)
    .eq('id', poiId)
    .select()
    .single();
  
  if (error) {
    console.error('Erreur lors de la mise à jour du point d\'intérêt:', error);
    throw error;
  }
  
  return data;
}

// Supprimer un point d'intérêt
export async function deletePOI(poiId: number) {
  const { error } = await supabase
    .from('points_of_interest')
    .delete()
    .eq('id', poiId);
  
  if (error) {
    console.error('Erreur lors de la suppression du point d\'intérêt:', error);
    throw error;
  }
  
  return true;
}

// Récupérer les types de POI disponibles
export async function getPOITypes() {
  const { data, error } = await supabase
    .from('points_of_interest')
    .select('type')
    .not('type', 'is', null);
  
  if (error) {
    console.error('Erreur lors de la récupération des types de POI:', error);
    return [];
  }
  
  // Extraire les types uniques
  const types = data.map(item => item.type);
  return [...new Set(types)].filter(Boolean);
} 