import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonInput, IonLabel, IonSegment, IonSegmentButton, IonSpinner } from '@ionic/angular/standalone';
import { userMessage } from '../shell-context';
import { PAGE_STYLES } from '../ui/styles';
import { FinanceInventoryApi } from './finance-inventory-api';
import { formatQuantity, MOVEMENT_LABEL, parseQuantity } from './rules';
import type { InventoryMovement, InventoryProduct, MovementType } from './types';

/**
 * A product, its stock and its movements (FR-018): register an entry or an exit. An exit larger than
 * the stock is refused by the API (422) and the screen says why (HU-INV-001 scenario 2).
 */
@Component({
  selector: 'fi-product-detail-page',
  imports: [RouterLink, IonButton, IonInput, IonLabel, IonSegment, IonSegmentButton, IonSpinner],
  template: `
    <section class="page">
      <a class="back" routerLink="/finance/products">‹ Inventario</a>
      @if (product(); as p) {
        <div class="head">
          <h1>{{ p.name }}</h1>
          <ion-button fill="outline" size="small" [routerLink]="['/finance/products', p.id, 'edit']">Editar</ion-button>
        </div>
        <div class="card">
          <p class="muted">Stock actual</p>
          <p [class.gold]="!p.lowStock" [class.error]="p.lowStock" style="font-size: 1.5rem; margin: 0">{{ quantity(p.currentStock, p.unit) }}</p>
          <p class="muted">Mínimo {{ quantity(p.minStockAlert, p.unit) }}{{ p.lowStock ? ' · stock bajo' : '' }}</p>
        </div>
        <h2>Registrar movimiento</h2>
        <ion-segment [value]="type()" (ionChange)="setType($event.detail.value)">
          <ion-segment-button value="IN"><ion-label>Entrada</ion-label></ion-segment-button>
          <ion-segment-button value="OUT"><ion-label>Salida</ion-label></ion-segment-button>
        </ion-segment>
        <div class="field">
          <ion-input [label]="'Cantidad (' + p.unit + ')'" labelPlacement="stacked" inputmode="decimal"
                     [value]="amount()" (ionInput)="amount.set($event.detail.value ?? '')" />
        </div>
        <div class="field">
          <ion-input label="Motivo (opcional)" labelPlacement="stacked" [maxlength]="255"
                     [value]="reason()" (ionInput)="reason.set($event.detail.value ?? '')" />
        </div>
        @if (moveError()) { <p class="error" role="alert">{{ moveError() }}</p> }
        <ion-button expand="block" [disabled]="busy()" (click)="move()">Guardar movimiento</ion-button>
        <h2>Historial</h2>
        @for (m of movements(); track m.id) {
          <div class="card">
            <div class="row">
              <div><p>{{ label[m.movementType] }}{{ m.reason ? ' · ' + m.reason : '' }}</p><p class="muted">{{ m.createdAt.slice(0, 10) }}</p></div>
              <p [class.gold]="m.movementType === 'IN'">{{ m.movementType === 'OUT' ? '- ' : '+ ' }}{{ quantity(m.quantity, p.unit) }}</p>
            </div>
          </div>
        } @empty { <p class="center">Sin movimientos todavía.</p> }
      } @else if (loadError()) {
        <div class="center"><p class="error">{{ loadError() }}</p><ion-button (click)="load()">Intentar de nuevo</ion-button></div>
      } @else {
        <div class="center"><ion-spinner aria-label="Cargando" /></div>
      }
    </section>
  `,
  styles: PAGE_STYLES,
})
export class ProductDetailPageComponent implements OnInit {
  private readonly api = inject(FinanceInventoryApi);
  readonly id = input.required<string>();
  readonly quantity = formatQuantity;
  readonly label = MOVEMENT_LABEL;
  readonly product = signal<InventoryProduct | null>(null);
  readonly movements = signal<InventoryMovement[]>([]);
  readonly loadError = signal('');
  readonly type = signal<MovementType>('IN');
  readonly amount = signal('');
  readonly reason = signal('');
  readonly busy = signal(false);
  readonly moveError = signal('');
  /** One key per movement being typed: a retried save does not move the stock twice (norm 5.3.8). */
  private key = crypto.randomUUID();

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loadError.set('');
    try {
      const [product, page] = await Promise.all([this.api.getProduct(this.id()), this.api.listMovements(this.id())]);
      this.product.set(product);
      this.movements.set(page.data);
    } catch (err) {
      this.loadError.set(userMessage(err));
    }
  }

  setType(value: unknown): void {
    if (value === 'IN' || value === 'OUT') this.type.set(value);
  }

  async move(): Promise<void> {
    const quantity = parseQuantity(this.amount());
    if (quantity === null || quantity === 0) {
      this.moveError.set('Escribe una cantidad mayor que cero, con máximo dos decimales.');
      return;
    }
    this.busy.set(true);
    this.moveError.set('');
    try {
      const reason = this.reason().trim();
      const result = await this.api.move(this.id(), { movementType: this.type(), quantity, ...(reason ? { reason } : {}) }, this.key);
      this.product.set(result.product);
      this.movements.update((list) => [result.movement, ...list]);
      this.amount.set('');
      this.reason.set('');
      this.key = crypto.randomUUID();
    } catch (err) {
      this.moveError.set(userMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
