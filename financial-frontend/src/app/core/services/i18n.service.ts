import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'app_language';
const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  readonly supportedLanguages: readonly AppLanguage[] = SUPPORTED_LANGUAGES;

  constructor(private readonly translateService: TranslateService) {}

  init(): void {
    this.translateService.addLangs([...this.supportedLanguages]);
    this.translateService.setDefaultLang('es');

    const storedLanguage = this.getStoredLanguage();
    if (storedLanguage) {
      this.translateService.use(storedLanguage);
      return;
    }

    const browserLang = this.translateService.getBrowserLang() as AppLanguage | undefined;
    const initialLanguage = this.isSupportedLanguage(browserLang) ? browserLang : 'es';

    this.translateService.use(initialLanguage);
    localStorage.setItem(STORAGE_KEY, initialLanguage);
  }

  useLanguage(language: AppLanguage): void {
    this.translateService.use(language);
    localStorage.setItem(STORAGE_KEY, language);
  }

  get currentLanguage(): AppLanguage {
    const activeLanguage = this.translateService.currentLang as AppLanguage | undefined;

    if (this.isSupportedLanguage(activeLanguage)) {
      return activeLanguage;
    }

    const defaultLanguage = this.translateService.defaultLang as AppLanguage | undefined;
    if (this.isSupportedLanguage(defaultLanguage)) {
      return defaultLanguage;
    }

    return 'es';
  }

  private getStoredLanguage(): AppLanguage | null {
    const value = localStorage.getItem(STORAGE_KEY);
    return this.isSupportedLanguage(value) ? value : null;
  }

  private isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
    return !!value && this.supportedLanguages.includes(value as AppLanguage);
  }
}
