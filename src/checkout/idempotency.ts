import type { CheckoutIdempotency } from './types.js';

/**
 * Models the request-lifetime idempotency lease used by the synchronous API.
 * Production implementations use a conditional write with a short TTL.
 */
export class InMemoryCheckoutIdempotency implements CheckoutIdempotency {
  private readonly active = new Set<string>();

  async claim(key: string): Promise<'claimed' | 'duplicate'> {
    if (this.active.has(key)) return 'duplicate';
    this.active.add(key);
    return 'claimed';
  }

  async release(key: string): Promise<void> {
    this.active.delete(key);
  }
}

