<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/services/auth';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { showNotification } from '$lib/stores/app-store';
  import Button from '$lib/components/ui/button.svelte';
  import Loading from '$lib/components/ui/loading.svelte';
  import RoutePointDetail from '$lib/components/map/RoutePointDetail.svelte';
  import type { Route, RoutePoint } from '$lib/types';
  import { supabase } from '$lib/supabase';
  import L from 'leaflet';
  import { getAllPOIs } from '$lib/services/poi';
  import { fade } from 'svelte/transition';
  
  // État de la carte
  let map: L.Map;
  let userMarker: L.Marker;
  let routeMarkers: L.Marker[] = [];
  let routePolylines: L.Polyline[] = [];
  let poiMarkers: L.Marker[] = [];
  let selectedRoute: Route | null = null;
  let selectedPoint: RoutePoint | null = null;
  let isLoading = true;
  let routes: Route[] = [];
  let userPosition: { lat: number; lng: number } | null = null;
  let watchId: number;
  
  // Filtres pour les POIs
  let selectedFilter = '';
  let showFilters = false;
  
  // Message de bienvenue pour les parents
  let showWelcomeMessage = true;
  let userName = '';
  
  function closeWelcomeMessage() {
    showWelcomeMessage = false;
  }
  
  onMount(() => {
    const initialize = async () => {
      if (!$currentUser) {
        goto('/login');
        return;
      }
      
      // Récupérer le nom de l'utilisateur pour le message de bienvenue
      if ($currentUser.first_name) {
        userName = $currentUser.first_name;
      }
      
      // Ajouter la classe au body pour empêcher le défilement
      document.body.classList.add('map-page');
      
      // Initialiser la carte
      await initMap();
      
      // Charger les parcours
      await loadRoutes();
      
      // Charger les POIs
      await loadPOIs();
      
      // Activer la géolocalisation
      startGeolocation();
    };
    
    initialize();
    
    // Fonction de nettoyage
    return () => {
      // Nettoyer la géolocalisation à la destruction du composant
      if (browser && watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      // Nettoyer la carte
      if (map) {
        map.remove();
      }
      
      // Réinitialiser les styles du body
      document.body.classList.remove('map-page');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  });
  
  async function initMap() {
    if (!browser) return;
    
    // Position par défaut (Paris)
    const defaultPosition = { lat: 48.8566, lng: 2.3522 };
    
    // Créer la carte
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    // S'assurer que les styles Leaflet sont chargés
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    // Fixer le body pour empêcher le défilement de la page
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Initialiser la carte Leaflet avec toutes les options de déplacement activées
    map = L.map('map', {
      dragging: true,
      scrollWheelZoom: true,
      touchZoom: true,
      zoomControl: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true
    }).setView([defaultPosition.lat, defaultPosition.lng], 14);
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);
    
    // Créer le marqueur utilisateur (invisible au début)
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div class="user-marker-inner"></div>',
      iconSize: [20, 20]
    });
    
    userMarker = L.marker([defaultPosition.lat, defaultPosition.lng], {
      icon: userIcon,
      opacity: 0
    }).addTo(map);
    
    // Ajouter un marqueur pour la Tour Eiffel
    const tourEiffelPosition = { lat: 48.8584, lng: 2.2945 };
    const tourEiffelIcon = L.divIcon({
      className: 'poi-marker',
      html: '<div class="poi-marker-inner"></div>',
      iconSize: [24, 24]
    });
    
    const tourEiffelMarker = L.marker([tourEiffelPosition.lat, tourEiffelPosition.lng], {
      icon: tourEiffelIcon,
      title: 'Tour Eiffel'
    }).addTo(map);
    
    // Créer le contenu de la popup avec HTML
    const eiffelTowerPopup = L.popup({
      maxWidth: 300,
      className: 'custom-popup'
    }).setContent(`
      <div class="p-0 overflow-hidden">
        <div class="relative">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg" 
               alt="Tour Eiffel" 
               class="w-full h-36 object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div class="absolute bottom-2 left-3 text-white">
            <h3 class="text-xl font-bold">Tour Eiffel</h3>
          </div>
        </div>
        
        <div class="p-3">
          <div class="flex items-center mb-3">
            <span class="material-icons text-amber-500 mr-1 text-sm">star</span>
            <span class="text-sm font-medium">4.7</span>
            <span class="mx-2 text-gray-400">•</span>
            <span class="text-sm text-gray-600">Monument historique</span>
          </div>
          
          <p class="text-sm text-gray-700 mb-3">
            Symbole de Paris et de la France, cette tour en fer de 330m offre une vue panoramique exceptionnelle.
          </p>
          
          <div class="flex flex-col space-y-2">
            <button id="details-button" class="bg-[#0082C3] text-white py-2 px-4 rounded-lg w-full font-medium flex items-center justify-center">
              <span class="material-icons mr-1 text-sm">info</span>
              Détails
            </button>
            <button id="directions-button" class="border border-[#0082C3] text-[#0082C3] py-2 px-4 rounded-lg w-full font-medium flex items-center justify-center">
              <span class="material-icons mr-1 text-sm">directions</span>
              Y aller
            </button>
          </div>
        </div>
      </div>
    `);
    
    // Ajouter la popup au marqueur
    tourEiffelMarker.bindPopup(eiffelTowerPopup);
    
    // Ajouter des écouteurs d'événements après l'ouverture de la popup
    tourEiffelMarker.on('click', function() {
      tourEiffelMarker.openPopup();
      
      // Attendre que le popup soit ajouté au DOM
      setTimeout(() => {
        // Gérer le clic sur le bouton "Détails"
        const detailsButton = document.getElementById('details-button');
        if (detailsButton) {
          detailsButton.addEventListener('click', () => {
            // Utiliser goto au lieu de window.location.href pour préserver la session
            const lat = tourEiffelMarker.getLatLng().lat;
            const lng = tourEiffelMarker.getLatLng().lng;
            goto(`/poi/${lat},${lng}`);
          });
        }
        
        // Gérer le clic sur le bouton "Y aller"
        const directionsButton = document.getElementById('directions-button');
        if (directionsButton) {
          directionsButton.addEventListener('click', () => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const userLat = position.coords.latitude;
                  const userLng = position.coords.longitude;
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${tourEiffelMarker.getLatLng().lat},${tourEiffelMarker.getLatLng().lng}&travelmode=walking`;
                  window.open(url, '_blank');
                },
                (error) => {
                  alert('Impossible d\'obtenir votre position. Veuillez activer la géolocalisation.');
                }
              );
            } else {
              alert('La géolocalisation n\'est pas prise en charge par votre navigateur.');
            }
          });
        }
      }, 100);
    });
  }
  
  async function loadRoutes() {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        routes = data;
        displayRoutes();
      }
      
      isLoading = false;
    } catch (error) {
      console.error('Erreur lors du chargement des parcours:', error);
      showNotification('Erreur lors du chargement des parcours', 'error');
      isLoading = false;
    }
  }
  
  function displayRoutes() {
    if (!map || !routes.length) return;
    
    // Nettoyer les marqueurs et polylines existants
    clearRouteDisplay();
    
    routes.forEach(route => {
      // Créer un polyline pour le parcours
      const path = [
        [route.start_point.lat, route.start_point.lng],
        ...route.waypoints.map(wp => [wp.lat, wp.lng]),
        [route.end_point.lat, route.end_point.lng]
      ];
      
      const polyline = L.polyline(path as L.LatLngExpression[], {
        color: '#0082C3',
        weight: 3,
        opacity: 0.8
      }).addTo(map);
      
      routePolylines.push(polyline);
      
      // Ajouter des marqueurs pour les points d'intérêt
      route.waypoints.forEach((point, index) => {
        const poiIcon = L.divIcon({
          className: 'poi-marker',
          html: '<div class="poi-marker-inner"></div>',
          iconSize: [16, 16]
        });
        
        const marker = L.marker([point.lat, point.lng], {
          icon: poiIcon,
          title: `Point ${index + 1}`
        }).addTo(map);
        
        // Ajouter un écouteur d'événement pour afficher les détails du point
        marker.on('click', () => {
          selectedRoute = route;
          selectedPoint = {
            position: point,
            name: `Point d'intérêt ${index + 1}`,
            description: 'Description du point d\'intérêt',
            image_url: '/images/poi-placeholder.jpg',
            recommended_products: [
              {
                id: 1,
                name: 'Chaussures de randonnée',
                image_url: '/images/products/hiking-shoes.jpg',
                price: 49.99,
                url: 'https://www.decathlon.fr/p/chaussures-de-randonnee/_/R-p-308943'
              },
              {
                id: 2,
                name: 'Gourde 1L',
                image_url: '/images/products/water-bottle.jpg',
                price: 9.99,
                url: 'https://www.decathlon.fr/p/gourde-randonnee/_/R-p-192278'
              }
            ]
          };
        });
        
        routeMarkers.push(marker);
      });
      
      // Ajouter des marqueurs pour le début et la fin du parcours
      const startIcon = L.divIcon({
        className: 'start-marker',
        html: '<div class="start-marker-inner"></div>',
        iconSize: [16, 16]
      });
      
      const endIcon = L.divIcon({
        className: 'end-marker',
        html: '<div class="end-marker-inner"></div>',
        iconSize: [16, 16]
      });
      
      const startMarker = L.marker([route.start_point.lat, route.start_point.lng], {
        icon: startIcon,
        title: 'Départ'
      }).addTo(map);
      
      const endMarker = L.marker([route.end_point.lat, route.end_point.lng], {
        icon: endIcon,
        title: 'Arrivée'
      }).addTo(map);
      
      routeMarkers.push(startMarker, endMarker);
      
      // Ajouter des écouteurs d'événements pour le début et la fin
      startMarker.on('click', () => {
        selectedRoute = route;
        selectedPoint = {
          position: route.start_point,
          name: 'Point de départ',
          description: 'Début du parcours',
          image_url: '/images/start-point.jpg',
          recommended_products: []
        };
      });
      
      endMarker.on('click', () => {
        selectedRoute = route;
        selectedPoint = {
          position: route.end_point,
          name: 'Point d\'arrivée',
          description: 'Fin du parcours',
          image_url: '/images/end-point.jpg',
          recommended_products: []
        };
      });
    });
    
    // Ajuster la vue pour montrer tous les parcours
    if (routePolylines.length > 0) {
      const group = L.featureGroup(routePolylines);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }
  
  function clearRouteDisplay() {
    // Supprimer les polylines
    routePolylines.forEach(polyline => {
      polyline.remove();
    });
    routePolylines = [];
    
    // Supprimer les marqueurs
    routeMarkers.forEach(marker => {
      marker.remove();
    });
    routeMarkers = [];
  }
  
  function startGeolocation() {
    if (!browser || !navigator.geolocation) {
      showNotification('La géolocalisation n\'est pas disponible sur votre appareil', 'info');
      return;
    }
    
    // Demander la position actuelle
    navigator.geolocation.getCurrentPosition(
      position => {
        updateUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      error => {
        console.error('Erreur de géolocalisation:', error);
        showNotification('Impossible d\'obtenir votre position', 'error');
      },
      { enableHighAccuracy: true }
    );
    
    // Suivre la position de l'utilisateur
    watchId = navigator.geolocation.watchPosition(
      position => {
        updateUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      error => {
        console.error('Erreur de suivi de position:', error);
      },
      { enableHighAccuracy: true }
    );
  }
  
  function updateUserPosition(position: { lat: number; lng: number }) {
    userPosition = position;
    
    if (userMarker && map) {
      userMarker.setLatLng([position.lat, position.lng]);
      userMarker.setOpacity(1);
    }
  }
  
  function centerOnUser() {
    if (map && userPosition) {
      map.setView([userPosition.lat, userPosition.lng], 16);
    } else {
      showNotification('Position non disponible', 'info');
    }
  }
  
  function closePointDetail() {
    selectedPoint = null;
  }
  
  function loadRouteById(routeId: number) {
    if (!routeId) return;
    
    const route = routes.find(r => r.id === routeId);
    if (route) {
      selectedRoute = route;
      
      // Centrer la carte sur le parcours
      if (map) {
        const path = [
          [route.start_point.lat, route.start_point.lng],
          ...route.waypoints.map(wp => [wp.lat, wp.lng]),
          [route.end_point.lat, route.end_point.lng]
        ];
        
        const bounds = L.latLngBounds(path as L.LatLngExpression[]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }
  
  async function loadPOIs(type?: string) {
    try {
      // Nettoyer les marqueurs de POI existants
      clearPOIMarkers();
      
      // Charger les POIs depuis la base de données
      const pois = await getAllPOIs(type);
      
      if (!pois.length) {
        if (type) {
          showNotification(`Aucun point d'intérêt de type "${type}" trouvé`, 'info');
        }
        return;
      }
      
      // Créer des marqueurs pour chaque POI
      pois.forEach(poi => {
        const poiIcon = L.divIcon({
          className: `poi-marker ${type ? 'poi-marker-' + type : ''}`,
          html: `<div class="poi-marker-inner"></div>`,
          iconSize: [24, 24]
        });
        
        const marker = L.marker([poi.latitude, poi.longitude], {
          icon: poiIcon,
          title: poi.name
        }).addTo(map);
        
        // Créer le contenu de la popup avec HTML
        const poiPopup = L.popup({
          maxWidth: 300,
          className: 'custom-popup'
        }).setContent(`
          <div class="p-0 overflow-hidden">
            <div class="relative">
              <img src="${poi.image_url}" 
                   alt="${poi.name}" 
                   class="w-full h-36 object-cover"
                   onerror="this.src='/placeholder.jpg'" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div class="absolute bottom-2 left-3 text-white">
                <h3 class="text-xl font-bold">${poi.name}</h3>
              </div>
            </div>
            
            <div class="p-3">
              <div class="flex items-center mb-3">
                <span class="material-icons text-amber-500 mr-1 text-sm">star</span>
                <span class="text-sm font-medium">4.5</span>
                <span class="mx-2 text-gray-400">•</span>
                <span class="text-sm text-gray-600">${poi.type || 'Point d\'intérêt'}</span>
              </div>
              
              <p class="text-sm text-gray-700 mb-3">
                ${poi.description}
              </p>
              
              <div class="flex flex-col space-y-2">
                <button id="details-button-${poi.id}" class="bg-[#0082C3] text-white py-2 px-4 rounded-lg w-full font-medium flex items-center justify-center">
                  <span class="material-icons mr-1 text-sm">info</span>
                  Détails
                </button>
                <button id="directions-button-${poi.id}" class="border border-[#0082C3] text-[#0082C3] py-2 px-4 rounded-lg w-full font-medium flex items-center justify-center">
                  <span class="material-icons mr-1 text-sm">directions</span>
                  Y aller
                </button>
              </div>
            </div>
          </div>
        `);
        
        // Ajouter la popup au marqueur
        marker.bindPopup(poiPopup);
        
        // Ajouter des écouteurs d'événements après l'ouverture de la popup
        marker.on('click', function() {
          marker.openPopup();
          
          // Attendre que le popup soit ajouté au DOM
          setTimeout(() => {
            // Gérer le clic sur le bouton "Détails"
            const detailsButton = document.getElementById(`details-button-${poi.id}`);
            if (detailsButton) {
              detailsButton.addEventListener('click', () => {
                const lat = marker.getLatLng().lat;
                const lng = marker.getLatLng().lng;
                goto(`/poi/${lat},${lng}`);
              });
            }
            
            // Gérer le clic sur le bouton "Y aller"
            const directionsButton = document.getElementById(`directions-button-${poi.id}`);
            if (directionsButton) {
              directionsButton.addEventListener('click', () => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const userLat = position.coords.latitude;
                      const userLng = position.coords.longitude;
                      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${marker.getLatLng().lat},${marker.getLatLng().lng}&travelmode=walking`;
                      window.open(url, '_blank');
                    },
                    (error) => {
                      alert('Impossible d\'obtenir votre position. Veuillez activer la géolocalisation.');
                    }
                  );
                } else {
                  alert('La géolocalisation n\'est pas prise en charge par votre navigateur.');
                }
              });
            }
          }, 100);
        });
        
        poiMarkers.push(marker);
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des POIs:', error);
      showNotification('Erreur lors du chargement des points d\'intérêt', 'error');
    }
  }
  
  function clearPOIMarkers() {
    poiMarkers.forEach(marker => {
      marker.remove();
    });
    poiMarkers = [];
  }
  
  function toggleFilters() {
    showFilters = !showFilters;
  }
  
  function applyFilter(type: string) {
    selectedFilter = type;
    loadPOIs(type);
    showFilters = false;
  }
  
  function clearFilter() {
    selectedFilter = '';
    loadPOIs();
    showFilters = false;
  }
</script>

<svelte:head>
  <title>Carte des parcours | Decathlon Urban Trek</title>
  <script>
    // Empêcher le défilement de la page mais permettre le déplacement sur la carte
    document.addEventListener('DOMContentLoaded', function() {
      // Ajouter un gestionnaire d'événements pour empêcher le défilement de la page
      // mais permettre les interactions sur la carte
      document.addEventListener('touchmove', function(e) {
        // Si l'événement ne provient pas de la carte, l'empêcher
        if (!e.target.closest('#map')) {
          e.preventDefault();
        }
      }, { passive: false });
    });
  </script>
</svelte:head>

<style>
  .map-container {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden; /* Empêcher le défilement */
  }
  
  #map {
    width: 100%;
    height: 100%;
  }
  
  /* Styles pour empêcher le défilement de la page lors de l'interaction avec la carte */
  :global(body.map-page) {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
  
  /* Permettre les interactions sur la carte */
  :global(.leaflet-container) {
    touch-action: auto !important;
  }
  
  /* Styles pour la popup personnalisée */
  :global(.custom-popup .leaflet-popup-content-wrapper) {
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  }
  
  :global(.custom-popup .leaflet-popup-content) {
    margin: 0;
    width: 100% !important;
  }
  
  :global(.custom-popup .leaflet-popup-tip) {
    background-color: white;
  }
  
  .map-controls {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .point-detail-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 16px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  
  /* Styles pour les marqueurs personnalisés */
  :global(.user-marker-inner) {
    width: 20px;
    height: 20px;
    background-color: #0082C3;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(0, 130, 195, 0.4);
  }
  
  :global(.poi-marker-inner) {
    width: 16px;
    height: 16px;
    background-color: #FF5722;
    border: 2px solid white;
    border-radius: 50%;
  }
  
  :global(.start-marker-inner) {
    width: 16px;
    height: 16px;
    background-color: #4CAF50;
    border: 2px solid white;
    border-radius: 50%;
  }
  
  :global(.end-marker-inner) {
    width: 16px;
    height: 16px;
    background-color: #F44336;
    border: 2px solid white;
    border-radius: 50%;
  }
  
  /* Styles pour le bouton de localisation */
  :global(.location-button) {
    width: 56px !important;
    height: 56px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: #0082C3 !important;
    color: white !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
    border: none !important;
    cursor: pointer !important;
  }
  
  :global(.location-button .material-icons) {
    font-size: 24px !important;
  }
  
  /* Styles pour les filtres */
  .map-controls {
    position: absolute;
    top: 80px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 1000;
  }
  
  .control-button {
    width: 40px;
    height: 40px;
    background-color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .control-button:hover {
    background-color: #f0f0f0;
  }
  
  .control-button.active {
    background-color: #0082C3;
    color: white;
  }
  
  .filter-panel {
    position: absolute;
    top: 80px;
    right: 60px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 250px;
    z-index: 1000;
    overflow: hidden;
  }
  
  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }
  
  .filter-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
  }
  
  .filter-options {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .filter-option {
    padding: 10px 12px;
    text-align: left;
    background: none;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .filter-option:hover {
    background-color: #f0f0f0;
  }
  
  .filter-option.active {
    background-color: #e6f3fa;
    color: #0082C3;
    font-weight: 500;
  }
  
  /* Styles pour le message de bienvenue */
  .welcome-message {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
    z-index: 1000;
    overflow: hidden;
  }
  
  .welcome-content {
    padding: 16px;
    position: relative;
  }
  
  .close-welcome {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
  }
  
  .welcome-content h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #0082C3;
  }
  
  .welcome-content p {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #333;
  }
  
  .welcome-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .inline-icon {
    font-size: 16px;
    vertical-align: middle;
  }
  
  /* Styles pour les marqueurs de POI */
  :global(.poi-marker) {
    width: 24px !important;
    height: 24px !important;
  }
  
  :global(.poi-marker-inner) {
    width: 100%;
    height: 100%;
    background-color: #0082C3;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  :global(.poi-marker-childrens_park .poi-marker-inner) {
    background-color: #4CAF50;
  }
  
  /* Styles pour la popup */
  :global(.custom-popup .leaflet-popup-content-wrapper) {
    padding: 0;
    overflow: hidden;
    border-radius: 8px;
  }
  
  :global(.custom-popup .leaflet-popup-content) {
    margin: 0;
    width: 280px !important;
  }
  
  :global(.custom-popup .leaflet-popup-tip) {
    background-color: white;
  }
</style>

<div class="map-container">
  {#if isLoading}
    <div class="loading-overlay">
      <Loading size="lg" />
    </div>
  {/if}
  
  <div id="map"></div>
  
  <!-- Boutons de contrôle -->
  <div class="map-controls">
    <button 
      class="control-button" 
      on:click={centerOnUser}
      title="Centrer sur ma position"
    >
      <span class="material-icons">my_location</span>
    </button>
    
    <button 
      class="control-button {selectedFilter ? 'active' : ''}" 
      on:click={toggleFilters}
      title="Filtrer les points d'intérêt"
    >
      <span class="material-icons">filter_list</span>
    </button>
  </div>
  
  <!-- Panneau de filtres -->
  {#if showFilters}
    <div class="filter-panel" transition:fade={{ duration: 200 }}>
      <div class="filter-header">
        <h3>Filtrer par type</h3>
        <button on:click={toggleFilters} class="close-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="filter-options">
        <button 
          class="filter-option {selectedFilter === '' ? 'active' : ''}"
          on:click={clearFilter}
        >
          Tous les points d'intérêt
        </button>
        
        <button 
          class="filter-option {selectedFilter === 'childrens_park' ? 'active' : ''}"
          on:click={() => applyFilter('childrens_park')}
        >
          Parcs pour enfants
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Message de bienvenue pour les parents -->
  {#if showWelcomeMessage}
    <div class="welcome-message" transition:fade={{ duration: 300 }}>
      <div class="welcome-content">
        <button class="close-welcome" on:click={closeWelcomeMessage}>
          <span class="material-icons">close</span>
        </button>
        
        <h3>Bonjour {userName || 'parent explorateur'} !</h3>
        <p>Découvrez des parcs pour enfants à proximité en utilisant le filtre <span class="material-icons inline-icon">filter_list</span>.</p>
        
        <div class="welcome-actions">
          <Button variant="primary" size="sm" on:click={closeWelcomeMessage}>
            C'est parti !
          </Button>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Détails du point sélectionné -->
  {#if selectedPoint}
    <div class="point-detail-container" transition:fade={{ duration: 200 }}>
      <RoutePointDetail 
        point={selectedPoint} 
        onClose={closePointDetail}
      />
    </div>
  {/if}
</div> 