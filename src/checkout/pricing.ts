import type { CheckoutLine } from './types.js';

export function calculateTotal(lines: CheckoutLine[]): number {
  return lines.reduce((total, line) => total + line.quantity * line.unitPriceCents, 0);
}

export function assertPriceSnapshot(lines: CheckoutLine[], expectedAmountCents: number): void {
  const calculated = calculateTotal(lines);
  if (calculated !== expectedAmountCents) {
    throw new Error(`price snapshot mismatch: expected ${expectedAmountCents}, calculated ${calculated}`);
  }
}

