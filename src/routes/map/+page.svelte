<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { getAllRoutes, getRouteById } from '$lib/services/routes';
  import { getAllPOIs, getFullPOIData } from '$lib/services/poi';
  import { withLoading, showNotification } from '$lib/stores/app-store';
  import { browser } from '$app/environment';
  import type { Route, RoutePoint } from '$lib/types';
  
  // Interface étendue pour les POIs avec des propriétés supplémentaires
  interface ExtendedRoutePoint extends RoutePoint {
    route_name?: string;
    route_id?: number;
    is_route_start?: boolean;
    distance_km?: number;
    difficulty?: string;
  }
  
  let mapElement: HTMLDivElement;
  let map: google.maps.Map | null = null;
  let userMarker: google.maps.Marker | null = null;
  let routeMarkers: google.maps.Marker[] = [];
  let poiMarkers: google.maps.Marker[] = [];
  let routePaths: google.maps.Polyline[] = [];
  let infoWindows: google.maps.InfoWindow[] = [];
  let selectedRoute: Route | null = null;
  let selectedRouteId: number | null = null;
  let selectedPOI: ExtendedRoutePoint | null = null;
  let routes: Route[] = [];
  let pois: RoutePoint[] = [];
  let watchId: number | null = null;
  let mapError: string | null = null;
  let isLoadingRoutes: boolean = false;
  let isPOIExpanded: boolean = false; // État d'expansion du panneau POI
  let touchStartY: number = 0;
  let touchEndY: number = 0;
  let poiPanelElement: HTMLDivElement;
  
  // Variables pour le suivi du trajet
  let isNavigating: boolean = false; // Indique si la navigation est active
  let isTracking: boolean = false; // Indique si l'enregistrement du trajet est actif
  let navigationPath: google.maps.Polyline | null = null; // Chemin de navigation
  let directionsRenderer: google.maps.DirectionsRenderer | null = null; // Renderer pour les directions
  let trackingPath: google.maps.Polyline[] = []; // Chemins enregistrés pendant le suivi
  let trackingCoordinates: google.maps.LatLng[] = []; // Coordonnées enregistrées pendant le suivi
  let startTime: number | null = null; // Heure de début du suivi
  let elapsedTime: number = 0; // Temps écoulé en secondes
  let distance: number = 0; // Distance parcourue en km
  let stepCount: number = 0; // Nombre de pas (estimation)
  let trackingInterval: number | null = null; // Intervalle pour mettre à jour le temps écoulé
  let destinationMarker: google.maps.Marker | null = null; // Marqueur de destination
  let navigationDestination: ExtendedRoutePoint | null = null; // Destination de navigation
  let navigationDistance: string = ""; // Distance jusqu'à la destination
  
  // Récupérer l'ID de l'itinéraire depuis les paramètres d'URL
  $: {
    const routeParam = $page.url.searchParams.get('route');
    if (routeParam) {
      selectedRouteId = parseInt(routeParam);
      if (!isNaN(selectedRouteId)) {
        loadSelectedRoute(selectedRouteId);
      }
    }
  }
  
  onMount(() => {
    if (!browser) return;
    
    // Vérifier si l'utilisateur est connecté
    if (!$currentUser) {
      goto('/login');
      return;
    }
    
    // Désactiver le scroll sur le body quand on est sur la page carte
    document.body.style.overflow = 'hidden';
    
    // Initialiser la carte de manière asynchrone
    initializeMap();
    
    // Fonction de nettoyage
    return () => {
      // Réactiver le scroll sur le body quand on quitte la page
      document.body.style.overflow = '';
      
      // Nettoyer les ressources
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      // Supprimer les marqueurs
      if (userMarker) userMarker.setMap(null);
      routeMarkers.forEach(marker => marker.setMap(null));
      poiMarkers.forEach(marker => marker.setMap(null));
      routePaths.forEach(path => path.setMap(null));
      infoWindows.forEach(window => window.close());
    };
  });
  
  async function initializeMap() {
    try {
      // Attendre que l'API Google Maps soit chargée
      if (typeof google === 'undefined') {
        mapError = "L'API Google Maps n'est pas chargée. Veuillez vérifier votre connexion internet.";
        return;
      }
      
      // Initialiser la carte
      initMap();
      
      // Charger les itinéraires
      await loadRoutes();
      
      // Charger les points d'intérêt
      await loadPOIs();
      
      // Démarrer le suivi de position
      startPositionTracking();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      if (error instanceof Error) {
        mapError = `Erreur: ${error.message}`;
      } else {
        mapError = "Une erreur s'est produite lors du chargement de la carte.";
      }
    }
  }
  
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
      clickableIcons: false, // Désactiver les POIs natifs de Google Maps
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    };
    
    try {
      // Créer la carte
      map = new google.maps.Map(mapElement, mapOptions);
      
      // Ajouter un bouton pour recentrer sur la position
      const centerControlDiv = document.createElement('div');
      const centerControl = createCenterControl();
      centerControlDiv.appendChild(centerControl);
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerControlDiv);
      
      // Ajouter une légende à la carte
      const legendDiv = createLegendControl();
      map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legendDiv);
      
      // Ajouter un gestionnaire de clic sur la carte pour fermer le panneau POI
      map.addListener('click', () => {
        if (selectedPOI) {
          clearSelectedPOI();
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création de la carte:', error);
      if (error instanceof Error) {
        mapError = `Erreur: ${error.message}`;
      } else {
        mapError = "Une erreur s'est produite lors de la création de la carte.";
      }
    }
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
  
  function createLegendControl() {
    const legendDiv = document.createElement('div');
    legendDiv.className = 'bg-white p-3 m-3 rounded-lg shadow-lg';
    legendDiv.style.maxWidth = '200px';
    
    legendDiv.innerHTML = `
      <div class="text-sm font-bold mb-2">Légende</div>
      <div class="flex items-center mb-2">
        <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #FF0000; margin-right: 8px;"></div>
        <span class="text-xs">Votre position</span>
      </div>
      <div class="flex items-center mb-2">
        <div style="width: 16px; height: 16px; border-radius: 50%; background-color: #0082C3; margin-right: 8px;"></div>
        <span class="text-xs">Départ d'itinéraire</span>
      </div>
      <div class="flex items-center mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#0082C3" style="margin-right: 8px;">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span class="text-xs">POI sur itinéraire</span>
      </div>
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FF5722" style="margin-right: 8px;">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span class="text-xs">Point d'intérêt</span>
      </div>
    `;
    
    return legendDiv;
  }
  
  async function loadRoutes() {
    try {
      isLoadingRoutes = true;
      await withLoading(async () => {
        routes = await getAllRoutes();
        displayRoutes();
      });
      isLoadingRoutes = false;
    } catch (error) {
      isLoadingRoutes = false;
      console.error('Erreur lors du chargement des itinéraires:', error);
      showNotification('Erreur lors du chargement des itinéraires', 'error');
    }
  }
  
  async function loadSelectedRoute(routeId: number) {
    try {
      const route = await getRouteById(routeId);
      if (route) {
        selectedRoute = route;
        
        // Si la carte est initialisée, zoomer sur l'itinéraire sélectionné
        if (map) {
          focusOnRoute(route);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'itinéraire:', error);
    }
  }
  
  async function loadPOIs() {
    try {
      await withLoading(async () => {
        const poiData = await getAllPOIs();
        
        // Convertir les données de POI au format RoutePoint
        pois = await Promise.all(poiData.map(async (poi) => {
          try {
            const fullPoi = await getFullPOIData(poi.latitude, poi.longitude);
            if (fullPoi) return fullPoi;
            
            // Fallback si getFullPOIData échoue
            return {
              position: { lat: poi.latitude, lng: poi.longitude },
              name: poi.name,
              description: poi.description,
              image_url: poi.image_url,
              recommended_products: [],
              opening_hours: poi.opening_hours,
              website: poi.website
            };
          } catch (error) {
            console.error(`Erreur lors du chargement des détails pour POI ${poi.id}:`, error);
            return {
              position: { lat: poi.latitude, lng: poi.longitude },
              name: poi.name,
              description: poi.description,
              image_url: poi.image_url,
              recommended_products: []
            };
          }
        }));
        
        displayPOIs();
      });
    } catch (error) {
      console.error('Erreur lors du chargement des points d\'intérêt:', error);
      showNotification('Erreur lors du chargement des points d\'intérêt', 'error');
    }
  }
  
  function displayPOIs() {
    if (!map) return;
    
    // Supprimer les marqueurs existants
    poiMarkers.forEach(marker => marker.setMap(null));
    poiMarkers = [];
    
    // Créer un SVG personnalisé pour les marqueurs POI
    const poiIcon = {
      url: "data:image/svg+xml," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#FF5722">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
      labelOrigin: new google.maps.Point(16, 10)
    };
    
    // Ajouter les marqueurs pour chaque POI
    pois.forEach(poi => {
      const marker = new google.maps.Marker({
        position: poi.position,
        map: map,
        title: poi.name,
        icon: poiIcon,
        animation: google.maps.Animation.DROP
      });
      
      // Ajouter un événement de clic
      marker.addListener('click', (e: google.maps.MapMouseEvent) => {
        // Empêcher la propagation du clic à la carte
        e.stop();
        
        // Fermer toutes les infobulles ouvertes
        infoWindows.forEach(window => window.close());
        
        // Définir ce POI comme sélectionné
        selectedPOI = poi;
      });
      
      poiMarkers.push(marker);
    });
    
    // Désactiver les infobulles par défaut de Google Maps
    if (map) {
      map.setOptions({
        clickableIcons: false
      });
    }
  }
  
  function displayRoutes() {
    if (!map) return;
    
    // Supprimer les marqueurs et chemins existants
    routeMarkers.forEach(marker => marker.setMap(null));
    routePaths.forEach(path => path.setMap(null));
    routeMarkers = [];
    routePaths = [];
    
    // Ajouter les nouveaux marqueurs et chemins
    routes.forEach(route => {
      // Créer un marqueur pour le point de départ
      if (route.waypoints && route.waypoints.length > 0) {
        const startPoint = route.waypoints[0];
        const marker = new google.maps.Marker({
          position: { lat: startPoint.lat, lng: startPoint.lng },
          map: map,
          title: route.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#0082C3',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
          }
        });
        
        // Ajouter un événement de clic
        marker.addListener('click', (e: google.maps.MapMouseEvent) => {
          // Empêcher la propagation du clic à la carte
          e.stop();
          
          // Fermer toutes les infobulles ouvertes
          infoWindows.forEach(window => window.close());
          
          // Définir ce POI comme sélectionné (en créant un POI à partir des données de l'itinéraire)
          selectedPOI = {
            position: { lat: startPoint.lat, lng: startPoint.lng },
            name: route.name,
            description: route.description || `Départ de l'itinéraire ${route.name}`,
            route_id: route.id,
            is_route_start: true,
            distance_km: route.distance_km,
            difficulty: route.difficulty,
            image_url: route.image_url || '',
            recommended_products: []
          };
        });
        
        routeMarkers.push(marker);
        
        // Créer un chemin pour l'itinéraire
        const path = route.waypoints.map(wp => ({
          lat: wp.lat,
          lng: wp.lng
        }));
        
        const routePath = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: route.id === selectedRouteId ? '#FF0000' : '#0082C3',
          strokeOpacity: route.id === selectedRouteId ? 1.0 : 0.7,
          strokeWeight: route.id === selectedRouteId ? 5 : 3,
          map: map
        });
        
        routePaths.push(routePath);
        
        // Ajouter les points d'intérêt de l'itinéraire
        if (route.points_of_interest && route.points_of_interest.length > 0) {
          // Créer un SVG personnalisé pour les marqueurs POI de l'itinéraire
          const routePoiIcon = {
            url: "data:image/svg+xml," + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${route.id === selectedRouteId ? '#FF0000' : '#0082C3'}">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32),
            labelOrigin: new google.maps.Point(16, 10)
          };
          
          route.points_of_interest.forEach(poi => {
            const poiMarker = new google.maps.Marker({
              position: poi.position,
              map: map,
              title: poi.name,
              icon: routePoiIcon,
              animation: route.id === selectedRouteId ? google.maps.Animation.BOUNCE : null
            });
            
            // Ajouter un événement de clic
            poiMarker.addListener('click', (e: google.maps.MapMouseEvent) => {
              // Empêcher la propagation du clic à la carte
              e.stop();
              
              // Fermer toutes les infobulles ouvertes
              infoWindows.forEach(window => window.close());
              
              // Définir ce POI comme sélectionné et ajouter l'info de l'itinéraire
              selectedPOI = {
                ...poi,
                route_name: route.name,
                route_id: route.id
              };
            });
            
            routeMarkers.push(poiMarker);
          });
        }
        
        // Si c'est l'itinéraire sélectionné, zoomer dessus
        if (route.id === selectedRouteId) {
          focusOnRoute(route);
        }
      }
    });
  }
  
  function focusOnRoute(route: Route) {
    if (!map || !route.waypoints || route.waypoints.length === 0) return;
    
    // Créer des limites pour englober tous les points de l'itinéraire
    const bounds = new google.maps.LatLngBounds();
    
    // Ajouter tous les points de l'itinéraire aux limites
    route.waypoints.forEach(point => {
      bounds.extend({ lat: point.lat, lng: point.lng });
    });
    
    // Ajouter les points d'intérêt aux limites
    if (route.points_of_interest && route.points_of_interest.length > 0) {
      route.points_of_interest.forEach(poi => {
        bounds.extend(poi.position);
      });
    }
    
    // Ajuster la vue pour montrer tout l'itinéraire
    map.fitBounds(bounds);
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
      
      // Si le suivi est actif, mettre à jour la position
      if (isTracking) {
        updateTrackingPosition(new google.maps.LatLng(pos.lat, pos.lng));
      }
    } else {
      userMarker = new google.maps.Marker({
        position: pos,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#FF0000',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10
        },
        zIndex: 1000
      });
      
      // Centrer la carte sur la position initiale si aucun itinéraire n'est sélectionné
      if (!selectedRouteId) {
        map.setCenter(pos);
        map.setZoom(15);
      }
    }
  }
  
  function handleRouteClick(route: Route) {
    selectedRoute = route;
    selectedRouteId = route.id;
    
    // Mettre à jour l'URL
    const url = new URL(window.location.href);
    url.searchParams.set('route', route.id.toString());
    window.history.pushState({}, '', url.toString());
    
    // Mettre à jour l'affichage des itinéraires
    displayRoutes();
  }
  
  function clearSelectedRoute() {
    selectedRoute = null;
    selectedRouteId = null;
    
    // Mettre à jour l'URL
    const url = new URL(window.location.href);
    url.searchParams.delete('route');
    window.history.pushState({}, '', url.toString());
    
    // Mettre à jour l'affichage des itinéraires
    displayRoutes();
  }
  
  function clearSelectedPOI() {
    selectedPOI = null;
    isPOIExpanded = false; // Réinitialiser l'état d'expansion
  }
  
  // Fonction pour basculer l'état d'expansion du panneau POI
  function togglePOIExpansion() {
    isPOIExpanded = !isPOIExpanded;
  }
  
  // Gestionnaires d'événements pour le swipe
  function handleTouchStart(event: TouchEvent) {
    touchStartY = event.touches[0].clientY;
  }
  
  function handleTouchMove(event: TouchEvent) {
    touchEndY = event.touches[0].clientY;
    
    // Feedback visuel pendant le swipe
    if (!selectedPOI) return;
    
    // Calculer la distance du swipe
    const swipeDistance = touchEndY - touchStartY;
    
    // Appliquer un petit déplacement visuel pendant le swipe
    if (isPOIExpanded && swipeDistance > 0 && swipeDistance < 100) {
      // Swipe vers le bas en mode étendu
      if (poiPanelElement && poiPanelElement.querySelector('.overflow-y-auto')?.scrollTop === 0) {
        poiPanelElement.style.transform = `translateY(${swipeDistance / 10}px)`;
      }
    } else if (!isPOIExpanded && swipeDistance < 0 && swipeDistance > -100) {
      // Swipe vers le haut en mode compact
      poiPanelElement.style.transform = `translateY(${swipeDistance / 10}px)`;
    }
  }
  
  function handleTouchEnd() {
    if (!selectedPOI) return;
    
    // Réinitialiser la transformation
    if (poiPanelElement) {
      poiPanelElement.style.transform = '';
    }
    
    // Si le swipe est vers le haut (touchStartY > touchEndY) et d'une distance suffisante
    if (touchStartY - touchEndY > 30 && !isPOIExpanded) {
      isPOIExpanded = true;
    } 
    // Si le swipe est vers le bas (touchStartY < touchEndY) et d'une distance suffisante
    else if (touchEndY - touchStartY > 30 && isPOIExpanded) {
      // Vérifier si on est au début du scroll avant de fermer
      if (poiPanelElement && poiPanelElement.querySelector('.overflow-y-auto')?.scrollTop === 0) {
        isPOIExpanded = false;
      }
    }
    
    // Réinitialiser les valeurs
    touchStartY = 0;
    touchEndY = 0;
  }
  
  // Calculer la distance entre deux points géographiques (en km)
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance en km
    
    return distance;
  }
  
  // Démarrer la navigation vers un POI
  function startNavigation(poi: ExtendedRoutePoint) {
    if (!poi || !userMarker || !map) return;
    
    // Vérifier que la position de l'utilisateur est disponible
    const userPosition = userMarker.getPosition();
    if (!userPosition) {
      showNotification('Position utilisateur non disponible', 'error');
      return;
    }
    
    // Nettoyer toute navigation précédente
    clearNavigation();
    
    // Définir l'état de navigation
    isNavigating = true;
    
    // Créer un marqueur de destination
    destinationMarker = new google.maps.Marker({
      position: poi.position,
      map: map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#0082C3',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 12
      },
      zIndex: 1000
    });
    
    try {
      // Utiliser le service de directions de Google Maps pour obtenir l'itinéraire
      const directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // Ne pas afficher les marqueurs par défaut
        polylineOptions: {
          strokeColor: '#0082C3',
          strokeOpacity: 0.8,
          strokeWeight: 5
        },
        map: map // Associer directement la carte au renderer
      });
      
      // Demander l'itinéraire
      directionsService.route({
        origin: userPosition,
        destination: poi.position,
        travelMode: google.maps.TravelMode.WALKING
      }, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          // Afficher l'itinéraire sur la carte
          if (directionsRenderer) {
            directionsRenderer.setDirections(response);
          }
          
          // Ajuster la vue pour montrer tout l'itinéraire
          if (map) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(userPosition);
            bounds.extend(poi.position);
            map.fitBounds(bounds);
            
            // Ajouter un peu de padding pour une meilleure vue
            map.fitBounds(bounds, 50); // 50 pixels de padding
          }
          
          // Afficher le panneau de navigation
          if (response.routes && response.routes[0] && response.routes[0].legs && response.routes[0].legs[0]) {
            showNavigationPanel(poi, response.routes[0].legs[0].distance?.text || "Distance inconnue");
          } else {
            showNavigationPanel(poi, "Distance inconnue");
          }
        } else {
          console.error('Erreur lors du calcul de l\'itinéraire:', status);
          
          // En cas d'erreur d'API, créer un itinéraire direct simple
          createSimpleRoute(userPosition, poi.position);
          
          // Afficher quand même le panneau de navigation avec une distance estimée
          const estimatedDistance = calculateDistance(
            userPosition.lat() || 0,
            userPosition.lng() || 0,
            poi.position.lat,
            poi.position.lng
          ).toFixed(1) + " km";
          
          showNavigationPanel(poi, estimatedDistance);
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la navigation:', error);
      
      // En cas d'erreur, créer un itinéraire direct simple
      createSimpleRoute(userPosition, poi.position);
      
      // Afficher quand même le panneau de navigation avec une distance estimée
      const estimatedDistance = calculateDistance(
        userPosition.lat() || 0,
        userPosition.lng() || 0,
        poi.position.lat,
        poi.position.lng
      ).toFixed(1) + " km";
      
      showNavigationPanel(poi, estimatedDistance);
    }
    
    // Fermer le panneau POI
    clearSelectedPOI();
  }
  
  // Créer un itinéraire simple (ligne droite) en cas d'erreur de l'API Directions
  function createSimpleRoute(origin: google.maps.LatLng, destination: google.maps.LatLngLiteral) {
    if (!map) return;
    
    // Créer un chemin direct entre l'origine et la destination
    navigationPath = new google.maps.Polyline({
      path: [
        origin,
        new google.maps.LatLng(destination.lat, destination.lng)
      ],
      geodesic: true,
      strokeColor: '#0082C3',
      strokeOpacity: 0.8,
      strokeWeight: 5,
      map: map
    });
    
    // Ajuster la vue pour montrer tout l'itinéraire
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);
    map.fitBounds(bounds, 50); // 50 pixels de padding
  }
  
  // Fonction pour gérer les erreurs de chargement d'image
  function handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = 'https://via.placeholder.com/200x150?text=Image+non+disponible';
    }
  }
  
  // Afficher le panneau de navigation
  function showNavigationPanel(destination: ExtendedRoutePoint, distanceText: string) {
    // Stocker les informations de destination
    navigationDestination = destination;
    navigationDistance = distanceText;
    
    // Afficher une notification
    showNotification(`Navigation vers ${destination.name} (${distanceText})`, 'success');
  }
  
  // Nettoyer la navigation
  function clearNavigation() {
    // Arrêter le suivi si actif
    if (isTracking) {
      stopTracking();
    }
    
    isNavigating = false;
    navigationDestination = null;
    navigationDistance = "";
    
    // Supprimer le renderer de directions
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
      directionsRenderer = null;
    }
    
    // Supprimer le chemin de navigation
    if (navigationPath) {
      navigationPath.setMap(null);
      navigationPath = null;
    }
    
    // Supprimer le marqueur de destination
    if (destinationMarker) {
      destinationMarker.setMap(null);
      destinationMarker = null;
    }
  }
  
  // Démarrer l'enregistrement du trajet
  function startTracking() {
    if (!isNavigating || isTracking || !userMarker || !map) return;
    
    isTracking = true;
    startTime = Date.now();
    trackingCoordinates = [userMarker.getPosition() as google.maps.LatLng];
    stepCount = 0;
    distance = 0;
    
    // Créer un nouveau chemin pour le suivi
    const newPath = new google.maps.Polyline({
      path: trackingCoordinates,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: map
    });
    
    trackingPath.push(newPath);
    
    // Mettre à jour le temps écoulé toutes les secondes
    trackingInterval = window.setInterval(() => {
      if (startTime) {
        elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      }
    }, 1000);
    
    showNotification('Enregistrement du trajet démarré', 'success');
  }
  
  // Arrêter l'enregistrement du trajet
  function stopTracking() {
    if (!isTracking) return;
    
    // Sauvegarder les statistiques finales avant de réinitialiser
    const finalDistance = distance;
    const finalTime = elapsedTime;
    
    // Arrêter le suivi
    isTracking = false;
    
    // Arrêter l'intervalle de mise à jour du temps
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
    
    // Nettoyer les chemins de suivi
    trackingPath.forEach(path => path.setMap(null));
    trackingPath = [];
    trackingCoordinates = [];
    
    // Réinitialiser les compteurs
    startTime = null;
    elapsedTime = 0;
    distance = 0;
    stepCount = 0;
    
    // Enregistrer les données du trajet
    saveTrackingData({
      coordinates: trackingCoordinates,
      distance: finalDistance,
      duration: Math.floor(finalTime / 60),
      steps: stepCount,
      startTime: startTime || 0,
      endTime: Date.now()
    });
    
    showNotification(`Trajet terminé: ${finalDistance.toFixed(2)} km en ${formatTime(finalTime)}`, 'success');
  }
  
  // Enregistrer les données du trajet
  function saveTrackingData(trackData: any) {
    // Cette fonction sera implémentée pour sauvegarder les données du trajet
    console.log('Données du trajet:', trackData);
    // TODO: Sauvegarder les données dans la base de données
  }
  
  // Mettre à jour la position pendant le suivi
  function updateTrackingPosition(position: google.maps.LatLng) {
    if (!isTracking || trackingPath.length === 0) return;
    
    // Ajouter la nouvelle position aux coordonnées
    trackingCoordinates.push(position);
    
    // Mettre à jour le chemin
    const currentPath = trackingPath[trackingPath.length - 1];
    currentPath.setPath(trackingCoordinates);
    
    // Calculer la distance parcourue
    if (trackingCoordinates.length >= 2) {
      const lastIndex = trackingCoordinates.length - 1;
      const newSegmentDistance = calculateDistance(
        trackingCoordinates[lastIndex - 1].lat(),
        trackingCoordinates[lastIndex - 1].lng(),
        trackingCoordinates[lastIndex].lat(),
        trackingCoordinates[lastIndex].lng()
      );
      
      distance += newSegmentDistance;
      
      // Estimer le nombre de pas (environ 1300 pas par km en moyenne)
      const stepsInSegment = Math.floor(newSegmentDistance * 1300);
      stepCount += stepsInSegment;
    }
  }
  
  // Formater le temps en heures:minutes:secondes
  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }
</script>

<svelte:head>
  <title>Carte | Decathlon Urban Trek</title>
</svelte:head>

<div class="fixed inset-0 bg-gray-50">
  <!-- Carte -->
  <div class="absolute inset-0">
    {#if mapError}
      <div class="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-6 text-center">
        <div class="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <span class="material-icons text-red-500 text-5xl mb-4">error_outline</span>
          <h2 class="text-xl font-bold text-gray-800 mb-2">Erreur de chargement de la carte</h2>
          <p class="text-gray-600 mb-6">{mapError}</p>
          <div class="text-sm text-gray-500 mb-4 p-4 bg-gray-50 rounded-lg">
            <p class="font-medium mb-2">Message technique:</p>
            <code class="block text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              RefererNotAllowedMapError: Votre URL de site n'est pas autorisée à utiliser cette clé API Google Maps.
            </code>
            <p class="mt-2">URL à autoriser: <code class="bg-gray-100 px-1 py-0.5 rounded">http://localhost:5173</code></p>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            Pour résoudre ce problème, vous devez autoriser votre domaine local dans la console Google Cloud.
          </p>
          <a 
            href="https://console.cloud.google.com/google/maps-apis/credentials" 
            target="_blank"
            rel="noopener noreferrer" 
            class="inline-block bg-[#0082C3] text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Ouvrir la console Google Cloud
          </a>
        </div>
      </div>
    {/if}
    
    <div bind:this={mapElement} class="w-full h-full"></div>
    
    <!-- Détails de l'itinéraire sélectionné -->
    {#if selectedRoute && !selectedPOI}
      <div class="absolute bottom-4 left-4 right-4 md:left-auto md:w-80 bg-white rounded-lg shadow-lg overflow-hidden z-10">
        <div class="p-4 bg-[#0082C3] text-white flex justify-between items-center">
          <h2 class="text-xl font-bold">{selectedRoute.name}</h2>
          <button 
            class="text-white hover:text-gray-200 transition-colors"
            on:click={clearSelectedRoute}
            aria-label="Fermer"
          >
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <div class="p-4">
          <p class="text-gray-600 mb-4">{selectedRoute.description}</p>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div class="text-sm text-gray-500">Distance</div>
              <div class="font-semibold">{selectedRoute.distance_km} km</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Difficulté</div>
              <div class="font-semibold">{selectedRoute.difficulty}</div>
            </div>
          </div>
          
          <a 
            href={`/routes/${selectedRoute.id}`}
            class="block w-full bg-[#0082C3] text-white text-center py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Voir détails
          </a>
        </div>
      </div>
    {/if}
    
    <!-- Panneau de détails du POI sélectionné (style Google Maps) -->
    {#if selectedPOI}
      <div 
        bind:this={poiPanelElement}
        class="absolute bottom-0 left-0 right-0 bg-white shadow-lg z-20 rounded-t-2xl flex flex-col transform transition-all duration-300 ease-out {isPOIExpanded ? 'h-[80vh]' : 'h-auto'} animate-slide-up"
        on:touchstart={handleTouchStart}
        on:touchmove={handleTouchMove}
        on:touchend={handleTouchEnd}
        on:click|stopPropagation={() => {}}
      >
        <!-- Barre de titre avec poignée -->
        <div 
          class="flex justify-center items-center p-2 relative border-b border-gray-200 cursor-pointer touch-manipulation"
          on:click={togglePOIExpansion}
          on:touchstart|stopPropagation={handleTouchStart}
          on:touchmove|stopPropagation={handleTouchMove}
          on:touchend|stopPropagation={handleTouchEnd}
        >
          <div class="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        <!-- Version compacte (titre et boutons uniquement) -->
        {#if !isPOIExpanded}
          <div class="p-5">
            <div class="flex items-start gap-3">
              <!-- Image miniature du POI -->
              {#if selectedPOI.image_url}
                <div class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                  <img 
                    src={selectedPOI.image_url} 
                    alt={selectedPOI.name} 
                    class="w-full h-full object-cover"
                    on:error={handleImageError}
                  >
                </div>
              {/if}
              
              <div class="flex-1 pt-2">
                <h2 class="text-xl font-medium text-gray-900">{selectedPOI.name}</h2>
                
                {#if selectedPOI.opening_hours}
                  <div class="text-green-600 font-medium text-sm mt-1">
                    {selectedPOI.opening_hours}
                  </div>
                {/if}
                
                <!-- Distance par rapport à la position actuelle -->
                {#if userMarker && selectedPOI.position}
                  <div class="flex items-center text-blue-600 mt-1">
                    <span class="material-icons text-sm mr-1">directions_walk</span>
                    <span class="text-sm font-medium">
                      {calculateDistance(
                        userMarker.getPosition()?.lat() || 0,
                        userMarker.getPosition()?.lng() || 0,
                        selectedPOI.position.lat,
                        selectedPOI.position.lng
                      ).toFixed(1)} km
                    </span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <!-- Version étendue avec tous les détails -->
          <div class="overflow-y-auto overscroll-contain flex-grow">
            <div class="relative">
              <!-- Image du POI -->
              {#if selectedPOI.image_url}
                <div class="w-full">
                  <img 
                    src={selectedPOI.image_url} 
                    alt={selectedPOI.name} 
                    class="w-full h-48 object-cover"
                    on:error={handleImageError}
                  >
                </div>
              {/if}
            </div>
            
            <div class="p-4">
              <!-- Titre du POI -->
              <h2 class="text-xl font-medium text-gray-900 mb-2">{selectedPOI.name}</h2>
              
              <!-- Horaires d'ouverture -->
              {#if selectedPOI.opening_hours}
                <div class="text-green-600 font-medium text-sm mb-3">
                  {selectedPOI.opening_hours}
                </div>
              {/if}
              
              <!-- Distance par rapport à la position actuelle -->
              {#if userMarker && selectedPOI.position}
                <div class="flex items-center text-blue-600 mb-3">
                  <span class="material-icons text-sm mr-1">directions_walk</span>
                  <span class="text-sm font-medium">
                    {calculateDistance(
                      userMarker.getPosition()?.lat() || 0,
                      userMarker.getPosition()?.lng() || 0,
                      selectedPOI.position.lat,
                      selectedPOI.position.lng
                    ).toFixed(1)} km de votre position
                  </span>
                </div>
              {/if}
              
              <!-- Bouton "Allons-y" -->
              <button 
                class="w-full bg-[#0082C3] text-white py-3 mb-4 font-medium text-center"
                on:click={() => selectedPOI && startNavigation(selectedPOI)}
              >
                Allons-y
              </button>
              
              <!-- Badges d'information -->
              {#if selectedPOI.route_name}
                <div class="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs mb-3">
                  <span class="material-icons text-xs mr-1">directions_walk</span>
                  <span>Point d'intérêt sur "{selectedPOI.route_name}"</span>
                </div>
              {/if}
              
              {#if selectedPOI.is_route_start}
                <div class="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs mb-3">
                  <span class="material-icons text-xs mr-1">directions_walk</span>
                  <span>{selectedPOI.distance_km} km · {selectedPOI.difficulty}</span>
                </div>
              {/if}
              
              <!-- Description -->
              {#if selectedPOI.description}
                <p class="text-gray-600 text-sm my-3">{selectedPOI.description}</p>
              {/if}
              
              <!-- Produits recommandés -->
              {#if selectedPOI.recommended_products && selectedPOI.recommended_products.length > 0}
                <div class="mt-4">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Produits recommandés</h3>
                  <div class="grid grid-cols-2 gap-3">
                    {#each selectedPOI.recommended_products as product}
                      <div class="bg-gray-50 rounded-lg p-2">
                        {#if product.image_url}
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            class="w-full h-24 object-contain mb-2"
                            on:error={handleImageError}
                          >
                        {/if}
                        <div class="text-xs font-medium">{product.name}</div>
                        {#if product.price}
                          <div class="text-xs text-blue-600 font-bold">{product.price} €</div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- Informations supplémentaires -->
              {#if selectedPOI.website}
                <div class="flex items-center mt-3 text-sm text-blue-600">
                  <span class="material-icons text-gray-500 mr-2 text-base">language</span>
                  <a href={selectedPOI.website} target="_blank" rel="noopener noreferrer" class="underline">
                    {selectedPOI.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              {/if}
              
              <!-- Espace en bas pour éviter que le contenu ne soit caché par les boutons -->
              <div class="h-16"></div>
            </div>
          </div>
        {/if}
        
        <!-- Boutons d'action en bas (toujours visibles) -->
        <div class="grid grid-cols-3 border-t border-gray-200">
          {#if selectedPOI.is_route_start}
            <a href={`/routes/${selectedPOI.route_id}`} class="flex flex-col items-center justify-center py-3 text-blue-600">
              <span class="material-icons text-2xl mb-1">info</span>
              <span class="text-xs">Détails</span>
            </a>
          {:else}
            <button class="flex flex-col items-center justify-center py-3 text-blue-600">
              <span class="material-icons text-2xl mb-1">directions</span>
              <span class="text-xs">Itinéraire</span>
            </button>
          {/if}
          
          <button class="flex flex-col items-center justify-center py-3 text-blue-600">
            <span class="material-icons text-2xl mb-1">navigation</span>
            <span class="text-xs">Démarrer</span>
          </button>
          
          {#if selectedPOI.website}
            <a href={selectedPOI.website} target="_blank" rel="noopener noreferrer" class="flex flex-col items-center justify-center py-3 text-blue-600">
              <span class="material-icons text-2xl mb-1">language</span>
              <span class="text-xs">Site web</span>
            </a>
          {:else}
            <button class="flex flex-col items-center justify-center py-3 text-blue-600">
              <span class="material-icons text-2xl mb-1">call</span>
              <span class="text-xs">Appeler</span>
            </button>
          {/if}
        </div>
      </div>
    {/if}
    
    <!-- Panneau de navigation et de suivi -->
    {#if isNavigating && navigationDestination}
      <div class="absolute bottom-0 left-0 right-0 bg-white shadow-lg overflow-hidden z-20 border-t-4 border-[#0082C3]">
        <div class="p-4 bg-[#0082C3] text-white flex justify-between items-center">
          <h2 class="text-lg font-bold">Navigation vers {navigationDestination.name}</h2>
          <button 
            class="text-white hover:text-gray-200 transition-colors"
            on:click={clearNavigation}
            aria-label="Fermer"
          >
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <div class="p-4">
          <!-- Informations sur la destination -->
          <div class="mb-4">
            <div class="flex items-center mb-2">
              <span class="material-icons text-blue-600 mr-2">place</span>
              <span class="text-gray-700">{navigationDestination.name}</span>
            </div>
            <div class="flex items-center mb-2">
              <span class="material-icons text-blue-600 mr-2">directions_walk</span>
              <span class="text-gray-700">Distance: {navigationDistance}</span>
            </div>
          </div>
          
          {#if !isTracking}
            <!-- Bouton pour démarrer le suivi -->
            <button 
              class="w-full bg-[#0082C3] text-white text-center py-3 font-semibold hover:bg-blue-600 transition-colors mb-2"
              on:click={startTracking}
            >
              Démarrer le suivi
            </button>
            
            <!-- Bouton pour retourner à la carte -->
            <button 
              class="w-full border border-[#0082C3] text-[#0082C3] text-center py-3 font-semibold hover:bg-blue-50 transition-colors"
              on:click={() => {
                if (map && userMarker && userMarker.getPosition()) {
                  map.setCenter(userMarker.getPosition());
                  map.setZoom(16);
                }
              }}
            >
              Retour à ma position
            </button>
          {:else}
            <!-- Affichage des statistiques pendant le suivi -->
            <div class="grid grid-cols-3 gap-4 mb-4">
              <div class="text-center">
                <div class="text-sm text-gray-500">Distance</div>
                <div class="font-semibold">{distance.toFixed(2)} km</div>
              </div>
              <div class="text-center">
                <div class="text-sm text-gray-500">Temps</div>
                <div class="font-semibold">{formatTime(elapsedTime)}</div>
              </div>
              <div class="text-center">
                <div class="text-sm text-gray-500">Pas</div>
                <div class="font-semibold">{stepCount}</div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <button 
                class="w-full bg-red-600 text-white text-center py-3 font-semibold hover:bg-red-700 transition-colors"
                on:click={stopTracking}
              >
                Arrêter
              </button>
              
              <button 
                class="w-full bg-gray-600 text-white text-center py-3 font-semibold hover:bg-gray-700 transition-colors"
                on:click={clearNavigation}
              >
                Annuler
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.gm-style-cc) {
    display: none;
  }
  
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out forwards;
  }
</style> 