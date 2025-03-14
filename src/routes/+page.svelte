<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { hasCompletedPreferences } from '$lib/services/preferences';
  import { getUserSteps, type UserSteps } from '$lib/services/steps';
  import { getPersonalizedRecommendations, getNearbyPOIs } from '$lib/services/recommendations';
  import type { Route } from '$lib/types';
  import { fade, fly, scale } from 'svelte/transition';
  import Loading from '$lib/components/ui/loading.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { browser } from '$app/environment';
  
  let loading = true;
  let showSplash = true;
  let showInitialSplash = true; // Premier écran de splash (M)
  let showSecondSplash = false; // Deuxième écran de splash (MOOV)
  let splashStep = 0;
  let authChecked = false;
  let userSteps: UserSteps | null = null;
  let stepsGoal = 10000; // Objectif quotidien par défaut
  let stepsPercentage = 0;
  let recommendations: Route[] = [];
  let nearbyPOIs: Route[] = [];
  let userLocation = { latitude: 48.8566, longitude: 2.3522 }; // Paris par défaut
  
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
    showInitialSplash = false;
    showSecondSplash = false;
    showSplash = false;
    checkUserPreferences();
  }
  
  // Calculer le pourcentage de l'objectif atteint
  $: if (userSteps) {
    stepsPercentage = Math.min(100, Math.round((userSteps.total_steps / stepsGoal) * 100));
  }
  
  // Calculer le dashoffset pour l'anneau de progression
  $: dashOffset = 251.2 - (251.2 * stepsPercentage / 100);
  
  // Fonction pour gérer la séquence des écrans de splash
  function handleSplashSequence() {
    console.log('Démarrage de la séquence de splash');
    
    // Garantir que le premier écran est affiché
    showInitialSplash = true;
    showSecondSplash = false;
    
    // Afficher le premier écran pendant 3 secondes
    setTimeout(() => {
      console.log('Transition vers le deuxième écran');
      // Transition vers le deuxième écran
      showInitialSplash = false;
      showSecondSplash = true;
      
      // Afficher le deuxième écran pendant 3 secondes
      setTimeout(() => {
        console.log('Fin de la séquence de splash, redirection vers onboarding');
        showSecondSplash = false;
        // Forcer la redirection vers onboarding
        window.location.href = '/onboarding';
      }, 3000);
    }, 3000);
  }
  
  async function loadUserSteps() {
    if ($currentUser) {
      userSteps = await getUserSteps();
      if (!userSteps) {
        userSteps = { total_steps: 0, last_updated: new Date().toISOString() };
      }
    }
  }
  
  async function loadRecommendations() {
    if ($currentUser) {
      recommendations = await getPersonalizedRecommendations(
        $currentUser.id,
        userLocation.latitude,
        userLocation.longitude
      );
    } else {
      recommendations = [];
    }
  }
  
  async function loadNearbyPOIs() {
    try {
      // Obtenir la position de l'utilisateur avant de charger les POIs
      await getUserLocation();
      nearbyPOIs = await getNearbyPOIs(userLocation.latitude, userLocation.longitude, 10, 6);
      console.log('POIs à proximité chargés:', nearbyPOIs);
    } catch (error) {
      console.error('Erreur lors du chargement des POIs à proximité:', error);
      nearbyPOIs = [];
    }
  }
  
  async function getUserLocation() {
    if (browser && navigator.geolocation) {
      return new Promise<{ latitude: number, longitude: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            userLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            resolve(userLocation);
          },
          (error) => {
            console.error('Erreur de géolocalisation:', error);
            resolve(userLocation); // Utiliser la position par défaut en cas d'erreur
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      });
    }
    return userLocation;
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
        // Sinon, rediriger vers la page d'onboarding
        window.location.href = '/onboarding';
      }
    }
  }
  
  function skipIntro() {
    showSplash = false;
    // Si l'utilisateur est connecté, vérifier ses préférences
    if ($currentUser) {
      checkUserPreferences();
    } else {
      // Sinon, rediriger vers la page d'onboarding
      window.location.href = '/onboarding';
    }
  }
  
  async function checkUserPreferences() {
    if (!$currentUser) return;
    
    loading = true;
    const hasPrefs = await hasCompletedPreferences($currentUser.id);
    
    if (!hasPrefs) {
      // Rediriger vers la page d'onboarding seulement si l'utilisateur n'a pas de préférences
      window.location.href = '/onboarding';
    } else {
      // Ne pas rediriger, juste arrêter le chargement
      await loadUserSteps();
      loading = false;
    }
  }
  
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins}min`;
  }
  
  function getDifficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'facile': return 'text-green-600';
      case 'moyen': return 'text-orange-500';
      case 'difficile': return 'text-red-600';
      default: return 'text-green-600';
    }
  }
  
  onMount(async () => {
    console.log('onMount: Initialisation');
    
    // Vérifier si l'utilisateur est connecté
    if ($currentUser) {
      console.log('onMount: Utilisateur connecté, pas de splash');
      showInitialSplash = false;
      showSecondSplash = false;
      showSplash = false;
      checkUserPreferences();
      return; // Sortir de la fonction pour éviter d'exécuter le reste du code
    }
    
    // Afficher la séquence d'écrans de splash pour les utilisateurs non connectés
    if (browser) {
      const hasSeenSplash = localStorage.getItem('hasSeenInitialSplash');
      
      if (hasSeenSplash === 'true') {
        console.log('onMount: Splash déjà vu, redirection vers onboarding');
        showInitialSplash = false;
        showSecondSplash = false;
        // Forcer la redirection vers onboarding
        window.location.href = '/onboarding';
      } else {
        console.log('onMount: Premier accès, affichage du splash');
        localStorage.setItem('hasSeenInitialSplash', 'true');
        // Démarrer la séquence de splash
        handleSplashSequence();
      }
    }
    
    authChecked = true;
    loading = false;

    if (browser) {
      const imagesToPreload = [
        '/logo.svg', 
        '/logo-white.svg', 
        '/placeholder.jpg', 
        '/logo/Logo Moov\'.png',
        '/logo/Logo Moov\'-full.png'
      ];
      imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    }
    
    // Charger les données uniquement si l'utilisateur est connecté
    if ($currentUser) {
      // Charger les données de pas
      await loadUserSteps();
      
      // Obtenir la position de l'utilisateur
      await getUserLocation();
      
      // Charger les recommandations et les POIs à proximité
      await Promise.all([
        loadRecommendations(),
        loadNearbyPOIs()
      ]);
    }
  });
</script>

<svelte:head>
  <title>Moov - Explorez votre ville en famille</title>
</svelte:head>

<!-- Page d'accueil principale -->
<div class="min-h-screen bg-white">
  {#if showInitialSplash}
    <!-- Premier écran de splash (M) - sans animation -->
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#3643BA]">
      <div class="flex flex-col items-center">
        <img src="/logo/Logo Moov'.png" alt="M" class="w-[259px] h-[56.88px] mb-4" />
        <p class="text-white text-xl font-medium">Pas à pas.</p>
      </div>
    </div>
  {:else if showSecondSplash}
    <!-- Deuxième écran de splash (MOOV) - avec animation simple -->
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#3643BA]">
      <div class="flex flex-col items-center">
        <div in:scale={{ duration: 800, start: 0, opacity: 0 }}>
          <img src="/logo/Logo Moov'-full.png" alt="MOOV" class="w-[259px] mb-4" />
        </div>
        <p class="text-white text-xl font-medium">Pas à pas.</p>
      </div>
    </div>
  {:else if loading}
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
                      stroke-dashoffset="{dashOffset}" 
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="45" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">{userSteps?.total_steps || 0}</text>
                    <text x="50" y="65" text-anchor="middle" font-size="12" fill="#333">pas</text>
                  </svg>
                </div>
                
                <!-- Texte -->
                <div>
                  <h3 class="text-gray-600 font-medium text-lg">Marche quotidienne</h3>
                  <p class="text-gray-700 font-medium">
                    Tu as accompli<br>
                    <span class="font-bold">{stepsPercentage}% de ton objectif</span><br>
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
        <!-- Section "Vos recommandations" -->
        <section class="mb-8 px-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Vos recommandations</h2>
            <a href="/recommendations" class="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          <div class="flex overflow-x-auto space-x-4 pb-2">
            {#each recommendations.slice(0, 4) as route}
              <div class="bg-white rounded-[5px] overflow-hidden shadow-sm flex-shrink-0 w-[200px]">
                <div class="relative h-[120px]">
                  <img src={route.image_url || "/placeholder.jpg"} alt={route.name} class="w-full h-full object-cover" />
                </div>
                <div class="p-2 h-[61.51px] flex flex-col justify-between">
                  <h3 class="font-medium text-sm truncate">{route.name}</h3>
                  <div class="flex justify-between text-xs">
                    <span>{formatDuration(route.duration_minutes || 0)}</span>
                    <span class={getDifficultyClass(route.difficulty)}>{route.difficulty}</span>
                  </div>
                </div>
              </div>
            {:else}
              {#each Array(2) as _, i}
                <div class="bg-white rounded-[5px] overflow-hidden shadow-sm flex-shrink-0 w-[200px]">
                  <div class="h-[120px] bg-gray-200"></div>
                  <div class="p-2 h-[61.51px]">
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div class="flex justify-between">
                      <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              {/each}
            {/each}
          </div>
        </section>
        
        <!-- Section des POIs à proximité -->
        <section class="mb-8 px-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold flex items-center">
              <span class="material-icons mr-2">near_me</span>
              À proximité de vous
            </h2>
            <a href="/map" class="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          <div class="flex overflow-x-auto space-x-4 pb-2">
            {#each nearbyPOIs as poi}
              <div class="bg-white rounded-[5px] overflow-hidden shadow-sm flex-shrink-0 w-[200px]">
                <div class="relative h-[120px]">
                  <img src={poi.image_url || "/placeholder.jpg"} alt={poi.name} class="w-full h-full object-cover" />
                </div>
                <div class="p-2 h-[61.51px] flex flex-col justify-between">
                  <h3 class="font-medium text-sm truncate">{poi.name}</h3>
                  <div class="flex justify-between text-xs">
                    <span>
                      {Math.round((poi.distance_km || 0) * 10) / 10} km • 
                      {typeof poi.duration_minutes === 'number' ? poi.duration_minutes : 0} min
                    </span>
                    <span class={getDifficultyClass(poi.difficulty)}>{poi.difficulty}</span>
                  </div>
                </div>
              </div>
            {:else}
              {#each Array(2) as _, i}
                <div class="bg-white rounded-[5px] overflow-hidden shadow-sm flex-shrink-0 w-[200px]">
                  <div class="h-[120px] bg-gray-200"></div>
                  <div class="p-2 h-[61.51px]">
                    <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div class="flex justify-between">
                      <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div class="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              {/each}
            {/each}
          </div>
        </section>
      </div>
    </div>
  {/if}
</div>
