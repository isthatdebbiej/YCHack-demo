import { describe, expect, it, vi } from 'vitest';
import { submitOrder } from '../src/checkout/submit-order.js';
import { InMemoryCheckoutIdempotency } from '../src/checkout/idempotency.js';
import type { CheckoutRequest } from '../src/checkout/types.js';

const request: CheckoutRequest = {
  orderId: 'order-123',
  customerId: 'customer-7',
  amountCents: 4999,
  idempotencyKey: 'checkout-attempt-123',
  paymentToken: 'payment-token-7',
  lines: [{ sku: 'coffee-1kg', quantity: 1, unitPriceCents: 4999 }],
};

function dependencies() {
  return {
    orders: { create: vi.fn() },
    queue: { enqueue: vi.fn() },
    idempotency: new InMemoryCheckoutIdempotency(),
    audit: { record: vi.fn() },
  };
}

describe('submitOrder', () => {
  it('accepts an overloaded order for deferred processing', async () => {
    const { orders, queue, idempotency, audit } = dependencies();
    const result = await submitOrder(request, { isOverloaded: async () => true }, orders, queue, idempotency, audit);

    expect(result).toEqual({ status: 202, orderId: 'order-123' });
    expect(queue.enqueue).toHaveBeenCalledWith(expect.objectContaining({ request, reason: 'capacity' }));
    expect(audit.record).toHaveBeenCalledWith({ type: 'checkout.deferred', orderId: 'order-123', reason: 'capacity' });
    expect(orders.create).not.toHaveBeenCalled();
  });

  it('creates an order when capacity is available', async () => {
    const { orders, queue, idempotency, audit } = dependencies();
    const result = await submitOrder(request, { isOverloaded: async () => false }, orders, queue, idempotency, audit);

    expect(result).toEqual({ status: 201, orderId: 'order-123' });
    expect(orders.create).toHaveBeenCalledWith(request);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('suppresses a concurrent duplicate request', async () => {
    const { orders, queue, idempotency, audit } = dependencies();
    await idempotency.claim(request.idempotencyKey);

    const result = await submitOrder(request, { isOverloaded: async () => false }, orders, queue, idempotency, audit);

    expect(result.status).toBe(429);
    expect(orders.create).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ type: 'checkout.duplicate' }));
  });
});
