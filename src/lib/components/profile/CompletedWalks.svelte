<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserCompletedWalks, type CompletedWalk } from '$lib/services/walks';
  import { goto } from '$app/navigation';
  import { showNotification } from '$lib/stores/app-store';

  let walks: CompletedWalk[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const { data, error: walkError } = await getUserCompletedWalks();
      
      if (walkError) {
        throw walkError;
      }
      
      walks = data || [];
    } catch (e) {
      console.error('Erreur lors du chargement des balades:', e);
      error = e instanceof Error ? e.message : 'Une erreur est survenue lors du chargement des balades';
      showNotification('Erreur lors du chargement des balades', 'error');
    } finally {
      loading = false;
    }
  });

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

  // Naviguer vers le détail d'une balade
  function viewWalkDetails(walkId: string) {
    goto(`/walks/${walkId}`);
  }

  // Gérer les erreurs de chargement d'image
  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://via.placeholder.com/400x200?text=Image+non+disponible';
    }
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
  <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Mes balades</h2>
  
  {#if loading}
    <div class="flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  {:else if error}
    <div class="p-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg">
      <p>{error}</p>
      <button 
        class="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        on:click={() => window.location.reload()}
      >
        Réessayer
      </button>
    </div>
  {:else if walks.length === 0}
    <div class="p-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
      <div class="text-gray-500 dark:text-gray-400 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <p>Vous n'avez pas encore enregistré de balades</p>
      </div>
      <a 
        href="/map" 
        class="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Commencer une balade
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each walks as walk (walk.id)}
        <div 
          role="button"
          tabindex="0"
          class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          on:click={() => walk.id && viewWalkDetails(walk.id)}
          on:keydown={(e) => e.key === 'Enter' && walk.id && viewWalkDetails(walk.id)}
        >
          <div class="relative h-32">
            <img 
              src={walk.image_url || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop'} 
              alt={walk.name} 
              class="w-full h-full object-cover"
              on:error={handleImageError}
            />
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <h3 class="text-white font-semibold truncate">{walk.name}</h3>
              <p class="text-white/80 text-sm">{walk.created_at ? formatDate(walk.created_at) : 'Date inconnue'}</p>
            </div>
          </div>
          
          <div class="p-3 bg-white dark:bg-gray-800">
            <div class="flex justify-between text-sm">
              <div class="flex items-center">
                <span class="material-icons text-indigo-600 text-sm mr-1">straighten</span>
                <span>{walk.distance_km.toFixed(2)} km</span>
              </div>
              <div class="flex items-center">
                <span class="material-icons text-indigo-600 text-sm mr-1">schedule</span>
                <span>{formatDuration(walk.duration_seconds)}</span>
              </div>
              <div class="flex items-center">
                <span class="material-icons text-indigo-600 text-sm mr-1">directions_walk</span>
                <span>{walk.steps} pas</span>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    {#if walks.length > 0}
      <div class="mt-4 text-center">
        <a 
          href="/walks" 
          class="text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Voir toutes mes balades
        </a>
      </div>
    {/if}
  {/if}
</div> 