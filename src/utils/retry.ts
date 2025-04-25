// Generic async retry helper for data fetching and other promises
export async function retry<T>(fn: () => Promise<T>, retries = 5, delayMs = 50): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
  throw lastError;
}
