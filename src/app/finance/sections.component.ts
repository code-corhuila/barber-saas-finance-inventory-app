import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonLabel, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { PAGE_STYLES } from '../ui/styles';

/** The three sections of the owner's money and stock: the dashboard, finance and inventory. */
@Component({
  selector: 'fi-sections',
  imports: [IonSegment, IonSegmentButton, IonLabel, RouterLink],
  template: `
    <ion-segment [value]="active()">
      <ion-segment-button value="dashboard" routerLink="/finance/dashboard"><ion-label>Tablero</ion-label></ion-segment-button>
      <ion-segment-button value="records" routerLink="/finance/records"><ion-label>Finanzas</ion-label></ion-segment-button>
      <ion-segment-button value="products" routerLink="/finance/products"><ion-label>Inventario</ion-label></ion-segment-button>
    </ion-segment>
  `,
  styles: PAGE_STYLES,
})
export class SectionsComponent {
  readonly active = input.required<'dashboard' | 'records' | 'products'>();
}
