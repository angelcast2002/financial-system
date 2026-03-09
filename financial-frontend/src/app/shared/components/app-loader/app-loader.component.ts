import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="inline-flex items-center gap-2" [ngClass]="wrapperClass">
      <span
        class="block animate-spin rounded-full border-app-primary/20 border-t-app-primary"
        [style.width.px]="size"
        [style.height.px]="size"
        [style.border-width.px]="stroke"
        aria-hidden="true"
      ></span>

      @if (labelKey) {
        <span class="text-sm font-semibold text-app-muted">{{ labelKey | translate }}</span>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLoaderComponent {
  @Input() size = 20;
  @Input() stroke = 3;
  @Input() labelKey = '';
  @Input() centered = false;

  get wrapperClass(): string {
    return this.centered ? 'justify-center' : '';
  }
}
