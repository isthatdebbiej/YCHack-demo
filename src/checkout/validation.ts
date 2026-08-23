import type { CheckoutRequest } from './types.js';

export function validateCheckout(request: CheckoutRequest): void {
  if (!request.orderId.trim()) throw new Error('orderId is required');
  if (!request.idempotencyKey.trim()) throw new Error('idempotencyKey is required');
  if (!Number.isSafeInteger(request.amountCents) || request.amountCents <= 0) {
    throw new Error('amountCents must be a positive integer');
  }
}

