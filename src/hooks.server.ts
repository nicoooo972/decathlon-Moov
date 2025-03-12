import { redirect, type Handle } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export const handle: Handle = async ({ event, resolve }) => {
  // Récupérer la session depuis les cookies
  const { data: { session } } = await supabase.auth.getSession();

  // Définir les routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = ['/', '/login', '/register', '/onboarding'];
  const isPublicRoute = publicRoutes.some(route => 
    event.url.pathname === route || event.url.pathname.startsWith(route + '/')
  );

  // Si l'utilisateur n'est pas connecté et n'est pas sur une route publique, rediriger vers la page de connexion
  if (!session && !isPublicRoute) {
    throw redirect(303, '/login');
  }

  // Ajouter la session à l'événement pour qu'elle soit accessible dans les routes
  event.locals.session = session;

  // Continuer avec la résolution de la requête
  return resolve(event);
}; 