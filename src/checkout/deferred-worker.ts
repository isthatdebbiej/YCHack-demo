import type { CheckoutAudit, Clock, OrderGateway, QueuedOrder } from './types.js';

/**
 * Replays accepted checkout requests after capacity recovers. The worker has no
 * access to the original HTTP request's idempotency lease.
 */
export class DeferredCheckoutWorker {
  constructor(
    private readonly orders: OrderGateway,
    private readonly audit: CheckoutAudit,
    private readonly clock: Clock,
    private readonly maximumAgeMs = 5 * 60_000,
  ) {}

  async process(message: QueuedOrder): Promise<'created' | 'expired'> {
    const age = this.clock.now().getTime() - new Date(message.acceptedAt).getTime();
    if (age > this.maximumAgeMs) {
      await this.audit.record({ type: 'checkout.rejected', orderId: message.request.orderId, reason: 'capacity' });
      return 'expired';
    }

    await this.orders.create(message.request);
    await this.audit.record({ type: 'checkout.created', orderId: message.request.orderId });
    return 'created';
  }
}

