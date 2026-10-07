import { Routes } from '@angular/router';

/**
 * What this domain app exposes as './routes' (ADR-013). The shell mounts them under /finance for
 * `ADMIN_BARBERSHOP` only (every operation of finance-inventory-service.yaml is the owner's); every
 * screen is lazy, so the shell downloads only what is opened.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'records' },
  { path: 'records', title: 'Finanzas', loadComponent: () =>
      import('./finance/records-page.component').then((m) => m.RecordsPageComponent) },
  { path: 'records/new', title: 'Registrar', loadComponent: () =>
      import('./finance/record-form-page.component').then((m) => m.RecordFormPageComponent) },
];
