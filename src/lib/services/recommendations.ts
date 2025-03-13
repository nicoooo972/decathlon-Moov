import { supabase } from '$lib/supabaseClient';
import type { Route, UserPreferences, ActivityPreference, AgeGroup } from '$lib/types';
import { getUserPreferences } from './preferences';

// Vitesse moyenne de marche en km/h
const AVERAGE_WALKING_SPEED = 4.5;

// Fonction utilitaire pour calculer la durée en minutes basée sur la distance
function calculateDuration(distanceKm: number): number {
  // Durée = (distance / vitesse) * 60 pour convertir en minutes
  return Math.round((distanceKm / AVERAGE_WALKING_SPEED) * 60);
}

/**
 * Récupère les recommandations personnalisées en fonction des préférences de l'utilisateur
 */
export async function getPersonalizedRecommendations(
  userId: string, 
  latitude: number = 48.8566, // Paris par défaut
  longitude: number = 2.3522,
  limit: number = 4
): Promise<Route[]> {
  try {
    // Récupérer les préférences de l'utilisateur
    const userPrefs = await getUserPreferences(userId);
    
    if (!userPrefs) {
      // Si l'utilisateur n'a pas de préférences, retourner des recommandations générales
      return getGeneralRecommendations(limit);
    }
    
    // Récupérer toutes les routes
    const { data, error } = await supabase
      .from('routes')
      .select('*');
    
    if (error) {
      console.error('Erreur lors de la récupération des routes:', error);
      return getGeneralRecommendations(limit);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Ajouter la distance et la durée à chaque route
    const routesWithDistance = data.map(route => {
      const distance = calculateDistance(
        latitude,
        longitude,
        route.start_point.lat,
        route.start_point.lng
      );
      return {
        ...route,
        distance_km: distance,
        duration_minutes: calculateDuration(distance)
      };
    });

    // Filtrer selon les préférences utilisateur
    const filteredRoutes = routesWithDistance.filter(route => {
      // Vérifier le type d'activité
      if (userPrefs.activity_preferences?.length > 0 && 
          !userPrefs.activity_preferences.includes(route.activity_type as ActivityPreference)) {
        return false;
      }

      // Vérifier les tranches d'âge (au moins une correspondance)
      if (userPrefs.age_groups?.length > 0 && 
          !route.suitable_ages.some((age: string) => userPrefs.age_groups.includes(age as AgeGroup))) {
        return false;
      }

      // Vérifier l'accessibilité
      if (userPrefs.accessibility_needs && !route.accessibility) {
        return false;
      }

      // Vérifier la distance maximale
      if (userPrefs.max_distance_km && route.distance_km > userPrefs.max_distance_km) {
        return false;
      }

      return true;
    });

    // Trier par distance et limiter le nombre de résultats
    return filteredRoutes
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);

  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations personnalisées:', error);
    return getGeneralRecommendations(limit);
  }
}

// Fonction utilitaire pour calculer la distance entre deux points GPS (formule de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
}

/**
 * Récupère les points d'intérêt à proximité de l'utilisateur
 */
export async function getNearbyPOIs(
  latitude: number, 
  longitude: number, 
  radiusKm: number = 10,
  limit: number = 6
): Promise<Route[]> {
  try {
    // Récupérer tous les POIs
    const { data, error } = await supabase
      .from('routes')
      .select('*');
    
    if (error) {
      console.error('Erreur lors de la récupération des POIs:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Calculer la distance et la durée pour chaque POI et filtrer ceux dans le rayon
    const poisWithDistance = data
      .map(poi => {
        const distance = calculateDistance(
          latitude,
          longitude,
          poi.start_point.lat,
          poi.start_point.lng
        );
        return {
          ...poi,
          distance_km: distance,
          duration_minutes: calculateDuration(distance)
        };
      })
      .filter(poi => poi.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);

    return poisWithDistance;
  } catch (error) {
    console.error('Erreur lors de la récupération des POIs à proximité:', error);
    return [];
  }
}

/**
 * Récupère des recommandations générales (non personnalisées)
 */
export async function getGeneralRecommendations(limit: number = 4): Promise<Route[]> {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .limit(limit);
    
    if (error) {
      console.error('Erreur lors de la récupération des recommandations générales:', error);
      // Vérifier si la table existe
      await ensureRoutesTableExists();
      // Réessayer après avoir créé la table
      const retryResult = await supabase.from('routes').select('*').limit(limit);
      return retryResult.data || [];
    }
    
    if (!data || data.length === 0) {
      // Vérifier si la table est vide et la remplir si nécessaire
      await ensureRoutesTableHasData();
      // Réessayer après avoir ajouté des données
      const retryResult = await supabase.from('routes').select('*').limit(limit);
      return retryResult.data || [];
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations générales:', error);
    // Créer des données si nécessaire
    await ensureRoutesTableHasData();
    // Réessayer une dernière fois
    try {
      const retryResult = await supabase.from('routes').select('*').limit(limit);
      return retryResult.data || [];
    } catch (e) {
      console.error('Échec de la récupération des recommandations après création de données:', e);
      return [];
    }
  }
}

/**
 * Vérifie si la table routes existe et la crée si nécessaire
 */
async function ensureRoutesTableExists(): Promise<void> {
  try {
    // Vérifier si la table existe en essayant de récupérer une ligne
    const { error } = await supabase.from('routes').select('id').limit(1);
    
    if (error && error.code === '42P01') { // Code PostgreSQL pour "relation does not exist"
      console.log('La table routes n\'existe pas, création en cours...');
      
      // Créer la table routes
      await supabase.rpc('create_routes_table');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification/création de la table routes:', error);
  }
}

/**
 * Vérifie si la table routes contient des données et en ajoute si nécessaire
 */
async function ensureRoutesTableHasData(): Promise<void> {
  try {
    // Vérifier si la table contient des données
    const { data, error } = await supabase.from('routes').select('id').limit(1);
    
    if (error) {
      console.error('Erreur lors de la vérification des données de la table routes:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('La table routes est vide, ajout de données...');
      
      // Ajouter des données de test
    
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de données à la table routes:', error);
  }
} 