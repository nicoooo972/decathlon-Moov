import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';

export const load: PageLoad = async () => {
  // Vérifier si nous sommes dans le navigateur
  if (!browser) {
    return {};
  }
  
  // Vérifier directement la session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!session) {
    throw redirect(302, '/login');
  }
  
  return {
    session
  };
}; 