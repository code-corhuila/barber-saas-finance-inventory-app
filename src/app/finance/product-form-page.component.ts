import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonInput, IonSpinner } from '@ionic/angular/standalone';
import { userMessage } from '../shell-context';
import { PAGE_STYLES } from '../ui/styles';
import { FinanceInventoryApi } from './finance-inventory-api';
import { type ProductForm, validateProduct } from './rules';

/**
 * Create a product with its initial stock (`/finance/products/new`) or edit one (`.../:id/edit`). An
 * edit never touches the stock: it only changes through entries and exits (DEC-INV-01).
 */
@Component({
  selector: 'fi-product-form-page',
  imports: [RouterLink, IonButton, IonInput, IonSpinner],
  template: `
    <section class="page">
      <a class="back" [routerLink]="id() ? ['/finance/products', id()] : '/finance/products'">‹ {{ id() ? 'Producto' : 'Inventario' }}</a>
      <h1>{{ id() ? 'Editar producto' : 'Nuevo producto' }}</h1>
      @if (loading()) { <div class="center"><ion-spinner aria-label="Cargando" /></div> }
      @else {
        <div class="field">
          <ion-input label="Nombre" labelPlacement="stacked" placeholder="Shampoo mentolado" [maxlength]="120"
                     [value]="form().name" (ionInput)="set('name', $event.detail.value)" />
          @if (errors().name) { <p class="field-error">{{ errors().name }}</p> }
        </div>
        <div class="field">
          <ion-input label="Unidad" labelPlacement="stacked" placeholder="ml, unidad, g" [maxlength]="20"
                     [value]="form().unit" (ionInput)="set('unit', $event.detail.value)" />
          @if (errors().unit) { <p class="field-error">{{ errors().unit }}</p> }
        </div>
        @if (!id()) {
          <div class="field">
            <ion-input label="Stock inicial" labelPlacement="stacked" inputmode="decimal" placeholder="2000"
                       [value]="form().stock" (ionInput)="set('stock', $event.detail.value)" />
            @if (errors().stock) { <p class="field-error">{{ errors().stock }}</p> }
          </div>
        }
        <div class="field">
          <ion-input label="Alerta de stock mínimo" labelPlacement="stacked" inputmode="decimal" placeholder="500"
                     [value]="form().minStock" (ionInput)="set('minStock', $event.detail.value)" />
          <p class="hint">Avisa cuando el stock llega a este valor. Con 0, solo cuando se agota.</p>
          @if (errors().minStock) { <p class="field-error">{{ errors().minStock }}</p> }
        </div>
        <div class="field">
          <ion-input label="Descripción (opcional)" labelPlacement="stacked" [maxlength]="255"
                     [value]="form().description" (ionInput)="set('description', $event.detail.value)" />
          @if (errors().description) { <p class="field-error">{{ errors().description }}</p> }
        </div>
        @if (id()) { <p class="hint">El stock cambia solo con entradas y salidas, desde el detalle del producto.</p> }
        @if (saveError()) { <p class="error" role="alert">{{ saveError() }}</p> }
        <ion-button expand="block" [disabled]="saving()" (click)="save()">Guardar</ion-button>
      }
    </section>
  `,
  styles: PAGE_STYLES,
})
export class ProductFormPageComponent implements OnInit {
  private readonly api = inject(FinanceInventoryApi);
  private readonly router = inject(Router);
  /** The `:id` of the route; absent when creating. */
  readonly id = input<string>();
  readonly form = signal<ProductForm>({ name: '', unit: '', stock: '', minStock: '0', description: '' });
  readonly errors = signal<Partial<Record<keyof ProductForm, string>>>({});
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  /** One key per form: retrying the same creation does not create two products (norm 5.3.8). */
  private readonly idempotencyKey = crypto.randomUUID();

  ngOnInit(): void {
    void this.load();
  }

  set(field: keyof ProductForm, value: string | null | undefined): void {
    this.form.update((f) => ({ ...f, [field]: value ?? '' }));
  }

  private async load(): Promise<void> {
    const productId = this.id();
    if (!productId) return;
    this.loading.set(true);
    try {
      const p = await this.api.getProduct(productId);
      this.form.set({ name: p.name, unit: p.unit, stock: String(p.currentStock), minStock: String(p.minStockAlert),
        description: p.description ?? '' });
    } catch (err) {
      this.saveError.set(userMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const productId = this.id();
    const { errors, request } = validateProduct(this.form(), !productId);
    this.errors.set(errors);
    if (!request) return;
    this.saving.set(true);
    this.saveError.set('');
    try {
      if (productId) {
        const { currentStock: _stock, ...edit } = request;
        await this.api.updateProduct(productId, edit);
        await this.router.navigate(['/finance/products', productId]);
      } else {
        const created = await this.api.createProduct(request, this.idempotencyKey);
        await this.router.navigate(['/finance/products', created.id]);
      }
    } catch (err) {
      this.saveError.set(userMessage(err));
    } finally {
      this.saving.set(false);
    }
  }
}
