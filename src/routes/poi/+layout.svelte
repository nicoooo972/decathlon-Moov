<script>
  import { onMount } from 'svelte';
  
  onMount(() => {
    // S'assurer que le défilement est activé
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.width = 'auto';
    document.body.style.height = 'auto';
    
    // Supprimer la classe map-page si elle existe
    document.body.classList.remove('map-page');
    
    return () => {
      // Réinitialiser les styles du body quand on quitte la page
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  });
</script>

<style>
  :global(body) {
    overflow: auto !important;
    position: static !important;
    width: auto !important;
    height: auto !important;
  }
</style>

<slot></slot> 