<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { refreshUserData, hasUserPreferences, currentUser } from '$lib/services/auth';
  import { showNotification } from '$lib/stores/app-store';
  import Loading from '$lib/components/ui/loading.svelte';
  import { get } from 'svelte/store';

  onMount(async () => {
    try {
      // Rafraîchir les données utilisateur après l'authentification OAuth
      await refreshUserData();
      showNotification('Connexion réussie', 'success');
      
      // Vérifier si l'utilisateur a des préférences
      const user = get(currentUser);
      if (user && await hasUserPreferences(user.id)) {
        goto('/');
      } else {
        goto('/preferences');
      }
    } catch (error) {
      console.error('Erreur lors de la redirection après OAuth:', error);
      showNotification('Une erreur est survenue lors de la connexion', 'error');
      goto('/login');
    }
  });
</script>

<svelte:head>
  <title>Authentification en cours... | Moov</title>
</svelte:head>

<div class="min-h-screen bg-[#3643BA] flex flex-col justify-center items-center">
  <div class="text-center">
    <h2 class="text-2xl font-bold text-white mb-4">Authentification en cours...</h2>
    <Loading size="lg" />
  </div>
</div> 