<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { getAllRoutes, getRecommendedRoutes } from '$lib/services/routes';
  import { withLoading, showNotification } from '$lib/stores/app-store';
  import Button from '$lib/components/ui/button.svelte';
  import Loading from '$lib/components/ui/loading.svelte';
  import type { Route } from '$lib/types';
  
  let routes: Route[] = [];
  let isLoading = true;
  let showRecommended = true;
  
  onMount(async () => {
    if (!$currentUser) {
      goto('/login');
      return;
    }
    
    await loadRoutes();
  });
  
  async function loadRoutes() {
    try {
      await withLoading(async () => {
        if (showRecommended && $currentUser) {
          routes = await getRecommendedRoutes($currentUser.id);
        } else {
          routes = await getAllRoutes();
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
    } finally {
      isLoading = false;
    }
  }
  
  function toggleRouteDisplay() {
    showRecommended = !showRecommended;
    loadRoutes();
  }
  
  function viewRouteOnMap(route: Route) {
    goto(`/map?route=${route.id}`);
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
</script>

<svelte:head>
  <title>Activités disponibles | Decathlon Urban Trek</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Activités disponibles</h1>
      
      <div class="flex space-x-2">
        <Button variant="outline" on:click={toggleRouteDisplay}>
          {showRecommended ? 'Voir toutes les activités' : 'Voir recommandées'}
        </Button>
        <Button on:click={() => goto('/map')}>
          <span class="material-icons mr-1">map</span>
          Carte
        </Button>
      </div>
    </div>
    
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <Loading size="lg" />
      </div>
    {:else if routes.length === 0}
      <div class="bg-white shadow rounded-lg p-6 text-center">
        <span class="material-icons text-4xl text-gray-400 mb-2">hiking</span>
        <h2 class="text-xl font-medium text-gray-900 mb-2">Aucun parcours disponible</h2>
        <p class="text-gray-600 mb-4">
          {#if showRecommended}
            Nous n'avons pas trouvé de parcours correspondant à vos préférences.
          {:else}
            Aucun parcours n'est disponible pour le moment.
          {/if}
        </p>
        {#if showRecommended}
          <Button on:click={toggleRouteDisplay}>
            Voir tous les parcours
          </Button>
        {/if}
      </div>
    {:else}
      <div class="grid grid-cols-1 gap-6">
        {#each routes as route}
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="md:flex">
              <div class="md:w-1/3">
                <img 
                  src={route.image_url || '/images/route-placeholder.jpg'} 
                  alt={route.name}
                  class="h-48 w-full object-cover md:h-full"
                  on:error={handleImageError}
                />
              </div>
              <div class="p-6 md:w-2/3">
                <div class="flex justify-between items-start">
                  <h2 class="text-xl font-bold text-gray-900 mb-2">{route.name}</h2>
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(route.difficulty)}`}>
                    {route.difficulty}
                  </span>
                </div>
                
                <p class="text-gray-600 mb-4 line-clamp-2">{route.description}</p>
                
                <div class="flex flex-wrap gap-4 mb-4">
                  <div class="flex items-center text-sm text-gray-500">
                    <span class="material-icons text-sm mr-1">straighten</span>
                    {route.distance_km} km
                  </div>
                  <div class="flex items-center text-sm text-gray-500">
                    <span class="material-icons text-sm mr-1">schedule</span>
                    {formatDuration(route.duration_minutes)}
                  </div>
                  <div class="flex items-center text-sm text-gray-500">
                    <span class="material-icons text-sm mr-1">category</span>
                    {route.activity_type}
                  </div>
                  {#if route.accessibility}
                    <div class="flex items-center text-sm text-gray-500">
                      <span class="material-icons text-sm mr-1">accessible</span>
                      Accessible
                    </div>
                  {/if}
                </div>
                
                <div class="flex justify-end">
                  <Button variant="outline" on:click={() => goto(`/routes/${route.id}`)}>
                    Détails
                  </Button>
                  <div class="ml-2">
                    <Button on:click={() => viewRouteOnMap(route)}>
                      <span class="material-icons mr-1">map</span>
                      Voir sur la carte
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div> 