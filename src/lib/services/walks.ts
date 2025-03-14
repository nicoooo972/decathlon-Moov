import { supabase } from '$lib/supabase';
import { currentUser } from './auth';
import { get } from 'svelte/store';
import { showNotification } from '$lib/stores/app-store';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@supabase/supabase-js';

// Interface pour les balades terminées
export interface CompletedWalk {
  id?: string;
  user_id?: string;
  route_id: string | null;
  name: string;
  description: string;
  distance_km: number;
  duration_seconds: number;
  steps: number;
  created_at?: string;
  image_url?: string;
}

// Interface pour les points de suivi
export interface WalkPoint {
  id?: string;
  walk_id: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timestamp: string;
}

// Interface pour les photos de balade
export interface WalkPhoto {
  id?: string;
  walk_id: string;
  url: string;
  created_at?: string;
}

/**
 * Sauvegarde une balade terminée
 */
export async function saveCompletedWalk(walkData: CompletedWalk) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    showNotification('Vous devez être connecté pour enregistrer une balade', 'error');
    return { data: null, error: new Error('Utilisateur non connecté') };
  }
  
  const { data, error } = await supabase
    .from('completed_walks')
    .insert({
      ...walkData,
      user_id: user.id
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * Récupère les balades terminées d'un utilisateur
 */
export async function getUserCompletedWalks() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: new Error('Utilisateur non connecté') };
  }
  
  const { data, error } = await supabase
    .from('completed_walks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * Récupère une balade terminée par son ID
 */
export async function getCompletedWalkById(walkId: string) {
  const { data, error } = await supabase
    .from('completed_walks')
    .select('*')
    .eq('id', walkId)
    .single();
  
  return { data, error };
}

/**
 * Récupère les points d'une balade
 */
export async function getWalkPoints(walkId: string) {
  const { data, error } = await supabase
    .from('walk_points')
    .select('*')
    .eq('walk_id', walkId)
    .order('timestamp', { ascending: true });
  
  return { data, error };
}

/**
 * Met à jour la description d'une balade
 */
export async function updateWalkDescription(walkId: string, description: string) {
  const { data, error } = await supabase
    .from('completed_walks')
    .update({ description })
    .eq('id', walkId);
  
  return { data, error };
}

/**
 * Télécharge une photo pour une balade
 */
export async function uploadWalkPhoto(walkId: string, file: File) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    showNotification('Vous devez être connecté pour télécharger des photos', 'error');
    return { data: null, error: new Error('Utilisateur non connecté') };
  }
  
  try {
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `walk_photos/${user.id}/${walkId}/${fileName}`;
    
    // Télécharger le fichier vers le bucket de stockage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Erreur lors du téléchargement de la photo:', uploadError);
      return { data: null, error: uploadError };
    }
    
    // Récupérer l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);
    
    // Enregistrer l'URL dans la table walk_photos
    const { data: photoData, error: photoError } = await supabase
      .from('walk_photos')
      .insert({
        walk_id: walkId,
        url: publicUrl
      })
      .select()
      .single();
    
    if (photoError) {
      console.error('Erreur lors de l\'enregistrement de la photo:', photoError);
      return { data: null, error: photoError };
    }
    
    return { data: photoData, error: null };
  } catch (error) {
    console.error('Erreur inattendue lors du téléchargement de la photo:', error);
    return { data: null, error };
  }
} 