import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonSelect, IonSelectOption, IonSpinner } from '@ionic/angular/standalone';
import { loader } from '../ui/load';
import { PAGE_STYLES } from '../ui/styles';
import { FinanceInventoryApi } from './finance-inventory-api';
import { formatCop, monthOf, TYPE_LABEL } from './rules';
import { SectionsComponent } from './sections.component';
import type { FinanceRecord, FinanceRecordType, FinanceSummary, Page } from './types';

/** The month's income and expenses (HU-FIN-001): its summary and every record, the newest first. */
@Component({
  selector: 'fi-records-page',
  imports: [RouterLink, IonButton, IonSelect, IonSelectOption, IonSpinner, SectionsComponent],
  template: `
    <section class="page">
      <div class="head">
        <h1>Finanzas</h1>
        <ion-button routerLink="/finance/records/new">+ Registrar</ion-button>
      </div>
      <p class="sub">Ingresos y gastos de este mes.</p>
      <fi-sections active="records" />
      <div class="field">
        <ion-select label="Tipo" labelPlacement="stacked" interface="popover" [value]="type()"
                    (ionChange)="filter($event.detail.value)">
          <ion-select-option [value]="null">Todos</ion-select-option>
          <ion-select-option value="INCOME">Ingresos</ion-select-option>
          <ion-select-option value="EXPENSE">Gastos</ion-select-option>
        </ion-select>
      </div>
      @switch (view.state().kind) {
        @case ('loading') { <div class="center"><ion-spinner aria-label="Cargando" /></div> }
        @case ('error') {
          <div class="center"><p class="error">{{ errorText() }}</p><ion-button (click)="view.run()">Intentar de nuevo</ion-button></div>
        }
        @case ('data') {
          @if (summary(); as s) {
            <div class="card">
              <div class="row"><span class="muted">Ingresos</span><span class="gold">{{ money(s.totalIncomeCents) }}</span></div>
              <div class="row"><span class="muted">Gastos</span><span>{{ money(s.totalExpensesCents) }}</span></div>
              <div class="row"><span class="muted">Utilidad</span>
                <span [class.gold]="s.netProfitCents >= 0" [class.error]="s.netProfitCents < 0">{{ money(s.netProfitCents) }}</span></div>
            </div>
          }
          @for (r of records(); track r.id) {
            <div class="card">
              <div class="row">
                <div>
                  <h2>{{ r.category }}</h2>
                  <p class="muted">{{ r.recordDate }}{{ r.description ? ' · ' + r.description : '' }}</p>
                </div>
                <div style="text-align: right">
                  <span class="badge" [class.ACTIVE]="r.type === 'INCOME'" [class.CANCELLED]="r.type === 'EXPENSE'">{{ label[r.type] }}</span>
                  <p [class.gold]="r.type === 'INCOME'">{{ r.type === 'EXPENSE' ? '- ' : '' }}{{ money(r.amountCents) }}</p>
                </div>
              </div>
            </div>
          } @empty {
            <p class="center">No hay registros este mes.</p>
          }
          <p class="hint">Un registro no se edita ni se borra: un error se corrige con un registro del tipo contrario.</p>
        }
      }
    </section>
  `,
  styles: PAGE_STYLES,
})
export class RecordsPageComponent {
  private readonly api = inject(FinanceInventoryApi);
  readonly money = formatCop;
  readonly label = TYPE_LABEL;
  readonly type = signal<FinanceRecordType | null>(null);
  readonly view = loader(async (): Promise<{ summary: FinanceSummary; page: Page<FinanceRecord> }> => {
    const { from, to } = monthOf();
    const [summary, page] = await Promise.all([this.api.summary(from, to), this.api.listRecords(from, to, this.type())]);
    return { summary, page };
  });

  constructor() {
    void this.view.run();
  }

  filter(value: FinanceRecordType | null): void {
    this.type.set(value);
    void this.view.run();
  }

  summary(): FinanceSummary | null {
    const s = this.view.state();
    return s.kind === 'data' ? s.value.summary : null;
  }

  records(): FinanceRecord[] {
    const s = this.view.state();
    return s.kind === 'data' ? s.value.page.data : [];
  }

  errorText(): string {
    const s = this.view.state();
    return s.kind === 'error' ? s.message : '';
  }
}
