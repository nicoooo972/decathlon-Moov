<script lang="ts">
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'primary' | 'secondary' | 'outline' | 'text' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
  export let icon: string | null = null;
  
  // Classes CSS selon les variantes
  const variantClasses = {
    primary: 'bg-[#0082C3] hover:bg-[#006699] text-white',
    secondary: 'bg-[#FF6B00] hover:bg-[#E05A00] text-white',
    outline: 'bg-transparent border border-[#0082C3] text-[#0082C3] hover:bg-[#0082C3]/10',
    text: 'bg-transparent text-[#0082C3] hover:underline'
  };
  
  const sizeClasses = {
    sm: 'text-sm py-1 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-3 px-6'
  };
  
  $: classes = `
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    rounded-md font-medium transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-[#0082C3] focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
  `;
</script>

<button
  {type}
  class={classes}
  on:click
  disabled={disabled || loading}
>
  {#if loading}
    <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  
  {#if icon && !loading}
    <span class="material-icons text-base">{icon}</span>
  {/if}
  
  <slot />
</button> 