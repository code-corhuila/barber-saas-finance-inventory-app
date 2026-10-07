import { Routes } from '@angular/router';

/**
 * What this domain app exposes as './routes' (ADR-013). The shell mounts them under /finance for
 * `ADMIN_BARBERSHOP` only (every operation of finance-inventory-service.yaml is the owner's); every
 * screen is lazy, so the shell downloads only what is opened.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'Mi barbería', loadComponent: () =>
      import('./finance/dashboard-page.component').then((m) => m.DashboardPageComponent) },
  { path: 'records', title: 'Finanzas', loadComponent: () =>
      import('./finance/records-page.component').then((m) => m.RecordsPageComponent) },
  { path: 'records/new', title: 'Registrar', loadComponent: () =>
      import('./finance/record-form-page.component').then((m) => m.RecordFormPageComponent) },
  { path: 'products', title: 'Inventario', loadComponent: () =>
      import('./finance/products-page.component').then((m) => m.ProductsPageComponent) },
  { path: 'products/new', title: 'Nuevo producto', loadComponent: () =>
      import('./finance/product-form-page.component').then((m) => m.ProductFormPageComponent) },
  { path: 'products/:id', title: 'Producto', loadComponent: () =>
      import('./finance/product-detail-page.component').then((m) => m.ProductDetailPageComponent) },
  { path: 'products/:id/edit', title: 'Editar producto', loadComponent: () =>
      import('./finance/product-form-page.component').then((m) => m.ProductFormPageComponent) },
];
