export interface CheckoutRequest {
  orderId: string;
  customerId: string;
  amountCents: number;
  idempotencyKey: string;
  paymentToken: string;
  lines: CheckoutLine[];
}

export interface CheckoutLine {
  sku: string;
  quantity: number;
  unitPriceCents: number;
}

export type CheckoutResult =
  | { status: 201; orderId: string }
  | { status: 202; orderId: string }
  | { status: 429; retryAfterSeconds: number };

export interface RateLimiter {
  isOverloaded(customerId: string): Promise<boolean>;
}

export interface OrderGateway {
  create(request: CheckoutRequest): Promise<void>;
}

export interface InventoryGateway {
  reserve(orderId: string, lines: CheckoutLine[]): Promise<string>;
  release(reservationId: string): Promise<void>;
}

export interface PaymentGateway {
  authorize(input: { orderId: string; paymentToken: string; amountCents: number }): Promise<string>;
  void(authorizationId: string): Promise<void>;
}

export interface OrderRepository {
  insert(order: PersistedOrder): Promise<void>;
  exists(orderId: string): Promise<boolean>;
}

export interface PersistedOrder {
  orderId: string;
  customerId: string;
  amountCents: number;
  reservationId: string;
  authorizationId: string;
  createdAt: string;
}

export interface OrderQueue {
  enqueue(message: QueuedOrder): Promise<void>;
}

export interface QueuedOrder {
  request: CheckoutRequest;
  acceptedAt: string;
  reason: 'capacity';
}

export interface CheckoutIdempotency {
  claim(key: string): Promise<'claimed' | 'duplicate'>;
  release(key: string): Promise<void>;
}

export interface CheckoutAudit {
  record(event: CheckoutAuditEvent): Promise<void>;
}

export type CheckoutAuditEvent =
  | { type: 'checkout.created'; orderId: string }
  | { type: 'checkout.rejected'; orderId: string; reason: 'capacity' }
  | { type: 'checkout.deferred'; orderId: string; reason: 'capacity' }
  | { type: 'checkout.duplicate'; orderId: string; idempotencyKey: string };

export interface Clock {
  now(): Date;
}
