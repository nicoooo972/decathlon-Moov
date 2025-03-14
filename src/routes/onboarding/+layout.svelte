<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { afterNavigate, beforeNavigate } from '$app/navigation';

  let styleElement: HTMLStyleElement | null = null;
  let scrollPosition = 0;
  let preventDefault: ((e: Event) => void) | null = null;

  // Fonction pour ajouter les styles de blocage de défilement
  function addNoScrollStyles() {
    if (!browser) return;
    
    // Créer un élément de style pour le blocage du défilement
    styleElement = document.createElement('style');
    styleElement.textContent = `
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
      
      * {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
      }
      
      *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      
      input, textarea, select, button {
        touch-action: manipulation !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Sauvegarder la position de défilement actuelle
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Appliquer le style directement au body
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';
    
    // Empêcher les événements de défilement
    preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('wheel', preventDefault, { passive: false });
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if(['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // Fonction pour supprimer les styles de blocage de défilement
  function removeNoScrollStyles() {
    if (!browser) return;
    
    // Supprimer l'élément de style
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
      styleElement = null;
    }
    
    // Restaurer les styles du body
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.touchAction = '';
    
    // Restaurer la position de défilement
    window.scrollTo(0, scrollPosition);
    
    // Supprimer les gestionnaires d'événements
    if (preventDefault) {
      document.removeEventListener('wheel', preventDefault);
      document.removeEventListener('touchmove', preventDefault);
      preventDefault = null;
    }
  }

  onMount(() => {
    addNoScrollStyles();
  });

  onDestroy(() => {
    removeNoScrollStyles();
  });

  // S'assurer que les styles sont supprimés lors de la navigation
  beforeNavigate(() => {
    removeNoScrollStyles();
  });
</script>

<svelte:head>
  <style>
    /* Cacher la navbar sur toutes les pages d'onboarding */
    nav {
      display: none !important;
    }
  </style>
</svelte:head>

<slot /> 