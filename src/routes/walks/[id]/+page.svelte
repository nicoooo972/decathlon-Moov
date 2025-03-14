<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getCompletedWalkById, getWalkPoints, updateWalkDescription } from '$lib/services/walks';
  import { showNotification } from '$lib/stores/app-store';
  import type { CompletedWalk, WalkPoint } from '$lib/services/walks';
  
  let walk: CompletedWalk | null = null;
  let walkPoints: WalkPoint[] = [];
  let loading = true;
  let error: string | null = null;
  let editingDescription = false;
  let newDescription = '';
  let savingDescription = false;
  let map: google.maps.Map | null = null;
  let mapElement: HTMLDivElement;
  let walkPath: google.maps.Polyline | null = null;
  
  // Récupérer l'ID de la balade depuis l'URL
  const walkId = $page.params.id;
  
  onMount(async () => {
    try {
      // Charger les détails de la balade
      const { data: walkData, error: walkError } = await getCompletedWalkById(walkId);
      
      if (walkError) {
        throw walkError;
      }
      
      if (!walkData) {
        throw new Error('Balade non trouvée');
      }
      
      walk = walkData;
      newDescription = walkData.description || '';
      
      // Charger les points de la balade
      const { data: pointsData, error: pointsError } = await getWalkPoints(walkId);
      
      if (pointsError) {
        console.error('Erreur lors du chargement des points:', pointsError);
      } else {
        walkPoints = pointsData || [];
      }
      
      // Initialiser la carte si des points sont disponibles
      if (walkPoints.length > 0) {
        initMap();
      }
    } catch (e) {
      console.error('Erreur lors du chargement de la balade:', e);
      error = e instanceof Error ? e.message : 'Une erreur est survenue lors du chargement de la balade';
      showNotification('Erreur lors du chargement de la balade', 'error');
    } finally {
      loading = false;
    }
  });
  
  function initMap() {
    if (typeof google === 'undefined' || walkPoints.length === 0) return;
    
    // Convertir les points en coordonnées pour Google Maps
    const path = walkPoints.map(point => ({
      lat: point.latitude,
      lng: point.longitude
    }));
    
    // Créer les limites pour centrer la carte
    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    
    // Options de la carte
    const mapOptions = {
      zoom: 14,
      center: bounds.getCenter(),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true
    };
    
    // Créer la carte
    map = new google.maps.Map(mapElement, mapOptions);
    
    // Ajouter le tracé de la balade
    walkPath = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#0082C3',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: map
    });
    
    // Ajouter des marqueurs pour le début et la fin
    if (path.length > 0) {
      // Marqueur de début
      new google.maps.Marker({
        position: path[0],
        map: map,
        title: 'Départ',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#00C853',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10
        }
      });
      
      // Marqueur de fin
      new google.maps.Marker({
        position: path[path.length - 1],
        map: map,
        title: 'Arrivée',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#FF3D00',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10
        }
      });
    }
    
    // Ajuster la vue pour montrer tout le tracé
    map.fitBounds(bounds);
  }
  
  // Formater la durée en heures et minutes
  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${minutes} min`;
    }
  }
  
  // Formater la date
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  // Mettre à jour la description
  async function saveDescription() {
    if (!walk || !walk.id) return;
    
    try {
      savingDescription = true;
      
      const { error } = await updateWalkDescription(walk.id, newDescription);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour la description locale
      walk.description = newDescription;
      editingDescription = false;
      showNotification('Description mise à jour avec succès', 'success');
    } catch (e) {
      console.error('Erreur lors de la mise à jour de la description:', e);
      showNotification('Erreur lors de la mise à jour de la description', 'error');
    } finally {
      savingDescription = false;
    }
  }
  
  function goBack() {
    goto('/profile');
  }
  
  // Gérer les erreurs de chargement d'image
  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://via.placeholder.com/800x400?text=Image+non+disponible';
    }
  }
</script>

<svelte:head>
  <title>{walk ? walk.name : 'Détails de la balade'} | EcoTrek</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 py-8">
    <!-- En-tête avec bouton de retour -->
    <div class="flex items-center mb-6">
      <button 
        on:click={goBack}
        class="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Retour"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
        {#if loading}
          Chargement...
        {:else if walk}
          {walk.name}
        {:else}
          Balade non trouvée
        {/if}
      </h1>
    </div>
    
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    {:else if error}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div class="p-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg">
          <p>{error}</p>
          <button 
            class="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            on:click={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    {:else if walk}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Colonne de gauche: Carte et statistiques -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Carte -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div bind:this={mapElement} class="w-full h-[400px]"></div>
          </div>
          
          <!-- Statistiques -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Statistiques</h2>
            
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{walk.distance_km.toFixed(2)} km</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Distance</div>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatDuration(walk.duration_seconds)}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Durée</div>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{walk.steps}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">Pas</div>
              </div>
            </div>
            
            {#if walk.created_at}
              <div class="mt-4 text-center text-gray-600 dark:text-gray-400">
                Balade effectuée le {formatDate(walk.created_at)}
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Colonne de droite: Informations et photos -->
        <div class="space-y-6">
          <!-- Image principale -->
          {#if walk.image_url}
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <img 
                src={walk.image_url} 
                alt={walk.name} 
                class="w-full h-64 object-cover"
                on:error={handleImageError}
              />
            </div>
          {/if}
          
          <!-- Description -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-gray-800 dark:text-white">Description</h2>
              
              {#if !editingDescription}
                <button 
                  class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                  on:click={() => editingDescription = true}
                >
                  <span class="material-icons text-sm mr-1">edit</span>
                  <span>Modifier</span>
                </button>
              {/if}
            </div>
            
            {#if editingDescription}
              <div class="space-y-4">
                <textarea 
                  bind:value={newDescription}
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white h-32 resize-none"
                  placeholder="Décrivez votre balade..."
                ></textarea>
                
                <div class="flex justify-end space-x-2">
                  <button 
                    class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    on:click={() => {
                      editingDescription = false;
                      newDescription = walk?.description || '';
                    }}
                    disabled={savingDescription}
                  >
                    Annuler
                  </button>
                  
                  <button 
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                    on:click={saveDescription}
                    disabled={savingDescription}
                  >
                    {#if savingDescription}
                      <span class="inline-block mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    {/if}
                    Enregistrer
                  </button>
                </div>
              </div>
            {:else}
              <p class="text-gray-700 dark:text-gray-300">
                {walk.description || 'Aucune description disponible.'}
              </p>
            {/if}
          </div>
          
          <!-- Partage -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Partager</h2>
            
            <div class="flex justify-center space-x-4">
              <button class="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                <span class="material-icons">facebook</span>
              </button>
              
              <button class="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors">
                <span class="material-icons">twitter</span>
              </button>
              
              <button class="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">
                <span class="material-icons">whatsapp</span>
              </button>
              
              <button class="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors">
                <span class="material-icons">email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p class="text-gray-700 dark:text-gray-300">Balade non trouvée.</p>
        <a 
          href="/profile" 
          class="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retour au profil
        </a>
      </div>
    {/if}
  </div>
</div> 