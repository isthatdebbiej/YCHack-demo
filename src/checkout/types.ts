export interface CheckoutRequest {
  orderId: string;
  customerId: string;
  amountCents: number;
  idempotencyKey: string;
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
