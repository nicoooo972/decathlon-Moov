<!-- tracks/+page.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import type { Track } from '$lib/types';
    
    let tracks: Track[] = [];
    let isLoading = true;
    
    onMount(async () => {
        try {
            const { data, error } = await supabase
                .from('tracks')
                .select(`
                    *,
                    route:routes (
                        name,
                        distance,
                        elevation_gain
                    )
                `)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            tracks = data || [];
        } catch (error) {
            console.error('Error loading tracks:', error);
        } finally {
            isLoading = false;
        }
    });
    
    function formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    
    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
</script>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Mes trajets</h1>
    
    {#if isLoading}
        <div class="flex justify-center items-center h-32">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0082C3]"></div>
        </div>
    {:else if tracks.length === 0}
        <div class="text-center py-12">
            <p class="text-gray-600">Vous n'avez pas encore enregistré de trajet.</p>
        </div>
    {:else}
        <div class="grid gap-6">
            {#each tracks as track}
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h2 class="text-xl font-semibold mb-1">
                                {track.route?.name || 'Trajet sans itinéraire'}
                            </h2>
                            <p class="text-gray-500">{formatDate(track.created_at)}</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div class="text-sm text-gray-500">Distance</div>
                            <div class="text-lg font-semibold">
                                {((track.distance || 0) / 1000).toFixed(2)} km
                            </div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Durée</div>
                            <div class="text-lg font-semibold">
                                {formatDuration(track.duration || 0)}
                            </div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Vitesse moyenne</div>
                            <div class="text-lg font-semibold">
                                {track.average_speed ? (track.average_speed * 3.6).toFixed(1) : '0'} km/h
                            </div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Dénivelé</div>
                            <div class="text-lg font-semibold">
                                {track.elevation_gain?.toFixed(0) || '0'} m
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div> 