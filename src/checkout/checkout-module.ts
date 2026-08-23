import { CheckoutOrderProcessor } from './order-processor.js';
import { RetryingPaymentGateway, type PaymentRetryOptions, type Sleeper } from './payment-retry.js';
import type { Clock, InventoryGateway, OrderRepository, PaymentGateway } from './types.js';

export interface CheckoutModuleDependencies {
  inventory: InventoryGateway;
  payments: PaymentGateway;
  orders: OrderRepository;
  clock: Clock;
  sleeper?: Sleeper;
  paymentRetry?: PaymentRetryOptions;
}

export function createCheckoutOrderProcessor(dependencies: CheckoutModuleDependencies): CheckoutOrderProcessor {
  const payments = new RetryingPaymentGateway(
    dependencies.payments,
    dependencies.paymentRetry,
    dependencies.sleeper,
  );
  return new CheckoutOrderProcessor(
    dependencies.inventory,
    payments,
    dependencies.orders,
    dependencies.clock,
  );
}

