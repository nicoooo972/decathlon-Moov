export type UserRole = 'parent' | 'enfant';

export type ActivityPreference = 'nature' | 'histoire' | 'culture' | 'sport' | 'aventure';

export type AgeGroup = 'tout-petit' | 'enfant' | 'adolescent' | 'adulte';

export interface UserPreferences {
  id?: number;
  user_id: string;
  role: UserRole;
  activity_preferences: ActivityPreference[];
  age_groups: AgeGroup[];
  max_distance_km: number;
  accessibility_needs: boolean;
  created_at?: string;
  updated_at?: string;
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
  distance_km: number;
  duration_minutes: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
  activity_type: ActivityPreference;
  suitable_ages: AgeGroup[];
  accessibility: boolean;
  start_point: { lat: number; lng: number };
  end_point: { lat: number; lng: number };
  waypoints: { lat: number; lng: number }[];
  points_of_interest: RoutePoint[];
  image_url: string;
  created_at: string;
  updated_at: string;
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