<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { hasCompletedPreferences } from '$lib/services/preferences';
  import { fade, fly } from 'svelte/transition';
  import Loading from '$lib/components/ui/loading.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { browser } from '$app/environment';
  
  let loading = true;
  let showSplash = true;
  let splashStep = 0;
  let authChecked = false;
  
  // Contenu des écrans d'introduction
  const introScreens = [
    {
      title: "Bienvenue sur Moov",
      description: "Votre compagnon d'exploration urbaine",
      image: "/intro-1.jpg",
      icon: "explore"
    },
    {
      title: "Découvrez votre ville",
      description: "Des parcours personnalisés selon vos centres d'intérêt",
      image: "/intro-2.jpg",
      icon: "map"
    },
    {
      title: "Partagez vos aventures",
      description: "Enregistrez vos parcours favoris et partagez-les",
      image: "/intro-3.jpg",
      icon: "share"
    }
  ];
  
  // Réagir aux changements de l'état de l'utilisateur
  $: if ($currentUser) {
    showSplash = false;
    checkUserPreferences();
  }
  
  function nextSplashStep() {
    if (splashStep < introScreens.length - 1) {
      splashStep++;
    } else {
      showSplash = false;
      // Si l'utilisateur est connecté, vérifier ses préférences
      if ($currentUser) {
        checkUserPreferences();
      } else {
        // Sinon, rediriger vers la page de connexion
        goto('/login');
      }
    }
  }
  
  function skipIntro() {
    showSplash = false;
    // Si l'utilisateur est connecté, vérifier ses préférences
    if ($currentUser) {
      checkUserPreferences();
    } else {
      // Sinon, rediriger vers la page de connexion
      goto('/login');
    }
  }
  
  async function checkUserPreferences() {
    if (!$currentUser) return;
    
    loading = true;
    const hasPrefs = await hasCompletedPreferences($currentUser.id);
    
    if (!hasPrefs) {
      // Rediriger vers la page d'onboarding seulement si l'utilisateur n'a pas de préférences
      goto('/onboarding');
    } else {
      // Ne pas rediriger, juste arrêter le chargement
      loading = false;
    }
  }
  
  onMount(async () => {
    if ($currentUser) {
      showSplash = false;
      checkUserPreferences();
    } else {
      if (browser) {
        const hasSeenIntro = localStorage.getItem('hasSeenIntro');
        if (hasSeenIntro === 'true') {
          showSplash = false;
        } else {
          localStorage.setItem('hasSeenIntro', 'true');
        }
      }
    }
    authChecked = true;
    loading = false;

    if (browser) {
      const imagesToPreload = ['/logo.svg', '/logo-white.svg', '/placeholder.jpg'];
      imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    }
  });
</script>

<svelte:head>
  <title>Moov - Explorez votre ville en famille</title>
</svelte:head>

{#if !authChecked}
  <div class="fixed inset-0 bg-white flex items-center justify-center">
    <Loading size="lg" />
  </div>
{:else if showSplash && !$currentUser}
  <div 
    class="fixed inset-0 bg-[#0082C3] flex flex-col items-center justify-center z-50"
    transition:fade={{ duration: 300 }}
  >
    <!-- Logo et titre toujours visibles -->
    <div class="absolute top-8 text-center">
      <img src="/logo.svg" alt="Moov" class="w-16 h-16 mx-auto mb-2" />
      <h1 class="text-white text-xl font-bold">Moov</h1>
    </div>
    
    <!-- Contenu de l'écran actuel -->
    {#key splashStep}
      <div 
        class="max-w-md px-6 text-center"
        in:fly={{ y: 50, duration: 400 }}
        out:fly={{ y: -50, duration: 300 }}
      >
        <div class="bg-white/20 rounded-full p-4 inline-flex mb-6">
          <span class="material-icons text-white text-4xl">{introScreens[splashStep].icon}</span>
        </div>
        
        <h2 class="text-white text-3xl font-bold mb-3">{introScreens[splashStep].title}</h2>
        <p class="text-white/90 text-lg mb-8">{introScreens[splashStep].description}</p>
      </div>
    {/key}
    
    <!-- Indicateurs de progression -->
    <div class="flex space-x-2 mt-8">
      {#each introScreens as _, i}
        <div 
          class="w-2.5 h-2.5 rounded-full transition-all duration-300 {i === splashStep ? 'bg-white' : 'bg-white/40'}"
        ></div>
      {/each}
    </div>
    
    <!-- Boutons de navigation -->
    <div class="absolute bottom-12 w-full px-6 flex flex-col items-center">
      <button 
        class="bg-white text-[#0082C3] font-medium rounded-full py-3 px-8 w-full max-w-xs mb-4"
        on:click={nextSplashStep}
      >
        {splashStep < introScreens.length - 1 ? 'Suivant' : 'Commencer'}
      </button>
      
      {#if splashStep < introScreens.length - 1}
        <button 
          class="text-white/80 font-medium py-2"
          on:click={skipIntro}
        >
          Passer
        </button>
      {/if}
    </div>
  </div>
{:else if !$currentUser}
  <!-- Page d'accueil pour les utilisateurs non connectés -->
  <div class="min-h-screen flex flex-col">
    <!-- Hero section -->
    <div class="relative bg-[#0082C3] text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div class="md:w-2/3">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">
            Explorez votre ville en famille
          </h1>
          <p class="text-xl mb-8">
            Découvrez des parcours personnalisés avec des histoires et des activités pour toute la famille.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="secondary" 
              size="lg" 
              on:click={() => goto('/login')}
            >
              Commencer l'aventure
            </Button>
          </div>
        </div>
      </div>
      
      <!-- Image décorative -->
      <div class="absolute right-0 bottom-0 w-1/3 h-full hidden md:block">
        <!-- Ici, vous pourriez ajouter une image décorative -->
      </div>
    </div>
    
    <!-- Features section -->
    <div class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900">Comment ça marche</h2>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-[#0082C3] text-2xl">person</span>
            </div>
            <h3 class="text-xl font-medium mb-2">Créez votre profil</h3>
            <p class="text-gray-600">Personnalisez vos préférences pour des parcours adaptés à vos envies.</p>
          </div>
          
          <div class="text-center">
            <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-[#0082C3] text-2xl">map</span>
            </div>
            <h3 class="text-xl font-medium mb-2">Choisissez un parcours</h3>
            <p class="text-gray-600">Explorez des itinéraires adaptés à votre famille et vos centres d'intérêt.</p>
          </div>
          
          <div class="text-center">
            <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-[#0082C3] text-2xl">directions_walk</span>
            </div>
            <h3 class="text-xl font-medium mb-2">Partez à l'aventure</h3>
            <p class="text-gray-600">Suivez le parcours, découvrez des histoires et relevez des défis en famille.</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA section -->
    <div class="bg-gray-100 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-6">Prêt à explorer votre ville ?</h2>
        <Button 
          variant="primary" 
          size="lg" 
          on:click={() => goto('/login')}
        >
          Créer un compte
        </Button>
      </div>
    </div>
    
    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <img src="/logo-white.svg" alt="Moov" class="h-8" />
          </div>
          <div class="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Moov. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  </div>
{:else}
  <!-- Page d'accueil pour les utilisateurs connectés -->
  <div class="min-h-screen flex flex-col pt-16 pb-16">
    <!-- Hero section -->
    <div class="relative bg-[#0082C3] text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="md:w-2/3">
          <h1 class="text-4xl md:text-5xl font-bold mb-4">
            Bonjour {$currentUser.first_name || 'explorateur'} !
          </h1>
          <p class="text-xl mb-6">
            Prêt à explorer de nouveaux horizons aujourd'hui ?
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="secondary" 
              size="lg" 
              on:click={() => goto('/map')}
            >
              Voir la carte
            </Button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Parcours recommandés -->
    <div class="py-12 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Parcours recommandés</h2>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Carte de parcours 1 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-48 bg-gray-200 relative">
              <img 
                src="/placeholder.jpg" 
                alt="Parcours" 
                class="w-full h-full object-cover" 
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium mb-2">Découverte du Quartier Latin</h3>
              <p class="text-gray-600 text-sm mb-3">Un parcours culturel au cœur de Paris</p>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">2.5 km • 1h30</span>
                <Button variant="text" on:click={() => goto('/routes/1')}>Voir</Button>
              </div>
            </div>
          </div>
          
          <!-- Carte de parcours 2 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-48 bg-gray-200 relative">
              <img 
                src="/placeholder.jpg" 
                alt="Parcours" 
                class="w-full h-full object-cover" 
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium mb-2">Le Paris des Enfants</h3>
              <p class="text-gray-600 text-sm mb-3">Activités ludiques pour toute la famille</p>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">3 km • 2h</span>
                <Button variant="text" on:click={() => goto('/routes/2')}>Voir</Button>
              </div>
            </div>
          </div>
          
          <!-- Carte de parcours 3 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-48 bg-gray-200 relative">
              <img 
                src="/placeholder.jpg" 
                alt="Parcours" 
                class="w-full h-full object-cover" 
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium mb-2">Balade au bord de Seine</h3>
              <p class="text-gray-600 text-sm mb-3">Découvrez Paris au fil de l'eau</p>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">4 km • 2h30</span>
                <Button variant="text" on:click={() => goto('/routes/3')}>Voir</Button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-8 text-center">
          <Button variant="outline" on:click={() => goto('/routes')}>
            Voir tous les parcours
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Points d'intérêt à proximité -->
    <div class="py-12 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">À découvrir près de chez vous</h2>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- POI 1 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-40 bg-gray-200 relative">
              <img 
                src="/placeholder.jpg" 
                alt="Point d'intérêt" 
                class="w-full h-full object-cover" 
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium mb-1">Tour Eiffel</h3>
              <p class="text-gray-600 text-sm mb-3">Le monument emblématique de Paris</p>
              <Button variant="text" size="sm" on:click={() => goto('/poi/48.8584,2.2945')}>
                Voir les détails
              </Button>
            </div>
          </div>
          
          <!-- POI 2 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-40 bg-gray-200 relative">
              <img 
                src="/placeholder.jpg" 
                alt="Point d'intérêt" 
                class="w-full h-full object-cover" 
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium mb-1">Musée du Louvre</h3>
              <p class="text-gray-600 text-sm mb-3">Le plus grand musée d'art du monde</p>
              <Button variant="text" size="sm" on:click={() => goto('/poi/48.8606,2.3376')}>
                Voir les détails
              </Button>
            </div>
          </div>
          
          <!-- POI 3 -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-40 bg-gray-200 relative">
              <img 
                src="/placeholder.jpg" 
                alt="Point d'intérêt" 
                class="w-full h-full object-cover" 
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium mb-1">Jardin du Luxembourg</h3>
              <p class="text-gray-600 text-sm mb-3">Un havre de paix au cœur de Paris</p>
              <Button variant="text" size="sm" on:click={() => goto('/poi/48.8462,2.3371')}>
                Voir les détails
              </Button>
            </div>
          </div>
        </div>
        
        <div class="mt-8 text-center">
          <Button variant="primary" on:click={() => goto('/map')}>
            Explorer la carte
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <img src="/logo-white.svg" alt="Moov" class="h-8" />
          </div>
          <div class="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Moov. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  </div>
{/if}
