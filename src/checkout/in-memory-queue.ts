import type { OrderQueue, QueuedOrder } from './types.js';

export class InMemoryOrderQueue implements OrderQueue {
  private readonly pending: QueuedOrder[] = [];

  async enqueue(message: QueuedOrder): Promise<void> {
    this.pending.push(structuredClone(message));
  }

  take(): QueuedOrder | undefined {
    return this.pending.shift();
  }

  size(): number {
    return this.pending.length;
  }
}

