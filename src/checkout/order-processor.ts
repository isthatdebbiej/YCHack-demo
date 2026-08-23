import { assertPriceSnapshot } from './pricing.js';
import type {
  Clock,
  CheckoutRequest,
  InventoryGateway,
  OrderGateway,
  OrderRepository,
  PaymentGateway,
} from './types.js';

/**
 * Executes the synchronous checkout transaction. Inventory is reserved before
 * payment, and both side effects are compensated if persistence fails.
 */
export class CheckoutOrderProcessor implements OrderGateway {
  constructor(
    private readonly inventory: InventoryGateway,
    private readonly payments: PaymentGateway,
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
  ) {}

  async create(request: CheckoutRequest): Promise<void> {
    assertPriceSnapshot(request.lines, request.amountCents);
    if (await this.orders.exists(request.orderId)) return;

    const reservationId = await this.inventory.reserve(request.orderId, request.lines);
    let authorizationId: string | undefined;
    try {
      authorizationId = await this.payments.authorize({
        orderId: request.orderId,
        paymentToken: request.paymentToken,
        amountCents: request.amountCents,
      });
      await this.orders.insert({
        orderId: request.orderId,
        customerId: request.customerId,
        amountCents: request.amountCents,
        reservationId,
        authorizationId,
        createdAt: this.clock.now().toISOString(),
      });
    } catch (error) {
      if (authorizationId) await this.payments.void(authorizationId);
      await this.inventory.release(reservationId);
      throw error;
    }
  }
}

