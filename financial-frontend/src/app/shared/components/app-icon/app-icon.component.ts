import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { IconName } from '../../models/ui.models';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <span
      [class]="'material-symbols-rounded ' + className"
      [style.fontSize.px]="size"
      aria-hidden="true"
    >
      {{ glyph }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconComponent {
  @Input() name: IconName = 'home';
  @Input() size = 20;
  @Input() strokeWidth = 1.8;
  @Input() className = '';

  get glyph(): string {
    switch (this.name) {
      case 'brand':
        return 'sync_alt';
      case 'home':
        return 'home';
      case 'transactions':
        return 'receipt_long';
      case 'accounts':
        return 'account_circle';
      case 'account_balance':
        return 'account_balance';
      case 'register':
        return 'person_add';
      case 'integration':
        return 'hub';
      case 'settings':
        return 'settings';
      case 'notification':
        return 'notifications';
      case 'wallet':
        return 'account_balance_wallet';
      case 'income':
        return 'trending_up';
      case 'expense':
        return 'receipt_long';
      case 'savings':
        return 'savings';
      case 'card':
        return 'credit_card';
      case 'deposit':
        return 'north';
      case 'withdraw':
        return 'south';
      case 'service':
        return 'payments';
      case 'transfer':
        return 'swap_horiz';
      case 'pending':
        return 'schedule';
      case 'send':
        return 'send';
      case 'drag':
        return 'drag_indicator';
      case 'chevron-right':
        return 'chevron_right';
      case 'edit':
        return 'edit';
      case 'user':
        return 'person';
      case 'mail':
        return 'mail';
      case 'id':
        return 'badge';
      case 'calendar':
        return 'calendar_today';
      case 'location':
        return 'location_on';
      case 'logout':
        return 'logout';
      default:
        return 'help';
    }
  }
}
