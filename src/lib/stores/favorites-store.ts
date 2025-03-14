import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { currentUser } from '$lib/services/auth';
import { get } from 'svelte/store';

// Store pour les favoris
export const favoritePOIs = writable<Set<number>>(new Set());

// Fonction pour charger les favoris de l'utilisateur
export async function loadUserFavorites() {
  const user = get(currentUser);
  if (!user) return;
  
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('poi_id')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    if (data) {
      favoritePOIs.set(new Set(data.map((fav: { poi_id: number }) => fav.poi_id)));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des favoris:', error);
  }
}

// Fonction pour vérifier si un POI est dans les favoris
export async function checkIfFavorite(poiId: number) {
  const user = get(currentUser);
  if (!user) return false;
  
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('poi_id', poiId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (data) {
      // Mettre à jour le store
      favoritePOIs.update(set => {
        set.add(poiId);
        return set;
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification des favoris:', error);
    return false;
  }
}

// Fonction pour ajouter/supprimer un favori
export async function toggleFavorite(poiId: number) {
  const user = get(currentUser);
  if (!user) return false;
  
  // Récupérer l'état actuel des favoris
  const favorites = get(favoritePOIs);
  const isFavorite = favorites.has(poiId);
  
  try {
    if (isFavorite) {
      // Supprimer des favoris
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('poi_id', poiId);
        
      if (error) throw error;
      
      // Mettre à jour le store
      favoritePOIs.update(set => {
        set.delete(poiId);
        return set;
      });
      
      return false; // N'est plus un favori
    } else {
      // Ajouter aux favoris
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          poi_id: poiId
        });
        
      if (error) throw error;
      
      // Mettre à jour le store
      favoritePOIs.update(set => {
        set.add(poiId);
        return set;
      });
      
      return true; // Est maintenant un favori
    }
  } catch (error) {
    console.error('Erreur lors de la gestion des favoris:', error);
    return isFavorite; // Retourner l'état précédent en cas d'erreur
  }
}

// Initialiser les favoris quand l'utilisateur change
currentUser.subscribe(user => {
  if (user) {
    loadUserFavorites();
  } else {
    favoritePOIs.set(new Set());
  }
}); 