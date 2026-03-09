import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { I18nService } from '../../core/services/i18n.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { AppLoaderComponent } from '../../shared/components/app-loader/app-loader.component';
import { IconName } from '../../shared/models/ui.models';

interface NavItem {
  labelKey: string;
  route: string;
  icon: IconName;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    AppIconComponent,
    AppLoaderComponent,
  ],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  readonly i18nService = inject(I18nService);

  @Input() showMobileClose = false;
  @Output() readonly closeRequested = new EventEmitter<void>();

  readonly isUploadingImage = signal(false);
  readonly uploadErrorKey = signal('');

  readonly navItems: ReadonlyArray<NavItem> = [
    { labelKey: 'sidebar.nav.home', route: '/dashboard', icon: 'home' },
    {
      labelKey: 'sidebar.nav.transactions',
      route: '/accounts',
      icon: 'account_balance',
    },
    { labelKey: 'sidebar.nav.accounts', route: '/register-account', icon: 'accounts' },
  ];

  trackByRoute(_index: number, item: NavItem): string {
    return item.route;
  }

  requestClose(): void {
    this.closeRequested.emit();
  }

  changeLanguage(language: 'es' | 'en'): void {
    this.i18nService.useLanguage(language);
  }

  isLanguageActive(language: 'es' | 'en'): boolean {
    return this.i18nService.currentLanguage === language;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploadErrorKey.set('');

    if (!file.type.startsWith('image/')) {
      this.uploadErrorKey.set('sidebar.user.uploadInvalidType');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.uploadErrorKey.set('sidebar.user.uploadTooLarge');
      input.value = '';
      return;
    }

    this.isUploadingImage.set(true);

    this.authService.uploadProfileImage(file).subscribe({
      next: () => {
        this.isUploadingImage.set(false);
        input.value = '';
      },
      error: () => {
        this.isUploadingImage.set(false);
        this.uploadErrorKey.set('sidebar.user.uploadError');
        input.value = '';
      },
    });
  }

  get userInitial(): string {
    const username = this.authService.user()?.username?.trim() ?? '';
    return username ? username[0].toUpperCase() : '?';
  }

  logout(): void {
    this.authService.logout();
    this.requestClose();
  }
}
