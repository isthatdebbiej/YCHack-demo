import { describe, expect, it, vi } from 'vitest';
import { submitOrder } from '../src/checkout/submit-order.js';
import type { CheckoutRequest } from '../src/checkout/types.js';

const request: CheckoutRequest = {
  orderId: 'order-123',
  customerId: 'customer-7',
  amountCents: 4999,
};

describe('submitOrder', () => {
  it('accepts an overloaded order for deferred processing', async () => {
    const orders = { create: vi.fn() };
    const queue = { enqueue: vi.fn() };
    const result = await submitOrder(request, { isOverloaded: async () => true }, orders, queue);

    expect(result).toEqual({ status: 202, orderId: 'order-123' });
    expect(queue.enqueue).toHaveBeenCalledWith(request);
    expect(orders.create).not.toHaveBeenCalled();
  });

  it('creates an order when capacity is available', async () => {
    const orders = { create: vi.fn() };
    const queue = { enqueue: vi.fn() };
    const result = await submitOrder(request, { isOverloaded: async () => false }, orders, queue);

    expect(result).toEqual({ status: 201, orderId: 'order-123' });
    expect(orders.create).toHaveBeenCalledWith(request);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
});
