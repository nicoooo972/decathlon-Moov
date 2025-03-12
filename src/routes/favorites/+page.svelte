<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/services/auth';
  import { getUserFavorites } from '$lib/services/user';
  import { goto } from '$app/navigation';
  import type { User } from '$lib/types';
  
  let user: User | null = null;
  let loading = true;
  let favorites: any[] = [];
  
  onMount(() => {
    const unsubscribe = currentUser.subscribe(async (value) => {
      user = value;
      if (user) {
        loading = true;
        try {
          favorites = await getUserFavorites(user.id);
        } catch (e) {
          console.error('Erreur lors du chargement des favoris:', e);
        } finally {
          loading = false;
        }
      } else {
        loading = false;
      }
    });
    
    return unsubscribe;
  });
  
  function goBack() {
    goto('/profile');
  }
  
  function goToPOI(lat: number, lng: number) {
    goto(`/poi/${lat},${lng}`);
  }
  
  function handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://via.placeholder.com/400x300?text=Image+non+disponible';
    }
  }
</script>

<svelte:head>
  <title>Mes Favoris | EcoTrek</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 py-8">
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
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Mes Favoris</h1>
    </div>
    
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    {:else if !user}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p class="text-center text-gray-700 dark:text-gray-300">
          Vous n'êtes pas connecté. Veuillez vous <a href="/login" class="text-green-600 dark:text-green-400 hover:underline">connecter</a> pour accéder à vos favoris.
        </p>
      </div>
    {:else if favorites.length === 0}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p class="text-center text-gray-700 dark:text-gray-300">
          Vous n'avez pas encore de favoris. Explorez la carte pour découvrir des points d'intérêt et les ajouter à vos favoris.
        </p>
        <div class="mt-6 flex justify-center">
          <a 
            href="/map" 
            class="inline-block py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Explorer la carte
          </a>
        </div>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each favorites as favorite}
          <div 
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            on:click={() => goToPOI(favorite.points_of_interest.latitude, favorite.points_of_interest.longitude)}
            on:keydown={(e) => e.key === 'Enter' && goToPOI(favorite.points_of_interest.latitude, favorite.points_of_interest.longitude)}
            tabindex="0"
            role="button"
            aria-label={`Voir les détails de ${favorite.points_of_interest.name}`}
          >
            <div class="relative h-48">
              <img 
                src={favorite.points_of_interest.image_url} 
                alt={favorite.points_of_interest.name}
                class="w-full h-full object-cover"
                on:error={handleImageError}
              />
              <div class="absolute top-2 right-2">
                <span class="bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">{favorite.points_of_interest.name}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Ajouté le {new Date(favorite.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div> 