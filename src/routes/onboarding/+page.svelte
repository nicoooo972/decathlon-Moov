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
  const totalSteps = 5; // Ajout d'une étape d'introduction
  
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
  
  // Contenu des slides d'introduction
  const introSlides = [
    {
      title: "Bienvenue sur Moov",
      description: "Découvrez une nouvelle façon d'explorer votre ville et ses trésors cachés.",
      icon: "explore",
      image: "/intro-slide-1.jpg"
    }
  ];
  
  onMount(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!$currentUser) {
      goto('/login');
    }
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
        goto('/map');
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

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md mx-auto">
    <div class="text-center mb-8">
      <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="Moov" />
      
      {#if currentStep === 0}
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Bienvenue sur Moov
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Découvrez comment fonctionne l'application
        </p>
      {:else}
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Personnalisez votre expérience
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Étape {currentStep} sur {totalSteps - 1}
        </p>
      {/if}
      
      <!-- Indicateur de progression -->
      <div class="mt-4 flex justify-between bg-gray-200 rounded-full h-2.5">
        {#each Array(totalSteps) as _, i}
          <div 
            class="h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            class:bg-[#0082C3]={i <= currentStep}
            class:bg-gray-200={i > currentStep}
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
        <!-- Étape 0: Introduction au concept -->
        {#if currentStep === 0}
          <div class="space-y-6" in:fade={{ duration: 300 }}>
            <div class="relative h-48 rounded-lg overflow-hidden mb-6">
              <img 
                src="/intro-concept.jpg" 
                alt="Moov concept" 
                class="w-full h-full object-cover"
                on:error={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target) target.src = 'https://via.placeholder.com/600x300?text=Moov';
                }}
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <div class="p-4 text-white">
                  <h3 class="text-xl font-bold">Explorez. Découvrez. Partagez.</h3>
                </div>
              </div>
            </div>
            
            <h3 class="text-lg font-medium text-gray-900">Qu'est-ce que Moov ?</h3>
            <p class="text-gray-600">
              Moov est votre compagnon d'exploration urbaine qui vous aide à découvrir votre ville sous un nouveau jour.
            </p>
            
            <div class="space-y-4 mt-6">
              <div class="flex items-start">
                <div class="flex-shrink-0 bg-blue-100 rounded-full p-2">
                  <span class="material-icons text-[#0082C3]">map</span>
                </div>
                <div class="ml-4">
                  <h4 class="text-base font-medium text-gray-900">Parcours personnalisés</h4>
                  <p class="text-sm text-gray-500">Des itinéraires adaptés à vos centres d'intérêt et à votre famille.</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="flex-shrink-0 bg-blue-100 rounded-full p-2">
                  <span class="material-icons text-[#0082C3]">location_on</span>
                </div>
                <div class="ml-4">
                  <h4 class="text-base font-medium text-gray-900">Points d'intérêt</h4>
                  <p class="text-sm text-gray-500">Découvrez des lieux fascinants avec des informations détaillées et des activités.</p>
                </div>
              </div>
              
              <div class="flex items-start">
                <div class="flex-shrink-0 bg-blue-100 rounded-full p-2">
                  <span class="material-icons text-[#0082C3]">shopping_bag</span>
                </div>
                <div class="ml-4">
                  <h4 class="text-base font-medium text-gray-900">Équipement recommandé</h4>
                  <p class="text-sm text-gray-500">Des suggestions de produits pour profiter pleinement de vos aventures.</p>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Étape 1: Rôle -->
        {#if currentStep === 1}
          <div class="space-y-6" in:fade={{ duration: 300 }}>
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
          <div class="space-y-6" in:fade={{ duration: 300 }}>
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
          <div class="space-y-6" in:fade={{ duration: 300 }}>
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
          <div class="space-y-6" in:fade={{ duration: 300 }}>
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
                  J'ai besoin de parcours accessibles (mobilité réduite, poussette, etc.)
                </label>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Boutons de navigation -->
        <div class="mt-8 flex justify-between">
          {#if currentStep > 0}
            <Button 
              variant="outline" 
              on:click={prevStep}
            >
              Précédent
            </Button>
          {:else}
            <div></div> <!-- Espace vide pour maintenir l'alignement -->
          {/if}
          
          {#if currentStep < totalSteps - 1}
            <Button 
              variant="primary" 
              on:click={nextStep}
              disabled={currentStep === 2 && activityPreferences.length === 0 || currentStep === 3 && ageGroups.length === 0}
            >
              Suivant
            </Button>
          {:else}
            <Button 
              variant="primary" 
              on:click={savePreferences}
              loading={$isLoading}
              disabled={$isLoading}
            >
              Commencer
            </Button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div> 