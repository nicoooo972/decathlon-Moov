<script lang="ts">
  export let point: {
    position: { lat: number; lng: number };
    name: string;
    description: string;
    image_url: string;
    recommended_products: {
      id: number;
      name: string;
      image_url: string;
      price: number;
      url: string;
      category?: string;
    }[];
    details?: string[];
    activities?: string[];
    opening_hours?: string;
    website?: string;
  };
  export let route: any | null = null;
  export let onClose: () => void;
  
  let activeTab = 'info'; // 'info', 'activities', 'products'
  
  function handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/images/placeholder.jpg';
  }
  
  function handleProductImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/images/product-placeholder.jpg';
  }
  
  function openDirections() {
    if (point.position) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${point.position.lat},${point.position.lng}`, '_blank');
    }
  }
  
  function openWebsite() {
    if (point.website) {
      window.open(point.website, '_blank');
    }
  }
  
  function setTab(tab: string) {
    activeTab = tab;
  }
</script>

<style>
  :global(.action-button) {
    min-height: 48px !important;
    font-size: 16px !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
    min-width: 140px !important;
  }
  
  :global(.primary-button) {
    background-color: #0082C3 !important;
  }
  
  .detail-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .detail-content {
    flex: 1;
    overflow-y: auto;
  }
  
  .detail-image {
    height: 220px;
    width: 100%;
    object-fit: cover;
  }
  
  .tab-bar {
    border-bottom: 1px solid #eee;
    display: flex;
  }
  
  .tab-button {
    flex: 1;
    padding: 12px 0;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .tab-button.active {
    color: #0082C3;
    border-bottom: 2px solid #0082C3;
  }
</style>

<div class="detail-container">
  <!-- Header avec image et bouton de fermeture -->
  <div class="relative">
    <img 
      src={point.image_url} 
      alt={point.name} 
      class="detail-image"
      on:error={handleImageError}
    />
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
    <button 
      class="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-md min-h-[48px] min-w-[48px] flex items-center justify-center"
      on:click={onClose}
      aria-label="Fermer"
    >
      <span class="material-icons text-gray-600">close</span>
    </button>
    
    <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
      <div class="flex items-center mb-1">
        <span class="material-icons text-amber-400 mr-1">star</span>
        <span class="font-medium mr-2">4.7</span>
        <span class="text-sm text-white/80">(2,345 avis)</span>
      </div>
      <h2 class="text-3xl font-bold mb-1">{point.name}</h2>
      <div class="flex items-center text-sm">
        <span class="material-icons text-white/90 mr-1 text-sm">place</span>
        <span>7e arrondissement, Paris</span>
      </div>
    </div>
  </div>
  
  <!-- Navigation par onglets -->
  <div class="tab-bar">
    <button 
      class="tab-button {activeTab === 'info' ? 'active' : ''}"
      on:click={() => setTab('info')}
    >
      <span class="material-icons text-sm mr-1">info</span>
      Informations
    </button>
    {#if point.activities && point.activities.length > 0}
      <button 
        class="tab-button {activeTab === 'activities' ? 'active' : ''}"
        on:click={() => setTab('activities')}
      >
        <span class="material-icons text-sm mr-1">hiking</span>
        Activités
      </button>
    {/if}
    {#if point.recommended_products && point.recommended_products.length > 0}
      <button 
        class="tab-button {activeTab === 'products' ? 'active' : ''}"
        on:click={() => setTab('products')}
      >
        <span class="material-icons text-sm mr-1">shopping_bag</span>
        Équipement
      </button>
    {/if}
  </div>
  
  <!-- Contenu principal avec défilement -->
  <div class="detail-content">
    {#if activeTab === 'info'}
      <div class="p-5">
        <!-- Description principale -->
        <p class="text-gray-700 mb-6 leading-relaxed">{point.description}</p>
        
        <!-- Détails supplémentaires -->
        {#if point.details && point.details.length > 0}
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-gray-800 mb-3">À propos</h3>
            <ul class="space-y-3">
              {#each point.details as detail}
                <li class="flex items-start">
                  <span class="material-icons text-[#0082C3] mr-2 text-sm mt-1">check_circle</span>
                  <span class="text-gray-700">{detail}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <!-- Horaires -->
        {#if point.opening_hours}
          <div class="mb-6 bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center mb-2">
              <span class="material-icons text-gray-700 mr-2">schedule</span>
              <h3 class="text-lg font-semibold text-gray-800">Horaires</h3>
            </div>
            <p class="text-gray-700">{point.opening_hours}</p>
          </div>
        {/if}
        
        <!-- Informations pratiques -->
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-3">Informations pratiques</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <span class="material-icons text-gray-700 mr-2 text-sm">euro</span>
                <span class="font-medium text-gray-800">Tarifs</span>
              </div>
              <p class="text-sm text-gray-600">À partir de 17,10€</p>
            </div>
            
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <span class="material-icons text-gray-700 mr-2 text-sm">access_time</span>
                <span class="font-medium text-gray-800">Durée</span>
              </div>
              <p class="text-sm text-gray-600">2-3 heures</p>
            </div>
            
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <span class="material-icons text-gray-700 mr-2 text-sm">directions_walk</span>
                <span class="font-medium text-gray-800">Accessibilité</span>
              </div>
              <p class="text-sm text-gray-600">Ascenseurs disponibles</p>
            </div>
            
            <div class="bg-gray-50 p-3 rounded-lg">
              <div class="flex items-center mb-1">
                <span class="material-icons text-gray-700 mr-2 text-sm">restaurant</span>
                <span class="font-medium text-gray-800">Restauration</span>
              </div>
              <p class="text-sm text-gray-600">Restaurants sur place</p>
            </div>
          </div>
        </div>
        
        <!-- Boutons d'action -->
        <div class="flex gap-4 mt-6">
          {#if point.website}
            <button 
              class="flex-1 bg-white border border-[#0082C3] text-[#0082C3] py-3 px-4 rounded-lg font-medium flex items-center justify-center"
              on:click={openWebsite}
            >
              <span class="material-icons mr-2">language</span>
              Site web
            </button>
          {/if}
          <button 
            class="flex-1 bg-[#0082C3] text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
            on:click={openDirections}
          >
            <span class="material-icons mr-2">directions</span>
            Y aller
          </button>
        </div>
      </div>
    {:else if activeTab === 'activities'}
      <div class="p-5">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Activités à faire</h3>
        
        <div class="space-y-4">
          {#each point.activities || [] as activity, i}
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-start">
                <div class="bg-[#0082C3] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p class="text-gray-700">{activity}</p>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if activeTab === 'products'}
      <div class="p-5">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Équipement recommandé</h3>
        
        <div class="space-y-4">
          {#each point.recommended_products || [] as product}
            <a 
              href={product.url} 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex items-center bg-white border rounded-lg p-4 hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Voir le produit {product.name}"
            >
              <div class="relative w-20 h-20 bg-white rounded-md overflow-hidden flex-shrink-0 border">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  class="w-full h-full object-contain"
                  on:error={handleProductImageError}
                />
              </div>
              <div class="flex-1 ml-4">
                <div class="flex items-center mb-1">
                  {#if product.category}
                    <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{product.category}</span>
                  {/if}
                </div>
                <p class="font-medium text-gray-800">{product.name}</p>
                <div class="flex items-center justify-between mt-1">
                  <p class="text-[#0082C3] font-bold">{product.price.toFixed(2)} €</p>
                  <span class="text-xs bg-[#0082C3] text-white px-2 py-1 rounded-full">Voir</span>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div> 