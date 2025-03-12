import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import { getFullPOIData } from '$lib/services/poi';

export const load = (async ({ params, parent }) => {
  // Vérifier si nous sommes dans le navigateur
  if (browser) {
    // Vérifier directement la session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!session) {
      throw redirect(302, '/login');
    }
  }
  
  const id = params.id;
  
  // Vérifier si l'ID est au format "lat,lng"
  if (!id || !id.includes(',')) {
    throw error(404, 'Point d\'intérêt non trouvé');
  }
  
  // Extraire les coordonnées
  const [lat, lng] = id.split(',').map(Number);
  
  // Vérifier si les coordonnées sont valides
  if (isNaN(lat) || isNaN(lng)) {
    throw error(404, 'Coordonnées invalides');
  }
  
  // Récupérer les données du point d'intérêt depuis la base de données
  const point = await getFullPOIData(lat, lng);
  
  if (!point) {
    // Si le point n'existe pas en base de données, créer un point générique
    return {
      point: {
        position: { lat, lng },
        name: `Point d'intérêt (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        description: 'Description non disponible pour ce point d\'intérêt.',
        image_url: 'https://via.placeholder.com/800x600?text=Image+non+disponible',
        recommended_products: []
      }
    };
  }
  
  return { point };
}) satisfies PageLoad; 