<!-- tracking-map.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { isTracking, currentPoints, currentStats, startTracking, stopTracking } from '$lib/services/tracking-service';
    import { supabase } from '$lib/supabase';
    import type { Route } from '$lib/types';
    import { browser } from '$app/environment';
    
    export let routeId: number | undefined = undefined;
    
    let mapElement: HTMLDivElement;
    let map: google.maps.Map | null = null;
    let userMarker: google.maps.Marker | null = null;
    let routePath: google.maps.Polyline | null = null;
    let trackPath: google.maps.Polyline | null = null;
    let route: Route | null = null;
    let poiMarkers: google.maps.Marker[] = [];
    let watchId: number | null = null;
    
    // Réagir aux changements des points de suivi
    $: if (map && $currentPoints.length > 0) {
        updateTrackPath();
    }
    
    onMount(async () => {
        if (!browser) return;
        
        // Attendre que l'API Google Maps soit chargée
        if (typeof google === 'undefined') {
            console.error('Google Maps API not loaded');
            return;
        }
        
        // Initialiser la carte
        initMap();
        
        // Charger l'itinéraire si un ID est fourni
        if (routeId) {
            await loadRoute();
        }
        
        // Démarrer le suivi de position
        startPositionTracking();
        
        return () => {
            // Nettoyer les ressources
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
            
            // Supprimer les marqueurs
            if (userMarker) userMarker.setMap(null);
            if (routePath) routePath.setMap(null);
            if (trackPath) trackPath.setMap(null);
            poiMarkers.forEach(marker => marker.setMap(null));
        };
    });
    
    function initMap() {
        // Options de la carte
        const mapOptions = {
            zoom: 13,
            center: { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        };
        
        // Créer la carte
        map = new google.maps.Map(mapElement, mapOptions);
        
        // Ajouter un bouton pour recentrer sur la position
        const centerControlDiv = document.createElement('div');
        const centerControl = createCenterControl();
        centerControlDiv.appendChild(centerControl);
        map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
    }
    
    function createCenterControl() {
        const controlButton = document.createElement('button');
        controlButton.style.backgroundColor = '#fff';
        controlButton.style.border = '2px solid #fff';
        controlButton.style.borderRadius = '50%';
        controlButton.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlButton.style.cursor = 'pointer';
        controlButton.style.marginRight = '10px';
        controlButton.style.marginBottom = '10px';
        controlButton.style.textAlign = 'center';
        controlButton.style.width = '40px';
        controlButton.style.height = '40px';
        controlButton.style.display = 'flex';
        controlButton.style.justifyContent = 'center';
        controlButton.style.alignItems = 'center';
        controlButton.title = 'Centrer sur ma position';
        controlButton.innerHTML = '<span class="material-icons" style="color:#0082C3;">my_location</span>';
        
        controlButton.addEventListener('click', () => {
            if (userMarker && map) {
                map.setCenter(userMarker.getPosition()!);
                map.setZoom(16);
            }
        });
        
        return controlButton;
    }
    
    async function loadRoute() {
        if (!routeId || !map) return;
        
        try {
            const { data, error } = await supabase
                .from('routes')
                .select('*')
                .eq('id', routeId)
                .single();
                
            if (error) throw error;
            if (!data) return;
            
            route = data;
            displayRoute();
        } catch (err) {
            console.error('Error loading route:', err);
        }
    }
    
    function displayRoute() {
        if (!route || !map) return;
        
        try {
            // Créer le chemin à partir des waypoints
            const path = route.waypoints.map(wp => ({
                lat: wp.lat,
                lng: wp.lng
            }));
            
            // Afficher le chemin de l'itinéraire
            routePath = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: '#0082C3',
                strokeOpacity: 0.8,
                strokeWeight: 4,
                map: map
            });
            
            // Ajouter des marqueurs pour les points d'intérêt
            if (route.points_of_interest && route.points_of_interest.length > 0) {
                route.points_of_interest.forEach((poi, index) => {
                    const marker = new google.maps.Marker({
                        position: { lat: poi.position.lat, lng: poi.position.lng },
                        map: map,
                        title: poi.name,
                        icon: {
                            url: '/images/poi-marker.svg',
                            scaledSize: new google.maps.Size(32, 32)
                        },
                        zIndex: 1
                    });
                    
                    // Ajouter une infobulle
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<div class="p-2"><strong>${poi.name}</strong><p>${poi.description.substring(0, 100)}...</p></div>`
                    });
                    
                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });
                    
                    poiMarkers.push(marker);
                });
            }
            
            // Ajuster la vue pour montrer tout l'itinéraire
            const bounds = new google.maps.LatLngBounds();
            path.forEach(point => bounds.extend(point));
            map.fitBounds(bounds);
            
        } catch (err) {
            console.error('Error displaying route:', err);
        }
    }
    
    function startPositionTracking() {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser');
            return;
        }
        
        // Suivre la position
        watchId = navigator.geolocation.watchPosition(
            handlePositionUpdate,
            (error) => console.error('Error getting location:', error),
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
    
    function handlePositionUpdate(position: GeolocationPosition) {
        if (!map) return;
        
        const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        // Mettre à jour ou créer le marqueur de l'utilisateur
        if (userMarker) {
            userMarker.setPosition(pos);
        } else {
            userMarker = new google.maps.Marker({
                position: pos,
                map: map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: '#0082C3',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                    scale: 8
                },
                zIndex: 2
            });
            
            // Centrer la carte sur la position initiale
            map.setCenter(pos);
            map.setZoom(16);
        }
        
        // Si le suivi est actif, centrer la carte sur l'utilisateur
        if ($isTracking) {
            map.setCenter(pos);
        }
    }
    
    function updateTrackPath() {
        if (!map) return;
        
        // Créer le chemin à partir des points enregistrés
        const path = $currentPoints.map(p => ({
            lat: p.latitude,
            lng: p.longitude
        }));
        
        // Mettre à jour ou créer le chemin de suivi
        if (trackPath) {
            trackPath.setPath(path);
        } else {
            trackPath = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: map
            });
        }
    }
</script>

<div class="relative w-full h-[60vh] mb-4">
    <div bind:this={mapElement} class="w-full h-full rounded-lg shadow-lg"></div>
    
    <!-- Overlay des statistiques de suivi -->
    {#if $isTracking}
        <div class="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div class="text-sm text-gray-500">Distance</div>
                    <div class="text-lg font-semibold">
                        {($currentStats.distance / 1000).toFixed(2)} km
                    </div>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Durée</div>
                    <div class="text-lg font-semibold">
                        {Math.floor($currentStats.duration / 60)}:{($currentStats.duration % 60).toString().padStart(2, '0')}
                    </div>
                </div>
                <div>
                    <div class="text-sm text-gray-500">Vitesse</div>
                    <div class="text-lg font-semibold">
                        {($currentStats.speed * 3.6).toFixed(1)} km/h
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(.gm-style-cc) {
        display: none;
    }
</style> 