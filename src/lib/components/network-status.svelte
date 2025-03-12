<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { isOnline, registerNetworkStatusListeners } from '$lib/pwa-utils';
  
  let online = true;
  let showStatus = false;
  let statusTimeout: ReturnType<typeof setTimeout>;
  
  function updateOnlineStatus(newStatus: boolean) {
    online = newStatus;
    showStatus = true;
    
    // Masquer la notification après 3 secondes
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      showStatus = false;
    }, 3000);
  }
  
  onMount(() => {
    // Initialiser l'état en ligne
    online = isOnline();
    
    // Enregistrer les écouteurs
    const cleanup = registerNetworkStatusListeners(
      () => updateOnlineStatus(true),
      () => updateOnlineStatus(false)
    );
    
    return cleanup;
  });
  
  onDestroy(() => {
    clearTimeout(statusTimeout);
  });
</script>

{#if showStatus}
  <div 
    class="fixed top-4 right-4 px-4 py-2 rounded-md text-white font-medium transition-all duration-300"
    class:bg-green-600={online}
    class:bg-red-600={!online}
  >
    {online ? 'Vous êtes en ligne' : 'Vous êtes hors ligne'}
  </div>
{/if} 