import { describe, expect, it, vi } from 'vitest';
import { submitOrder } from '../src/checkout/submit-order.js';
import type { CheckoutRequest } from '../src/checkout/types.js';

const request: CheckoutRequest = {
  orderId: 'order-123',
  customerId: 'customer-7',
  amountCents: 4999,
};

describe('submitOrder', () => {
  it('rejects overload explicitly and does not create an order', async () => {
    const orders = { create: vi.fn() };
    const result = await submitOrder(request, { isOverloaded: async () => true }, orders);

    expect(result).toEqual({ status: 429, retryAfterSeconds: 30 });
    expect(orders.create).not.toHaveBeenCalled();
  });

  it('creates an order when capacity is available', async () => {
    const orders = { create: vi.fn() };
    const result = await submitOrder(request, { isOverloaded: async () => false }, orders);

    expect(result).toEqual({ status: 201, orderId: 'order-123' });
    expect(orders.create).toHaveBeenCalledWith(request);
  });
});

