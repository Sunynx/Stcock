export class MemoryCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; revalidating: boolean }>();
  private ttlMs: number;
  private swrMs: number;
  private intervalId: ReturnType<typeof setInterval>;

  constructor(ttlMs: number = 60000, swrMs: number = 300000, cleanupMs: number = 600000) {
    this.ttlMs = ttlMs;
    this.swrMs = swrMs;
    
    this.intervalId = setInterval(() => this.cleanup(), cleanupMs);
    
    // @ts-ignore - unref is available in Node.js
    if (this.intervalId.unref) {
      // @ts-ignore
      this.intervalId.unref();
    }
  }

  async getOrUpdate(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const item = this.cache.get(key);

    if (item) {
      const age = now - item.timestamp;
      
      // If fresh, return immediately
      if (age < this.ttlMs) {
        return item.data;
      }
      
      // If stale but within SWR window, return stale data and revalidate in background
      if (age < this.ttlMs + this.swrMs) {
        if (!item.revalidating) {
          item.revalidating = true;
          // Background revalidation
          fetcher()
            .then(data => {
              this.cache.set(key, { data, timestamp: Date.now(), revalidating: false });
            })
            .catch(err => {
              console.error(`Background revalidation failed for key ${key}:`, err);
              item.revalidating = false;
            });
        }
        return item.data;
      }
    }

    // Cache miss or fully expired, fetch synchronously
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now(), revalidating: false });
    return data;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttlMs + this.swrMs && !item.revalidating) {
        this.cache.delete(key);
      }
    }
  }
}
