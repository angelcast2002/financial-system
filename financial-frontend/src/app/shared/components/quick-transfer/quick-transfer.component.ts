import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { AppIconComponent } from '../app-icon/app-icon.component';
import { QuickContact } from '../../models/ui.models';

@Component({
  selector: 'app-quick-transfer',
  standalone: true,
  imports: [TranslateModule, AppIconComponent],
  templateUrl: './quick-transfer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickTransferComponent {
  @Input({ required: true }) contacts!: ReadonlyArray<QuickContact>;
  @Input() amount = '';

  trackByName(_index: number, item: QuickContact): string {
    return item.name;
  }
}
