<script lang="ts">
  import { signUp, signInWithGoogle, signInWithFacebook } from '$lib/services/auth';
  import { goto } from '$app/navigation';
  import { withLoading, showNotification } from '$lib/stores/app-store';
  import Loading from '$lib/components/ui/loading.svelte';
  import { isLoading } from '$lib/stores/app-store';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let email = '';
  let password = '';
  let confirmPassword = '';
  let acceptCGU = false;
  let errors = {
    email: '',
    password: '',
    confirmPassword: '',
    acceptCGU: ''
  };
  
  onMount(() => {
    if (browser) {
      // Ajouter la classe no-scroll au body
      document.body.classList.add('no-scroll');
    }
  });
  
  function validateForm() {
    let isValid = true;
    errors = {
      email: '',
      password: '',
      confirmPassword: '',
      acceptCGU: ''
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
    } else if (password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }
    
    if (!acceptCGU) {
      errors.acceptCGU = 'Vous devez accepter les conditions générales d\'utilisation';
      isValid = false;
    }
    
    return isValid;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    try {
      await withLoading(async () => {
        await signUp(email, password);
        showNotification('Inscription réussie ! Un email de confirmation vous a été envoyé.', 'success');
        
        // Réinitialiser le compteur de redirections
        if (browser) {
          sessionStorage.setItem('redirectCount', '0');
        }
        
        goto('/login');
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
  
  function goToLogin() {
    goto('/login');
  }
</script>

<svelte:head>
  <title>Inscription | Moov</title>
</svelte:head>

<div class="fixed inset-0 bg-[#3643BA] flex flex-col">
  <!-- En-tête avec le titre -->
  <div class="pt-8 px-6 text-center">
    <h1 class="text-[32px] font-bold text-white" style="font-family: 'Inter', sans-serif;">Créez votre compte !</h1>
    <p class="text-white mt-1 text-[18px] font-semibold leading-[24px]" style="font-family: 'Inter', sans-serif;">Rejoignez-nous<br />pour découvrir des balades !</p>
  </div>
  
  <!-- Formulaire d'inscription -->
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
        <div class="flex flex-col items-center">
          <div class="w-[327px] text-left">
            <label for="password" class="block text-base font-medium text-white mb-1">Mot de passe*</label>
          </div>
          <input
            type="password"
            id="password"
            placeholder="6 caractères minimum"
            class="w-[327px] h-14 px-4 rounded-lg bg-white text-gray-800 text-base"
            bind:value={password}
            required
          />
          {#if errors.password}
            <p class="text-red-300 text-xs mt-1 w-[327px] text-left">{errors.password}</p>
          {/if}
        </div>
        
        <!-- Champ Confirmation Mot de passe -->
        <div class="flex flex-col items-center">
          <div class="w-[327px] text-left">
            <label for="confirmPassword" class="block text-base font-medium text-white mb-1">Confirmer le mot de passe*</label>
          </div>
          <input
            type="password"
            id="confirmPassword"
            placeholder="Confirmez votre mot de passe"
            class="w-[327px] h-14 px-4 rounded-lg bg-white text-gray-800 text-base"
            bind:value={confirmPassword}
            required
          />
          {#if errors.confirmPassword}
            <p class="text-red-300 text-xs mt-1 w-[327px] text-left">{errors.confirmPassword}</p>
          {/if}
        </div>
        
        <!-- Case à cocher CGU -->
        <div class="flex flex-col items-center">
          <div class="w-[327px] flex items-start">
            <input
              type="checkbox"
              id="acceptCGU"
              class="mt-1 mr-2 h-5 w-5"
              bind:checked={acceptCGU}
            />
            <label for="acceptCGU" class="text-lg text-white">
              J'accepte les <a href="/cgu" class="underline font-semibold">conditions générales d'utilisation</a>
            </label>
          </div>
          {#if errors.acceptCGU}
            <p class="text-red-300 text-xs mt-1 w-[327px] text-left">{errors.acceptCGU}</p>
          {/if}
        </div>
        
        <!-- Bouton d'inscription -->
        <button 
          type="submit" 
          class="w-[327px] h-[60px] mt-4 bg-[#D9F0FF] text-black font-medium rounded-lg flex items-center justify-center mx-auto text-base"
          disabled={$isLoading}
        >
          {#if $isLoading}
            <Loading size="sm" />
          {:else}
            <span>S'inscrire</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
      </form>
      
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
          <span>S'inscrire avec Google</span>
        </button>
        
        <!-- Facebook -->
        <button 
          on:click={handleFacebookSignIn}
          class="w-[327px] h-14 bg-white text-[#1877F2] font-medium rounded-lg flex items-center justify-center text-base"
        >
          <img src="/images/facebook-icon.svg" alt="Facebook" class="h-5 w-5 mr-2" />
          <span>S'inscrire avec Facebook</span>
        </button>
      </div>
      
      <!-- Lien de connexion -->
      <div class="mt-6 text-center pb-4">
        <p class="text-white text-base">Vous avez déjà un compte ?</p>
        <button on:click={goToLogin} class="text-white font-medium underline text-base">
          Connectez-vous !
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  /* Supprimer les styles inline qui empêchent le défilement */
  /* :global(body) {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
  } */
</style> 