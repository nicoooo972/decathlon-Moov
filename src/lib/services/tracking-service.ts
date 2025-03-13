import { supabase } from '$lib/supabase';
import { writable, get } from 'svelte/store';
import type { Location } from '$lib/types';

// Stores for tracking state
export const isTracking = writable(false);
export const currentPoints = writable<Location[]>([]);
export const currentTrackId = writable<string | null>(null);

let watchId: number | null = null;
let startTime: Date | null = null;
let lastPoint: GeolocationPosition | null = null;

export const startTracking = async (routeId?: number) => {
    if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
    }

    // Create new track in database
    const { data: track, error } = await supabase
        .from('locations')
        .insert({
            type: 'track_point',
            route_id: routeId,
            metadata: {
                start_time: new Date().toISOString()
            }
        })
        .select()
        .single();

    if (error) throw error;

    currentTrackId.set(track.id);
    startTime = new Date();
    isTracking.set(true);

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
};

export const stopTracking = async () => {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    const trackId = get(currentTrackId);
    if (!trackId) return;

    // Update track end time
    const { error } = await supabase
        .from('locations')
        .update({
            metadata: {
                end_time: new Date().toISOString()
            }
        })
        .eq('id', trackId);

    if (error) {
        console.error('Error updating track:', error);
    }

    // Reset stores
    currentTrackId.set(null);
    currentPoints.set([]);
    isTracking.set(false);
    startTime = null;
    lastPoint = null;
};

const handlePosition = async (position: GeolocationPosition) => {
    const trackId = get(currentTrackId);
    if (!trackId) return;

    const point: Partial<Location> = {
        type: 'track_point',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        elevation: position.coords.altitude ?? undefined,
        metadata: {
            speed: position.coords.speed ?? undefined,
            time: new Date().toISOString()
        }
    };

    // Save point to database
    const { error } = await supabase
        .from('locations')
        .insert(point);

    if (error) {
        console.error('Error saving track point:', error);
        return;
    }

    // Update current points
    currentPoints.update(points => [...points, point as Location]);

    // Update stats
    if (lastPoint) {
        updateStats(lastPoint, position);
    }

    lastPoint = position;
};

const handleError = (error: GeolocationPositionError) => {
    console.error('Error getting location:', error);
};

const updateStats = (lastPosition: GeolocationPosition, currentPosition: GeolocationPosition) => {
    // Calculate distance, speed, etc.
    // This can be implemented based on your needs
}; 