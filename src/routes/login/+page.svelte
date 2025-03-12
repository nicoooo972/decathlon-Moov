<script lang="ts">
  import { signIn, signUp, hasUserPreferences } from '$lib/services/auth';
  import { goto } from '$app/navigation';
  import { withLoading, showNotification } from '$lib/stores/app-store';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Loading from '$lib/components/ui/loading.svelte';
  import { isLoading } from '$lib/stores/app-store';
  
  let isLoginMode = true;
  let email = '';
  let password = '';
  let confirmPassword = '';
  let errors = {
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  function validateForm() {
    let isValid = true;
    errors = {
      email: '',
      password: '',
      confirmPassword: ''
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
    
    if (!isLoginMode && password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }
    
    return isValid;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    try {
      if (isLoginMode) {
        await withLoading(async () => {
          const user = await signIn(email, password);
          showNotification('Connexion réussie', 'success');
          
          if (user && await hasUserPreferences(user.id)) {
            goto('/');
          } else {
            goto('/onboarding');
          }
        });
      } else {
        await withLoading(async () => {
          await signUp(email, password);
          showNotification('Inscription réussie ! Un email de confirmation vous a été envoyé.', 'success');
          goto('/onboarding');
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        showNotification(error.message, 'error');
      }
    }
  }
  
  function toggleMode() {
    isLoginMode = !isLoginMode;
    errors = {
      email: '',
      password: '',
      confirmPassword: ''
    };
  }
</script>

<svelte:head>
  <title>{isLoginMode ? 'Connexion' : 'Inscription'} | Decathlon Urban Trek</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <img class="mx-auto h-12 w-auto" src="/decathlon-logo.svg" alt="Decathlon" />
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      {isLoginMode ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      {isLoginMode ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
      <button 
        on:click={toggleMode}
        class="font-medium text-[#0082C3] hover:text-[#006699] focus:outline-none"
      >
        {isLoginMode ? 'Inscrivez-vous' : 'Connectez-vous'}
      </button>
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <Input
          type="email"
          name="email"
          label="Adresse email"
          bind:value={email}
          error={errors.email}
          required
        />
        
        <Input
          type="password"
          name="password"
          label="Mot de passe"
          bind:value={password}
          error={errors.password}
          required
        />
        
        {#if !isLoginMode}
          <Input
            type="password"
            name="confirmPassword"
            label="Confirmer le mot de passe"
            bind:value={confirmPassword}
            error={errors.confirmPassword}
            required
          />
        {/if}
        
        <div>
          <Button 
            type="submit" 
            fullWidth 
            loading={$isLoading}
            disabled={$isLoading}
          >
            {isLoginMode ? 'Se connecter' : 'S\'inscrire'}
          </Button>
        </div>
      </form>
      
      {#if $isLoading}
        <div class="mt-4 flex justify-center">
          <Loading />
        </div>
      {/if}
    </div>
  </div>
</div> 