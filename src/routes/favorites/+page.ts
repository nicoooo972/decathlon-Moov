import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';

export const load = (async ({ parent }) => {
  // Vérifier si nous sommes dans le navigateur
  if (browser) {
    // Vérifier directement la session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!session) {
      throw redirect(302, '/login');
    }
  }
  
  // Les données des favoris seront chargées via le store currentUser dans le composant
  return {};
}) satisfies PageLoad; 