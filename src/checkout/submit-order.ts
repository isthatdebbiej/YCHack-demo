import type { CheckoutRequest, CheckoutResult, OrderGateway, RateLimiter } from './types.js';

const RETRY_AFTER_SECONDS = 30;

/**
 * Checkout overload is explicit: reject the request and let the customer retry.
 * Orders must never be accepted for deferred processing.
 */
export async function submitOrder(
  request: CheckoutRequest,
  rateLimiter: RateLimiter,
  orders: OrderGateway,
): Promise<CheckoutResult> {
  if (await rateLimiter.isOverloaded(request.customerId)) {
    return { status: 429, retryAfterSeconds: RETRY_AFTER_SECONDS };
  }

  await orders.create(request);
  return { status: 201, orderId: request.orderId };
}

