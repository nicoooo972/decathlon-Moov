<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser, refreshUserData } from '$lib/services/auth';
  import { saveUserPreferences } from '$lib/services/preferences';
  import { withLoading, showNotification } from '$lib/stores/app-store';
  import Button from '$lib/components/ui/button.svelte';
  import Loading from '$lib/components/ui/loading.svelte';
  import { isLoading } from '$lib/stores/app-store';
  import type { UserRole, ActivityPreference, AgeGroup } from '$lib/types';
  import { supabase } from '$lib/supabase';
  import { fade } from 'svelte/transition';
  
  // Étape actuelle du processus d'onboarding
  let currentStep = 0; // Commencer à 0 pour l'introduction
  const totalSteps = 7; // 3 écrans d'introduction + 4 étapes de préférences
  
  // Données du formulaire
  let role: UserRole = 'parent';
  let activityPreferences: ActivityPreference[] = [];
  let ageGroups: AgeGroup[] = [];
  let maxDistanceKm = 5;
  let accessibilityNeeds = false;
  
  // Options pour les activités
  const activityOptions: { value: ActivityPreference; label: string; icon: string }[] = [
    { value: 'nature', label: 'Nature', icon: 'park' },
    { value: 'histoire', label: 'Histoire', icon: 'history_edu' },
    { value: 'culture', label: 'Culture', icon: 'museum' },
    { value: 'sport', label: 'Sport', icon: 'sports' },
    { value: 'aventure', label: 'Aventure', icon: 'explore' }
  ];
  
  // Options pour les tranches d'âge
  const ageGroupOptions: { value: AgeGroup; label: string }[] = [
    { value: 'tout-petit', label: '0-3 ans' },
    { value: 'enfant', label: '4-11 ans' },
    { value: 'adolescent', label: '12-17 ans' },
    { value: 'adulte', label: '18+ ans' }
  ];
  
  onMount(() => {
    // Ne pas rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    // Les utilisateurs non connectés doivent pouvoir accéder à l'onboarding
  });
  
  function nextStep() {
    if (currentStep < totalSteps - 1) {
      currentStep++;
    }
  }
  
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
    }
  }
  
  function toggleActivityPreference(pref: ActivityPreference) {
    if (activityPreferences.includes(pref)) {
      activityPreferences = activityPreferences.filter(p => p !== pref);
    } else {
      activityPreferences = [...activityPreferences, pref];
    }
  }
  
  function toggleAgeGroup(group: AgeGroup) {
    if (ageGroups.includes(group)) {
      ageGroups = ageGroups.filter(g => g !== group);
    } else {
      ageGroups = [...ageGroups, group];
    }
  }
  
  async function savePreferences() {
    try {
      await withLoading(async () => {
        if ($currentUser) {
          // Vérifier si l'utilisateur a un profil complet
          if (!$currentUser.first_name) {
            // Rafraîchir les données utilisateur pour s'assurer que nous avons les dernières informations
            await refreshUserData();
          }
          
          // Enregistrer les préférences
          await saveUserPreferences(
            $currentUser.id,
            role,
            activityPreferences,
            ageGroups,
            maxDistanceKm,
            accessibilityNeeds
          );
          
          showNotification('Préférences enregistrées avec succès !', 'success');
          goto('/');
        } else {
          // Si l'utilisateur n'est pas connecté, le rediriger vers la page d'inscription
          // avec les préférences stockées temporairement dans localStorage
          localStorage.setItem('tempPreferences', JSON.stringify({
            role,
            activity_preferences: activityPreferences,
            age_groups: ageGroups,
            max_distance_km: maxDistanceKm,
            accessibility_needs: accessibilityNeeds
          }));
          
          showNotification('Veuillez créer un compte pour continuer', 'info');
          goto('/register');
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
    }
  }
</script>

<svelte:head>
  <title>Bienvenue | Moov</title>
</svelte:head>

{#if currentStep === 0}
  <!-- Première page d'onboarding avec fond bleu, logo, texte et nuages -->
  <div class="min-h-screen bg-[#3643BA] flex flex-col">
    <!-- Logo et texte en haut -->
    <div class="px-6 pt-24">
      <div class="px-[24px]">
        <img src="/logo/Logo Moov'-full.png" alt="Moov" class="w-[159px] h-[35.12px] ml-2" />
        <div class="mt-2 w-[265px] h-[72px] bg-[#3643BA] rounded p-3">
          <p class="text-[#FCFCFB] text-[20px] leading-[120%] font-bold" style="font-family: 'Inter', sans-serif; letter-spacing: 0%;">
            Marchez, explorez et profitez du mouvement en toute simplicité
          </p>
        </div>
      </div>
    </div>
    
    <!-- Nuages en bas -->
    <div class="mt-auto relative">
      <img src="/images/Nuages.svg" alt="Nuages" class="w-full" />
    </div>
    
    <!-- Bouton Suivant -->
    <div class="absolute bottom-8 left-0 right-0 px-6">
      <button 
        class="w-[327px] h-[56px] bg-[#3643BA] rounded-[8px] text-white font-medium flex items-center justify-center gap-2 p-4"
        style="margin: 0 auto;"
        on:click={nextStep}
      >
        <span>Suivant</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
{:else if currentStep === 1}
  <!-- Deuxième page d'onboarding avec fond personnalisé et texte au milieu -->
  <div class="min-h-screen flex flex-col relative">
    <!-- Image de fond -->
    <img src="/images/fond.png" alt="Fond" class="absolute inset-0 w-full h-full object-cover" />
    
    <!-- Texte directement sur le fond bleu -->
    <div class="flex-1 flex flex-col justify-center z-10 px-6">
      <div class="mt-auto mb-auto">
        <p class="text-[#FCFCFB] text-[24px] leading-[120%] font-bold text-left pl-4" style="font-family: 'Inter', sans-serif; letter-spacing: 0%; max-width: 300px;">
          Partez à la découverte de lieux et d'événements autour de vous !
        </p>
      </div>
    </div>
    
    <!-- Bouton Suivant -->
    <div class="absolute bottom-8 left-0 right-0 px-6 z-10">
      <button 
        class="w-[327px] h-[56px] bg-[#FFFFFF] rounded-[8px] text-[#3643BA] font-medium flex items-center justify-center gap-2 p-4"
        style="margin: 0 auto;"
        on:click={nextStep}
      >
        <span>Suivant</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
{:else if currentStep === 2}
  <!-- Troisième page d'onboarding avec nuage rose, mascottes et texte en haut -->
  <div class="min-h-screen bg-[#3643BA] flex flex-col relative">
    <!-- Texte en haut -->
    <div class="pt-36 px-6 z-10">
      <p class="text-[#FCFCFB] text-[24px] leading-[120%] font-bold" style="font-family: 'Inter', sans-serif; letter-spacing: 0%; max-width: 300px;">
        Capturez vos moment et gardez les en souvenir !
      </p>
    </div>
    
    <!-- Nuage rose en bas -->
    <div class="mt-auto relative">
      <img src="/images/nuage rose.png" alt="Nuage rose" class="w-full" />
    </div>
    
    <!-- Mascottes par-dessus le nuage -->
    <div class="absolute bottom-0 left-0 right-0 z-10">
      <img src="/images/mascottes.png" alt="Mascottes" class="w-full" />
    </div>
    
    <!-- Bouton C'est parti -->
    <div class="absolute bottom-8 left-0 right-0 px-6 z-20">
      <button 
        class="w-[327px] h-[56px] bg-[#E0FF96] rounded-[8px] text-[#3643BA] font-medium flex items-center justify-center gap-2 p-4"
        style="margin: 0 auto;"
        on:click={() => goto('/login')}
      >
        <span>C'est parti !</span>
      </button>
    </div>
  </div>
{:else if currentStep === 3}
  <!-- Étape 1: Rôle -->
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <div class="text-center mb-8">
        <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="Moov" />
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Personnalisez votre expérience
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Étape {currentStep - 2} sur {totalSteps - 3}
        </p>
        
        <!-- Indicateur de progression -->
        <div class="mt-4 flex justify-between bg-gray-200 rounded-full h-2.5">
          {#each Array(totalSteps - 2) as _, i}
            <div 
              class="h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              class:bg-[#0082C3]={i <= currentStep - 3}
              class:bg-gray-200={i > currentStep - 3}
              style="width: {100 / (totalSteps - 2)}%"
            ></div>
          {/each}
        </div>
      </div>
      
      <div class="bg-white shadow rounded-lg p-6">
        {#if $isLoading}
          <div class="flex justify-center items-center h-64">
            <Loading size="lg" />
          </div>
        {:else}
          <div class="space-y-6" in:fade={{ duration: 300 }}>
            <h3 class="text-lg font-medium text-gray-900">Qui êtes-vous ?</h3>
            <p class="text-sm text-gray-500">
              Nous adapterons les parcours en fonction de votre profil.
            </p>
            
            <div class="space-y-4">
              <button 
                type="button"
                class="w-full border rounded-lg p-4 cursor-pointer transition-colors duration-200 flex items-center"
                class:border-[#0082C3]={role === 'parent'}
                on:click={() => (role = 'parent')}
                on:keydown={e => e.key === 'Enter' && (role = 'parent')}
                role="radio"
                aria-checked={role === 'parent'}
              >
                <img src="/icons/parent.svg" alt="" class="w-8 h-8 mr-4" />
                <div>
                  <h3 class="font-medium">Parent</h3>
                  <p class="text-sm text-gray-500">Je cherche des activités pour ma famille</p>
                </div>
              </button>
              
              <button 
                type="button"
                class="w-full border rounded-lg p-4 cursor-pointer transition-colors duration-200 flex items-center"
                class:border-[#0082C3]={role === 'enfant'}
                on:click={() => (role = 'enfant')}
                on:keydown={e => e.key === 'Enter' && (role = 'enfant')}
                role="radio"
                aria-checked={role === 'enfant'}
              >
                <img src="/icons/child.svg" alt="" class="w-8 h-8 mr-4" />
                <div>
                  <h3 class="font-medium">Enfant</h3>
                  <p class="text-sm text-gray-500">Je veux explorer avec mes parents</p>
                </div>
              </button>
            </div>
          </div>
          
          <!-- Boutons de navigation -->
          <div class="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              on:click={prevStep}
            >
              Précédent
            </Button>
            
            <Button 
              variant="primary" 
              on:click={nextStep}
            >
              Suivant
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else if currentStep === 4}
  <!-- Étape 2: Préférences d'activités -->
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <div class="text-center mb-8">
        <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="Moov" />
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Personnalisez votre expérience
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Étape {currentStep - 2} sur {totalSteps - 3}
        </p>
        
        <!-- Indicateur de progression -->
        <div class="mt-4 flex justify-between bg-gray-200 rounded-full h-2.5">
          {#each Array(totalSteps - 2) as _, i}
            <div 
              class="h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              class:bg-[#0082C3]={i <= currentStep - 3}
              class:bg-gray-200={i > currentStep - 3}
              style="width: {100 / (totalSteps - 2)}%"
            ></div>
          {/each}
        </div>
      </div>
      
      <div class="bg-white shadow rounded-lg p-6">
        {#if $isLoading}
          <div class="flex justify-center items-center h-64">
            <Loading size="lg" />
          </div>
        {:else}
          <div class="space-y-6" in:fade={{ duration: 300 }}>
            <h3 class="text-lg font-medium text-gray-900">Quelles activités vous intéressent ?</h3>
            <p class="text-sm text-gray-500">
              Sélectionnez au moins une préférence.
            </p>
            
            <div class="grid grid-cols-2 gap-4">
              {#each activityOptions as option}
                <button 
                  type="button"
                  class="border rounded-lg p-4 cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center text-center"
                  class:border-[#0082C3]={activityPreferences.includes(option.value)}
                  on:click={() => toggleActivityPreference(option.value)}
                  on:keydown={e => e.key === 'Enter' && toggleActivityPreference(option.value)}
                  role="checkbox"
                  aria-checked={activityPreferences.includes(option.value)}
                >
                  <img src={option.icon} alt="" class="w-12 h-12 mb-2" />
                  <h3 class="font-medium">{option.label}</h3>
                </button>
              {/each}
            </div>
          </div>
          
          <!-- Boutons de navigation -->
          <div class="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              on:click={prevStep}
            >
              Précédent
            </Button>
            
            <Button 
              variant="primary" 
              on:click={nextStep}
              disabled={activityPreferences.length === 0}
            >
              Suivant
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else if currentStep === 5}
  <!-- Étape 3: Tranches d'âge -->
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <div class="text-center mb-8">
        <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="Moov" />
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Personnalisez votre expérience
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Étape {currentStep - 2} sur {totalSteps - 3}
        </p>
        
        <!-- Indicateur de progression -->
        <div class="mt-4 flex justify-between bg-gray-200 rounded-full h-2.5">
          {#each Array(totalSteps - 2) as _, i}
            <div 
              class="h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              class:bg-[#0082C3]={i <= currentStep - 3}
              class:bg-gray-200={i > currentStep - 3}
              style="width: {100 / (totalSteps - 2)}%"
            ></div>
          {/each}
        </div>
      </div>
      
      <div class="bg-white shadow rounded-lg p-6">
        {#if $isLoading}
          <div class="flex justify-center items-center h-64">
            <Loading size="lg" />
          </div>
        {:else}
          <div class="space-y-6" in:fade={{ duration: 300 }}>
            <h3 class="text-lg font-medium text-gray-900">Tranches d'âge</h3>
            <p class="text-sm text-gray-500">
              Pour qui cherchez-vous des parcours ?
            </p>
            
            <div class="space-y-3">
              {#each ageGroupOptions as option}
                <button 
                  type="button"
                  class="w-full border rounded-lg p-3 cursor-pointer transition-colors duration-200 flex items-center"
                  class:border-[#0082C3]={ageGroups.includes(option.value)}
                  on:click={() => toggleAgeGroup(option.value)}
                  on:keydown={e => e.key === 'Enter' && toggleAgeGroup(option.value)}
                  role="checkbox"
                  aria-checked={ageGroups.includes(option.value)}
                >
                  <div class="flex-1">
                    <h3 class="font-medium">{option.label}</h3>
                    <p class="text-sm text-gray-500">{option.description}</p>
                  </div>
                </button>
              {/each}
            </div>
          </div>
          
          <!-- Boutons de navigation -->
          <div class="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              on:click={prevStep}
            >
              Précédent
            </Button>
            
            <Button 
              variant="primary" 
              on:click={nextStep}
              disabled={ageGroups.length === 0}
            >
              Suivant
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else if currentStep === 6}
  <!-- Étape 4: Distance et accessibilité -->
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <div class="text-center mb-8">
        <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="Moov" />
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Personnalisez votre expérience
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Étape {currentStep - 2} sur {totalSteps - 3}
        </p>
        
        <!-- Indicateur de progression -->
        <div class="mt-4 flex justify-between bg-gray-200 rounded-full h-2.5">
          {#each Array(totalSteps - 2) as _, i}
            <div 
              class="h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              class:bg-[#0082C3]={i <= currentStep - 3}
              class:bg-gray-200={i > currentStep - 3}
              style="width: {100 / (totalSteps - 2)}%"
            ></div>
          {/each}
        </div>
      </div>
      
      <div class="bg-white shadow rounded-lg p-6">
        {#if $isLoading}
          <div class="flex justify-center items-center h-64">
            <Loading size="lg" />
          </div>
        {:else}
          <div class="space-y-6" in:fade={{ duration: 300 }}>
            <h3 class="text-lg font-medium text-gray-900">Distance et accessibilité</h3>
            
            <div>
              <label for="maxDistance" class="block text-sm font-medium text-gray-700 mb-1">
                Distance maximale (en km): {maxDistanceKm}
              </label>
              <input 
                type="range" 
                id="maxDistance"
                min="1" 
                max="20" 
                bind:value={maxDistanceKm}
                class="w-full"
              />
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>10 km</span>
                <span>20 km</span>
              </div>
            </div>
            
            <div class="mt-6">
              <div class="flex items-center">
                <input 
                  id="accessibility" 
                  type="checkbox" 
                  bind:checked={accessibilityNeeds}
                  class="h-5 w-5 text-[#0082C3] focus:ring-[#0082C3] rounded"
                />
                <label for="accessibility" class="ml-3 text-sm font-medium text-gray-700">
                  J'ai besoin de parcours accessibles (mobilité réduite, poussette, etc.)
                </label>
              </div>
            </div>
          </div>
          
          <!-- Boutons de navigation -->
          <div class="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              on:click={prevStep}
            >
              Précédent
            </Button>
            
            <Button 
              variant="primary" 
              on:click={savePreferences}
              loading={$isLoading}
              disabled={$isLoading}
            >
              Commencer
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if} 