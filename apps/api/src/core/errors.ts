export class OrderNotFoundError extends Error {
  constructor(readonly orderId: string) {
    super(`Order ${orderId} not found`);
    this.name = 'OrderNotFoundError';
  }
}
