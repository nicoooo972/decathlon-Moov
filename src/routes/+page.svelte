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

<!-- Page d'accueil principale -->
<div class="min-h-screen bg-white">
  {#if loading}
    <div class="flex items-center justify-center min-h-screen">
      <Loading />
    </div>
  {:else if showSplash}
    <!-- Écrans d'introduction -->
    <div class="min-h-screen flex flex-col bg-white">
      <!-- Contenu des écrans d'introduction -->
    </div>
  {:else}
    <!-- Page d'accueil -->
    <div class="min-h-screen flex flex-col">
      <!-- Hero section -->
      <div class="relative bg-white text-gray-800">
        <div class="mx-auto px-6 pt-8 pb-6">
          <!-- Titre -->
          <h1 class="text-3xl font-bold mb-10">
            Bonjour {$currentUser?.first_name || 'Nicolas'} !
          </h1>
          
          <!-- Espace supplémentaire entre le titre et le rectangle bleu -->
          <div class="h-16"></div>
          
          <!-- Carte de statistiques avec mascotte -->
          <div class="relative mb-8">
            <!-- Mascotte positionnée derrière le rectangle -->
            <div class="absolute -top-14 right-8 z-0">
              <img src="/icons/Mascotte Famille.png" alt="Mascotte" class="w-[76.05px] h-[117.53px] object-contain" />
            </div>
            
            <div class="bg-[#D0EEF9] rounded-3xl p-6 relative z-10">
              <div class="flex items-center">
                <!-- Cercle de progression -->
                <div class="relative w-24 h-24 mr-6 flex-shrink-0">
                  <svg class="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#ffffff" 
                      stroke-width="8"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      fill="none" 
                      stroke="#4F46E5" 
                      stroke-width="8"
                      stroke-dasharray="251.2" 
                      stroke-dashoffset="150.72" 
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="45" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">4 000</text>
                    <text x="50" y="65" text-anchor="middle" font-size="12" fill="#333">pas</text>
                  </svg>
                </div>
                
                <!-- Texte -->
                <div>
                  <h3 class="text-gray-600 font-medium text-lg">Marche quotidienne</h3>
                  <p class="text-gray-700 font-medium">
                    Tu as accompli<br>
                    <span class="font-bold">40% de ton objectif</span><br>
                    de marche quotidien !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Contenu principal -->
      <div class="flex-grow bg-white">
        <!-- Section Parcours recommandés -->
        <div class="px-6 py-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Parcours recommandés</h2>
          
          <!-- Carte de parcours -->
          <div class="bg-gray-100 rounded-lg overflow-hidden mb-4">
            <div class="h-48 bg-gray-200 relative">
              <img 
                src="/placeholder.jpg" 
                alt="Parcours" 
                class="w-full h-full object-cover" 
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-medium mb-1">Découverte du Quartier Latin</h3>
              <p class="text-gray-600 text-sm mb-3">Un parcours culturel au cœur de Paris</p>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">2.5 km • 1h30</span>
                <Button variant="text" on:click={() => goto('/routes/1')}>Voir</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
