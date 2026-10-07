/** Types of `finance-inventory-service.yaml` 1.1.0 (`barber-saas-docs`). Money in cents (ADR-010). */

export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export type FinanceRecordType = 'INCOME' | 'EXPENSE';

export interface FinanceRecord {
  id: string;
  type: FinanceRecordType;
  category: string;
  amountCents: number;
  description: string | null;
  recordDate: string;
  relatedAppointmentId: string | null;
  createdAt: string;
}

export interface FinanceRecordRequest {
  type: FinanceRecordType;
  category: string;
  amountCents: number;
  description?: string;
  recordDate: string;
}

export interface FinanceSummary {
  from: string;
  to: string;
  totalIncomeCents: number;
  totalExpensesCents: number;
  netProfitCents: number;
}

/** Quantities are numbers with two decimals in the product's unit, not money (DEC-INV-01). */
export interface InventoryProduct {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  currentStock: number;
  minStockAlert: number;
  lowStock: boolean;
  createdAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  unit: string;
  minStockAlert: number;
}

export interface NewProductRequest extends ProductRequest {
  currentStock: number;
}

export type MovementType = 'IN' | 'OUT';

export interface InventoryMovement {
  id: string;
  productId: string;
  movementType: MovementType;
  quantity: number;
  reason: string | null;
  createdByUserId: string;
  createdAt: string;
}

export interface MovementRequest {
  movementType: MovementType;
  quantity: number;
  reason?: string;
}

export interface MovementResult {
  movement: InventoryMovement;
  product: InventoryProduct;
}
