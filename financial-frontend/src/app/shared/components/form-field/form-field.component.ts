import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { SelectOption } from '../../models/ui.models';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './form-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  @Input({ required: true }) labelKey!: string;
  @Input() type: 'text' | 'email' | 'select' = 'text';
  @Input() value = '';
  @Input() placeholder = '';
  @Input() options: ReadonlyArray<SelectOption> = [];
}
