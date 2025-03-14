<script lang="ts">
	import '../app.css';
	import PwaInstall from '$lib/components/pwa-install.svelte';
	import NetworkStatus from '$lib/components/network-status.svelte';
	import Notification from '$lib/components/ui/notification.svelte';
	import { isLoading } from '$lib/stores/app-store';
	import Loading from '$lib/components/ui/loading.svelte';
	import { onMount } from 'svelte';
	import { initializeAuth, currentUser, signOut, refreshUserData } from '$lib/services/auth';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	
	// Récupérer les données de session du layout.ts
	export let data;
	
	// Déterminer si la page actuelle est une page d'authentification
	$: isAuthPage = $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register');
	
	// Déterminer si la page actuelle est une page d'onboarding
	$: isOnboardingPage = $page.url.pathname.startsWith('/onboarding');
	
	onMount(() => {
		// Vérifier si un token existe et est valide
		const checkSession = async () => {
			const { data: { session } } = await supabase.auth.getSession();
			
			if (session) {
				// Token valide trouvé, initialiser l'utilisateur
				await refreshUserData();
				
				// Rediriger si nécessaire
				if (isAuthPage) {
					goto('/');
				}
			} else {
				// Pas de session valide, initialiser l'auth normalement
				initializeAuth();
			}
		};
		
		// Exécuter la vérification
		checkSession();
		
		// Écouter les changements d'authentification
		const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
			if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
				await refreshUserData();
			} else if (event === 'SIGNED_OUT') {
				currentUser.set(null);
			}
		});
		
		// Nettoyer l'écouteur lors du démontage
		return () => {
			authListener.subscription.unsubscribe();
		};
	});
</script>

<!-- Ajout de la police Material Icons -->
<svelte:head>
	<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</svelte:head>

<main class="pb-16">
	<slot />
</main>

<!-- Navigation inférieure mobile -->
{#if $currentUser}
<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-[9999]">
  <div class="grid grid-cols-5 h-16">
    <a 
      href="/" 
      class="flex flex-col items-center justify-center text-xs {$page.url.pathname === '/' ? 'text-[#0082C3]' : 'text-gray-500'}"
    >
      <img src="/icons/HouseLine.svg" alt="Accueil" class="w-6 h-6 mb-1" />
      <span>Accueil</span>
    </a>
    <a 
      href="/routes" 
      class="flex flex-col items-center justify-center text-xs {$page.url.pathname.startsWith('/routes') ? 'text-[#0082C3]' : 'text-gray-500'}"
    >
      <img src="/icons/ListDashes.svg" alt="Parcours" class="w-6 h-6 mb-1" />
      <span>Parcours</span>
    </a>
    <a 
      href="/map" 
      class="flex flex-col items-center justify-center text-xs {$page.url.pathname === '/map' ? 'text-[#0082C3]' : 'text-gray-500'}"
    >
      <img src="/icons/MapTrifold.png" alt="Carte" class="w-6 h-6 mb-1" />
      <span>Carte</span>
    </a>
    <a 
      href="/favorites" 
      class="flex flex-col items-center justify-center text-xs {$page.url.pathname === '/favorites' ? 'text-[#0082C3]' : 'text-gray-500'}"
    >
      <img src="/icons/ImageSquare.svg" alt="Favoris" class="w-6 h-6 mb-1" />
      <span>Favoris</span>
    </a>
    <a 
      href="/profile" 
      class="flex flex-col items-center justify-center text-xs {$page.url.pathname === '/profile' ? 'text-[#0082C3]' : 'text-gray-500'}"
    >
      <img src="/icons/User.svg" alt="Profil" class="w-6 h-6 mb-1" />
      <span>Profil</span>
    </a>
  </div>
</nav>
{/if}

<!-- Composants PWA -->
<PwaInstall />
<NetworkStatus />

<!-- Composants UI -->
<Notification />

<!-- Indicateur de chargement global -->
{#if $isLoading}
	<Loading fullScreen />
{/if}
