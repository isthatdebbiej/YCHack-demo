export interface CheckoutRequest {
  orderId: string;
  customerId: string;
  amountCents: number;
}

export type CheckoutResult =
  | { status: 201; orderId: string }
  | { status: 429; retryAfterSeconds: number };

export interface RateLimiter {
  isOverloaded(customerId: string): Promise<boolean>;
}

export interface OrderGateway {
  create(request: CheckoutRequest): Promise<void>;
}

