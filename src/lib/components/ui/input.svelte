<script lang="ts">
  export let type: 'text' | 'email' | 'password' | 'number' | 'tel' = 'text';
  export let name: string;
  export let label: string = '';
  export let placeholder: string = '';
  export let value: string = '';
  export let required: boolean = false;
  export let disabled: boolean = false;
  export let error: string = '';
  
  // Générer un ID unique pour l'input
  const id = `input-${Math.random().toString(36).substring(2, 9)}`;
</script>

<div class="mb-4">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {#if required}
        <span class="text-red-500">*</span>
      {/if}
    </label>
  {/if}
  
  <input
    {id}
    {type}
    {name}
    {placeholder}
    {required}
    {disabled}
    bind:value
    class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0082C3] 
    {error ? 'border-red-500' : 'border-gray-300'}"
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : undefined}
  />
  
  {#if error}
    <p id="{id}-error" class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div> 