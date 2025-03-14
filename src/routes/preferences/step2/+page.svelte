<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { fade, slide } from 'svelte/transition';
  import { quartOut } from 'svelte/easing';
  
  let currentStep = 2;
  const totalSteps = 5;
  
  // Champs du formulaire
  let firstName = '';
  let birthDate = '';
  let isReducedMobility = false;
  
  // Validation du formulaire
  let errors: { [key: string]: string } = {};
  
  function validateForm(): boolean {
    errors = {};
    
    if (!firstName) {
      errors.firstName = 'Le prénom est requis';
    }
    
    if (!birthDate) {
      errors.birthDate = 'La date de naissance est requise';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  function handleSubmit() {
    if (validateForm()) {
      // Stocker les données dans le localStorage
      localStorage.setItem('pref_firstName', firstName);
      localStorage.setItem('pref_birthDate', birthDate);
      localStorage.setItem('pref_isReducedMobility', String(isReducedMobility));
      
      // Passer à l'étape suivante
      goto('/preferences/step3');
    }
  }
</script>

<svelte:head>
  <title>Parlez-nous de vous | Moov</title>
  <style>
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

  <!-- Titre et formulaire -->
  <div class="w-[327px] flex-grow" in:fade={{ duration: 400, delay: 100 }}>
    <div class="mb-8">
      <p class="text-white font-semibold text-base leading-6">Personnalisez votre expérience</p>
      <h1 class="text-white font-bold text-2xl leading-8 mt-2">Parlez-nous de vous</h1>
    </div>

    <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
      <!-- Prénom -->
      <div>
        <label for="firstName" class="block text-white font-semibold mb-2">Prénom<span class="text-red-500">*</span></label>
        <input
          type="text"
          id="firstName"
          bind:value={firstName}
          class="w-[327px] h-[48px] px-4 rounded-lg bg-white text-[#2A37A3] placeholder-[#2A37A3]/50"
          placeholder="Texte du champ"
        />
        {#if errors.firstName}
          <p class="text-red-500 text-sm mt-1">{errors.firstName}</p>
        {/if}
      </div>

      <!-- Date de naissance -->
      <div>
        <label for="birthDate" class="block text-white font-semibold mb-2">Date de naissance<span class="text-red-500">*</span></label>
        <input
          type="date"
          id="birthDate"
          bind:value={birthDate}
          class="w-[327px] h-[48px] px-4 rounded-lg bg-white text-[#2A37A3] placeholder-[#2A37A3]/50"
          placeholder="Texte du champ"
        />
        {#if errors.birthDate}
          <p class="text-red-500 text-sm mt-1">{errors.birthDate}</p>
        {/if}
      </div>

      <!-- PMR -->
      <div>
        <p class="text-white font-semibold mb-4">Êtes-vous une Personne à Mobilité Réduite (PMR) ?</p>
        <div class="flex gap-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="pmr"
              bind:group={isReducedMobility}
              value={true}
              class="w-5 h-5 accent-white"
            />
            <span class="text-white">Oui</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="pmr"
              bind:group={isReducedMobility}
              value={false}
              class="w-5 h-5 accent-white"
            />
            <span class="text-white">Non</span>
          </label>
        </div>
      </div>
    </form>
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
      class="w-[255px] h-[56px] bg-white text-[#2A37A3] rounded-lg font-semibold flex items-center justify-center"
      on:click={handleSubmit}
    >
      <span>Suivant</span>
      <svg class="ml-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</div> 