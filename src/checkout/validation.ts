import type { CheckoutRequest } from './types.js';

export function validateCheckout(request: CheckoutRequest): void {
  if (!request.orderId.trim()) throw new Error('orderId is required');
  if (!request.idempotencyKey.trim()) throw new Error('idempotencyKey is required');
  if (!request.paymentToken.trim()) throw new Error('paymentToken is required');
  if (!request.lines.length) throw new Error('at least one checkout line is required');
  for (const line of request.lines) {
    if (!line.sku.trim() || !Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new Error('checkout lines require a sku and positive quantity');
    }
  }
  if (!Number.isSafeInteger(request.amountCents) || request.amountCents <= 0) {
    throw new Error('amountCents must be a positive integer');
  }
}
