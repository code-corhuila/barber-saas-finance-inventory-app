import { Observable, firstValueFrom } from 'rxjs';
import type {
  FinanceRecord, FinanceRecordRequest, FinanceRecordType, FinanceSummary, InventoryMovement, InventoryProduct,
  MovementRequest, MovementResult, NewProductRequest, Page, ProductRequest,
} from './types';

/** The part of HttpClient this app uses: plain params and headers, so the calls test without Angular. */
export interface Http {
  get<T>(url: string, options?: { params?: Record<string, string | number | boolean> }): Observable<T>;
  post<T>(url: string, body: unknown, options?: { headers?: Record<string, string> }): Observable<T>;
  put<T>(url: string, body: unknown): Observable<T>;
}

const FINANCE = '/api/v1/finance';
const PRODUCTS = '/api/v1/inventory/products';
const id = (value: string) => encodeURIComponent(value);

/**
 * The calls of `finance-inventory-service.yaml`, all for `ADMIN_BARBERSHOP`. Relative '/api/...' URLs:
 * the shell's interceptor adds the gateway, the token and X-Correlation-Id. The barbershop is the token's.
 */
export class FinanceInventoryCalls {
  constructor(private readonly http: Http) {}

  /** A period is both dates inclusive; a type narrows it to income or expenses. */
  listRecords(from: string, to: string, type: FinanceRecordType | null, page = 1): Promise<Page<FinanceRecord>> {
    const params: Record<string, string | number> = { from, to, page, limit: 50, ...(type ? { type } : {}) };
    return firstValueFrom(this.http.get<Page<FinanceRecord>>(`${FINANCE}/records`, { params }));
  }

  /** Creation is idempotent: a retried form sends the same key (norm 5.3.8). */
  createRecord(request: FinanceRecordRequest, idempotencyKey: string): Promise<FinanceRecord> {
    return firstValueFrom(this.http.post<FinanceRecord>(`${FINANCE}/records`, request, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }));
  }

  summary(from: string, to: string): Promise<FinanceSummary> {
    return firstValueFrom(this.http.get<FinanceSummary>(`${FINANCE}/summary`, { params: { from, to } }));
  }

  /** {@code lowStock} null lists every product (FR-019). */
  listProducts(lowStock: boolean | null): Promise<Page<InventoryProduct>> {
    const params: Record<string, string | number | boolean> = { limit: 100, ...(lowStock === null ? {} : { lowStock }) };
    return firstValueFrom(this.http.get<Page<InventoryProduct>>(PRODUCTS, { params }));
  }

  getProduct(productId: string): Promise<InventoryProduct> {
    return firstValueFrom(this.http.get<InventoryProduct>(`${PRODUCTS}/${id(productId)}`));
  }

  createProduct(request: NewProductRequest, idempotencyKey: string): Promise<InventoryProduct> {
    return firstValueFrom(this.http.post<InventoryProduct>(PRODUCTS, request, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }));
  }

  /** Never the stock: it changes only through movements (DEC-INV-01). */
  updateProduct(productId: string, request: ProductRequest): Promise<InventoryProduct> {
    return firstValueFrom(this.http.put<InventoryProduct>(`${PRODUCTS}/${id(productId)}`, request));
  }

  listMovements(productId: string): Promise<Page<InventoryMovement>> {
    return firstValueFrom(this.http.get<Page<InventoryMovement>>(`${PRODUCTS}/${id(productId)}/movements`, {
      params: { limit: 50 },
    }));
  }

  /** An exit larger than the stock answers 422 and the shell's message says so. */
  move(productId: string, request: MovementRequest, idempotencyKey: string): Promise<MovementResult> {
    return firstValueFrom(this.http.post<MovementResult>(`${PRODUCTS}/${id(productId)}/movements`, request, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }));
  }
}
