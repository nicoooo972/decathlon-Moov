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
	
	let isMenuOpen = false;
	
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
	
	function closeMenu() {
		isMenuOpen = false;
	}
	
	async function handleSignOut() {
		await signOut();
		closeMenu();
	}
	
	// Déterminer si la page actuelle est une page d'authentification
	$: isAuthPage = $page.url.pathname.startsWith('/login') || $page.url.pathname.startsWith('/register');
	
	// Déterminer si la page actuelle est une page d'onboarding
	$: isOnboardingPage = $page.url.pathname.startsWith('/onboarding');
	
	// Afficher la navigation seulement si l'utilisateur est connecté et n'est pas sur une page d'auth ou d'onboarding
	$: showNavigation = !!$currentUser && !isAuthPage && !isOnboardingPage;
	
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

{#if showNavigation}
	<!-- Barre de navigation supérieure -->
	<header class="bg-white shadow-md fixed top-0 left-0 right-0 z-[9999]">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex">
					<div class="flex-shrink-0 flex items-center">
						<img class="h-8 w-auto" src="/decathlon-logo.svg" alt="Decathlon" />
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a 
							href="/" 
							class="inline-flex items-center px-1 pt-1 border-b-2 {$page.url.pathname === '/' ? 'border-[#0082C3] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							Accueil
						</a>
						<a 
							href="/routes" 
							class="inline-flex items-center px-1 pt-1 border-b-2 {$page.url.pathname.startsWith('/routes') ? 'border-[#0082C3] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							Parcours
						</a>
						<a 
							href="/map" 
							class="inline-flex items-center px-1 pt-1 border-b-2 {$page.url.pathname === '/map' ? 'border-[#0082C3] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							Carte
						</a>
						<a 
							href="/favorites" 
							class="inline-flex items-center px-1 pt-1 border-b-2 {$page.url.pathname === '/favorites' ? 'border-[#0082C3] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
						>
							Favoris
						</a>
					</div>
				</div>
				<div class="hidden sm:ml-6 sm:flex sm:items-center">
					<div class="ml-3 relative">
						<div>
							<button 
								type="button" 
								class="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0082C3]" 
								id="user-menu-button" 
								aria-expanded={isMenuOpen} 
								aria-haspopup="true"
								on:click={toggleMenu}
							>
								<span class="sr-only">Ouvrir le menu utilisateur</span>
								<div class="h-8 w-8 rounded-full bg-[#0082C3] flex items-center justify-center text-white">
									{#if $currentUser?.first_name}
										{$currentUser.first_name.charAt(0).toUpperCase()}
									{:else}
										<span class="material-icons">person</span>
									{/if}
								</div>
							</button>
						</div>
						
						{#if isMenuOpen}
							<div 
								class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" 
								role="menu" 
								aria-orientation="vertical" 
								aria-labelledby="user-menu-button" 
								tabindex="-1"
							>
								<a 
									href="/profile" 
									class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
									role="menuitem" 
									tabindex="-1" 
									id="user-menu-item-0"
									on:click={closeMenu}
								>
									Mon profil
								</a>
								<a 
									href="/onboarding" 
									class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
									role="menuitem" 
									tabindex="-1" 
									id="user-menu-item-1"
									on:click={closeMenu}
								>
									Mes préférences
								</a>
								<button 
									class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
									role="menuitem" 
									tabindex="-1" 
									id="user-menu-item-2"
									on:click={handleSignOut}
								>
									Déconnexion
								</button>
							</div>
						{/if}
					</div>
				</div>
				<div class="-mr-2 flex items-center sm:hidden">
					<!-- Bouton menu mobile -->
					<button 
						type="button" 
						class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0082C3]" 
						aria-controls="mobile-menu" 
						aria-expanded={isMenuOpen}
						on:click={toggleMenu}
					>
						<span class="sr-only">Ouvrir le menu principal</span>
						<span class="material-icons">{isMenuOpen ? 'close' : 'menu'}</span>
					</button>
				</div>
			</div>
		</div>
		
		<!-- Menu mobile -->
		{#if isMenuOpen}
			<div class="sm:hidden" id="mobile-menu" style="z-index: 9999; position: relative;">
				<div class="pt-2 pb-3 space-y-1">
					<a 
						href="/" 
						class="block pl-3 pr-4 py-2 border-l-4 {$page.url.pathname === '/' ? 'border-[#0082C3] text-[#0082C3] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}"
						on:click={closeMenu}
					>
						Accueil
					</a>
					<a 
						href="/routes" 
						class="block pl-3 pr-4 py-2 border-l-4 {$page.url.pathname.startsWith('/routes') ? 'border-[#0082C3] text-[#0082C3] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}"
						on:click={closeMenu}
					>
						Parcours
					</a>
					<a 
						href="/map" 
						class="block pl-3 pr-4 py-2 border-l-4 {$page.url.pathname === '/map' ? 'border-[#0082C3] text-[#0082C3] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}"
						on:click={closeMenu}
					>
						Carte
					</a>
					<a 
						href="/favorites" 
						class="block pl-3 pr-4 py-2 border-l-4 {$page.url.pathname === '/favorites' ? 'border-[#0082C3] text-[#0082C3] bg-blue-50' : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'}"
						on:click={closeMenu}
					>
						Favoris
					</a>
				</div>
				<div class="pt-4 pb-3 border-t border-gray-200">
					<div class="flex items-center px-4">
						<div class="flex-shrink-0">
							<div class="h-10 w-10 rounded-full bg-[#0082C3] flex items-center justify-center text-white">
								{#if $currentUser?.first_name}
									{$currentUser.first_name.charAt(0).toUpperCase()}
								{:else}
									<span class="material-icons">person</span>
								{/if}
							</div>
						</div>
						<div class="ml-3">
							<div class="text-base font-medium text-gray-800">
								{$currentUser?.first_name || 'Utilisateur'}
							</div>
							<div class="text-sm font-medium text-gray-500">
								{$currentUser?.email || ''}
							</div>
						</div>
					</div>
					<div class="mt-3 space-y-1">
						<a 
							href="/profile" 
							class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100" 
							on:click={closeMenu}
						>
							Mon profil
						</a>
						<a 
							href="/onboarding" 
							class="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100" 
							on:click={closeMenu}
						>
							Mes préférences
						</a>
						<button 
							class="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100" 
							on:click={handleSignOut}
						>
							Déconnexion
						</button>
					</div>
				</div>
			</div>
		{/if}
	</header>
	
	<!-- Espace pour la barre de navigation -->
	<div class="h-16"></div>
{/if}

<main class={showNavigation ? 'pb-16' : ''}>
	<slot />
</main>

{#if showNavigation}
	<!-- Navigation inférieure mobile -->
	<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-[9999]">
		<div class="grid grid-cols-4 h-16">
			<a 
				href="/" 
				class="flex flex-col items-center justify-center text-xs {$page.url.pathname === '/' ? 'text-[#0082C3]' : 'text-gray-500'}"
			>
				<span class="material-icons">{$page.url.pathname === '/' ? 'home' : 'home'}</span>
				<span>Accueil</span>
			</a>
			<a 
				href="/routes" 
				class="flex flex-col items-center justify-center text-xs {$page.url.pathname.startsWith('/routes') ? 'text-[#0082C3]' : 'text-gray-500'}"
			>
				<span class="material-icons">{$page.url.pathname.startsWith('/routes') ? 'hiking' : 'hiking'}</span>
				<span>Parcours</span>
			</a>
			<a 
				href="/map" 
				class="flex flex-col items-center justify-center text-xs {$page.url.pathname === '/map' ? 'text-[#0082C3]' : 'text-gray-500'}"
			>
				<span class="material-icons">{$page.url.pathname === '/map' ? 'map' : 'map'}</span>
				<span>Carte</span>
			</a>
			<a 
				href="/favorites" 
				class="flex flex-col items-center justify-center text-xs {$page.url.pathname === '/favorites' ? 'text-[#0082C3]' : 'text-gray-500'}"
			>
				<span class="material-icons">{$page.url.pathname === '/favorites' ? 'favorite' : 'favorite_border'}</span>
				<span>Favoris</span>
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
