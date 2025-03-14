import { supabase } from '$lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '$lib/types';
import { goto } from '$app/navigation';
import { writable } from 'svelte/store';

export const currentUser = writable<User | null>(null);

// Initialize the store with the current session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    refreshUserData();
  } else {
    currentUser.set(null);
  }
});

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    // Supprimer la classe no-scroll du body pour permettre le défilement
    if (typeof document !== 'undefined') {
      document.body.classList.remove('no-scroll');
    }
    refreshUserData();
  } else {
    currentUser.set(null);
  }
});

// Initialiser l'utilisateur au chargement
export async function initializeAuth() {
  const { data } = await supabase.auth.getSession();
  
  if (data.session) {
    await refreshUserData();
    return true;
  }
  return false;
}

// Récupérer les données de l'utilisateur
export async function refreshUserData() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Supprimer la classe no-scroll du body pour permettre le défilement après connexion
    if (typeof document !== 'undefined') {
      document.body.classList.remove('no-scroll');
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      currentUser.set({
        id: user.id,
        email: user.email || '',
        first_name: data.first_name,
        last_name: data.last_name,
        avatar_url: data.avatar_url,
        created_at: user.created_at || new Date().toISOString()
      });
      return true;
    } else {
      // Profil non trouvé, créer un profil vide via la fonction RPC
      try {
        const { error: rpcError } = await supabase.rpc('create_profile_for_user', {
          user_id: user.id,
          user_email: user.email
        });
        
        if (rpcError) throw rpcError;
        
        // Récupérer le profil nouvellement créé
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (newProfile) {
          currentUser.set({
            id: user.id,
            email: user.email || '',
            first_name: newProfile.first_name,
            last_name: newProfile.last_name,
            avatar_url: newProfile.avatar_url,
            created_at: user.created_at || new Date().toISOString()
          });
          return true;
        } else {
          // Fallback si le profil n'est toujours pas trouvé
          currentUser.set({
            id: user.id,
            email: user.email || '',
            created_at: user.created_at || new Date().toISOString()
          });
          return true;
        }
      } catch (error) {
        console.error('Erreur lors de la création du profil:', error);
        // Fallback en cas d'erreur
        currentUser.set({
          id: user.id,
          email: user.email || '',
          created_at: user.created_at || new Date().toISOString()
        });
        return true;
      }
    }
  } else {
    currentUser.set(null);
    return false;
  }
}

// Vérifier si l'utilisateur a déjà des préférences
export async function hasUserPreferences(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('preferences')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error checking user preferences:', error);
    return false;
  }

  return !!data;
}

// Inscription avec email et mot de passe
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (error) throw error;
  
  if (data.user) {
    // Le profil sera créé automatiquement par le trigger ou lors du refreshUserData
    await refreshUserData();
    return data.user;
  }
  
  return null;
}

// Connexion avec email et mot de passe
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  
  if (data.user) {
    // Supprimer la classe no-scroll du body pour permettre le défilement après connexion
    if (typeof document !== 'undefined') {
      document.body.classList.remove('no-scroll');
    }
    
    await refreshUserData();
    return data.user;
  }
  
  return null;
}

// Déconnexion
export async function signOut() {
  await supabase.auth.signOut();
  currentUser.set(null);
  goto('/login');
}

// Vérifier si l'utilisateur est connecté
export function isAuthenticated(): boolean {
  let isAuth = false;
  currentUser.subscribe(user => {
    isAuth = !!user;
  })();
  
  return isAuth;
}

// Mettre à jour le profil utilisateur
export async function updateProfile(profile: Partial<User>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', profile.id)
    .select()
    .single();
  
  if (error) throw error;
  
  await refreshUserData();
  return data;
}

// Connexion avec Google
export async function signInWithGoogle() {
  // Supprimer la classe no-scroll du body pour permettre le défilement
  if (typeof document !== 'undefined') {
    document.body.classList.remove('no-scroll');
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://vzxnfzbgyuoohbocullm.supabase.co/auth/v1/callback'
    }
  });
  
  if (error) throw error;
  
  return data;
}

// Connexion avec Facebook
export async function signInWithFacebook() {
  // Supprimer la classe no-scroll du body pour permettre le défilement
  if (typeof document !== 'undefined') {
    document.body.classList.remove('no-scroll');
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: 'https://vzxnfzbgyuoohbocullm.supabase.co/auth/v1/callback'
    }
  });
  
  if (error) throw error;
  
  return data;
} 