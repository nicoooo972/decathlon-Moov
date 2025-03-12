import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';

export const load: LayoutLoad = async ({ parent }) => {
  // Récupérer les données du parent (layout racine)
  const parentData = await parent();
  
  // Vérifier si nous sommes dans le navigateur
  if (!browser) {
    return parentData;
  }
  
  // Vérifier directement la session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!session) {
    throw redirect(302, '/login');
  }
  
  return {
    ...parentData,
    session
  };
}; 