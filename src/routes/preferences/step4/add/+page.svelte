<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade, slide } from 'svelte/transition';
  import { quartOut } from 'svelte/easing';
  
  let name = '';
  let ageGroup = '';
  let isReducedMobility = false;
  let selectedInterests: string[] = [];
  let errors: { [key: string]: string } = {};
  
  // Options pour les tranches d'âge
  const ageGroups = [
    { value: 'tout-petit', label: '0-3 ans (tout-petit)' },
    { value: 'enfant', label: '4-11 ans (enfant)' },
    { value: 'adolescent', label: '12-17 ans (adolescent)' },
    { value: 'adulte', label: '18+ ans (adulte)' }
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
  
  function validateForm(): boolean {
    errors = {};
    
    if (!name.trim()) {
      errors.name = 'Le prénom est requis';
    }
    
    if (!ageGroup) {
      errors.ageGroup = 'La tranche d\'âge est requise';
    }
    
    return Object.keys(errors).length === 0;
  }
  
  function toggleInterest(id: string) {
    if (selectedInterests.includes(id)) {
      selectedInterests = selectedInterests.filter(i => i !== id);
    } else {
      selectedInterests = [...selectedInterests, id];
    }
  }
  
  function handleSubmit() {
    if (validateForm()) {
      // Récupérer les membres existants
      const storedMembers = localStorage.getItem('pref_familyMembers');
      let members = storedMembers ? JSON.parse(storedMembers) : [];
      
      // Ajouter le nouveau membre
      members.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        ageGroup,
        isReducedMobility,
        interests: selectedInterests
      });
      
      // Sauvegarder
      localStorage.setItem('pref_familyMembers', JSON.stringify(members));
      
      // Retourner à la liste
      goto('/preferences/step4');
    }
  }
</script>

<svelte:head>
  <title>Ajouter un membre | Moov</title>
  <style>
    nav {
      display: none !important;
    }
  </style>
</svelte:head>

<div class="min-h-screen bg-[#3643BA] flex flex-col items-center" 
  in:slide={{ duration: 400, easing: quartOut }} 
  out:slide={{ duration: 400, easing: quartOut }}>
  
  <!-- Titre -->
  <div class="w-[327px] mt-6" in:fade={{ duration: 400 }}>
    <h1 class="text-white font-bold text-2xl leading-8">Ajoutez un membre de votre famille</h1>
  </div>

  <!-- Formulaire -->
  <div class="w-[327px] flex-grow mt-4" in:fade={{ duration: 400, delay: 100 }}>
    <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
      <!-- Prénom -->
      <div>
        <label for="name" class="block text-white font-semibold mb-1">Prénom du membre<span class="text-red-500">*</span></label>
        <input
          type="text"
          id="name"
          bind:value={name}
          class="w-full h-[48px] px-4 rounded-lg bg-white text-[#2A37A3] placeholder-[#2A37A3]/50"
          placeholder="Texte du champ"
        />
        {#if errors.name}
          <p class="text-red-500 text-sm mt-1">{errors.name}</p>
        {/if}
      </div>

      <!-- Tranche d'âge -->
      <div>
        <label for="ageGroup" class="block text-white font-semibold mb-1">Tranche d'âge du membre<span class="text-red-500">*</span></label>
        <select
          id="ageGroup"
          bind:value={ageGroup}
          class="w-full h-[48px] px-4 rounded-lg bg-white text-[#2A37A3] appearance-none"
        >
          <option value="">Sélectionnez une tranche d'âge</option>
          {#each ageGroups as group}
            <option value={group.value}>{group.label}</option>
          {/each}
        </select>
        {#if errors.ageGroup}
          <p class="text-red-500 text-sm mt-1">{errors.ageGroup}</p>
        {/if}
      </div>

      <!-- Centres d'intérêts -->
      <div>
        <p class="text-white font-semibold mb-2">Sélectionnez les centres d'intérêts du membre</p>
        <div class="grid grid-cols-3 gap-3">
          {#each interests as interest}
            <button
              type="button"
              class="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all text-[#3643BA] {selectedInterests.includes(interest.id) ? 'bg-[#D0EEF9]' : 'bg-white'}"
              on:click={() => toggleInterest(interest.id)}
            >
              <img src={interest.icon} alt={interest.label} class="w-6 h-6" />
              <span class="text-sm font-medium">{interest.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- PMR -->
      <div>
        <p class="text-white font-semibold mb-2">Le membre est-il une Personne à Mobilité Réduite (PMR) ?</p>
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
      class="flex-1 h-[56px] bg-white text-[#3643BA] rounded-lg font-semibold flex items-center justify-center gap-2"
      on:click={handleSubmit}
    >
      <span>Ajouter ce membre</span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</div> 