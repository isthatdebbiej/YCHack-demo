import { describe, expect, it, vi } from 'vitest';
import { PaymentDeclinedError, PaymentProviderTimeoutError } from '../src/checkout/payment-errors.js';
import { RetryingPaymentGateway } from '../src/checkout/payment-retry.js';

const authorization = {
  orderId: 'order-123',
  paymentToken: 'payment-token-7',
  amountCents: 4999,
};

describe('RetryingPaymentGateway', () => {
  it('recovers from an ambiguous timeout by submitting authorization again', async () => {
    const provider = {
      authorize: vi.fn()
        .mockRejectedValueOnce(new PaymentProviderTimeoutError('provider-request-1'))
        .mockResolvedValueOnce('authorization-2'),
      void: vi.fn(),
    };
    const sleeper = { wait: vi.fn() };
    const gateway = new RetryingPaymentGateway(
      provider,
      { maximumAttempts: 3, initialDelayMs: 100 },
      sleeper,
    );

    await expect(gateway.authorize(authorization)).resolves.toBe('authorization-2');
    expect(provider.authorize).toHaveBeenCalledTimes(2);
    expect(provider.authorize).toHaveBeenNthCalledWith(1, authorization);
    expect(provider.authorize).toHaveBeenNthCalledWith(2, authorization);
    expect(sleeper.wait).toHaveBeenCalledWith(100);
  });

  it('uses exponential delays across repeated provider timeouts', async () => {
    const provider = {
      authorize: vi.fn()
        .mockRejectedValueOnce(new PaymentProviderTimeoutError('provider-request-1'))
        .mockRejectedValueOnce(new PaymentProviderTimeoutError('provider-request-2'))
        .mockResolvedValueOnce('authorization-3'),
      void: vi.fn(),
    };
    const sleeper = { wait: vi.fn() };
    const gateway = new RetryingPaymentGateway(
      provider,
      { maximumAttempts: 3, initialDelayMs: 100 },
      sleeper,
    );

    await expect(gateway.authorize(authorization)).resolves.toBe('authorization-3');
    expect(sleeper.wait.mock.calls).toEqual([[100], [200]]);
  });

  it('does not retry an explicit decline', async () => {
    const provider = {
      authorize: vi.fn().mockRejectedValue(new PaymentDeclinedError('insufficient_funds')),
      void: vi.fn(),
    };
    const gateway = new RetryingPaymentGateway(provider, { maximumAttempts: 3, initialDelayMs: 100 });

    await expect(gateway.authorize(authorization)).rejects.toThrow('insufficient_funds');
    expect(provider.authorize).toHaveBeenCalledTimes(1);
  });

  it('stops after the configured attempt limit', async () => {
    const provider = {
      authorize: vi.fn().mockRejectedValue(new PaymentProviderTimeoutError('provider-request')), 
      void: vi.fn(),
    };
    const sleeper = { wait: vi.fn() };
    const gateway = new RetryingPaymentGateway(
      provider,
      { maximumAttempts: 3, initialDelayMs: 10 },
      sleeper,
    );

    await expect(gateway.authorize(authorization)).rejects.toBeInstanceOf(PaymentProviderTimeoutError);
    expect(provider.authorize).toHaveBeenCalledTimes(3);
    expect(sleeper.wait.mock.calls).toEqual([[10], [20]]);
  });
});

