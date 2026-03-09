import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ApiCustomer, CreateCustomerPayload } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { FinancialApiService } from '../../core/services/financial-api.service';
import { AppAlertComponent } from '../../shared/components/app-alert/app-alert.component';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { AppLoaderComponent } from '../../shared/components/app-loader/app-loader.component';
import { AppLoadingSkeletonComponent } from '../../shared/components/app-loading-skeleton/app-loading-skeleton.component';
import { AppToastPopupComponent } from '../../shared/components/app-toast-popup/app-toast-popup.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PanelComponent } from '../../shared/components/panel/panel.component';
import { SelectOption } from '../../shared/models/ui.models';

type RegisterFieldKey =
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'dpi'
  | 'birth_date'
  | 'address'
  | 'department'
  | 'municipality';

type SubmitTone = 'error' | 'success' | 'warning' | 'info';

const MIN_ADULT_AGE = 18;

function adultBirthDateValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return { invalidDate: true };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (parsedDate > today) {
    return { futureDate: true };
  }

  const minimumBirthDate = new Date(today.getFullYear() - MIN_ADULT_AGE, today.getMonth(), today.getDate());
  if (parsedDate > minimumBirthDate) {
    return { underage: true };
  }

  return null;
}

@Component({
  selector: 'app-register-account-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    PageHeaderComponent,
    PanelComponent,
    AppIconComponent,
    AppAlertComponent,
    AppLoaderComponent,
    AppLoadingSkeletonComponent,
    AppToastPopupComponent,
  ],
  templateUrl: './register-account-page.component.html',
  styleUrls: ['./register-account-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterAccountPageComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly financialApiService = inject(FinancialApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly isCustomerLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isUploadingImage = signal(false);
  readonly avatarUploadErrorKey = signal('');
  readonly customerLoadErrorMessage = signal('');
  readonly submitMessage = signal('');
  readonly showSubmitPopup = signal(false);
  readonly submitTone = signal<SubmitTone>('success');
  readonly selectedCustomerId = signal<number | null>(null);
  readonly birthDateMin = '1900-01-01';
  readonly birthDateMax = this.getBirthDateMax();

  readonly departmentOptions: SelectOption[] = [
    { label: 'Guatemala', value: 'guatemala' },
    { label: 'Sacatepéquez', value: 'sacatepequez' },
    { label: 'Quetzaltenango', value: 'quetzaltenango' },
    { label: 'Escuintla', value: 'escuintla' },
    { label: 'Huehuetenango', value: 'huehuetenango' },
  ];

  private readonly municipalitiesByDepartment: Record<string, SelectOption[]> = {
    guatemala: [
      { label: 'Guatemala', value: 'guatemala' },
      { label: 'Mixco', value: 'mixco' },
      { label: 'Villa Nueva', value: 'villa-nueva' },
      { label: 'Amatitlán', value: 'amatitlan' },
    ],
    sacatepequez: [
      { label: 'Antigua Guatemala', value: 'antigua-guatemala' },
      { label: 'Ciudad Vieja', value: 'ciudad-vieja' },
      { label: 'Jocotenango', value: 'jocotenango' },
    ],
    quetzaltenango: [
      { label: 'Quetzaltenango', value: 'quetzaltenango' },
      { label: 'Coatepeque', value: 'coatepeque' },
      { label: 'Olintepeque', value: 'olintepeque' },
    ],
    escuintla: [
      { label: 'Escuintla', value: 'escuintla' },
      { label: 'Puerto San José', value: 'puerto-san-jose' },
      { label: 'Santa Lucía Cotzumalguapa', value: 'santa-lucia-cotzumalguapa' },
    ],
    huehuetenango: [
      { label: 'Huehuetenango', value: 'huehuetenango' },
      { label: 'Chiantla', value: 'chiantla' },
      { label: 'Malacatancito', value: 'malacatancito' },
    ],
  };

  municipalityOptions: SelectOption[] = [];

  fields: RegisterFieldKey[] = [
    'first_name',
    'last_name',
    'email',
    'dpi',
    'birth_date',
    'address',
    'department',
    'municipality',
  ];

  readonly form = this.fb.nonNullable.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    dpi: ['', Validators.required],
    birth_date: ['', [Validators.required, adultBirthDateValidator]],
    address: ['', Validators.required],
    department: ['', Validators.required],
    municipality: ['', Validators.required],
  });

  constructor() {
    this.initializeDepartmentBehavior();
    this.loadCustomerFromApi();
  }

  trackByField(_index: number, field: RegisterFieldKey): string {
    return field;
  }

  getLabelKey(field: RegisterFieldKey): string {
    switch (field) {
      case 'first_name':
        return 'register.form.firstName';
      case 'last_name':
        return 'register.form.lastName';
      case 'email':
        return 'register.form.email';
      case 'dpi':
        return 'register.form.dpi';
      case 'birth_date':
        return 'register.form.birthDate';
      case 'address':
        return 'register.form.address';
      case 'department':
        return 'register.form.department';
      case 'municipality':
        return 'register.form.municipality';
      default:
        return 'register.form.firstName';
    }
  }

  isSelectField(field: RegisterFieldKey): boolean {
    return field === 'department' || field === 'municipality';
  }

  isDateField(field: RegisterFieldKey): boolean {
    return field === 'birth_date';
  }

  isSelectDisabled(field: RegisterFieldKey): boolean {
    return field === 'municipality' && !this.form.controls.department.value;
  }

  getSelectPlaceholderKey(field: RegisterFieldKey): string {
    return field === 'department'
      ? 'register.form.selectDepartment'
      : 'register.form.selectMunicipality';
  }

  getBirthDateErrorKey(): string | null {
    const control = this.form.controls.birth_date;
    if (!(control.touched || control.dirty) || !control.errors) {
      return null;
    }

    if (control.hasError('required')) {
      return 'register.form.birthDateRequired';
    }

    if (control.hasError('underage')) {
      return 'register.form.birthDateUnderage';
    }

    if (control.hasError('futureDate')) {
      return 'register.form.birthDateFuture';
    }

    if (control.hasError('invalidDate')) {
      return 'register.form.birthDateInvalid';
    }

    return null;
  }

  getFieldType(field: RegisterFieldKey): 'text' | 'email' | 'date' {
    if (field === 'email') {
      return 'email';
    }

    if (field === 'birth_date') {
      return 'date';
    }

    return 'text';
  }

  getSelectOptions(field: RegisterFieldKey): ReadonlyArray<SelectOption> {
    if (field === 'department') {
      return this.departmentOptions;
    }

    if (field === 'municipality') {
      return this.municipalityOptions;
    }

    return [];
  }

  submit(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitMessage.set('');
    this.showSubmitPopup.set(false);
    this.isSaving.set(true);

    const payload = this.form.getRawValue() as CreateCustomerPayload;
    const selectedCustomerId = this.selectedCustomerId();

    const saveRequest$ = selectedCustomerId
      ? this.financialApiService
          .updateMyCustomer(payload)
          .pipe(map(() => void 0))
      : this.financialApiService
          .createMyCustomer(payload)
          .pipe(
            tap((customer) => this.selectedCustomerId.set(customer.id)),
            switchMap((customer) => this.financialApiService.createAccount(customer.id)),
            map(() => void 0),
          );

    saveRequest$.subscribe({
        next: () => {
          this.isSaving.set(false);
          this.submitTone.set('success');
          this.submitMessage.set('register.messages.success');
          this.showSubmitPopup.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.submitTone.set('error');
          const detail = typeof error.error?.detail === 'string' ? error.error.detail : 'register.messages.error';
          this.submitMessage.set(detail);
          this.showSubmitPopup.set(true);
        },
      });
  }

  closeSubmitPopup(): void {
    this.showSubmitPopup.set(false);
    this.submitMessage.set('');
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.avatarUploadErrorKey.set('');

    if (!file.type.startsWith('image/')) {
      this.avatarUploadErrorKey.set('sidebar.user.uploadInvalidType');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.avatarUploadErrorKey.set('sidebar.user.uploadTooLarge');
      input.value = '';
      return;
    }

    this.isUploadingImage.set(true);

    this.authService
      .uploadProfileImage(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isUploadingImage.set(false);
          input.value = '';
        },
        error: () => {
          this.isUploadingImage.set(false);
          this.avatarUploadErrorKey.set('sidebar.user.uploadError');
          input.value = '';
        },
      });
  }

  get userInitial(): string {
    const username = this.authService.user()?.username?.trim() ?? '';
    return username ? username[0].toUpperCase() : '?';
  }

  private loadCustomerFromApi(): void {
    this.isCustomerLoading.set(true);
    this.customerLoadErrorMessage.set('');

    this.financialApiService
      .getMyCustomer()
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null as ApiCustomer | null);
          }

          const detail = typeof error.error?.detail === 'string'
            ? error.error.detail
            : 'register.messages.loadError';
          this.customerLoadErrorMessage.set(detail);
          return of(null as ApiCustomer | null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((customer) => {

        if (customer) {
          this.selectedCustomerId.set(customer.id);
          this.ensureSelectOption(this.departmentOptions, customer.department);

          this.updateMunicipalityOptions(customer.department ?? '');
          this.ensureSelectOption(this.municipalityOptions, customer.municipality);

          this.form.patchValue({
            first_name: customer.first_name ?? '',
            last_name: customer.last_name ?? '',
            email: customer.email ?? '',
            dpi: customer.dpi ?? '',
            birth_date: this.toDateInputValue(customer.birth_date),
            address: customer.address ?? '',
            department: customer.department ?? '',
            municipality: customer.municipality ?? '',
          });
        } else {
          const profileEmail = this.authService.user()?.email ?? '';
          if (profileEmail) {
            this.form.patchValue({ email: profileEmail });
          }
        }

        this.isCustomerLoading.set(false);
        this.cdr.markForCheck();
      });
  }

  private initializeDepartmentBehavior(): void {
    this.form.controls.department.valueChanges
      .pipe(
        startWith(this.form.controls.department.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((departmentValue) => {
        this.updateMunicipalityOptions(departmentValue);

        const municipalityControl = this.form.controls.municipality;
        const municipalityValue = municipalityControl.value;
        if (municipalityValue && !this.municipalityOptions.some((option) => option.value === municipalityValue)) {
          municipalityControl.setValue('');
        }

        this.cdr.markForCheck();
      });
  }

  private updateMunicipalityOptions(departmentValue: string): void {
    const normalizedDepartment = (departmentValue ?? '').trim().toLowerCase();
    const source = this.municipalitiesByDepartment[normalizedDepartment] ?? [];
    this.municipalityOptions = source.map((item) => ({ ...item }));
  }

  private ensureSelectOption(options: SelectOption[], value: string | undefined): void {
    if (!value) {
      return;
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }

    if (options.some((option) => option.value === normalizedValue)) {
      return;
    }

    options.push({
      label: normalizedValue,
      value: normalizedValue,
    });
  }

  private toDateInputValue(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
  }

  private getBirthDateMax(): string {
    const now = new Date();
    const maxDate = new Date(now.getFullYear() - MIN_ADULT_AGE, now.getMonth(), now.getDate());
    return maxDate.toISOString().slice(0, 10);
  }
}
