<script lang="ts">
  import { onMount } from 'svelte';
  
  let deferredPrompt: any;
  let showInstallButton = false;
  
  onMount(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      // Update UI to notify the user they can add to home screen
      showInstallButton = true;
    });
    
    window.addEventListener('appinstalled', () => {
      // Hide the app-provided install promotion
      showInstallButton = false;
      // Clear the deferredPrompt so it can be garbage collected
      deferredPrompt = null;
      // Log the installation to analytics
      console.log('PWA was installed');
    });
  });
  
  async function installApp() {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // Optionally, send analytics event with outcome of user choice
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
    // Hide the install button
    showInstallButton = false;
  }
</script>

{#if showInstallButton}
  <button 
    on:click={installApp}
    class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg"
  >
    Installer l'application
  </button>
{/if} 