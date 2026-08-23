import { describe, expect, it, vi } from 'vitest';
import { DeferredCheckoutWorker } from '../src/checkout/deferred-worker.js';
import type { QueuedOrder } from '../src/checkout/types.js';

const message: QueuedOrder = {
  acceptedAt: '2026-08-23T19:59:00.000Z', reason: 'capacity',
  request: {
    orderId: 'order-123', customerId: 'customer-7', amountCents: 4999,
    idempotencyKey: 'attempt-123', paymentToken: 'token-7',
    lines: [{ sku: 'coffee-1kg', quantity: 1, unitPriceCents: 4999 }],
  },
};

describe('DeferredCheckoutWorker', () => {
  it('creates a recently accepted queued order', async () => {
    const orders = { create: vi.fn() };
    const audit = { record: vi.fn() };
    const worker = new DeferredCheckoutWorker(orders, audit, { now: () => new Date('2026-08-23T20:00:00.000Z') });

    await expect(worker.process(message)).resolves.toBe('created');
    expect(orders.create).toHaveBeenCalledWith(message.request);
  });

  it('expires stale queued orders without charging the customer', async () => {
    const orders = { create: vi.fn() };
    const audit = { record: vi.fn() };
    const worker = new DeferredCheckoutWorker(orders, audit, { now: () => new Date('2026-08-23T20:10:00.000Z') });

    await expect(worker.process(message)).resolves.toBe('expired');
    expect(orders.create).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ type: 'checkout.rejected' }));
  });
});
