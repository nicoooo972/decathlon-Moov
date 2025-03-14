import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';
import { hasUserPreferences } from '$lib/services/auth';

export const load: PageLoad = async () => {
  // Vérifier si nous sommes dans le navigateur
  if (!browser) {
    return {};
  }
  
  // Vérifier directement la session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Si l'utilisateur n'est pas connecté, le laisser accéder à la page d'accueil
  // (il verra l'écran de splash ou sera redirigé vers onboarding par le composant)
  if (!session) {
    return {
      session: null
    };
  }
  
  // Vérifier si l'utilisateur a des préférences
  const hasPrefs = await hasUserPreferences(session.user.id);
  
  // Si l'utilisateur est connecté mais n'a pas de préférences, le rediriger vers la page de préférences
  if (!hasPrefs) {
    throw redirect(302, '/preferences');
  }
  
  return {
    session
  };
}; 