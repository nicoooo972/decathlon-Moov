<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { hasUserPreferences } from '$lib/services/auth';
  import { saveUserPreferences } from '$lib/services/preferences';
  import { showNotification } from '$lib/utils/notifications';
  import { withLoading } from '$lib/utils/loading';
  import Button from '$lib/components/ui/button.svelte';
  import { fade, slide } from 'svelte/transition';
  import { quartOut } from 'svelte/easing';
  import type { UserRole, ActivityPreference, AgeGroup } from '$lib/types';
  
  // État pour suivre l'étape actuelle
  let currentStep = 5;
  const totalSteps = 5;
  
  // Récupérer les préférences précédentes
  let userType: 'famille' | 'solo' = 'solo';
  let maxDistance = 5;
  let accessibilityNeeds = false;
  
  // Valeurs par défaut pour les préférences
  let activityPreferences: ActivityPreference[] = ['nature', 'culture'];
  let ageGroups: AgeGroup[] = ['adulte'];
  
  const durations = [
    { value: '10min', label: '10min' },
    { value: '30min', label: '30min' },
    { value: '1h', label: '1h' }
  ];
  
  let selectedDuration = '';
  $: console.log('Duration selected:', selectedDuration);
  
  // Récupérer les préférences du localStorage
  let activityPreferencesFromStorage: string[] = [];
  let ageGroupsFromStorage: string[] = [];
  let maxDistanceFromStorage = 5;
  let accessibilityNeedsFromStorage = false;
  let durationMinutes = 30;
  
  // Vérifier les activités dans la console pour le débogage
  console.log('Activités récupérées:', activityPreferencesFromStorage);
  
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
    const storedUserType = localStorage.getItem('pref_userType');
    if (storedUserType === 'famille' || storedUserType === 'solo') {
      userType = storedUserType;
    } else {
      goto('/preferences');
      return;
    }
    
    // Récupérer les activités
    const storedActivities = localStorage.getItem('pref_interests');
    if (storedActivities) {
      try {
        activityPreferencesFromStorage = JSON.parse(storedActivities);
        console.log('Activities loaded:', activityPreferencesFromStorage);
      } catch (e) {
        console.error('Error parsing activities:', e);
      }
    }
    
    // Récupérer les tranches d'âge
    const storedAgeGroups = localStorage.getItem('pref_ageGroups');
    if (storedAgeGroups) {
      try {
        ageGroups = JSON.parse(storedAgeGroups);
      } catch (e) {
        console.error('Erreur lors de la récupération des tranches d\'âge:', e);
      }
    }
  });
  
  async function savePreferences() {
    try {
      await withLoading(async () => {
        if ($currentUser) {
          // Enregistrer les préférences
          await saveUserPreferences(
            $currentUser.id,
            userType,
            activityPreferences,
            ageGroups,
            maxDistance,
            accessibilityNeeds
          );
          
          // Nettoyer le localStorage
          localStorage.removeItem('pref_userType');
          localStorage.removeItem('pref_maxDistance');
          localStorage.removeItem('pref_activities');
          localStorage.removeItem('pref_ageGroups');
          
          showNotification('Préférences enregistrées avec succès !', 'success');
          goto('/');
        } else {
          showNotification('Vous devez être connecté pour enregistrer vos préférences', 'error');
          goto('/login');
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des préférences:', error);
      showNotification('Une erreur est survenue lors de l\'enregistrement des préférences', 'error');
    }
  }
  
  function prevStep() {
    // Retourner à l'étape précédente
    goto('/preferences/step4');
  }

  async function handleSubmit() {
    if (!$currentUser) {
      goto('/login');
      return;
    }

    if (activityPreferencesFromStorage.length === 0) {
      alert('Veuillez sélectionner au moins une activité dans les étapes précédentes.');
      goto('/preferences/step3');
      return;
    }

    // Convertir la durée en minutes
    const durationInMinutes = selectedDuration === '1h' ? 60 : parseInt(selectedDuration);

    try {
      await saveUserPreferences(
        $currentUser.id,
        userType === 'famille' ? 'family' : 'solo',
        activityPreferencesFromStorage,
        ageGroupsFromStorage,
        maxDistanceFromStorage,
        accessibilityNeedsFromStorage,
        durationInMinutes
      );

      // Nettoyer le localStorage après la sauvegarde
      localStorage.removeItem('pref_userType');
      localStorage.removeItem('pref_interests');
      localStorage.removeItem('pref_ageGroups');
      localStorage.removeItem('pref_maxDistance');
      localStorage.removeItem('pref_accessibilityNeeds');

      goto('/');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Une erreur est survenue lors de la sauvegarde des préférences.');
    }
  }
</script>

<svelte:head>
  <title>Durée des balades | Moov</title>
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

  <!-- Titre et contenu -->
  <div class="w-[327px] flex-grow" in:fade={{ duration: 400, delay: 100 }}>
    <div class="mb-6">
      <p class="text-white font-semibold text-base leading-6">Personnalisez votre expérience</p>
      <h1 class="text-white font-bold text-2xl leading-8 mt-2">Combien de temps souhaitez-vous consacrer à vos balades ?</h1>
    </div>

    <!-- Options de durée -->
    <div class="space-y-3">
      {#each durations as duration}
        <button
          type="button"
          class="w-full h-[56px] rounded-lg flex items-center px-4 gap-3 transition-colors {selectedDuration === duration.value ? 'bg-[#D0EEF9]' : 'bg-white hover:bg-[#D0EEF9]/50'}"
          on:click={() => selectedDuration = duration.value}
        >
          <div class="w-6 h-6 flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3643BA" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 6v6l4 2" stroke-linecap="round" />
            </svg>
          </div>
          <span class="font-semibold text-[#3643BA]">{duration.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Boutons de navigation -->
  <div class="w-[327px] py-4 flex gap-3" in:fade={{ duration: 400, delay: 200 }}>
    <button
      class="w-[56px] h-[56px] bg-white/10 text-white rounded-lg font-semibold flex items-center justify-center"
      on:click={() => window.history.back()}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 19L8 12L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <button
      class="flex-1 h-[56px] bg-white text-[#3643BA] rounded-lg font-semibold flex items-center justify-center"
      on:click={handleSubmit}
      disabled={!selectedDuration}
    >
      <span>Terminer</span>
    </button>
  </div>
</div> 