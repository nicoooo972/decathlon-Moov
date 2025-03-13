import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { Track, TrackPoint } from '$lib/types';

// Stores for tracking state
export const isTracking = writable(false);
export const currentTrack = writable<Track | null>(null);
export const currentPoints = writable<TrackPoint[]>([]);
export const currentStats = writable({
    distance: 0,
    duration: 0,
    speed: 0,
    elevationGain: 0,
    elevationLoss: 0
});

let watchId: number | null = null;
let startTime: Date | null = null;
let lastPoint: GeolocationPosition | null = null;

export const startTracking = async (routeId?: number) => {
    if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
    }

    // Create new track in database
    const { data: track, error } = await supabase
        .from('tracks')
        .insert({
            route_id: routeId,
            start_time: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;

    currentTrack.set(track);
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

    const track = get(currentTrack);
    if (!track) return;

    const points = get(currentPoints);
    const stats = get(currentStats);

    // Update track with final stats
    const { error } = await supabase
        .from('tracks')
        .update({
            end_time: new Date().toISOString(),
            distance: stats.distance,
            duration: Math.floor((Date.now() - startTime!.getTime()) / 1000),
            average_speed: stats.speed,
            elevation_gain: stats.elevationGain,
            elevation_loss: stats.elevationLoss
        })
        .eq('id', track.id);

    if (error) throw error;

    // Reset stores
    isTracking.set(false);
    currentTrack.set(null);
    currentPoints.set([]);
    currentStats.set({
        distance: 0,
        duration: 0,
        speed: 0,
        elevationGain: 0,
        elevationLoss: 0
    });
};

const handlePosition = async (position: GeolocationPosition) => {
    const track = get(currentTrack);
    if (!track) return;

    const point = {
        track_id: track.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        elevation: position.coords.altitude || null,
        speed: position.coords.speed || null,
        time: new Date().toISOString()
    };

    // Save point to database
    const { error } = await supabase
        .from('track_points')
        .insert(point);

    if (error) {
        console.error('Error saving track point:', error);
        return;
    }

    // Update current points
    currentPoints.update(points => [...points, point]);

    // Update stats
    if (lastPoint) {
        updateStats(lastPoint, position);
    }

    lastPoint = position;
};

const handleError = (error: GeolocationPositionError) => {
    console.error('Error getting location:', error);
};

const updateStats = (lastPosition: GeolocationPosition, newPosition: GeolocationPosition) => {
    currentStats.update(stats => {
        const distance = calculateDistance(
            lastPosition.coords.latitude,
            lastPosition.coords.longitude,
            newPosition.coords.latitude,
            newPosition.coords.longitude
        );

        const elevationDiff = (newPosition.coords.altitude || 0) - (lastPosition.coords.altitude || 0);
        
        return {
            ...stats,
            distance: stats.distance + distance,
            speed: newPosition.coords.speed || 0,
            elevationGain: stats.elevationGain + (elevationDiff > 0 ? elevationDiff : 0),
            elevationLoss: stats.elevationLoss + (elevationDiff < 0 ? -elevationDiff : 0)
        };
    });
};

// Haversine formula for calculating distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}; 