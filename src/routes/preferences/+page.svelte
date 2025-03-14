<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { hasUserPreferences } from '$lib/services/auth';
  import Button from '$lib/components/ui/button.svelte';
  import { fade, slide } from 'svelte/transition';
  import { quartOut } from 'svelte/easing';
  
  // État pour suivre l'étape actuelle
  let currentStep = 1;
  const totalSteps = 5;
  
  // Préférences utilisateur
  let userType: 'famille' | 'solo' | null = null;
  
  onMount(async () => {
    // Vérifier si l'utilisateur est connecté et a déjà des préférences
    if ($currentUser) {
      const hasPrefs = await hasUserPreferences($currentUser.id);
      if (hasPrefs) {
        // Rediriger vers l'accueil si l'utilisateur a déjà des préférences
        goto('/');
      }
    } else {
      // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
      goto('/login');
    }
  });
  
  function selectUserType(type: 'famille' | 'solo') {
    userType = type;
    // Stocker temporairement la sélection
    localStorage.setItem('pref_userType', type);
    // Rediriger vers la page appropriée
    if (type === 'solo') {
      goto('/preferences/solo');
    } else {
      goto('/preferences/step2');
    }
  }
</script>

<svelte:head>
  <title>Personnalisez votre expérience | Moov</title>
  <style>
    /* Cacher la navbar sur cette page */
    nav {
      display: none !important;
    }
  </style>
</svelte:head>

<div class="min-h-screen bg-[#3643BA] flex flex-col items-center" 
  in:slide={{ duration: 400, easing: quartOut }} 
  out:slide={{ duration: 400, easing: quartOut }}>
  <!-- En-tête avec étape et barre de progression -->
  <div class="w-full max-w-md mt-12 mb-4 px-4" in:fade={{ duration: 400 }}>
    <p class="text-white text-center font-semibold text-base leading-6">Étape {currentStep} sur {totalSteps}</p>
    <div class="w-full bg-[#5A67D8]/30 h-2 rounded-full mt-2">
      <div class="bg-[#5A67D8] h-2 rounded-full" style="width: {(currentStep / totalSteps) * 100}%"></div>
    </div>
  </div>
  
  <!-- Titre de l'étape -->
  <div class="w-full max-w-md text-center px-4" in:fade={{ duration: 400, delay: 100 }}>
    <p class="text-white font-semibold text-base leading-6">Personnalisez votre expérience</p>
    <h1 class="text-white font-bold text-2xl leading-8 mt-2">Pour qui souhaitez-vous découvrir nos balades ?</h1>
  </div>

  <div class="w-full flex flex-col items-center flex-grow justify-end relative">
    <!-- Boutons de choix - Côte à côte -->
    <div class="absolute bottom-[calc(20%-90px)] z-10 w-full px-4" in:fade={{ duration: 400, delay: 200 }}>
      <div class="max-w-[319px] mx-auto flex gap-2">
        <button 
          class="w-[155.5px] h-[56px] bg-[#2A37A3] text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
          on:click={() => selectUserType('famille')}
        >
          <img src="/iconesPerso/all-icons.png" alt="Icône famille" class="w-6 h-6" />
          <span>En famille</span>
        </button>
        
        <button 
          class="w-[155.5px] h-[56px] bg-white text-[#2A37A3] rounded-lg flex items-center justify-center gap-2 font-semibold relative"
          on:click={() => selectUserType('solo')}
        >
          <img src="/iconesPerso/User.png" alt="Icône utilisateur" class="w-6 h-6" />
          <span>En solo</span>
        </button>
      </div>
    </div>

    <!-- Mascotte - Agrandie et collée au bas -->
    <div class="w-screen" in:fade={{ duration: 400, delay: 300 }}>
      <img src="/mascottes/mascotteBleuClair.png" alt="Mascotte" class="w-full h-auto" />
    </div>
  </div>
</div> 