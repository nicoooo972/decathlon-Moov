<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { goto } from '$app/navigation';
  import type { RoutePoint } from '$lib/types';
  
  export let data: { point: RoutePoint };
  const { point } = data;
  
  let activeTab = 'info'; // 'info', 'activities', 'products'
  let imageError = false;
  
  // Assurer que le défilement fonctionne correctement
  onMount(() => {
    // Réinitialiser les styles du body pour permettre le défilement
    document.body.classList.remove('map-page');
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
  });
  
  onDestroy(() => {
    // Nettoyer les styles si nécessaire
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  });
  
  function handleImageError() {
    imageError = true;
  }
  
  function openDirections() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${point.position.lat},${point.position.lng}&travelmode=walking`;
          window.open(url, '_blank');
        },
        (error) => {
          alert('Impossible d\'obtenir votre position. Veuillez activer la géolocalisation.');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas prise en charge par votre navigateur.');
    }
  }
  
  function goBack() {
    goto('/map');
  }
  
  function openWebsite() {
    if (point.website) {
      window.open(point.website, '_blank');
    }
  }
  
  function setTab(tab: string) {
    activeTab = tab;
  }
  
  function handleProductImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) target.src = 'https://via.placeholder.com/150?text=Image+non+disponible';
  }
</script>

<svelte:head>
  <title>{point.name} | EcoTrek</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
  <!-- Header avec image et bouton de retour -->
  <div class="relative h-64">
    {#if !imageError}
      <img 
        src={point.image_url} 
        alt={point.name} 
        class="w-full h-full object-cover"
        on:error={handleImageError}
      />
    {:else}
      <div class="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
        <span class="text-gray-600 dark:text-gray-400">Image non disponible</span>
      </div>
    {/if}
    
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
    
    <button 
      class="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-md min-h-[48px] min-w-[48px] flex items-center justify-center"
      on:click={goBack}
      aria-label="Retour"
    >
      <span class="material-icons text-gray-600 dark:text-gray-300">arrow_back</span>
    </button>
    
    <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
      <div class="flex items-center mb-1">
        <span class="material-icons text-amber-400 mr-1">star</span>
        <span class="font-medium mr-2">4.7</span>
        <span class="text-sm text-white/80">(2,345 avis)</span>
      </div>
      <h1 class="text-3xl font-bold mb-1">{point.name}</h1>
      <div class="flex items-center text-sm">
        <span class="material-icons text-white/90 mr-1 text-sm">place</span>
        <span>7e arrondissement, Paris</span>
      </div>
    </div>
  </div>
  
  <!-- Navigation par onglets -->
  <div class="flex border-b bg-white dark:bg-gray-800 dark:border-gray-700">
    <button 
      class="flex-1 py-4 text-center font-medium text-sm flex items-center justify-center {activeTab === 'info' ? 'text-[#0082C3] dark:text-[#0082C3] border-b-2 border-[#0082C3]' : 'text-gray-500 dark:text-gray-400'}"
      on:click={() => setTab('info')}
    >
      <span class="material-icons text-sm mr-1">info</span>
      Informations
    </button>
    {#if point.activities && point.activities.length > 0}
      <button 
        class="flex-1 py-4 text-center font-medium text-sm flex items-center justify-center {activeTab === 'activities' ? 'text-[#0082C3] dark:text-[#0082C3] border-b-2 border-[#0082C3]' : 'text-gray-500 dark:text-gray-400'}"
        on:click={() => setTab('activities')}
      >
        <span class="material-icons text-sm mr-1">hiking</span>
        Activités
      </button>
    {/if}
    {#if point.recommended_products && point.recommended_products.length > 0}
      <button 
        class="flex-1 py-4 text-center font-medium text-sm flex items-center justify-center {activeTab === 'products' ? 'text-[#0082C3] dark:text-[#0082C3] border-b-2 border-[#0082C3]' : 'text-gray-500 dark:text-gray-400'}"
        on:click={() => setTab('products')}
      >
        <span class="material-icons text-sm mr-1">shopping_bag</span>
        Équipement
      </button>
    {/if}
  </div>
  
  <!-- Contenu principal -->
  <div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
    {#if activeTab === 'info'}
      <div class="p-5">
        <!-- Description principale -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-5">
          <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{point.description}</p>
        </div>
        
        <!-- Détails supplémentaires -->
        {#if point.details && point.details.length > 0}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-5">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">À propos</h2>
            <ul class="space-y-3">
              {#each point.details as detail}
                <li class="flex items-start">
                  <span class="material-icons text-[#0082C3] mr-2 text-sm mt-1">check_circle</span>
                  <span class="text-gray-700 dark:text-gray-300 text-base">{detail}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <!-- Horaires -->
        {#if point.opening_hours}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-5">
            <div class="flex items-center mb-3">
              <span class="material-icons text-gray-700 dark:text-gray-300 mr-2">schedule</span>
              <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Horaires</h2>
            </div>
            <p class="text-gray-700 dark:text-gray-300 text-base">{point.opening_hours}</p>
          </div>
        {/if}
        
        <!-- Informations pratiques -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-5">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Informations pratiques</h2>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <span class="material-icons text-gray-700 dark:text-gray-300 mr-2 text-sm">euro</span>
                <span class="font-medium text-gray-800 dark:text-white">Tarifs</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">À partir de 17,10€</p>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <span class="material-icons text-gray-700 dark:text-gray-300 mr-2 text-sm">access_time</span>
                <span class="font-medium text-gray-800 dark:text-white">Durée</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">2-3 heures</p>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <span class="material-icons text-gray-700 dark:text-gray-300 mr-2 text-sm">directions_walk</span>
                <span class="font-medium text-gray-800 dark:text-white">Accessibilité</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Ascenseurs disponibles</p>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <span class="material-icons text-gray-700 dark:text-gray-300 mr-2 text-sm">restaurant</span>
                <span class="font-medium text-gray-800 dark:text-white">Restauration</span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Restaurants sur place</p>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'activities'}
      <div class="p-5">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Activités à faire</h2>
          
          <div class="space-y-4">
            {#each point.activities || [] as activity, i}
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div class="flex items-start">
                  <div class="bg-[#0082C3] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p class="text-gray-700 dark:text-gray-300">{activity}</p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else if activeTab === 'products'}
      <div class="p-5">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Équipement recommandé</h2>
          
          <div class="space-y-4">
            {#each point.recommended_products || [] as product}
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                class="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                aria-label="Voir le produit {product.name}"
              >
                <div class="relative w-20 h-20 bg-white dark:bg-gray-700 rounded-md overflow-hidden flex-shrink-0 border dark:border-gray-600">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    class="w-full h-full object-contain"
                    on:error={handleProductImageError}
                  />
                </div>
                <div class="flex-1 ml-4">
                  {#if product.category}
                    <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">{product.category}</span>
                  {/if}
                  <p class="font-medium text-gray-800 dark:text-white mt-1">{product.name}</p>
                  <div class="flex items-center justify-between mt-1">
                    <p class="text-[#0082C3] font-bold">{product.price.toFixed(2)} €</p>
                    <span class="text-xs bg-[#0082C3] text-white px-2 py-1 rounded-full">Voir</span>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Barre d'actions fixe en bas -->
  <div class="p-4 border-t flex flex-col space-y-3 bg-white dark:bg-gray-800 dark:border-gray-700">
    {#if point.website}
      <button 
        class="w-full border border-gray-300 dark:border-gray-600 rounded-md min-h-[48px] px-4 py-2 text-base flex items-center justify-center text-gray-700 dark:text-gray-300"
        on:click={openWebsite}
      >
        <span class="material-icons mr-1">language</span>
        Site web
      </button>
    {/if}
    
    <button 
      class="w-full bg-[#0082C3] text-white rounded-md min-h-[48px] px-4 py-2 text-base flex items-center justify-center"
      on:click={openDirections}
    >
      <span class="material-icons mr-1">directions</span>
      Y aller
    </button>
  </div>
</div> 