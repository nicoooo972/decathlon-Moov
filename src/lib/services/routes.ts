import { supabase } from '$lib/supabase';
import type { Route, RoutePoint, Product, UserPreferences, AgeGroup } from '$lib/types';

// Récupérer tous les parcours
export async function getAllRoutes(): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
}

// Récupérer un parcours par son ID
export async function getRouteById(id: number): Promise<Route | null> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  
  return data;
}

// Récupérer les parcours recommandés en fonction des préférences de l'utilisateur
export async function getRecommendedRoutes(userId: string): Promise<Route[]> {
  // Récupérer les préférences de l'utilisateur
  const { data: preferences, error: preferencesError } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (preferencesError) {
    console.error('Erreur lors de la récupération des préférences:', preferencesError);
    return getAllRoutes(); // Fallback: retourner tous les parcours
  }
  
  if (!preferences) {
    return getAllRoutes(); // Pas de préférences, retourner tous les parcours
  }
  
  // Filtrer les parcours en fonction des préférences
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .in('activity_type', preferences.activity_preferences)
    .lte('distance_km', preferences.max_distance_km)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Filtrer davantage côté client pour les tranches d'âge et l'accessibilité
  let filteredRoutes = data || [];
  
  if (preferences.accessibility_needs) {
    filteredRoutes = filteredRoutes.filter(route => route.accessibility);
  }
  
  if (preferences.age_groups && preferences.age_groups.length > 0) {
    filteredRoutes = filteredRoutes.filter(route => {
      return route.suitable_ages.some((age: AgeGroup) => preferences.age_groups.includes(age));
    });
  }
  
  return filteredRoutes;
}

// Interface pour les résultats de la requête
interface RoutePointProductResult {
  products: Product;
}

// Récupérer les produits recommandés pour un point d'intérêt
export async function getProductsForRoutePoint(routeId: number, pointIndex: number): Promise<Product[]> {
  const { data, error } = await supabase
    .from('route_point_products')
    .select('products(*)')
    .eq('route_id', routeId)
    .eq('point_index', pointIndex);
  
  if (error) throw error;
  
  if (!data) return [];
  
  return data.map((item: RoutePointProductResult) => item.products);
}

// Enregistrer un parcours comme favori
export async function saveRouteFavorite(userId: string, routeId: number): Promise<void> {
  const { error } = await supabase
    .from('route_favorites')
    .insert({ user_id: userId, route_id: routeId });
  
  if (error) throw error;
}

// Supprimer un parcours des favoris
export async function removeRouteFavorite(userId: string, routeId: number): Promise<void> {
  const { error } = await supabase
    .from('route_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('route_id', routeId);
  
  if (error) throw error;
}

// Vérifier si un parcours est dans les favoris
export async function isRouteFavorite(userId: string, routeId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('route_favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('route_id', routeId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  
  return !!data;
}

// Interface pour les résultats de la requête
interface RouteFavoriteResult {
  routes: Route;
}

// Récupérer les parcours favoris d'un utilisateur
export async function getUserFavoriteRoutes(userId: string): Promise<Route[]> {
  const { data, error } = await supabase
    .from('route_favorites')
    .select('route_id, routes(*)')
    .eq('user_id', userId);
  
  if (error) throw error;
  
  if (!data) return [];
  
  return data.map((item: RouteFavoriteResult) => item.routes);
} 