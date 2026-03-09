import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { AppIconComponent } from '../app-icon/app-icon.component';
import { IconName, Tone } from '../../models/ui.models';

@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [CommonModule, TranslateModule, AppIconComponent],
  templateUrl: './stat-tile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatTileComponent {
  @Input({ required: true }) labelKey!: string;
  @Input({ required: true }) value!: string;
  @Input({ required: true }) icon!: IconName;
  @Input() tone: Tone = 'primary';

  get toneClass(): string {
    switch (this.tone) {
      case 'accent':
        return 'bg-app-accent/25 text-teal-600';
      case 'success':
        return 'bg-app-success/25 text-emerald-600';
      case 'warning':
        return 'bg-app-warning/30 text-amber-600';
      case 'danger':
        return 'bg-app-danger/25 text-rose-600';
      case 'muted':
        return 'bg-app-muted/20 text-app-muted';
      case 'primary':
      default:
        return 'bg-app-primary/15 text-app-primary';
    }
  }
}
