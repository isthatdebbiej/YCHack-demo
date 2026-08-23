import type {
  CheckoutAudit,
  CheckoutIdempotency,
  CheckoutRequest,
  CheckoutResult,
  OrderGateway,
  OrderQueue,
  RateLimiter,
} from './types.js';
import { validateCheckout } from './validation.js';

/**
 * Checkout overload is explicit: reject the request and let the customer retry.
 * Orders must never be accepted for deferred processing.
 */
export async function submitOrder(
  request: CheckoutRequest,
  rateLimiter: RateLimiter,
  orders: OrderGateway,
  queue: OrderQueue,
  idempotency: CheckoutIdempotency,
  audit: CheckoutAudit,
): Promise<CheckoutResult> {
  validateCheckout(request);
  const claim = await idempotency.claim(request.idempotencyKey);
  if (claim === 'duplicate') {
    await audit.record({ type: 'checkout.duplicate', orderId: request.orderId, idempotencyKey: request.idempotencyKey });
    return { status: 429, retryAfterSeconds: 30 };
  }

  if (await rateLimiter.isOverloaded(request.customerId)) {
    await queue.enqueue({ request, acceptedAt: new Date().toISOString(), reason: 'capacity' });
    await idempotency.release(request.idempotencyKey);
    await audit.record({ type: 'checkout.deferred', orderId: request.orderId, reason: 'capacity' });
    return { status: 202, orderId: request.orderId };
  }

  try {
    await orders.create(request);
    await audit.record({ type: 'checkout.created', orderId: request.orderId });
    return { status: 201, orderId: request.orderId };
  } finally {
    await idempotency.release(request.idempotencyKey);
  }
}
