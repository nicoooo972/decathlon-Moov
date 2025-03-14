<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, updateProfile, signOut } from '$lib/services/auth';
  import { getUserStats, updateUserAvatar } from '$lib/services/user';
  import Button from '$lib/components/ui/button.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabase';
  import type { User } from '$lib/types';
  import CompletedWalks from '$lib/components/profile/CompletedWalks.svelte';
  
  let user: User | null = null;
  let loading = true;
  let updating = false;
  let message = '';
  let error = '';
  
  // Formulaire
  let firstName = '';
  let lastName = '';
  let email = '';
  let avatarUrl = '';
  let avatarFile: File | null = null;
  
  // Statistiques
  let stats = {
    visited: 0,
    favorites: 0,
    routes: 0
  };
  let loadingStats = false;
  
  onMount(() => {
    // Réinitialiser les styles du body pour permettre le défilement
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
    
    // Supprimer la classe map-page si elle existe
    document.body.classList.remove('map-page');
    
    // S'abonner au store currentUser
    const unsubscribe = currentUser.subscribe(async (value) => {
      user = value;
      if (user) {
        firstName = user.first_name || '';
        lastName = user.last_name || '';
        email = user.email;
        avatarUrl = user.avatar_url || '';
        
        // Charger les statistiques
        loadingStats = true;
        try {
          stats = await getUserStats(user.id);
        } catch (e) {
          console.error('Erreur lors du chargement des statistiques:', e);
        } finally {
          loadingStats = false;
        }
      }
      loading = false;
    });
    
    return unsubscribe;
  });
  
  async function handleSubmit() {
    if (!user) return;
    
    try {
      updating = true;
      error = '';
      message = '';
      
      // Si un nouveau fichier avatar a été sélectionné, le télécharger
      if (avatarFile) {
        try {
          avatarUrl = await updateUserAvatar(user.id, avatarFile);
        } catch (e) {
          throw new Error('Erreur lors du téléchargement de l\'avatar');
        }
      }
      
      // Mettre à jour le profil
      await updateProfile({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl
      });
      
      message = 'Profil mis à jour avec succès';
    } catch (e) {
      console.error('Erreur lors de la mise à jour du profil:', e);
      error = e instanceof Error ? e.message : 'Une erreur est survenue';
    } finally {
      updating = false;
    }
  }
  
  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      avatarFile = input.files[0];
      // Créer une URL temporaire pour l'aperçu
      avatarUrl = URL.createObjectURL(avatarFile);
    }
  }
  
  function handleLogout() {
    signOut();
  }
  
  function goBack() {
    goto('/map');
  }
</script>

<svelte:head>
  <title>Mon Profil | EcoTrek</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 py-8 overflow-auto">
    <div class="flex items-center mb-6">
      <button 
        on:click={goBack}
        class="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Retour"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Mon Profil</h1>
    </div>
    
    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    {:else if !user}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p class="text-center text-gray-700 dark:text-gray-300">
          Vous n'êtes pas connecté. Veuillez vous <a href="/login" class="text-green-600 dark:text-green-400 hover:underline">connecter</a> pour accéder à votre profil.
        </p>
      </div>
    {:else}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Avatar -->
          <div class="flex flex-col items-center space-y-4">
            <div class="relative">
              {#if avatarUrl}
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  class="w-24 h-24 rounded-full object-cover border-2 border-green-500"
                  on:error={() => { avatarUrl = 'https://via.placeholder.com/150?text=Avatar' }}
                />
              {:else}
                <div class="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                  <span class="text-2xl text-gray-600 dark:text-gray-400">
                    {firstName && lastName 
                      ? `${firstName[0]}${lastName[0]}` 
                      : email[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              {/if}
              <label 
                for="avatar-upload" 
                class="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full cursor-pointer hover:bg-green-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input 
                type="file" 
                id="avatar-upload" 
                accept="image/*" 
                on:change={handleFileChange} 
                class="hidden"
              />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Cliquez sur l'icône pour changer votre photo</p>
          </div>
          
          <!-- Informations personnelles -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prénom
              </label>
              <input 
                type="text" 
                id="firstName" 
                bind:value={firstName} 
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Votre prénom"
              />
            </div>
            
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <input 
                type="text" 
                id="lastName" 
                bind:value={lastName} 
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Votre nom"
              />
            </div>
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              disabled 
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">L'adresse email ne peut pas être modifiée</p>
          </div>
          
          <!-- Messages -->
          {#if message}
            <div class="p-3 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-lg">
              {message}
            </div>
          {/if}
          
          {#if error}
            <div class="p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg">
              {error}
            </div>
          {/if}
          
          <!-- Boutons d'action -->
          <div class="flex flex-col space-y-3">
            <Button 
              type="submit" 
              disabled={updating}
              size="lg"
              fullWidth={true}
            >
              {#if updating}
                <span class="inline-block mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                Mise à jour...
              {:else}
                Enregistrer les modifications
              {/if}
            </Button>
            
            <button 
              type="button" 
              on:click={handleLogout} 
              class="w-full py-3 text-lg bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </form>
      </div>
      
      <!-- Statistiques -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Mes statistiques</h2>
        
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.visited}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Lieux visités</div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.favorites}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Favoris</div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.routes}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Parcours</div>
          </div>
        </div>
      </div>
      
      <!-- Balades terminées -->
      <CompletedWalks />
      
      <!-- Section des préférences -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Mes préférences</h2>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          Gérez vos préférences pour personnaliser votre expérience.
        </p>
        <a 
          href="/onboarding" 
          class="inline-block w-full text-center py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Modifier mes préférences
        </a>
      </div>
    {/if}
  </div>
</div> 