import { writable } from 'svelte/store';

// Store pour gérer l'état de chargement
export const isLoading = writable<boolean>(false);

// Store pour gérer les erreurs
export const errorMessage = writable<string | null>(null);

// Store pour gérer les notifications
export const notification = writable<{
  message: string;
  type: 'success' | 'error' | 'info';
  timeout?: number;
} | null>(null);

// Fonction pour afficher une notification
export function showNotification(
  message: string, 
  type: 'success' | 'error' | 'info' = 'info', 
  timeout: number = 3000
) {
  notification.set({ message, type, timeout });
  
  if (timeout > 0) {
    setTimeout(() => {
      notification.set(null);
    }, timeout);
  }
}

// Fonction pour afficher une erreur
export function showError(message: string) {
  errorMessage.set(message);
  showNotification(message, 'error');
}

// Fonction pour effacer l'erreur
export function clearError() {
  errorMessage.set(null);
}

// Fonction pour gérer les opérations asynchrones avec état de chargement
export async function withLoading<T>(operation: () => Promise<T>): Promise<T> {
  isLoading.set(true);
  clearError();
  
  try {
    const result = await operation();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      showError(error.message);
    } else {
      showError('Une erreur est survenue');
    }
    throw error;
  } finally {
    isLoading.set(false);
  }
} 