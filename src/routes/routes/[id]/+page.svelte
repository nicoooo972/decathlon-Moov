<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { getRouteById, isRouteFavorite, saveRouteFavorite, removeRouteFavorite } from '$lib/services/routes';
  import { withLoading, showNotification } from '$lib/stores/app-store';
  import Button from '$lib/components/ui/button.svelte';
  import Loading from '$lib/components/ui/loading.svelte';
  import type { Route } from '$lib/types';
  import { startTracking, stopTracking, isTracking } from '$lib/services/tracking-service';
  import TrackingMap from '$lib/components/tracking-map.svelte';
  
  export let data;
  const route = data.route;
  
  let isLoading = true;
  let isFavorite = false;
  let toggleFavoriteLoading = false;
  
  onMount(async () => {
    if (!$currentUser) {
      goto('/login');
      return;
    }
    
    const routeId = parseInt($page.params.id);
    if (isNaN(routeId)) {
      showNotification('ID de parcours invalide', 'error');
      goto('/routes');
      return;
    }
    
    await loadRoute(routeId);
    await checkFavoriteStatus(routeId);
  });
  
  async function loadRoute(id: number) {
    try {
      await withLoading(async () => {
        route = await getRouteById(id);
        
        if (!route) {
          showNotification('Parcours non trouvé', 'error');
          goto('/routes');
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
      goto('/routes');
    } finally {
      isLoading = false;
    }
  }
  
  async function checkFavoriteStatus(routeId: number) {
    if (!$currentUser) return;
    
    try {
      isFavorite = await isRouteFavorite($currentUser.id, routeId);
    } catch (error) {
      console.error('Erreur lors de la vérification du statut favori:', error);
    }
  }
  
  async function toggleFavorite() {
    if (!$currentUser || !route) return;
    
    toggleFavoriteLoading = true;
    
    try {
      if (isFavorite) {
        await removeRouteFavorite($currentUser.id, route.id);
        showNotification('Parcours retiré des favoris', 'success');
      } else {
        await saveRouteFavorite($currentUser.id, route.id);
        showNotification('Parcours ajouté aux favoris', 'success');
      }
      
      isFavorite = !isFavorite;
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
    } finally {
      toggleFavoriteLoading = false;
    }
  }
  
  function viewOnMap() {
    if (route) {
      goto(`/map?route=${route.id}`);
    }
  }
  
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    
    return `${mins} min`;
  }
  
  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'facile':
        return 'bg-green-100 text-green-800';
      case 'moyen':
        return 'bg-yellow-100 text-yellow-800';
      case 'difficile':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  function handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/images/route-placeholder.jpg';
    }
  }
  
  async function handleStartTracking() {
    try {
      await startTracking(route.id);
      showNotification('Suivi du trajet démarré', 'success');
    } catch (error) {
      console.error('Error starting tracking:', error);
      showNotification('Erreur lors du démarrage du suivi', 'error');
    }
  }
  
  async function handleStopTracking() {
    try {
      await stopTracking();
      showNotification('Trajet enregistré avec succès', 'success');
      goto('/tracks');
    } catch (error) {
      console.error('Error stopping tracking:', error);
      showNotification('Erreur lors de l\'arrêt du suivi', 'error');
    }
  }
</script>

<svelte:head>
  <title>{route ? route.name : 'Chargement...'} | Decathlon Urban Trek</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 pb-12">
  {#if isLoading}
    <div class="flex justify-center items-center h-64 pt-12">
      <Loading size="lg" />
    </div>
  {:else if route}
    <!-- Header avec image de couverture -->
    <div class="relative h-64 md:h-96 bg-gray-200">
      <img 
        src={route.image_url || '/images/route-placeholder.jpg'} 
        alt={route.name}
        class="w-full h-full object-cover"
        on:error={handleImageError}
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      
      <!-- Bouton retour -->
      <div class="absolute top-4 left-4">
        <button 
          class="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
          on:click={() => goto('/routes')}
          aria-label="Retour"
        >
          <span class="material-icons">arrow_back</span>
        </button>
      </div>
      
      <!-- Titre et infos principales -->
      <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-3xl font-bold mb-2">{route.name}</h1>
              <div class="flex flex-wrap gap-4 items-center">
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm`}>
                  {route.activity_type}
                </span>
                <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(route.difficulty)}`}>
                  {route.difficulty}
                </span>
                {#if route.accessibility}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <span class="material-icons text-xs mr-1">accessible</span>
                    Accessible
                  </span>
                {/if}
              </div>
            </div>
            <button 
              class="bg-white/20 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white/30 transition-colors"
              on:click={toggleFavorite}
              disabled={toggleFavoriteLoading}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <span class="material-icons text-white">
                {isFavorite ? 'favorite' : 'favorite_border'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Contenu principal -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Informations du parcours -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex flex-wrap gap-6 mb-6">
          <div class="flex items-center">
            <span class="material-icons text-[#0082C3] mr-2">straighten</span>
            <div>
              <p class="text-sm text-gray-500">Distance</p>
              <p class="font-medium">{route.distance_km} km</p>
            </div>
          </div>
          <div class="flex items-center">
            <span class="material-icons text-[#0082C3] mr-2">schedule</span>
            <div>
              <p class="text-sm text-gray-500">Durée</p>
              <p class="font-medium">{formatDuration(route.duration_minutes)}</p>
            </div>
          </div>
          <div class="flex items-center">
            <span class="material-icons text-[#0082C3] mr-2">group</span>
            <div>
              <p class="text-sm text-gray-500">Âges recommandés</p>
              <p class="font-medium">{route.suitable_ages.join(', ')}</p>
            </div>
          </div>
        </div>
        
        <h2 class="text-xl font-bold text-gray-900 mb-3">Description</h2>
        <p class="text-gray-600 mb-6">{route.description}</p>
        
        <div class="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" on:click={() => goto('/routes')}>
            Retour à la liste
          </Button>
          <Button on:click={viewOnMap}>
            <span class="material-icons mr-1">map</span>
            Voir sur la carte
          </Button>
        </div>
      </div>
      
      <!-- Carte avec le trajet -->
      <div class="mb-8">
        <TrackingMap routeId={route.id} />
      </div>
      
      <!-- Boutons d'action -->
      <div class="flex gap-4 mb-8">
        {#if $isTracking}
          <button
            class="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            on:click={handleStopTracking}
          >
            Terminer
          </button>
        {:else}
          <button
            class="bg-[#0082C3] text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            on:click={handleStartTracking}
          >
            Y aller
          </button>
        {/if}
        
        <button 
          class="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          on:click={toggleFavorite}
          disabled={toggleFavoriteLoading}
        >
          {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        </button>
      </div>
      
      <!-- Points d'intérêt -->
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Points d'intérêt</h2>
      <div class="space-y-6">
        {#if route.points_of_interest && route.points_of_interest.length > 0}
          {#each route.points_of_interest as point, index}
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
              <div class="md:flex">
                <div class="md:w-1/3">
                  <img 
                    src={point.image_url || '/images/poi-placeholder.jpg'} 
                    alt={point.name}
                    class="h-48 w-full object-cover md:h-full"
                    on:error={(e) => (e.target as HTMLImageElement).src = '/images/poi-placeholder.jpg'}
                  />
                </div>
                <div class="p-6 md:w-2/3">
                  <h3 class="text-lg font-bold text-gray-900 mb-2">{point.name}</h3>
                  <p class="text-gray-600 mb-4">{point.description}</p>
                  
                  {#if point.recommended_products && point.recommended_products.length > 0}
                    <h4 class="text-sm font-semibold text-gray-700 mb-2">Équipement recommandé</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {#each point.recommended_products as product}
                        <a 
                          href={product.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          class="flex items-center border rounded-lg p-2 hover:bg-gray-50 transition-colors"
                        >
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            class="w-12 h-12 object-contain mr-3"
                            on:error={(e) => (e.target as HTMLImageElement).src = '/images/product-placeholder.jpg'}
                          />
                          <div>
                            <p class="font-medium text-gray-800">{product.name}</p>
                            <p class="text-[#0082C3] font-bold">{product.price.toFixed(2)} €</p>
                          </div>
                        </a>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        {:else}
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <span class="material-icons text-4xl text-gray-400 mb-2">location_off</span>
            <p class="text-gray-600">Aucun point d'intérêt n'est disponible pour ce parcours.</p>
          </div>
        {/if}
      </div>
      
      <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Distance</h3>
          <p class="text-2xl font-bold text-[#0082C3]">{route.distance} km</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Dénivelé</h3>
          <p class="text-2xl font-bold text-[#0082C3]">{route.elevation_gain} m</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Durée estimée</h3>
          <p class="text-2xl font-bold text-[#0082C3]">{route.estimated_duration}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">Difficulté</h3>
          <p class="text-2xl font-bold text-[#0082C3]">{route.difficulty}</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <span class="material-icons text-5xl text-gray-400 mb-4">error_outline</span>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Parcours non trouvé</h2>
      <p class="text-gray-600 mb-6">Le parcours que vous recherchez n'existe pas ou a été supprimé.</p>
      <Button on:click={() => goto('/routes')}>
        Retour à la liste des parcours
      </Button>
    </div>
  {/if}
</div> 