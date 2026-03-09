import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

type ToastTone = 'error' | 'success' | 'warning' | 'info';

@Component({
  selector: 'app-toast-popup',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div *ngIf="visible && message" class="pointer-events-none fixed right-3 top-3 z-50 w-[min(94vw,22rem)] sm:right-5 sm:top-5">
      <div
        class="pointer-events-auto rounded-2xl border border-app-border bg-app-surface px-4 py-3 shadow-app-soft"
        [ngClass]="toneBorderClass"
      >
        <div class="flex items-start gap-3">
          <span class="material-symbols-rounded mt-0.5 text-[20px]" [ngClass]="iconClass" aria-hidden="true">
            {{ iconName }}
          </span>

          <div class="min-w-0">
            <p *ngIf="title" class="text-sm font-bold text-app-ink">{{ title | translate }}</p>
            <p class="text-sm font-medium text-app-ink">{{ message | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppToastPopupComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) message = '';
  @Input() title = '';
  @Input() tone: ToastTone = 'success';
  @Input() visible = false;
  @Input() autoHideMs = 3200;

  @Output() readonly dismissed = new EventEmitter<void>();

  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible || !this.message) {
      this.clearAutoHide();
      return;
    }

    if (changes['visible'] || changes['message'] || changes['tone'] || changes['autoHideMs']) {
      this.scheduleAutoHide();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoHide();
  }

  get iconName(): string {
    switch (this.tone) {
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'error':
      default:
        return 'error';
    }
  }

  get toneBorderClass(): string {
    switch (this.tone) {
      case 'success':
        return 'border-l-4 border-l-app-success';
      case 'warning':
        return 'border-l-4 border-l-app-warning';
      case 'info':
        return 'border-l-4 border-l-app-primary-soft';
      case 'error':
      default:
        return 'border-l-4 border-l-app-danger';
    }
  }

  get iconClass(): string {
    switch (this.tone) {
      case 'success':
        return 'text-app-success';
      case 'warning':
        return 'text-app-warning';
      case 'info':
        return 'text-app-primary';
      case 'error':
      default:
        return 'text-app-danger';
    }
  }

  private scheduleAutoHide(): void {
    this.clearAutoHide();

    if (this.autoHideMs <= 0) {
      return;
    }

    this.hideTimeoutId = setTimeout(() => {
      this.hideTimeoutId = null;
      this.dismissed.emit();
    }, this.autoHideMs);
  }

  private clearAutoHide(): void {
    if (!this.hideTimeoutId) {
      return;
    }

    clearTimeout(this.hideTimeoutId);
    this.hideTimeoutId = null;
  }
}
