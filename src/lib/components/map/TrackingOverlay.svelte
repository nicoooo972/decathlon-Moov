<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { trackingSession, isTracking, stopTracking } from '$lib/services/tracking';
  import Button from '$lib/components/ui/button.svelte';
  import { fade, fly } from 'svelte/transition';
  import { showNotification } from '$lib/stores/app-store';
  import { get } from 'svelte/store';
  
  // Statistiques formatées
  let formattedDuration = '00:00:00';
  let formattedDistance = '0.0 km';
  let formattedSteps = '0';
  let poiName = '';
  
  // Intervalle pour mettre à jour les statistiques
  let updateInterval: ReturnType<typeof setInterval>;
  
  onMount(() => {
    // Mettre à jour les statistiques toutes les secondes
    updateInterval = setInterval(updateStats, 1000);
    
    // Récupérer le nom du POI
    trackingSession.subscribe(session => {
      if (session) {
        poiName = session.poiName || 'destination';
      }
    });
  });
  
  onDestroy(() => {
    // Nettoyer l'intervalle
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
  
  // Mettre à jour les statistiques affichées
  function updateStats() {
    const session = get(trackingSession);
    if (session && session.isActive) {
      // Calculer la durée
      const now = Date.now();
      const durationMs = now - session.startTime;
      formattedDuration = formatDuration(durationMs);
      
      // Formater la distance
      if (session.distance) {
        formattedDistance = formatDistance(session.distance);
      }
      
      // Formater le nombre de pas
      if (session.steps) {
        formattedSteps = session.steps.toLocaleString();
      }
    }
  }
  
  // Formater la durée en HH:MM:SS
  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  }
  
  // Formater la distance en km ou m
  function formatDistance(meters: number): string {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + ' km';
    } else {
      return Math.round(meters) + ' m';
    }
  }
  
  // Terminer le trajet
  async function handleStopTracking() {
    try {
      const success = await stopTracking();
      if (success) {
        showNotification('Trajet terminé et enregistré avec succès', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du suivi:', error);
      showNotification('Erreur lors de l\'arrêt du suivi', 'error');
    }
  }
</script>

{#if $isTracking}
  <div class="tracking-overlay" transition:fade={{ duration: 300 }}>
    <div class="tracking-card" transition:fly={{ y: 50, duration: 300 }}>
      <div class="tracking-header">
        <div class="tracking-title">
          <span class="material-icons recording-icon">fiber_manual_record</span>
          <h3>Trajet en cours</h3>
        </div>
        <div class="tracking-subtitle">
          Vers {poiName}
        </div>
      </div>
      
      <div class="tracking-stats">
        <div class="stat-item">
          <span class="material-icons">schedule</span>
          <div class="stat-value">{formattedDuration}</div>
          <div class="stat-label">Durée</div>
        </div>
        
        <div class="stat-item">
          <span class="material-icons">straighten</span>
          <div class="stat-value">{formattedDistance}</div>
          <div class="stat-label">Distance</div>
        </div>
        
        <div class="stat-item">
          <span class="material-icons">directions_walk</span>
          <div class="stat-value">{formattedSteps}</div>
          <div class="stat-label">Pas</div>
        </div>
      </div>
      
      <div class="tracking-actions">
        <div class="stop-button-wrapper">
          <Button 
            variant="primary" 
            on:click={handleStopTracking}
            fullWidth={true}
          >
            <span class="material-icons mr-1">stop</span>
            Terminer
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .tracking-overlay {
    position: absolute;
    bottom: 80px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
  }
  
  .tracking-card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 400px;
    overflow: hidden;
    pointer-events: auto;
  }
  
  .tracking-header {
    background-color: #0082C3;
    color: white;
    padding: 12px 16px;
  }
  
  .tracking-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .tracking-title h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .tracking-subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin-top: 4px;
  }
  
  .recording-icon {
    color: #ff4136;
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
  
  .tracking-stats {
    display: flex;
    justify-content: space-between;
    padding: 16px;
    background-color: #f8f9fa;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }
  
  .stat-item .material-icons {
    color: #0082C3;
    margin-bottom: 4px;
  }
  
  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .stat-label {
    font-size: 12px;
    color: #666;
  }
  
  .tracking-actions {
    padding: 12px 16px;
    display: flex;
    justify-content: center;
  }
  
  .stop-button-wrapper {
    width: 100%;
  }
  
  :global(.tracking-actions button) {
    background-color: #ff4136 !important;
    color: white !important;
    width: 100%;
  }
  
  :global(.tracking-actions button:hover) {
    background-color: #e03026 !important;
  }
</style> 