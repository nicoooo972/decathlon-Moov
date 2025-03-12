import { supabase } from '$lib/supabase';
import type { User } from '$lib/types';
import { currentUser, refreshUserData } from './auth';

// Récupérer les statistiques de l'utilisateur
export async function getUserStats(userId: string) {
  try {
    // Nombre de points d'intérêt visités
    const { count: visitedCount, error: visitedError } = await supabase
      .from('user_visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (visitedError) throw visitedError;
    
    // Nombre de favoris
    const { count: favoritesCount, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (favoritesError) throw favoritesError;
    
    // Nombre de routes complétées
    const { count: routesCount, error: routesError } = await supabase
      .from('user_completed_routes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (routesError) throw routesError;
    
    return {
      visited: visitedCount || 0,
      favorites: favoritesCount || 0,
      routes: routesCount || 0
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return {
      visited: 0,
      favorites: 0,
      routes: 0
    };
  }
}

// Mettre à jour l'avatar de l'utilisateur
export async function updateUserAvatar(userId: string, file: File): Promise<string> {
  try {
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Télécharger le fichier
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    // Obtenir l'URL publique
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    const avatarUrl = data.publicUrl;
    
    // Mettre à jour le profil avec la nouvelle URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    
    if (updateError) throw updateError;
    
    // Rafraîchir les données utilisateur
    await refreshUserData();
    
    return avatarUrl;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'avatar:', error);
    throw error;
  }
}

// Supprimer le compte utilisateur
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    // Supprimer le profil (la suppression du compte sera gérée par un trigger dans Supabase)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
    
    // Déconnecter l'utilisateur
    await supabase.auth.signOut();
    currentUser.set(null);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    throw error;
  }
}

// Récupérer l'historique des visites de l'utilisateur
export async function getUserVisitHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_visits')
      .select(`
        id,
        visited_at,
        points_of_interest (
          id,
          name,
          image_url,
          latitude,
          longitude
        )
      `)
      .eq('user_id', userId)
      .order('visited_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des visites:', error);
    return [];
  }
}

// Récupérer les favoris de l'utilisateur
export async function getUserFavorites(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        created_at,
        points_of_interest (
          id,
          name,
          image_url,
          latitude,
          longitude
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return [];
  }
} 