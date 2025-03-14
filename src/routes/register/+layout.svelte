<script>
  import { page } from '$app/stores';
</script>

<svelte:head>
  <style>
    /* Cacher la navbar sur toutes les pages d'inscription */
    nav {
      display: none !important;
    }
  </style>
</svelte:head>

<slot /> 