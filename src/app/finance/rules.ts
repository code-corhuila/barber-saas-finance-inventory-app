import type { FinanceRecordRequest, FinanceRecordType, MovementType, NewProductRequest } from './types';

/** Money travels as integer cents of COP (ADR-010); people read and type whole pesos. */
const PESOS = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function formatCop(cents: number): string {
  const sign = cents < 0 ? '- ' : '';
  return `${sign}$ ${PESOS.format(Math.round(Math.abs(cents) / 100))}`;
}

/** "25000" or "25.000" → 2500000; zero, negative or anything that is not whole pesos → null (FR-017). */
export function pesosToCents(typed: string): number | null {
  const digits = typed.trim().replace(/\./g, '');
  if (!/^\d{1,11}$/.test(digits) || Number(digits) === 0) return null;
  return Number(digits) * 100;
}

/** "2.5" or "2,5" → 2.5, at most two decimals; null when it is not a quantity. */
export function parseQuantity(typed: string): number | null {
  const text = typed.trim().replace(',', '.');
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) return null;
  return Number(text);
}

/** "2000" or "2000.5" as the stock shows it: no decimals when there are none. */
export function formatQuantity(quantity: number, unit: string): string {
  return `${Number.isInteger(quantity) ? quantity : quantity.toFixed(2)} ${unit}`;
}

export const TYPE_LABEL: Record<FinanceRecordType, string> = { INCOME: 'Ingreso', EXPENSE: 'Gasto' };
export const MOVEMENT_LABEL: Record<MovementType, string> = { IN: 'Entrada', OUT: 'Salida' };

/** YYYY-MM-DD by the phone's calendar. */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The calendar month of the day, both ends inclusive. */
export function monthOf(today: Date = new Date()): { from: string; to: string } {
  return { from: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    to: isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)) };
}

export interface RecordForm {
  type: FinanceRecordType;
  category: string;
  pesos: string;
  description: string;
  recordDate: string;
}

type Errors<F> = Partial<Record<keyof F, string>>;

/** The record form against the contract's limits; an error per field, or the request to send. */
export function validateRecord(form: RecordForm): { errors: Errors<RecordForm>; request: FinanceRecordRequest | null } {
  const errors: Errors<RecordForm> = {};
  const category = form.category.trim();
  if (!category) errors.category = 'Escribe la categoría.';
  else if (category.length > 80) errors.category = 'Máximo 80 caracteres.';
  const amountCents = pesosToCents(form.pesos);
  if (amountCents === null) errors.pesos = 'Escribe un valor mayor que cero, en pesos y sin decimales.';
  if (form.description.trim().length > 255) errors.description = 'Máximo 255 caracteres.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.recordDate)) errors.recordDate = 'Elige la fecha.';
  if (Object.keys(errors).length > 0) return { errors, request: null };
  const description = form.description.trim();
  return { errors, request: { type: form.type, category, amountCents: amountCents as number, recordDate: form.recordDate,
    ...(description ? { description } : {}) } };
}

export interface ProductForm {
  name: string;
  unit: string;
  stock: string;
  minStock: string;
  description: string;
}

/** The product form; {@code withStock} false when editing, because the stock only moves (DEC-INV-01). */
export function validateProduct(form: ProductForm, withStock: boolean):
    { errors: Errors<ProductForm>; request: NewProductRequest | null } {
  const errors: Errors<ProductForm> = {};
  const name = form.name.trim();
  const unit = form.unit.trim();
  if (!name) errors.name = 'Escribe el nombre del producto.';
  else if (name.length > 120) errors.name = 'Máximo 120 caracteres.';
  if (!unit) errors.unit = 'Escribe la unidad (ml, unidad, g…).';
  else if (unit.length > 20) errors.unit = 'Máximo 20 caracteres.';
  const stock = withStock ? parseQuantity(form.stock) : 0;
  if (stock === null) errors.stock = 'Escribe la cantidad, con máximo dos decimales.';
  const minStockAlert = parseQuantity(form.minStock);
  if (minStockAlert === null) errors.minStock = 'Escribe el mínimo, con máximo dos decimales.';
  if (form.description.trim().length > 255) errors.description = 'Máximo 255 caracteres.';
  if (Object.keys(errors).length > 0) return { errors, request: null };
  const description = form.description.trim();
  return { errors, request: { name, unit, currentStock: stock as number, minStockAlert: minStockAlert as number,
    ...(description ? { description } : {}) } };
}
