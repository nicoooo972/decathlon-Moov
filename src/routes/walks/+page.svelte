<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getUserCompletedWalks, type CompletedWalk } from '$lib/services/walks';
  import { showNotification } from '$lib/stores/app-store';
  import { currentUser } from '$lib/services/auth';

  let walks: CompletedWalk[] = [];
  let loading = true;
  let error: string | null = null;
  let searchTerm = '';
  let sortBy = 'date'; // 'date', 'distance', 'duration'
  let sortOrder = 'desc'; // 'asc', 'desc'

  // Filtrer les balades en fonction du terme de recherche
  $: filteredWalks = walks.filter(walk => 
    walk.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    walk.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Trier les balades
  $: sortedWalks = [...filteredWalks].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'distance') {
      return sortOrder === 'asc' ? a.distance_km - b.distance_km : b.distance_km - a.distance_km;
    } else if (sortBy === 'duration') {
      return sortOrder === 'asc' ? a.duration_seconds - b.duration_seconds : b.duration_seconds - a.duration_seconds;
    }
    return 0;
  });

  onMount(async () => {
    // Vérifier si l'utilisateur est connecté
    if (!$currentUser) {
      goto('/login');
      return;
    }

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

  function goBack() {
    goto('/profile');
  }

  // Changer le tri
  function changeSortBy(newSortBy: string) {
    if (sortBy === newSortBy) {
      // Inverser l'ordre si on clique sur le même critère
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy = newSortBy;
      // Par défaut, trier par date décroissante, distance et durée croissantes
      sortOrder = newSortBy === 'date' ? 'desc' : 'desc';
    }
  }

  // Gérer les erreurs de chargement d'image
  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'https://via.placeholder.com/400x200?text=Image+non+disponible';
    }
  }
</script>

<svelte:head>
  <title>Mes Balades | EcoTrek</title>
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
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Mes Balades</h1>
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
    {:else if walks.length === 0}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
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
      </div>
    {:else}
      <!-- Barre de recherche et filtres -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="relative flex-1">
            <input 
              type="text" 
              bind:value={searchTerm}
              placeholder="Rechercher une balade..." 
              class="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <span class="absolute left-3 top-2.5 text-gray-400 material-icons">search</span>
          </div>
          
          <div class="flex items-center space-x-2">
            <span class="text-gray-700 dark:text-gray-300 text-sm">Trier par:</span>
            
            <button 
              class={`px-3 py-1 rounded-lg text-sm ${sortBy === 'date' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              on:click={() => changeSortBy('date')}
            >
              Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            
            <button 
              class={`px-3 py-1 rounded-lg text-sm ${sortBy === 'distance' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              on:click={() => changeSortBy('distance')}
            >
              Distance {sortBy === 'distance' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            
            <button 
              class={`px-3 py-1 rounded-lg text-sm ${sortBy === 'duration' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              on:click={() => changeSortBy('duration')}
            >
              Durée {sortBy === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Liste des balades -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each sortedWalks as walk (walk.id)}
          <div 
            role="button"
            tabindex="0"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            on:click={() => walk.id && viewWalkDetails(walk.id)}
            on:keydown={(e) => e.key === 'Enter' && walk.id && viewWalkDetails(walk.id)}
          >
            <div class="relative h-48">
              <img 
                src={walk.image_url || 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop'} 
                alt={walk.name} 
                class="w-full h-full object-cover"
                on:error={handleImageError}
              />
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 class="text-white font-semibold text-lg truncate">{walk.name}</h3>
                <p class="text-white/80 text-sm">{walk.created_at ? formatDate(walk.created_at) : 'Date inconnue'}</p>
              </div>
            </div>
            
            <div class="p-4">
              <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3 h-10">
                {walk.description || 'Aucune description disponible.'}
              </p>
              
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
      
      {#if filteredWalks.length === 0 && searchTerm}
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center mt-6">
          <p class="text-gray-700 dark:text-gray-300">Aucune balade ne correspond à votre recherche.</p>
          <button 
            class="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline"
            on:click={() => searchTerm = ''}
          >
            Effacer la recherche
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div> 