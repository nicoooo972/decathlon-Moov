<script lang="ts">
  import { notification } from '$lib/stores/app-store';
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  
  let timeoutId: ReturnType<typeof setTimeout>;
  
  onMount(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
  
  $: if ($notification && $notification.timeout) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      notification.set(null);
    }, $notification.timeout);
  }
  
  function getIcon(type: 'success' | 'error' | 'info') {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }
  
  function getColor(type: 'success' | 'error' | 'info') {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }
</script>

{#if $notification}
  <div
    class="fixed top-4 right-4 z-50 max-w-md"
    in:fly={{ y: -20, duration: 300 }}
    out:fade={{ duration: 200 }}
  >
    <div class="p-4 rounded-md shadow-md border {getColor($notification.type)}">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="material-icons">{getIcon($notification.type)}</span>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{$notification.message}</p>
        </div>
        <div class="ml-auto pl-3">
          <button
            type="button"
            class="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            on:click={() => notification.set(null)}
          >
            <span class="sr-only">Fermer</span>
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if} 