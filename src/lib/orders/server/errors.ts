export class ProductUnavailableError extends Error {
  constructor(public readonly productIds: string[]) {
    super('Produits indisponibles');
    this.name = 'ProductUnavailableError';
  }
}

export type CheckoutConflictReason = 'alreadyProcessed' | 'inProgress';

export class CheckoutConflictError extends Error {
  constructor(public readonly reason: CheckoutConflictReason, public readonly orderNumber: number) {
    super(`Conflit de checkout : ${reason}`);
    this.name = 'CheckoutConflictError';
  }
}

export class PaymentProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'PaymentProviderError';
  }
}