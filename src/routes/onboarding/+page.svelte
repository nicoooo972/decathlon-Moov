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
  
  // Étape actuelle du processus d'onboarding
  let currentStep = 1;
  const totalSteps = 4;
  
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
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!$currentUser) {
      goto('/login');
    }
  });
  
  function nextStep() {
    if (currentStep < totalSteps) {
      currentStep++;
    }
  }
  
  function prevStep() {
    if (currentStep > 1) {
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
    if (!$currentUser) return;
    
    try {
      await withLoading(async () => {
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
        
        showNotification('Préférences enregistrées avec succès', 'success');
        goto('/routes');
      });
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
    }
  }
</script>

<svelte:head>
  <title>Personnalisation | Decathlon Urban Trek</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md mx-auto">
    <div class="text-center mb-8">
      <img class="mx-auto h-12 w-auto" src="/decathlon-logo.svg" alt="Decathlon" />
      <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
        Personnalisez votre expérience
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Étape {currentStep} sur {totalSteps}
      </p>
      
      <!-- Indicateur de progression -->
      <div class="mt-4 flex justify-between bg-gray-200 rounded-full h-2.5">
        {#each Array(totalSteps) as _, i}
          <div 
            class="h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            class:bg-[#0082C3]={i < currentStep}
            class:bg-gray-200={i >= currentStep}
            style="width: {100 / totalSteps}%"
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
        <!-- Étape 1: Rôle -->
        {#if currentStep === 1}
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-gray-900">Qui êtes-vous ?</h3>
            <p class="text-sm text-gray-500">
              Nous adapterons les parcours en fonction de votre profil.
            </p>
            
            <div class="space-y-4">
              <div 
                class="border rounded-lg p-4 cursor-pointer transition-colors duration-200 flex items-center"
                class:border-[#0082C3]={role === 'parent'}
                class:bg-blue-50={role === 'parent'}
                on:click={() => role = 'parent'}
              >
                <span class="material-icons text-2xl mr-3">family_restroom</span>
                <div>
                  <h4 class="font-medium">Parent</h4>
                  <p class="text-sm text-gray-500">Je cherche des activités pour ma famille</p>
                </div>
              </div>
              
              <div 
                class="border rounded-lg p-4 cursor-pointer transition-colors duration-200 flex items-center"
                class:border-[#0082C3]={role === 'enfant'}
                class:bg-blue-50={role === 'enfant'}
                on:click={() => role = 'enfant'}
              >
                <span class="material-icons text-2xl mr-3">person</span>
                <div>
                  <h4 class="font-medium">Individuel</h4>
                  <p class="text-sm text-gray-500">Je cherche des activités pour moi</p>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Étape 2: Préférences d'activités -->
        {#if currentStep === 2}
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-gray-900">Quelles activités vous intéressent ?</h3>
            <p class="text-sm text-gray-500">
              Sélectionnez au moins une préférence.
            </p>
            
            <div class="grid grid-cols-2 gap-4">
              {#each activityOptions as option}
                <div 
                  class="border rounded-lg p-4 cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center text-center"
                  class:border-[#0082C3]={activityPreferences.includes(option.value)}
                  class:bg-blue-50={activityPreferences.includes(option.value)}
                  on:click={() => toggleActivityPreference(option.value)}
                >
                  <span class="material-icons text-3xl mb-2">{option.icon}</span>
                  <h4 class="font-medium">{option.label}</h4>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Étape 3: Tranches d'âge -->
        {#if currentStep === 3}
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-gray-900">Tranches d'âge</h3>
            <p class="text-sm text-gray-500">
              Pour qui cherchez-vous des parcours ?
            </p>
            
            <div class="space-y-3">
              {#each ageGroupOptions as option}
                <div 
                  class="border rounded-lg p-3 cursor-pointer transition-colors duration-200 flex items-center"
                  class:border-[#0082C3]={ageGroups.includes(option.value)}
                  class:bg-blue-50={ageGroups.includes(option.value)}
                  on:click={() => toggleAgeGroup(option.value)}
                >
                  <input 
                    type="checkbox" 
                    checked={ageGroups.includes(option.value)} 
                    class="mr-3 h-5 w-5 text-[#0082C3] focus:ring-[#0082C3]"
                    on:change={() => toggleAgeGroup(option.value)}
                  />
                  <span>{option.label}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Étape 4: Distance et accessibilité -->
        {#if currentStep === 4}
          <div class="space-y-6">
            <h3 class="text-lg font-medium text-gray-900">Distance et accessibilité</h3>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Distance maximale (en km): {maxDistanceKm}
              </label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="1" 
                bind:value={maxDistanceKm}
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
                  J'ai besoin de parcours accessibles (mobilité réduite)
                </label>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Boutons de navigation -->
        <div class="mt-8 flex justify-between">
          {#if currentStep > 1}
            <Button variant="outline" on:click={prevStep}>
              Précédent
            </Button>
          {:else}
            <div></div>
          {/if}
          
          {#if currentStep < totalSteps}
            <Button on:click={nextStep}>
              Suivant
            </Button>
          {:else}
            <Button on:click={savePreferences} loading={$isLoading}>
              Terminer
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div> 