export type UserRole = 'solo' | 'family';

export type ActivityPreference = 'nature' | 'histoire' | 'culture' | 'sport' | 'aventure';

export type AgeGroup = 'tout-petit' | 'enfant' | 'adolescent' | 'adulte';

export interface UserPreferences {
  user_id: string;
  role: UserRole;
  activities: string[];
  age_groups: string[];
  max_distance: number;
  accessibility_needs: boolean;
  duration_minutes: number;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Route {
  id: number;
  name: string;
  description: string;
  duration_minutes?: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
  activity_type: string;
  suitable_ages: string[];
  accessibility: boolean;
  start_point: { lat: number; lng: number };
  end_point: { lat: number; lng: number };
  path_geom?: any; // GeoJSON LineString
  created_at: string;
  updated_at: string;
  image_url?: string;
  distance_km?: number; // Distance calculée à la volée
}

export interface RoutePoint {
  position: { lat: number; lng: number };
  name: string;
  description: string;
  image_url: string;
  recommended_products: Product[];
  details?: string[];
  activities?: string[];
  opening_hours?: string;
  website?: string;
}

export interface Product {
  id: number;
  name: string;
  image_url: string;
  price: number;
  url: string;
  category?: string;
}

export interface Track {
    id: string;
    user_id: string;
    route_id?: number;
    route?: {
        name: string;
        distance: number;
        elevation_gain: number;
    };
    start_time: string;
    end_time?: string;
    distance?: number;
    duration?: number;
    average_speed?: number;
    max_speed?: number;
    elevation_gain?: number;
    elevation_loss?: number;
    created_at: string;
    updated_at: string;
}

export interface TrackPoint {
    id?: string;
    track_id: string;
    latitude: number;
    longitude: number;
    elevation?: number | null;
    speed?: number | null;
    time: string;
    created_at?: string;
}

export interface Location {
    id: number;
    type: 'track_point' | 'poi' | 'checkpoint';
    name?: string;
    description?: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    route_id?: number;
    sequence_order?: number;
    metadata?: Record<string, any>;
    created_at: string;
}

export interface POI {
    id: number;
    name: string;
    type: 'activity' | 'product' | 'service';
    description?: string;
    location_id: number;
    contact_info?: Record<string, any>;
    opening_hours?: Record<string, any>;
    metadata?: Record<string, any>;
    created_at: string;
    location?: Location;
}

export interface UserRouteInteraction {
    id: number;
    user_id: string;
    route_id: number;
    interaction_type: 'completed' | 'favorite' | 'visited';
    completed_at?: string;
    rating?: number;
    duration_minutes?: number;
    metadata?: Record<string, any>;
    created_at: string;
    route?: Route;
} 