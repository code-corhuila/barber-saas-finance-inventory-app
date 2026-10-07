import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonInput, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { userMessage } from '../shell-context';
import { PAGE_STYLES } from '../ui/styles';
import { FinanceInventoryApi } from './finance-inventory-api';
import { isoDate, type RecordForm, validateRecord } from './rules';
import type { FinanceRecordType } from './types';

/** Record an income or an expense (FR-016); a zero or negative amount is refused here and by the API. */
@Component({
  selector: 'fi-record-form-page',
  imports: [RouterLink, IonButton, IonInput, IonSegment, IonSegmentButton, IonLabel],
  template: `
    <section class="page">
      <a class="back" routerLink="/finance/records">‹ Finanzas</a>
      <h1>Registrar</h1>
      <ion-segment [value]="form().type" (ionChange)="setType($event.detail.value)">
        <ion-segment-button value="INCOME"><ion-label>Ingreso</ion-label></ion-segment-button>
        <ion-segment-button value="EXPENSE"><ion-label>Gasto</ion-label></ion-segment-button>
      </ion-segment>
      <div class="field">
        <ion-input label="Categoría" labelPlacement="stacked" placeholder="Cortes, Insumos, Arriendo…" [maxlength]="80"
                   [value]="form().category" (ionInput)="set('category', $event.detail.value)" />
        @if (errors().category) { <p class="field-error">{{ errors().category }}</p> }
      </div>
      <div class="field">
        <ion-input label="Valor (pesos)" labelPlacement="stacked" inputmode="numeric" placeholder="85000"
                   [value]="form().pesos" (ionInput)="set('pesos', $event.detail.value)" />
        @if (errors().pesos) { <p class="field-error">{{ errors().pesos }}</p> }
      </div>
      <div class="field">
        <ion-input label="Fecha" labelPlacement="stacked" type="date"
                   [value]="form().recordDate" (ionInput)="set('recordDate', $event.detail.value)" />
        @if (errors().recordDate) { <p class="field-error">{{ errors().recordDate }}</p> }
      </div>
      <div class="field">
        <ion-input label="Descripción (opcional)" labelPlacement="stacked" [maxlength]="255"
                   [value]="form().description" (ionInput)="set('description', $event.detail.value)" />
        @if (errors().description) { <p class="field-error">{{ errors().description }}</p> }
      </div>
      @if (saveError()) { <p class="error" role="alert">{{ saveError() }}</p> }
      <ion-button expand="block" [disabled]="saving()" (click)="save()">Guardar</ion-button>
      <ion-button expand="block" fill="clear" routerLink="/finance/records">Cancelar</ion-button>
    </section>
  `,
  styles: PAGE_STYLES,
})
export class RecordFormPageComponent {
  private readonly api = inject(FinanceInventoryApi);
  private readonly router = inject(Router);
  readonly form = signal<RecordForm>({ type: 'INCOME', category: '', pesos: '', description: '', recordDate: isoDate(new Date()) });
  readonly errors = signal<Partial<Record<keyof RecordForm, string>>>({});
  readonly saving = signal(false);
  readonly saveError = signal('');
  /** One key per form: retrying the same record does not record it twice (norm 5.3.8). */
  private readonly idempotencyKey = crypto.randomUUID();

  set(field: Exclude<keyof RecordForm, 'type'>, value: string | null | undefined): void {
    this.form.update((f) => ({ ...f, [field]: value ?? '' }));
  }

  setType(value: unknown): void {
    if (value === 'INCOME' || value === 'EXPENSE') {
      this.form.update((f) => ({ ...f, type: value as FinanceRecordType }));
    }
  }

  async save(): Promise<void> {
    const { errors, request } = validateRecord(this.form());
    this.errors.set(errors);
    if (!request) return;
    this.saving.set(true);
    this.saveError.set('');
    try {
      await this.api.createRecord(request, this.idempotencyKey);
      await this.router.navigateByUrl('/finance/records');
    } catch (err) {
      this.saveError.set(userMessage(err));
    } finally {
      this.saving.set(false);
    }
  }
}
