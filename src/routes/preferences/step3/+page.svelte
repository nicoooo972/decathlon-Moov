<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { hasUserPreferences } from '$lib/services/auth';
  import Button from '$lib/components/ui/button.svelte';
  import { fade, slide } from 'svelte/transition';
  import { quartOut } from 'svelte/easing';
  import type { AgeGroup } from '$lib/types';
  
  // État pour suivre l'étape actuelle
  let currentStep = 3;
  const totalSteps = 5;
  
  // Récupérer les préférences précédentes
  let userType: 'famille' | 'solo' | null = null;
  
  // Tranches d'âge sélectionnées
  let selectedAgeGroups: AgeGroup[] = [];
  
  // Options pour les tranches d'âge
  const ageGroupOptions: { value: AgeGroup; label: string; icon: string }[] = [
    { value: 'tout-petit', label: '0-3 ans (tout-petit)', icon: 'child_care' },
    { value: 'enfant', label: '4-11 ans (enfant)', icon: 'face' },
    { value: 'adolescent', label: '12-17 ans (adolescent)', icon: 'person' },
    { value: 'adulte', label: '18+ ans (adulte)', icon: 'person' }
  ];
  
  // Centres d'intérêts
  const interests = [
    { id: 'nature', label: 'Nature', icon: '/icons_poi/feuille.svg' },
    { id: 'musee', label: 'Musée', icon: '/icons_poi/musee.svg' },
    { id: 'marches', label: 'Marchés', icon: '/icons_poi/marches.svg' },
    { id: 'cinema', label: 'Cinéma', icon: '/icons_poi/Popcorn.svg' },
    { id: 'resto', label: 'Resto', icon: '/icons_poi/Pizza.svg' },
    { id: 'panorama', label: 'Panorama', icon: '/icons_poi/panorama.svg' },
    { id: 'jeux', label: 'Jeux', icon: '/icons_poi/Games.svg' },
    { id: 'theatres', label: 'Théâtres', icon: '/icons_poi/Mask.svg' },
    { id: 'bibliotheque', label: 'Bibliothèque', icon: '/icons_poi/Book.svg' }
  ];
  
  let selectedInterests: string[] = [];
  
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
    
    // Récupérer les préférences temporaires
    userType = localStorage.getItem('pref_userType') as 'famille' | 'solo' | null;
    if (!userType) {
      // Si aucune préférence n'est trouvée, retourner à la première étape
      goto('/preferences');
    }
    
    // Récupérer les tranches d'âge déjà sélectionnées si elles existent
    const storedAgeGroups = localStorage.getItem('pref_ageGroups');
    if (storedAgeGroups) {
      try {
        selectedAgeGroups = JSON.parse(storedAgeGroups);
      } catch (e) {
        console.error('Erreur lors de la récupération des tranches d\'âge:', e);
      }
    } else {
      // Valeurs par défaut selon le type d'utilisateur
      if (userType === 'famille') {
        selectedAgeGroups = ['enfant', 'adulte'];
      } else {
        selectedAgeGroups = ['adulte'];
      }
    }
  });
  
  function toggleAgeGroup(ageGroup: AgeGroup) {
    if (selectedAgeGroups.includes(ageGroup)) {
      selectedAgeGroups = selectedAgeGroups.filter(a => a !== ageGroup);
    } else {
      selectedAgeGroups = [...selectedAgeGroups, ageGroup];
    }
  }
  
  function isSelected(ageGroup: AgeGroup): boolean {
    return selectedAgeGroups.includes(ageGroup);
  }
  
  function toggleInterest(id: string) {
    if (selectedInterests.includes(id)) {
      selectedInterests = selectedInterests.filter(i => i !== id);
    } else {
      selectedInterests = [...selectedInterests, id];
    }
  }
  
  function handleSubmit() {
    // Stocker les tranches d'âge sélectionnées
    localStorage.setItem('pref_ageGroups', JSON.stringify(selectedAgeGroups));
    
    // Stocker les centres d'intérêt sélectionnés
    localStorage.setItem('pref_interests', JSON.stringify(selectedInterests));
    
    // Passer à l'étape suivante
    goto('/preferences/step4');
  }
  
  function prevStep() {
    // Retourner à l'étape précédente
    goto('/preferences/step2');
  }
</script>

<svelte:head>
  <title>Centres d'intérêts | Moov</title>
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
  <div class="w-[327px] mt-12 mb-4" in:fade={{ duration: 400 }}>
    <p class="text-white text-center font-semibold text-base leading-6">Étape {currentStep} sur {totalSteps}</p>
    <div class="w-full bg-white/10 h-2 rounded-full mt-2">
      <div class="bg-[#E0B0FF] h-2 rounded-full" style="width: {(currentStep / totalSteps) * 100}%"></div>
    </div>
  </div>

  <!-- Titre et grille -->
  <div class="w-[327px] flex-grow" in:fade={{ duration: 400, delay: 100 }}>
    <div class="mb-6">
      <p class="text-white font-semibold text-base leading-6">Personnalisez votre expérience</p>
      <h1 class="text-white font-bold text-2xl leading-8 mt-2">Quels sont vos centres d'intérêts ?</h1>
      <p class="text-white/80 text-sm mt-2">Sélectionnez ceux auxquels vous vous identifiez le plus !</p>
    </div>

    <!-- Grille de centres d'intérêts -->
    <div class="grid grid-cols-3 gap-3">
      {#each interests as interest}
        <button
          class="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all text-[#3643BA] {selectedInterests.includes(interest.id) ? 'bg-[#D0EEF9]' : 'bg-white'}"
          on:click={() => toggleInterest(interest.id)}
        >
          <img src={interest.icon} alt={interest.label} class="w-6 h-6" />
          <span class="text-sm font-medium">{interest.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Boutons de navigation -->
  <div class="w-[327px] py-6 flex justify-between items-center" in:fade={{ duration: 400, delay: 200 }}>
    <button
      class="w-[56px] h-[56px] rounded-lg bg-white/10 flex items-center justify-center"
      on:click={() => window.history.back()}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 19L8 12L15 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <button
      class="w-[255px] h-[56px] bg-white text-[#2A37A3] rounded-lg font-semibold flex items-center justify-center transition-colors {selectedInterests.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
      on:click={handleSubmit}
      disabled={selectedInterests.length === 0}
    >
      <span>Suivant</span>
      <svg class="ml-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</div> 