import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from './core/services/auth.service';
import { I18nService } from './core/services/i18n.service';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { AppLoaderComponent } from './shared/components/app-loader/app-loader.component';
import { AppLoadingSkeletonComponent } from './shared/components/app-loading-skeleton/app-loading-skeleton.component';

type SkeletonRoute = 'dashboard' | 'accounts' | 'register' | 'generic';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SidebarComponent,
    RouterOutlet,
    TranslateModule,
    AppLoaderComponent,
    AppLoadingSkeletonComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly i18nService = inject(I18nService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly currentUrl = signal(this.router.url || '/');
  readonly showShell = computed(
    () => this.authService.isAuthenticated() && !this.currentUrl().startsWith('/login'),
  );
  readonly skeletonRoute = computed<SkeletonRoute>(() => this.resolveSkeletonRoute(this.currentUrl()));
  readonly isMobileSidebarOpen = signal(false);

  private hideLoadingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.i18nService.init();
    this.authService.bootstrapSession().subscribe();

    if (this.router.url === '/' || this.router.url === '') {
      const targetRoute = this.authService.isAuthenticated() ? '/dashboard' : '/login';
      void this.router.navigateByUrl(targetRoute);
    }

    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.hideLoadingTimeout) {
          clearTimeout(this.hideLoadingTimeout);
          this.hideLoadingTimeout = null;
        }

        this.currentUrl.set(event.url);
        this.isLoading.set(true);
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        const resolvedUrl = event instanceof NavigationEnd
          ? event.urlAfterRedirects
          : this.router.url;

        this.currentUrl.set(resolvedUrl);
        this.isMobileSidebarOpen.set(false);

        this.hideLoadingTimeout = setTimeout(() => {
          this.isLoading.set(false);
          this.hideLoadingTimeout = null;
        }, 180);
      }
    });
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update((isOpen) => !isOpen);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  private resolveSkeletonRoute(url: string): SkeletonRoute {
    if (url.startsWith('/accounts')) {
      return 'accounts';
    }

    if (url.startsWith('/register-account')) {
      return 'register';
    }

    if (url.startsWith('/dashboard')) {
      return 'dashboard';
    }

    return 'generic';
  }

}
