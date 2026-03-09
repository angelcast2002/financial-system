import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { AppIconComponent } from '../app-icon/app-icon.component';
import { AmountTone, TransactionListItem } from '../../models/ui.models';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './transaction-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionListComponent {
  @Input({ required: true }) items!: ReadonlyArray<TransactionListItem>;

  trackByTitle(_index: number, item: TransactionListItem): string {
    return `${item.title}-${item.subtitle}`;
  }

  getAmountClass(tone: AmountTone): string {
    switch (tone) {
      case 'success':
        return 'text-app-success';
      case 'danger':
        return 'text-app-danger';
      case 'muted':
      default:
        return 'text-app-muted';
    }
  }
}
