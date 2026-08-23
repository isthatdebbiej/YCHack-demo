import type { CheckoutRequest, CheckoutResult, OrderGateway, OrderQueue, RateLimiter } from './types.js';

/**
 * Checkout overload is explicit: reject the request and let the customer retry.
 * Orders must never be accepted for deferred processing.
 */
export async function submitOrder(
  request: CheckoutRequest,
  rateLimiter: RateLimiter,
  orders: OrderGateway,
  queue: OrderQueue,
): Promise<CheckoutResult> {
  if (await rateLimiter.isOverloaded(request.customerId)) {
    await queue.enqueue(request);
    return { status: 202, orderId: request.orderId };
  }

  await orders.create(request);
  return { status: 201, orderId: request.orderId };
}
