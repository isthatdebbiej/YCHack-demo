export class PaymentProviderTimeoutError extends Error {
  readonly outcome = 'unknown' as const;

  constructor(readonly providerRequestId: string) {
    super(`payment provider timed out for ${providerRequestId}`);
    this.name = 'PaymentProviderTimeoutError';
  }
}

export class PaymentDeclinedError extends Error {
  constructor(readonly declineCode: string) {
    super(`payment declined: ${declineCode}`);
    this.name = 'PaymentDeclinedError';
  }
}

