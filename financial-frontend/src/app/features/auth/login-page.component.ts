import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { AppAlertComponent } from '../../shared/components/app-alert/app-alert.component';
import { AppLoaderComponent } from '../../shared/components/app-loader/app-loader.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, AppAlertComponent, AppLoaderComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <section class="app-card w-full max-w-md p-8">
        <div class="mb-6 text-center">
          <h1 class="text-3xl font-bold text-app-ink">{{ 'auth.login.title' | translate }}</h1>
          <p class="mt-2 text-sm font-medium text-app-muted">{{ 'auth.login.subtitle' | translate }}</p>
        </div>

        <form class="space-y-4" [formGroup]="loginForm" (ngSubmit)="submit()">
          <div>
            <label class="app-label" for="username">{{ 'auth.login.username' | translate }}</label>
            <input
              id="username"
              class="app-input"
              type="text"
              formControlName="username"
              autocomplete="username"
              [placeholder]="'auth.login.usernamePlaceholder' | translate"
            />
          </div>

          <div>
            <label class="app-label" for="password">{{ 'auth.login.password' | translate }}</label>
            <input
              id="password"
              class="app-input"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              [placeholder]="'auth.login.passwordPlaceholder' | translate"
            />
          </div>

          @if (errorMessage()) {
            <app-alert
              tone="error"
              [title]="'auth.login.errorTitle' | translate"
              [message]="errorMessage() | translate"
            ></app-alert>
          }

          <button
            type="submit"
            class="mt-2 w-full rounded-xl bg-app-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="isSubmitting()"
          >
            @if (isSubmitting()) {
              <span class="inline-flex items-center gap-2">
                <app-loader [size]="16" [stroke]="2"></app-loader>
                {{ 'auth.login.loading' | translate }}
              </span>
            } @else {
              {{ 'auth.login.submit' | translate }}
            }
          </button>
        </form>
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    const { username, password } = this.loginForm.getRawValue();

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router
          .navigateByUrl('/dashboard')
          .then((navigated) => {
            if (!navigated) {
              this.errorMessage.set('auth.login.redirectError');
            }
          })
          .catch(() => {
            this.errorMessage.set('auth.login.redirectError');
          });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const detail = typeof error.error?.detail === 'string'
          ? error.error.detail
          : 'auth.login.error';
        this.errorMessage.set(detail);
      },
    });
  }
}
