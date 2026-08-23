import { describe, expect, it, vi } from 'vitest';
import { CheckoutOrderProcessor } from '../src/checkout/order-processor.js';
import type { CheckoutRequest } from '../src/checkout/types.js';

const request: CheckoutRequest = {
  orderId: 'order-123', customerId: 'customer-7', amountCents: 4999,
  idempotencyKey: 'attempt-123', paymentToken: 'token-7',
  lines: [{ sku: 'coffee-1kg', quantity: 1, unitPriceCents: 4999 }],
};

function dependencies() {
  return {
    inventory: { reserve: vi.fn().mockResolvedValue('reservation-1'), release: vi.fn() },
    payments: { authorize: vi.fn().mockResolvedValue('authorization-1'), void: vi.fn() },
    orders: { exists: vi.fn().mockResolvedValue(false), insert: vi.fn() },
    clock: { now: () => new Date('2026-08-23T20:00:00.000Z') },
  };
}

describe('CheckoutOrderProcessor', () => {
  it('reserves inventory, authorizes payment, and persists the order', async () => {
    const deps = dependencies();
    await new CheckoutOrderProcessor(deps.inventory, deps.payments, deps.orders, deps.clock).create(request);

    expect(deps.inventory.reserve).toHaveBeenCalledWith('order-123', request.lines);
    expect(deps.payments.authorize).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 4999 }));
    expect(deps.orders.insert).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 'order-123', reservationId: 'reservation-1', authorizationId: 'authorization-1',
    }));
  });

  it('compensates payment and inventory when persistence fails', async () => {
    const deps = dependencies();
    deps.orders.insert.mockRejectedValue(new Error('database unavailable'));
    const processor = new CheckoutOrderProcessor(deps.inventory, deps.payments, deps.orders, deps.clock);

    await expect(processor.create(request)).rejects.toThrow('database unavailable');
    expect(deps.payments.void).toHaveBeenCalledWith('authorization-1');
    expect(deps.inventory.release).toHaveBeenCalledWith('reservation-1');
  });

  it('rejects a stale or tampered price snapshot before side effects', async () => {
    const deps = dependencies();
    const processor = new CheckoutOrderProcessor(deps.inventory, deps.payments, deps.orders, deps.clock);

    await expect(processor.create({ ...request, amountCents: 1 })).rejects.toThrow('price snapshot mismatch');
    expect(deps.inventory.reserve).not.toHaveBeenCalled();
  });
});

