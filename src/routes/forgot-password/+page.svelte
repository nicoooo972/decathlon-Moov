<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { goto } from '$app/navigation';
  import { withLoading, showNotification } from '$lib/stores/app-store';
  import Loading from '$lib/components/ui/loading.svelte';
  import { isLoading } from '$lib/stores/app-store';
  
  let email = '';
  let error = '';
  let success = false;
  
  async function handleSubmit() {
    if (!email) {
      error = 'Veuillez entrer votre adresse email';
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      error = 'Veuillez entrer une adresse email valide';
      return;
    }
    
    error = '';
    
    try {
      await withLoading(async () => {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        
        if (resetError) throw resetError;
        
        success = true;
      });
    } catch (err) {
      if (err instanceof Error) {
        error = err.message;
      }
    }
  }
  
  function goBack() {
    goto('/login');
  }
</script>

<svelte:head>
  <title>Mot de passe oublié | Moov</title>
</svelte:head>

<div class="min-h-screen bg-[#3643BA] flex flex-col">
  <!-- En-tête avec le titre -->
  <div class="pt-16 px-6">
    <h1 class="text-[28px] font-bold text-white">Mot de passe oublié</h1>
    <p class="text-white mt-1">Entrez votre email pour réinitialiser votre mot de passe</p>
  </div>
  
  <!-- Formulaire de réinitialisation -->
  <div class="px-6 mt-8">
    {#if success}
      <div class="bg-white/10 rounded-lg p-6 text-white">
        <h3 class="text-xl font-medium mb-2">Email envoyé !</h3>
        <p>Un email de réinitialisation a été envoyé à {email}. Veuillez vérifier votre boîte de réception et suivre les instructions.</p>
        <button 
          on:click={goBack}
          class="w-full h-12 mt-6 bg-[#D9F0FF] text-[#3643BA] font-medium rounded-lg flex items-center justify-center"
        >
          Retour à la connexion
        </button>
      </div>
    {:else}
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <!-- Champ Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-white mb-1">Email*</label>
          <input
            type="email"
            id="email"
            placeholder="Entrez votre email"
            class="w-full h-12 px-4 rounded-lg bg-white text-gray-800"
            bind:value={email}
            required
          />
          {#if error}
            <p class="text-red-300 text-xs mt-1">{error}</p>
          {/if}
        </div>
        
        <!-- Bouton de réinitialisation -->
        <button 
          type="submit" 
          class="w-full h-12 mt-4 bg-[#D9F0FF] text-[#3643BA] font-medium rounded-lg flex items-center justify-center"
          disabled={$isLoading}
        >
          {#if $isLoading}
            <Loading size="sm" />
          {:else}
            <span>Réinitialiser le mot de passe</span>
          {/if}
        </button>
        
        <!-- Bouton retour -->
        <button 
          type="button"
          on:click={goBack}
          class="w-full h-12 mt-2 border border-white text-white font-medium rounded-lg flex items-center justify-center"
        >
          Retour à la connexion
        </button>
      </form>
    {/if}
  </div>
</div> 