// Vérifie si l'application est installée
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

// Vérifie si le service worker est supporté
export function isServiceWorkerSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'serviceWorker' in navigator;
}

// Vérifie si l'application est en ligne
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

// Enregistre un écouteur pour les changements de statut en ligne/hors ligne
export function registerNetworkStatusListeners(
  onlineCallback: () => void,
  offlineCallback: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => onlineCallback();
  const handleOffline = () => offlineCallback();
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Retourne une fonction pour nettoyer les écouteurs
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
} 