import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { type Http, FinanceInventoryCalls } from './finance-inventory-calls';
import { formatCop, formatQuantity, monthOf, parseQuantity, pesosToCents, validateProduct, validateRecord } from './rules';

function fakeHttp() {
  const http = { get: vi.fn(() => of({})), post: vi.fn(() => of({})), put: vi.fn(() => of({})) };
  return { http, calls: new FinanceInventoryCalls(http as unknown as Http) };
}

const options = (call: unknown[], i = 1) => call[i] as { params?: Record<string, unknown>; headers?: Record<string, string> };

describe('finance-inventory calls', () => {
  it('lists a period of records and its summary through the relative /api path the shell completes', async () => {
    const { http, calls } = fakeHttp();
    await calls.listRecords('2026-10-01', '2026-10-31', null);
    await calls.listRecords('2026-10-01', '2026-10-31', 'EXPENSE', 2);
    await calls.summary('2026-10-01', '2026-10-31');
    expect(http.get.mock.calls[0]![0]).toBe('/api/v1/finance/records');
    expect(options(http.get.mock.calls[0]!).params).toEqual({ from: '2026-10-01', to: '2026-10-31', page: 1, limit: 50 });
    expect(options(http.get.mock.calls[1]!).params).toEqual({ from: '2026-10-01', to: '2026-10-31', page: 2, limit: 50, type: 'EXPENSE' });
    expect(http.get.mock.calls[2]![0]).toBe('/api/v1/finance/summary');
  });

  it('creates records, products and movements with the Idempotency-Key of the form', async () => {
    const { http, calls } = fakeHttp();
    await calls.createRecord({ type: 'INCOME', category: 'Cortes', amountCents: 2500000, recordDate: '2026-10-07' }, 'key-1');
    await calls.createProduct({ name: 'Shampoo', unit: 'ml', currentStock: 2000, minStockAlert: 500 }, 'key-2');
    await calls.move('p/1', { movementType: 'OUT', quantity: 250 }, 'key-3');
    expect(http.post.mock.calls[0]![0]).toBe('/api/v1/finance/records');
    expect(options(http.post.mock.calls[0]!, 2).headers).toEqual({ 'Idempotency-Key': 'key-1' });
    expect(http.post.mock.calls[1]![0]).toBe('/api/v1/inventory/products');
    expect(http.post.mock.calls[2]![0]).toBe('/api/v1/inventory/products/p%2F1/movements');
    expect(options(http.post.mock.calls[2]!, 2).headers).toEqual({ 'Idempotency-Key': 'key-3' });
  });

  it('filters products by alert only when asked and edits without the stock', async () => {
    const { http, calls } = fakeHttp();
    await calls.listProducts(null);
    await calls.listProducts(true);
    await calls.updateProduct('p1', { name: 'Shampoo', unit: 'ml', minStockAlert: 300 });
    expect(options(http.get.mock.calls[0]!).params).toEqual({ limit: 100 });
    expect(options(http.get.mock.calls[1]!).params).toEqual({ limit: 100, lowStock: true });
    expect(http.put).toHaveBeenCalledWith('/api/v1/inventory/products/p1', { name: 'Shampoo', unit: 'ml', minStockAlert: 300 });
  });
});

describe('finance-inventory rules', () => {
  it('reads whole pesos as cents and refuses zero, negatives and decimals (FR-017)', () => {
    expect(pesosToCents('25.000')).toBe(2_500_000);
    expect(pesosToCents('0')).toBeNull();
    expect(pesosToCents('-5')).toBeNull();
    expect(pesosToCents('25000,5')).toBeNull();
    expect(formatCop(-120_000)).toBe('- $ 1.200');
  });

  it('reads quantities with at most two decimals and shows them in their unit', () => {
    expect(parseQuantity('2,5')).toBe(2.5);
    expect(parseQuantity('1.005')).toBeNull();
    expect(parseQuantity('-1')).toBeNull();
    expect(formatQuantity(2000, 'ml')).toBe('2000 ml');
    expect(formatQuantity(449.5, 'ml')).toBe('449.50 ml');
  });

  it('takes the calendar month', () => {
    expect(monthOf(new Date(2026, 1, 10))).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });

  it('validates the record form field by field', () => {
    const ok = validateRecord({ type: 'EXPENSE', category: ' Insumos ', pesos: '85.000', description: '', recordDate: '2026-10-07' });
    expect(ok.request).toEqual({ type: 'EXPENSE', category: 'Insumos', amountCents: 8_500_000, recordDate: '2026-10-07' });
    const bad = validateRecord({ type: 'INCOME', category: '', pesos: '0', description: '', recordDate: '' });
    expect(Object.keys(bad.errors).sort()).toEqual(['category', 'pesos', 'recordDate']);
    expect(bad.request).toBeNull();
  });

  it('validates the product form and leaves the stock out when editing', () => {
    const form = { name: 'Shampoo', unit: 'ml', stock: '', minStock: '500', description: '' };
    expect(validateProduct(form, true).errors.stock).toBeDefined();
    expect(validateProduct(form, false).request).toEqual({ name: 'Shampoo', unit: 'ml', currentStock: 0, minStockAlert: 500 });
  });
});
