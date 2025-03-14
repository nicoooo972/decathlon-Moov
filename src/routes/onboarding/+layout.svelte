<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  // Fonction pour bloquer le scroll
  onMount(() => {
    // Vérifier si le code s'exécute dans un navigateur
    if (browser) {
      // Sauvegarder la position de défilement actuelle
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      // Appliquer le style directement au body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.touchAction = 'none';
      
      // Empêcher les événements de défilement
      const preventDefault = (e: Event) => e.preventDefault();
      document.addEventListener('wheel', preventDefault, { passive: false });
      document.addEventListener('touchmove', preventDefault, { passive: false });
      
      return () => {
        // Nettoyer lors du démontage
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.touchAction = '';
        window.scrollTo(0, scrollPosition);
        
        document.removeEventListener('wheel', preventDefault);
        document.removeEventListener('touchmove', preventDefault);
      };
    }
    
    // Retourner une fonction vide si pas dans un navigateur
    return () => {};
  });
</script>

<svelte:head>
  <style>
    /* Cacher la navbar sur toutes les pages d'onboarding */
    nav {
      display: none !important;
    }
    
    /* Empêcher le scroll sur les pages d'onboarding */
    html, body {
      overflow: hidden !important;
      height: 100% !important;
      position: fixed !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      touch-action: none !important;
      overscroll-behavior: none !important;
      -webkit-overflow-scrolling: none !important;
    }
    
    /* Désactiver tous les éléments scrollables */
    * {
      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
    }
    
    /* Cacher les barres de défilement */
    *::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    
    /* Empêcher le scroll sur les éléments interactifs */
    input, textarea, select, button {
      touch-action: manipulation !important;
    }
  </style>
</svelte:head>

<slot /> 