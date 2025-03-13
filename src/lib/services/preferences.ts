import { supabase } from '$lib/supabaseClient';
import type { UserPreferences, UserRole, ActivityPreference, AgeGroup } from '$lib/types';
import { writable } from 'svelte/store';

export const userPreferences = writable<UserPreferences | null>(null);

// Récupérer les préférences de l'utilisateur
export async function getUserPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // PGRST116 est l'erreur "No rows found", qu'on peut ignorer
      if (error.code === 'PGRST116') {
        console.log('Aucune préférence trouvée pour l\'utilisateur:', userId);
        return null;
      }
      
      console.error('Erreur lors de la récupération des préférences:', error);
      return null;
    }
    
    if (data) {
      userPreferences.set(data as UserPreferences);
      return data as UserPreferences;
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    return null;
  }
}

// Créer ou mettre à jour les préférences
export async function saveUserPreferences(
  userId: string,
  role: UserRole,
  activityPreferences: ActivityPreference[],
  ageGroups: AgeGroup[],
  maxDistanceKm: number,
  accessibilityNeeds: boolean
) {
  // Vérifier si les préférences existent déjà
  const existingPrefs = await getUserPreferences(userId);
  
  if (existingPrefs) {
    // Mettre à jour
    const { data, error } = await supabase
      .from('preferences')
      .update({
        role,
        activity_preferences: activityPreferences,
        age_groups: ageGroups,
        max_distance_km: maxDistanceKm,
        accessibility_needs: accessibilityNeeds,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPrefs.id)
      .select()
      .single();
    
    if (error) throw error;
    
    userPreferences.set(data as UserPreferences);
    return data;
  } else {
    // Créer
    const { data, error } = await supabase
      .from('preferences')
      .insert({
        user_id: userId,
        role,
        activity_preferences: activityPreferences,
        age_groups: ageGroups,
        max_distance_km: maxDistanceKm,
        accessibility_needs: accessibilityNeeds,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    userPreferences.set(data as UserPreferences);
    return data;
  }
}

// Vérifier si l'utilisateur a complété ses préférences
export async function hasCompletedPreferences(userId: string): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  return !!prefs;
} 