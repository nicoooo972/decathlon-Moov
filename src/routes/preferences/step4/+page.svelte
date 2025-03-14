<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade, slide } from 'svelte/transition';
  import { quartOut } from 'svelte/easing';

  let currentStep = 4;
  const totalSteps = 5;
  
  // Informations du profil principal
  let mainProfile = {
    name: '',
    age: 0
  };
  
  // Structure pour un membre de la famille
  interface FamilyMember {
    id: string;
    name: string;
    ageGroup: 'tout-petit' | 'enfant' | 'adolescent' | 'adulte';
    isReducedMobility: boolean;
    interests: string[];
  }
  
  // Liste des membres de la famille
  let familyMembers: FamilyMember[] = [];
  
  // Mapping des tranches d'âge pour l'affichage
  const ageGroupLabels = {
    'tout-petit': '0-3 ans',
    'enfant': '4-11 ans',
    'adolescent': '12-17 ans',
    'adulte': '18+ ans'
  };
  
  onMount(() => {
    // Vérifier le type d'utilisateur
    const userType = localStorage.getItem('pref_userType');
    if (userType === 'solo') {
      // Rediriger vers l'étape finale si l'utilisateur est en mode solo
      goto('/preferences/step5');
    }
    
    // Récupérer les informations du profil principal
    const firstName = localStorage.getItem('pref_firstName');
    const birthDate = localStorage.getItem('pref_birthDate');
    
    if (firstName && birthDate) {
      const age = calculateAge(new Date(birthDate));
      mainProfile = {
        name: firstName,
        age: age
      };
    }
    
    // Récupérer les membres déjà ajoutés si ils existent
    const storedMembers = localStorage.getItem('pref_familyMembers');
    if (storedMembers) {
      try {
        familyMembers = JSON.parse(storedMembers);
      } catch (e) {
        console.error('Erreur lors de la récupération des membres:', e);
      }
    }
  });
  
  function calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  function editMainProfile() {
    goto('/preferences/step2');
  }

  function handleSubmit() {
    // Sauvegarder les membres
    localStorage.setItem('pref_familyMembers', JSON.stringify(familyMembers));
    // Aller à l'étape finale
    goto('/preferences/step5');
  }

  function addMember() {
    goto('/preferences/step4/add');
  }

  function editMember(id: string) {
    goto(`/preferences/step4/edit/${id}`);
  }
</script>

<svelte:head>
  <title>Ajout des membres | Moov</title>
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

  <!-- Titre et contenu -->
  <div class="w-[327px] flex-grow" in:fade={{ duration: 400, delay: 100 }}>
    <div class="mb-6">
      <p class="text-white font-semibold text-base leading-6">Personnalisez votre expérience</p>
      <h1 class="text-white font-bold text-2xl leading-8 mt-2">Ajoutez un membre de votre famille</h1>
    </div>

    <!-- Profil principal -->
    <div class="mb-6">
      <button
        class="w-full h-[72px] bg-white rounded-xl flex items-center px-4 text-[#3643BA]"
        on:click={editMainProfile}
      >
        <div class="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="flex flex-col items-start">
            <span class="font-semibold">{mainProfile.name}</span>
            <span class="text-sm">{mainProfile.age} ans</span>
          </div>
        </div>
        <svg class="ml-auto" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Liste des membres additionnels -->
    {#if familyMembers.length > 0}
      <div class="space-y-3">
        {#each familyMembers as member}
          <div class="w-full h-[72px] bg-white rounded-lg p-4 flex items-center justify-between" in:fade>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-[#3643BA]/10 rounded-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#3643BA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#3643BA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <p class="font-semibold text-[#2A37A3]">{member.name}</p>
                <p class="text-sm text-[#2A37A3]/60">{ageGroupLabels[member.ageGroup]}</p>
              </div>
            </div>
            <button 
              class="w-10 h-10 rounded-lg bg-[#3643BA]/5 flex items-center justify-center"
              on:click={() => editMember(member.id)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#3643BA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="#3643BA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Boutons de navigation -->
  <div class="w-[327px] py-6 space-y-3" in:fade={{ duration: 400, delay: 200 }}>
    <button
      class="w-full h-[56px] bg-white text-[#3643BA] rounded-lg font-semibold flex items-center justify-center gap-2"
      on:click={addMember}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Ajouter un autre membre</span>
    </button>
    
    <button
      class="w-full h-[56px] bg-[#D0EEF9] text-[#3643BA] rounded-lg font-semibold flex items-center justify-center gap-2"
      on:click={handleSubmit}
    >
      <span>{familyMembers.length > 0 ? 'Continuer' : 'Passer cette étape'}</span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</div> 