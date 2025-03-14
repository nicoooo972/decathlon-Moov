<script lang="ts">
  import { signIn, signUp, hasUserPreferences, signInWithGoogle, signInWithFacebook } from '$lib/services/auth';
  import { goto } from '$app/navigation';
  import { withLoading, showNotification } from '$lib/stores/app-store';
  import Loading from '$lib/components/ui/loading.svelte';
  import { isLoading } from '$lib/stores/app-store';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let email = '';
  let password = '';
  let errors = {
    email: '',
    password: ''
  };
  
  // Vérifier si on est dans une boucle de redirection
  onMount(() => {
    if (browser) {
      // Vérifier si on vient d'être redirigé
      const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0', 10);
      
      if (redirectCount > 5) {
        // Réinitialiser le compteur et afficher un message
        sessionStorage.setItem('redirectCount', '0');
        showNotification('Trop de redirections détectées. Veuillez réessayer.', 'error');
      } else {
        // Incrémenter le compteur
        sessionStorage.setItem('redirectCount', (redirectCount + 1).toString());
      }
    }
  });
  
  function validateForm() {
    let isValid = true;
    errors = {
      email: '',
      password: ''
    };
    
    if (!email) {
      errors.email = 'L\'email est requis';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'L\'email n\'est pas valide';
      isValid = false;
    }
    
    if (!password) {
      errors.password = 'Le mot de passe est requis';
      isValid = false;
    }
    
    return isValid;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    try {
      await withLoading(async () => {
        const user = await signIn(email, password);
        showNotification('Connexion réussie', 'success');
        
        // Réinitialiser le compteur de redirections
        if (browser) {
          sessionStorage.setItem('redirectCount', '0');
        }
        
        if (user && await hasUserPreferences(user.id)) {
          goto('/');
        } else {
          goto('/preferences');
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
    }
  }
  
  async function handleGoogleSignIn() {
    try {
      await signInWithGoogle();
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
    }
  }
  
  async function handleFacebookSignIn() {
    try {
      await signInWithFacebook();
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
    }
  }
  
  function goToRegister() {
    goto('/register');
  }
</script>

<svelte:head>
  <title>Connexion | Moov</title>
</svelte:head>

<div class="fixed inset-0 bg-[#3643BA] flex flex-col">
  <!-- En-tête avec le titre -->
  <div class="pt-8 px-6 text-center">
    <h1 class="text-[32px] font-bold text-white" style="font-family: 'Inter', sans-serif;">Connectez-vous !</h1>
    <p class="text-white mt-1 text-[18px] font-semibold leading-[24px]" style="font-family: 'Inter', sans-serif;">Rejoignez-nous<br />pour découvrir des balades !</p>
  </div>
  
  <!-- Formulaire de connexion -->
  <div class="px-6 flex-1 overflow-y-auto flex flex-col justify-center">
    <div class="max-h-full py-4">
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- Champ Email -->
        <div class="flex flex-col items-center">
          <div class="w-[327px] text-left">
            <label for="email" class="block text-base font-medium text-white mb-1">Email*</label>
          </div>
          <input
            type="email"
            id="email"
            placeholder="exemple@email.com"
            class="w-[327px] h-14 px-4 rounded-lg bg-white text-gray-800 text-base"
            bind:value={email}
            required
          />
          {#if errors.email}
            <p class="text-red-300 text-xs mt-1 w-[327px] text-left">{errors.email}</p>
          {/if}
        </div>
        
        <!-- Champ Mot de passe -->
        <div class="flex flex-col items-center mt-4">
          <div class="w-[327px] text-left">
            <label for="password" class="block text-base font-medium text-white mb-1">Mot de passe*</label>
          </div>
          <input
            type="password"
            id="password"
            placeholder="Votre mot de passe"
            class="w-[327px] h-14 px-4 rounded-lg bg-white text-gray-800 text-base"
            bind:value={password}
            required
          />
          {#if errors.password}
            <p class="text-red-300 text-xs mt-1 w-[327px] text-left">{errors.password}</p>
          {/if}
        </div>
        
        <!-- Bouton de connexion -->
        <button 
          type="submit" 
          class="w-[327px] h-[60px] mt-6 bg-[#D9F0FF] text-black font-medium rounded-lg flex items-center justify-center mx-auto text-base"
          disabled={$isLoading}
        >
          {#if $isLoading}
            <Loading size="sm" />
          {:else}
            <span>Connexion</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
      </form>
      
      <!-- Lien mot de passe oublié -->
      <div class="mt-3 text-center">
        <a href="/forgot-password" class="text-white text-base underline">Mot de passe oublié</a>
      </div>
      
      <!-- Séparateur -->
      <div class="flex items-center my-4">
        <div class="flex-grow h-px bg-white/30"></div>
        <span class="px-3 text-white text-base">ou</span>
        <div class="flex-grow h-px bg-white/30"></div>
      </div>
      
      <!-- Boutons de connexion sociale -->
      <div class="space-y-3 flex flex-col items-center">
        <!-- Google -->
        <button 
          on:click={handleGoogleSignIn}
          class="w-[327px] h-14 bg-white text-gray-800 font-medium rounded-lg flex items-center justify-center text-base"
        >
          <img src="/images/google-icon.svg" alt="Google" class="h-5 w-5 mr-2" />
          <span>Se connecter avec Google</span>
        </button>
        
        <!-- Facebook -->
        <button 
          on:click={handleFacebookSignIn}
          class="w-[327px] h-14 bg-white text-[#1877F2] font-medium rounded-lg flex items-center justify-center text-base"
        >
          <img src="/images/facebook-icon.svg" alt="Facebook" class="h-5 w-5 mr-2" />
          <span>Se connecter avec Facebook</span>
        </button>
      </div>
      
      <!-- Lien d'inscription -->
      <div class="mt-6 text-center pb-4">
        <p class="text-white text-base">Vous n'avez pas de compte ?</p>
        <button on:click={goToRegister} class="text-white font-medium underline text-base">
          Rejoignez nous !
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  /* Empêcher le scroll sur le body */
  :global(body) {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  }
</style> 