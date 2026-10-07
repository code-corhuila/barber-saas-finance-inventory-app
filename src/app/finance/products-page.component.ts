import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonSelect, IonSelectOption, IonSpinner } from '@ionic/angular/standalone';
import { loader } from '../ui/load';
import { PAGE_STYLES } from '../ui/styles';
import { FinanceInventoryApi } from './finance-inventory-api';
import { formatQuantity } from './rules';
import { SectionsComponent } from './sections.component';
import type { InventoryProduct } from './types';

/** The barbershop's products and their stock (HU-INV-001); the ones at or below their minimum stand out (FR-019). */
@Component({
  selector: 'fi-products-page',
  imports: [RouterLink, IonButton, IonSelect, IonSelectOption, IonSpinner, SectionsComponent],
  template: `
    <section class="page">
      <div class="head">
        <h1>Inventario</h1>
        <ion-button routerLink="/finance/products/new">+ Producto</ion-button>
      </div>
      <p class="sub">Los productos de la barbería y su stock.</p>
      <fi-sections active="products" />
      <div class="field">
        <ion-select label="Mostrar" labelPlacement="stacked" interface="popover" [value]="low()"
                    (ionChange)="filter($event.detail.value)">
          <ion-select-option [value]="null">Todos</ion-select-option>
          <ion-select-option [value]="true">Stock bajo</ion-select-option>
        </ion-select>
      </div>
      @switch (list.state().kind) {
        @case ('loading') { <div class="center"><ion-spinner aria-label="Cargando" /></div> }
        @case ('error') {
          <div class="center"><p class="error">{{ errorText() }}</p><ion-button (click)="list.run()">Intentar de nuevo</ion-button></div>
        }
        @case ('empty') { <p class="center">{{ low() ? 'Ningún producto está en stock bajo.' : 'Todavía no hay productos.' }}</p> }
        @case ('data') {
          @for (p of products(); track p.id) {
            <a class="card" [routerLink]="['/finance/products', p.id]">
              <div class="row">
                <div>
                  <h2>{{ p.name }}</h2>
                  <p class="muted">Mínimo {{ quantity(p.minStockAlert, p.unit) }}</p>
                </div>
                <div style="text-align: right">
                  <p [class.gold]="!p.lowStock" [class.error]="p.lowStock">{{ quantity(p.currentStock, p.unit) }}</p>
                  @if (p.lowStock) { <span class="badge CANCELLED">Stock bajo</span> }
                </div>
              </div>
            </a>
          }
        }
      }
    </section>
  `,
  styles: PAGE_STYLES,
})
export class ProductsPageComponent {
  private readonly api = inject(FinanceInventoryApi);
  readonly quantity = formatQuantity;
  readonly low = signal<boolean | null>(null);
  readonly list = loader(() => this.api.listProducts(this.low()), (p) => p.data.length === 0);

  constructor() {
    void this.list.run();
  }

  filter(value: boolean | null): void {
    this.low.set(value === true ? true : null);
    void this.list.run();
  }

  products(): InventoryProduct[] {
    const s = this.list.state();
    return s.kind === 'data' ? s.value.data : [];
  }

  errorText(): string {
    const s = this.list.state();
    return s.kind === 'error' ? s.message : '';
  }
}
