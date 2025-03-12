import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
  // Vérifier si nous sommes dans le navigateur
  if (!browser) {
    return { session: null };
  }

  // Récupérer la session actuelle
  const { data: { session } } = await supabase.auth.getSession();

  return {
    session
  };
}; 