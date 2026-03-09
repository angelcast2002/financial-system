import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TranslateModule } from '@ngx-translate/core';

import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [TranslateModule, DragDropModule, AppIconComponent],
  templateUrl: './panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelComponent {
  @Input() titleKey = '';
  @Input() actionKey = '';
  @Input() actionText = '';
  @Input() draggable = false;
  @Input() paddingClass = 'p-4 sm:p-6';

  get containerClass(): string {
    return `app-card ${this.paddingClass}`;
  }
}
