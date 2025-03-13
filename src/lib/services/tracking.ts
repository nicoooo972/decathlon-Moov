import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { currentUser } from './auth';
import { get } from 'svelte/store';
import { showNotification } from '$lib/stores/app-store';

// Types pour le suivi de trajet
export interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
}

export interface TrackingSession {
  id?: string;
  userId: string;
  poiId?: number;
  poiName?: string;
  startTime: number;
  endTime?: number;
  duration?: number; // en secondes
  distance?: number; // en mètres
  steps?: number;
  points: TrackingPoint[];
  isActive: boolean;
}

// Store pour la session de suivi actuelle
export const trackingSession = writable<TrackingSession | null>(null);
export const isTracking = writable<boolean>(false);

// Variables pour le suivi
let watchId: number | null = null;
let stepCountStart = 0;
let stepCountEnd = 0;
let hasStepCounter = false;

// Vérifier si l'API de comptage de pas est disponible
export function checkStepCounterAvailability(): boolean {
  if (typeof window !== 'undefined') {
    // @ts-ignore - L'API de comptage de pas n'est pas encore standardisée
    return window.Pedometer || ('sensors' in window && 'StepCounter' in window.sensors);
  }
  return false;
}

// Démarrer le suivi d'un trajet
export async function startTracking(poiId?: number, poiName?: string): Promise<boolean> {
  try {
    const user = get(currentUser);
    if (!user) {
      showNotification('Vous devez être connecté pour enregistrer un trajet', 'error');
      return false;
    }

    // Vérifier si le navigateur supporte la géolocalisation
    if (!navigator.geolocation) {
      showNotification('Votre appareil ne supporte pas la géolocalisation', 'error');
      return false;
    }

    // Vérifier si une session est déjà active
    if (get(isTracking)) {
      showNotification('Un trajet est déjà en cours d\'enregistrement', 'info');
      return false;
    }

    // Initialiser la session de suivi
    const newSession: TrackingSession = {
      userId: user.id,
      poiId,
      poiName,
      startTime: Date.now(),
      points: [],
      isActive: true
    };

    // Vérifier si le compteur de pas est disponible
    hasStepCounter = checkStepCounterAvailability();
    if (hasStepCounter) {
      try {
        // @ts-ignore - L'API de comptage de pas n'est pas encore standardisée
        if (window.Pedometer) {
          // @ts-ignore
          stepCountStart = await window.Pedometer.getStepCount();
        } else if ('sensors' in window && 'StepCounter' in window.sensors) {
          // @ts-ignore
          const sensor = new window.sensors.StepCounter();
          sensor.addEventListener('reading', () => {
            // @ts-ignore
            stepCountStart = sensor.steps;
          });
          sensor.start();
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du compteur de pas:', error);
        hasStepCounter = false;
      }
    }

    // Démarrer le suivi de position
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: TrackingPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          speed: position.coords.speed || undefined
        };

        // Mettre à jour la session avec le nouveau point
        trackingSession.update(session => {
          if (session) {
            session.points.push(point);
            
            // Calculer la distance parcourue
            if (session.points.length > 1) {
              const prevPoint = session.points[session.points.length - 2];
              const newDistance = calculateDistance(
                prevPoint.lat, prevPoint.lng,
                point.lat, point.lng
              );
              session.distance = (session.distance || 0) + newDistance;
            } else {
              session.distance = 0;
            }
            
            return session;
          }
          return null;
        });
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        showNotification('Erreur lors du suivi de position', 'error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );

    // Mettre à jour les stores
    trackingSession.set(newSession);
    isTracking.set(true);

    // Créer l'enregistrement en base de données
    const { data, error } = await supabase
      .from('tracking_sessions')
      .insert({
        user_id: user.id,
        poi_id: poiId,
        poi_name: poiName,
        start_time: new Date(newSession.startTime).toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la session de suivi:', error);
      showNotification('Erreur lors de l\'enregistrement du trajet', 'error');
      return false;
    }

    // Mettre à jour l'ID de la session
    trackingSession.update(session => {
      if (session) {
        session.id = data.id;
        return session;
      }
      return null;
    });

    showNotification('Enregistrement du trajet démarré', 'success');
    return true;
  } catch (error) {
    console.error('Erreur lors du démarrage du suivi:', error);
    showNotification('Erreur lors du démarrage du suivi', 'error');
    return false;
  }
}

// Arrêter le suivi et enregistrer les données
export async function stopTracking(): Promise<boolean> {
  try {
    const session = get(trackingSession);
    if (!session || !session.isActive) {
      showNotification('Aucun trajet en cours d\'enregistrement', 'info');
      return false;
    }

    // Arrêter le suivi de position
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    // Récupérer le nombre de pas final si disponible
    if (hasStepCounter) {
      try {
        // @ts-ignore
        if (window.Pedometer) {
          // @ts-ignore
          stepCountEnd = await window.Pedometer.getStepCount();
        } else if ('sensors' in window && 'StepCounter' in window.sensors) {
          // @ts-ignore
          const sensor = new window.sensors.StepCounter();
          sensor.addEventListener('reading', () => {
            // @ts-ignore
            stepCountEnd = sensor.steps;
          });
          sensor.start();
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre de pas:', error);
      }
    }

    // Calculer les statistiques finales
    const endTime = Date.now();
    const duration = Math.round((endTime - session.startTime) / 1000); // en secondes
    const steps = hasStepCounter ? stepCountEnd - stepCountStart : undefined;

    // Mettre à jour la session
    trackingSession.update(s => {
      if (s) {
        s.endTime = endTime;
        s.duration = duration;
        s.steps = steps;
        s.isActive = false;
        return s;
      }
      return null;
    });

    // Mettre à jour l'enregistrement en base de données
    if (session.id) {
      const { error } = await supabase
        .from('tracking_sessions')
        .update({
          end_time: new Date(endTime).toISOString(),
          duration,
          distance: session.distance,
          steps,
          points: session.points,
          is_active: false
        })
        .eq('id', session.id);

      if (error) {
        console.error('Erreur lors de la mise à jour de la session de suivi:', error);
        showNotification('Erreur lors de l\'enregistrement des données du trajet', 'error');
        return false;
      }
    }

    // Réinitialiser les stores
    isTracking.set(false);

    showNotification('Trajet enregistré avec succès', 'success');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du suivi:', error);
    showNotification('Erreur lors de l\'arrêt du suivi', 'error');
    return false;
  }
}

// Calculer la distance entre deux points en mètres (formule de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Récupérer l'historique des trajets d'un utilisateur
export async function getUserTrackingSessions() {
  try {
    const user = get(currentUser);
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des sessions de suivi:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions de suivi:', error);
    return [];
  }
}

// Récupérer une session de suivi par son ID
export async function getTrackingSessionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la session de suivi:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération de la session de suivi:', error);
    return null;
  }
} 