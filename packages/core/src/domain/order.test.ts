import { describe, expect, it } from 'vitest';
import { orderSchema, orderStatusSchema } from './order';

describe('orderStatusSchema', () => {
  it('accepts a known status', () => {
    expect(orderStatusSchema.parse('processing')).toBe('processing');
  });

  it('rejects an unknown status', () => {
    expect(() => orderStatusSchema.parse('shipped')).toThrow();
  });
});

describe('orderSchema', () => {
  it('rejects an order with no items', () => {
    const result = orderSchema.safeParse({
      id: '0f1b2c3d-4e5f-6071-8293-a4b5c6d7e8f9',
      customerId: 'cus_123',
      items: [],
      status: 'pending',
      totalCents: 0,
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});
