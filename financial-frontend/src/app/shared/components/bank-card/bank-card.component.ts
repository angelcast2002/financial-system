import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-bank-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, AppIconComponent],
  templateUrl: './bank-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankCardComponent {
  @Input() balance = '';
  @Input() holder = '';
  @Input() expiry = '—';
  @Input() number = '';
  @Input() variant: 'primary' | 'soft' = 'primary';

  get containerClass(): string {
    return this.variant === 'primary'
      ? 'rounded-3xl bg-gradient-to-r from-app-primary to-app-primary-soft text-white shadow-app-card'
      : 'app-card-soft text-app-ink';
  }

  get labelClass(): string {
    return this.variant === 'primary' ? 'text-white/80' : 'text-app-muted';
  }
}
