import { describe, expect, it, vi } from 'vitest';
import { createCheckoutOrderProcessor } from '../src/checkout/checkout-module.js';
import { PaymentProviderTimeoutError } from '../src/checkout/payment-errors.js';
import type { CheckoutRequest } from '../src/checkout/types.js';

const request: CheckoutRequest = {
  orderId: 'order-123', customerId: 'customer-7', amountCents: 4999,
  idempotencyKey: 'attempt-123', paymentToken: 'token-7',
  lines: [{ sku: 'coffee-1kg', quantity: 1, unitPriceCents: 4999 }],
};

describe('checkout module', () => {
  it('wires payment recovery into the order transaction', async () => {
    const inventory = { reserve: vi.fn().mockResolvedValue('reservation-1'), release: vi.fn() };
    const payments = {
      authorize: vi.fn()
        .mockRejectedValueOnce(new PaymentProviderTimeoutError('request-1'))
        .mockResolvedValueOnce('authorization-2'),
      void: vi.fn(),
    };
    const orders = { exists: vi.fn().mockResolvedValue(false), insert: vi.fn() };
    const processor = createCheckoutOrderProcessor({
      inventory,
      payments,
      orders,
      clock: { now: () => new Date('2026-08-23T20:00:00.000Z') },
      sleeper: { wait: vi.fn() },
      paymentRetry: { maximumAttempts: 3, initialDelayMs: 1 },
    });

    await processor.create(request);

    expect(payments.authorize).toHaveBeenCalledTimes(2);
    expect(orders.insert).toHaveBeenCalledWith(expect.objectContaining({ authorizationId: 'authorization-2' }));
  });
});
