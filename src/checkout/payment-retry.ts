import { PaymentProviderTimeoutError } from './payment-errors.js';
import type { PaymentGateway } from './types.js';

export interface Sleeper {
  wait(milliseconds: number): Promise<void>;
}

export interface PaymentRetryOptions {
  maximumAttempts: number;
  initialDelayMs: number;
}

const defaultSleeper: Sleeper = {
  wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
};

/**
 * Smooths transient provider failures so checkout does not fail during short
 * network interruptions. Declines and validation failures are never retried.
 */
export class RetryingPaymentGateway implements PaymentGateway {
  constructor(
    private readonly provider: PaymentGateway,
    private readonly options: PaymentRetryOptions = { maximumAttempts: 3, initialDelayMs: 100 },
    private readonly sleeper: Sleeper = defaultSleeper,
  ) {}

  async authorize(input: Parameters<PaymentGateway['authorize']>[0]): Promise<string> {
    let delayMs = this.options.initialDelayMs;
    for (let attempt = 1; attempt <= this.options.maximumAttempts; attempt += 1) {
      try {
        return await this.provider.authorize(input);
      } catch (error) {
        const canRetry = error instanceof PaymentProviderTimeoutError
          && attempt < this.options.maximumAttempts;
        if (!canRetry) throw error;
        await this.sleeper.wait(delayMs);
        delayMs *= 2;
      }
    }
    throw new Error('payment authorization attempts exhausted');
  }

  void(authorizationId: string): Promise<void> {
    return this.provider.void(authorizationId);
  }
}

