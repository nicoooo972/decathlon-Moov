import { supabase } from '$lib/supabase';
import type { Route, Location, POI, UserRouteInteraction } from '$lib/types';

// Récupérer tous les parcours avec leurs points d'intérêt
export async function getAllRoutes(): Promise<Route[]> {
    const { data, error } = await supabase
        .from('routes')
        .select(`
            *,
            locations (
                *,
                pois (*)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Route[];
}

// Récupérer un parcours par son ID
export async function getRouteById(id: number): Promise<Route | null> {
    const { data, error } = await supabase
        .from('routes')
        .select(`
            *,
            locations (
                *,
                pois (*)
            )
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Route;
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
            return route.suitable_ages.some((age: string) => preferences.age_groups.includes(age));
        });
    }
    
    return filteredRoutes as Route[];
}

// Interface pour les résultats de la requête
interface RoutePointProductResult {
    products: POI;
}

// Récupérer les produits recommandés pour un point d'intérêt
export async function getProductsForRoutePoint(routeId: number, pointIndex: number): Promise<POI[]> {
    const { data, error } = await supabase
        .from('route_point_products')
        .select('products(*)')
        .eq('route_id', routeId)
        .eq('point_index', pointIndex);
    
    if (error) throw error;
    
    if (!data) return [];
    
    return (data as unknown as RoutePointProductResult[]).map(item => item.products);
}

// Vérifier si un parcours est dans les favoris
export async function isRouteFavorite(userId: string, routeId: number): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_route_interactions')
        .select('*')
        .eq('user_id', userId)
        .eq('route_id', routeId)
        .eq('interaction_type', 'favorite')
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
}

// Ajouter un parcours aux favoris
export async function saveRouteFavorite(userId: string, routeId: number): Promise<void> {
    const { error } = await supabase
        .from('user_route_interactions')
        .insert({
            user_id: userId,
            route_id: routeId,
            interaction_type: 'favorite'
        });

    if (error) throw error;
}

// Retirer un parcours des favoris
export async function removeRouteFavorite(userId: string, routeId: number): Promise<void> {
    const { error } = await supabase
        .from('user_route_interactions')
        .delete()
        .eq('user_id', userId)
        .eq('route_id', routeId)
        .eq('interaction_type', 'favorite');

    if (error) throw error;
}

// Récupérer les parcours favoris d'un utilisateur
export async function getUserFavoriteRoutes(userId: string): Promise<Route[]> {
    const { data, error } = await supabase
        .from('user_route_interactions')
        .select(`
            route_id,
            route:routes (
                *,
                locations (
                    *,
                    pois (*)
                )
            )
        `)
        .eq('user_id', userId)
        .eq('interaction_type', 'favorite');

    if (error) throw error;
    if (!data) return [];
    return data.map(item => (item.route as unknown) as Route);
}

// Marquer un parcours comme complété
export async function markRouteAsCompleted(
    userId: string,
    routeId: number,
    duration_minutes: number,
    rating?: number
): Promise<void> {
    const { error } = await supabase
        .from('user_route_interactions')
        .insert({
            user_id: userId,
            route_id: routeId,
            interaction_type: 'completed',
            completed_at: new Date().toISOString(),
            duration_minutes,
            rating
        });

    if (error) throw error;
}

// Récupérer les parcours complétés d'un utilisateur
export async function getUserCompletedRoutes(userId: string): Promise<UserRouteInteraction[]> {
    const { data, error } = await supabase
        .from('user_route_interactions')
        .select(`
            *,
            route:routes (
                *,
                locations (
                    *,
                    pois (*)
                )
            )
        `)
        .eq('user_id', userId)
        .eq('interaction_type', 'completed')
        .order('completed_at', { ascending: false });

    if (error) throw error;
    return (data || []) as UserRouteInteraction[];
} 