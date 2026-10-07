import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { loader } from '../ui/load';
import { PAGE_STYLES } from '../ui/styles';
import { FinanceInventoryApi } from './finance-inventory-api';
import { formatCop, formatQuantity, isoDate, monthOf } from './rules';
import { SectionsComponent } from './sections.component';
import type { FinanceSummary, InventoryProduct } from './types';

interface Dashboard {
  month: FinanceSummary;
  today: FinanceSummary;
  lowStock: InventoryProduct[];
}

/**
 * The owner's dashboard (decision of 2026-10-04): the month's summary and what matters today — today's
 * income and expenses and the products in low stock.
 */
@Component({
  selector: 'fi-dashboard-page',
  imports: [RouterLink, IonButton, IonSpinner, SectionsComponent],
  template: `
    <section class="page">
      <h1>Mi barbería</h1>
      <p class="sub">El resumen del mes y lo importante de hoy.</p>
      <fi-sections active="dashboard" />
      @switch (view.state().kind) {
        @case ('loading') { <div class="center"><ion-spinner aria-label="Cargando" /></div> }
        @case ('error') {
          <div class="center"><p class="error">{{ errorText() }}</p><ion-button (click)="view.run()">Intentar de nuevo</ion-button></div>
        }
        @case ('data') {
          @if (data(); as d) {
            <h2>Este mes</h2>
            <div class="card">
              <div class="row"><span class="muted">Ingresos</span><span class="gold">{{ money(d.month.totalIncomeCents) }}</span></div>
              <div class="row"><span class="muted">Gastos</span><span>{{ money(d.month.totalExpensesCents) }}</span></div>
              <div class="row"><span class="muted">Utilidad</span>
                <span [class.gold]="d.month.netProfitCents >= 0" [class.error]="d.month.netProfitCents < 0">{{ money(d.month.netProfitCents) }}</span></div>
            </div>
            <h2>Hoy</h2>
            <div class="card">
              <div class="row"><span class="muted">Ingresos de hoy</span><span class="gold">{{ money(d.today.totalIncomeCents) }}</span></div>
              <div class="row"><span class="muted">Gastos de hoy</span><span>{{ money(d.today.totalExpensesCents) }}</span></div>
            </div>
            <div class="head">
              <h2>Stock bajo</h2>
              <ion-button fill="clear" size="small" routerLink="/finance/records/new">+ Registrar</ion-button>
            </div>
            @for (p of d.lowStock; track p.id) {
              <a class="card" [routerLink]="['/finance/products', p.id]">
                <div class="row"><h2>{{ p.name }}</h2><span class="error">{{ quantity(p.currentStock, p.unit) }}</span></div>
                <p class="muted">Mínimo {{ quantity(p.minStockAlert, p.unit) }}</p>
              </a>
            } @empty { <p class="center">Ningún producto está en stock bajo.</p> }
          }
        }
      }
    </section>
  `,
  styles: PAGE_STYLES,
})
export class DashboardPageComponent {
  private readonly api = inject(FinanceInventoryApi);
  readonly money = formatCop;
  readonly quantity = formatQuantity;
  readonly view = loader(async (): Promise<Dashboard> => {
    const today = isoDate(new Date());
    const { from, to } = monthOf();
    const [month, day, low] = await Promise.all([this.api.summary(from, to), this.api.summary(today, today),
      this.api.listProducts(true)]);
    return { month, today: day, lowStock: low.data };
  });

  constructor() {
    void this.view.run();
  }

  data(): Dashboard | null {
    const s = this.view.state();
    return s.kind === 'data' ? s.value : null;
  }

  errorText(): string {
    const s = this.view.state();
    return s.kind === 'error' ? s.message : '';
  }
}
