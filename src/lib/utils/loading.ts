export async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
  try {
    // TODO: Implement actual loading state management
    return await fn();
  } catch (error) {
    throw error;
  }
} 