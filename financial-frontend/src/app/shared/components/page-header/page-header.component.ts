import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../core/services/auth.service';
import { AppIconComponent } from '../app-icon/app-icon.component';
import { IconName } from '../../models/ui.models';

interface HeaderAction {
  icon: IconName;
  labelKey: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [TranslateModule, AppIconComponent],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly authService = inject(AuthService);

  @Input({ required: true }) titleKey!: string;

  readonly actions: ReadonlyArray<HeaderAction> = [
    { icon: 'settings', labelKey: 'common.actions.settings' },
    { icon: 'notification', labelKey: 'common.actions.notifications' },
  ];

  get userInitial(): string {
    const username = this.authService.user()?.username?.trim() ?? '';
    return username ? username[0].toUpperCase() : '?';
  }

  trackByLabel(_index: number, action: HeaderAction): string {
    return action.labelKey;
  }
}
