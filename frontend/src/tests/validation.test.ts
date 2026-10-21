import { describe, it, expect } from 'vitest';

describe('Order Item Input Validation Logic', () => {
  function validateOrderItems(items: { sku: string; qty: number }[]): { valid: boolean; error?: string } {
    if (items.length === 0) {
      return { valid: false, error: 'Order must contain at least one item' };
    }

    const seen = new Set<string>();
    for (const item of items) {
      if (!item.sku || item.sku.trim() === '') {
        return { valid: false, error: 'SKU cannot be empty' };
      }
      if (item.qty <= 0 || !Number.isInteger(item.qty)) {
        return { valid: false, error: 'Quantity must be an integer greater than zero' };
      }
      if (seen.has(item.sku)) {
        return { valid: false, error: `Duplicate SKU '${item.sku}' in order items` };
      }
      seen.add(item.sku);
    }

    return { valid: true };
  }

  it('rejects empty order items array', () => {
    const result = validateOrderItems([]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Order must contain at least one item');
  });

  it('rejects duplicate SKUs within one order', () => {
    const result = validateOrderItems([
      { sku: 'QZ-CALA-001', qty: 2 },
      { sku: 'QZ-CALA-001', qty: 5 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Duplicate SKU');
  });

  it('rejects zero or negative quantities', () => {
    const result = validateOrderItems([
      { sku: 'QZ-STAT-002', qty: 0 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('greater than zero');
  });

  it('accepts valid distinct order items', () => {
    const result = validateOrderItems([
      { sku: 'QZ-CALA-001', qty: 2 },
      { sku: 'QZ-STAT-002', qty: 1 },
      { sku: 'ACC-ADHE-012', qty: 5 },
    ]);
    expect(result.valid).toBe(true);
  });
});