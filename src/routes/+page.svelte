<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/services/auth';
  import { hasCompletedPreferences } from '$lib/services/preferences';
  import Button from '$lib/components/ui/button.svelte';
  
  let loading = true;
  
  onMount(async () => {
    // Vérifier si l'utilisateur est connecté
    if ($currentUser) {
      // Vérifier si l'utilisateur a complété ses préférences
      const hasPrefs = await hasCompletedPreferences($currentUser.id);
      
      if (hasPrefs) {
        // Rediriger vers la page des parcours
        goto('/routes');
      } else {
        // Rediriger vers la page d'onboarding
        goto('/onboarding');
      }
    } else {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Decathlon Urban Trek - Explorez votre ville en famille</title>
</svelte:head>

{#if !loading}
  <div class="min-h-screen flex flex-col">
    <!-- Hero section -->
    <div class="relative bg-[#0082C3] text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div class="md:w-2/3">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">
            Explorez votre ville en famille
          </h1>
          <p class="text-xl mb-8">
            Découvrez des parcours personnalisés avec des histoires et des activités pour toute la famille.
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="secondary" 
              size="lg" 
              on:click={() => goto('/login')}
            >
              Commencer l'aventure
            </Button>
          </div>
        </div>
      </div>
      
      <!-- Image décorative -->
      <div class="absolute right-0 bottom-0 w-1/3 h-full hidden md:block">
        <!-- Ici, vous pourriez ajouter une image décorative -->
      </div>
    </div>
    
    <!-- Features section -->
    <div class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900">Comment ça marche</h2>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-[#0082C3] text-2xl">person</span>
            </div>
            <h3 class="text-xl font-medium mb-2">Créez votre profil</h3>
            <p class="text-gray-600">Personnalisez vos préférences pour des parcours adaptés à vos envies.</p>
          </div>
          
          <div class="text-center">
            <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-[#0082C3] text-2xl">map</span>
            </div>
            <h3 class="text-xl font-medium mb-2">Choisissez un parcours</h3>
            <p class="text-gray-600">Explorez des itinéraires adaptés à votre famille et vos centres d'intérêt.</p>
          </div>
          
          <div class="text-center">
            <div class="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span class="material-icons text-[#0082C3] text-2xl">directions_walk</span>
            </div>
            <h3 class="text-xl font-medium mb-2">Partez à l'aventure</h3>
            <p class="text-gray-600">Suivez le parcours, découvrez des histoires et relevez des défis en famille.</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA section -->
    <div class="bg-gray-100 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-6">Prêt à explorer votre ville ?</h2>
        <Button 
          variant="primary" 
          size="lg" 
          on:click={() => goto('/login')}
        >
          Créer un compte
        </Button>
      </div>
    </div>
    
    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-8 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <img src="/decathlon-logo-white.svg" alt="Decathlon" class="h-8" />
          </div>
          <div class="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Decathlon. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  </div>
{/if}
