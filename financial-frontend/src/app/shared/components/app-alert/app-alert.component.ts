import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AlertTone = 'error' | 'success' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-start gap-3 rounded-xl border px-4 py-3" [ngClass]="containerClass">
      <span class="material-symbols-rounded mt-0.5 text-[20px]" [ngClass]="iconClass" aria-hidden="true">
        {{ iconName }}
      </span>

      <div class="min-w-0">
        @if (title) {
          <p class="text-sm font-bold">{{ title }}</p>
        }
        <p class="text-sm font-medium">{{ message }}</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppAlertComponent {
  @Input() tone: AlertTone = 'error';
  @Input() title = '';
  @Input({ required: true }) message = '';

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

  get containerClass(): string {
    switch (this.tone) {
      case 'success':
        return 'border-emerald-300 bg-emerald-50 text-emerald-800';
      case 'warning':
        return 'border-amber-300 bg-amber-50 text-amber-800';
      case 'info':
        return 'border-blue-300 bg-blue-50 text-blue-800';
      case 'error':
      default:
        return 'border-rose-300 bg-rose-50 text-rose-800';
    }
  }

  get iconClass(): string {
    switch (this.tone) {
      case 'success':
        return 'text-emerald-600';
      case 'warning':
        return 'text-amber-600';
      case 'info':
        return 'text-blue-600';
      case 'error':
      default:
        return 'text-rose-600';
    }
  }
}
