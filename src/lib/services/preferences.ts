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
  activities: string[],
  ageGroups: string[],
  maxDistance: number,
  accessibilityNeeds: boolean,
  durationMinutes: number
) {
  const { data, error } = await supabase
    .from('preferences')
    .upsert({
      user_id: userId,
      role,
      activities,
      age_groups: ageGroups,
      max_distance: maxDistance,
      accessibility_needs: accessibilityNeeds,
      duration_minutes: durationMinutes,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) {
    throw error;
  }

  return data;
}

// Vérifier si l'utilisateur a complété ses préférences
export async function hasCompletedPreferences(userId: string): Promise<boolean> {
  const prefs = await getUserPreferences(userId);
  return !!prefs;
} 