import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { ApiAccount, ApiCustomer, ApiTransaction } from '../../core/models/api.models';
import { FinancialApiService } from '../../core/services/financial-api.service';
import { BarChartComponent } from '../../shared/components/bar-chart/bar-chart.component';
import { BankCardComponent } from '../../shared/components/bank-card/bank-card.component';
import { DonutChartComponent } from '../../shared/components/donut-chart/donut-chart.component';
import { LineChartComponent } from '../../shared/components/line-chart/line-chart.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PanelComponent } from '../../shared/components/panel/panel.component';
import { QuickTransferComponent } from '../../shared/components/quick-transfer/quick-transfer.component';
import { TransactionListComponent } from '../../shared/components/transaction-list/transaction-list.component';
import { ChartSeries, DonutSlice, QuickContact, TransactionListItem } from '../../shared/models/ui.models';

type DashboardSectionId = 'weekly' | 'cards' | 'recent' | 'expense' | 'transfer' | 'history';
type DashboardCard = {
  id: string;
  variant: 'primary' | 'soft';
  balance: string;
  holder: string;
  expiry: string;
  number: string;
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    DragDropModule,
    PageHeaderComponent,
    PanelComponent,
    BankCardComponent,
    TransactionListComponent,
    BarChartComponent,
    DonutChartComponent,
    QuickTransferComponent,
    LineChartComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent implements OnInit {
  private readonly financialApiService = inject(FinancialApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  sections: DashboardSectionId[] = ['weekly', 'cards', 'recent', 'expense', 'transfer', 'history'];

  cards: DashboardCard[] = [];

  readonly weeklyLabels: string[] = [
    'common.days.monday',
    'common.days.tuesday',
    'common.days.wednesday',
    'common.days.thursday',
    'common.days.friday',
    'common.days.saturday',
    'common.days.sunday',
  ];

  weeklySeries: ChartSeries[] = [
    {
      nameKey: 'charts.deposit',
      color: 'primary',
      values: Array.from({ length: 7 }, () => 0),
    },
    {
      nameKey: 'charts.withdraw',
      color: 'accent',
      values: Array.from({ length: 7 }, () => 0),
    },
  ];

  recentTransactions: TransactionListItem[] = [];

  expenseSlices: DonutSlice[] = [
    { labelKey: 'dashboard.expense.labels.entertainment', value: 0, color: '#2936f4' },
    { labelKey: 'dashboard.expense.labels.bills', value: 0, color: '#f29f3d' },
    { labelKey: 'dashboard.expense.labels.others', value: 0, color: '#5568ff' },
    { labelKey: 'dashboard.expense.labels.investment', value: 0, color: '#cc4be8' },
  ];

  contacts: QuickContact[] = [];

  balancePoints: number[] = Array.from({ length: 7 }, () => 0);

  balanceLabels: string[] = [
    'common.months.august',
    'common.months.september',
    'common.months.october',
    'common.months.november',
    'common.months.december',
    'common.months.january',
    'common.months.february',
  ];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  reorderCards(event: CdkDragDrop<DashboardCard[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.cards, event.previousIndex, event.currentIndex);
  }

  reorderSections(event: CdkDragDrop<DashboardSectionId[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
  }

  private loadDashboardData(): void {
    forkJoin({
      customers: this.financialApiService.getCustomers().pipe(catchError(() => of([] as ApiCustomer[]))),
      accounts: this.financialApiService.getAccounts().pipe(catchError(() => of([] as ApiAccount[]))),
    })
      .pipe(
        switchMap(({ customers, accounts }) => {
          this.applyCards(customers, accounts);
          this.applyContacts(customers);

          return this.financialApiService
            .getTransactionsForAccounts(accounts.map((account) => account.id))
            .pipe(
              catchError(() => of([] as ApiTransaction[])),
              map((transactions) => ({ customers, accounts, transactions })),
            );
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ customers, accounts, transactions }) => {
          this.applyRecentTransactions(transactions, accounts, customers);
          this.applyWeeklyChart(transactions);
          this.applyExpenseSlices(transactions);
          this.applyBalanceHistory(transactions);
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  private applyCards(customers: ReadonlyArray<ApiCustomer>, accounts: ReadonlyArray<ApiAccount>): void {
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));
    const source = accounts.slice(0, 2);

    if (!source.length) {
      this.cards = [];
      return;
    }

    this.cards = source.map((account, index) => {
      const customer = customersById.get(account.customer_id);
      const holder = customer ? `${customer.first_name} ${customer.last_name}` : 'Cliente';

      return {
        id: String(account.id),
        variant: index === 0 ? 'primary' : 'soft',
        balance: this.formatMoney(this.toNumber(account.balance)),
        holder,
        expiry: '—',
        number: this.maskAccountNumber(account.account_number),
      };
    });
  }

  private applyContacts(customers: ReadonlyArray<ApiCustomer>): void {
    this.contacts = customers.slice(0, 3).map((customer) => {
      const name = `${customer.first_name} ${customer.last_name}`.trim();

      return {
        name,
        relation: customer.email,
        avatarUrl: this.createAvatarDataUrl(name),
      };
    });
  }

  private applyRecentTransactions(
    transactions: ReadonlyArray<ApiTransaction>,
    accounts: ReadonlyArray<ApiAccount>,
    customers: ReadonlyArray<ApiCustomer>,
  ): void {
    const accountsById = new Map(accounts.map((account) => [account.id, account]));
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));

    this.recentTransactions = [...transactions]
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 3)
      .map((transaction) => {
        const account = accountsById.get(transaction.account_id);
        const customer = account ? customersById.get(account.customer_id) : undefined;
        const ownerName = customer ? `${customer.first_name} ${customer.last_name}` : 'Cuenta';
        const amount = this.toNumber(transaction.amount);
        const isDeposit = transaction.type === 'deposit';

        return {
          icon: isDeposit ? 'deposit' : 'withdraw',
          title: `${isDeposit ? 'Depósito' : 'Retiro'} ${ownerName}`,
          subtitle: this.formatDate(transaction.created_at),
          amount: `${isDeposit ? '+' : '-'}${this.formatMoney(amount)}`,
          amountTone: isDeposit ? 'success' : 'danger',
        } as TransactionListItem;
      });
  }

  private applyWeeklyChart(transactions: ReadonlyArray<ApiTransaction>): void {
    const deposits = Array.from({ length: 7 }, () => 0);
    const withdrawals = Array.from({ length: 7 }, () => 0);

    for (const transaction of transactions) {
      const amount = this.toNumber(transaction.amount);
      const dayIndex = (new Date(transaction.created_at).getDay() + 6) % 7;

      if (transaction.type === 'deposit') {
        deposits[dayIndex] += amount;
      } else if (transaction.type === 'withdraw') {
        withdrawals[dayIndex] += amount;
      }
    }

    this.weeklySeries = [
      { nameKey: 'charts.deposit', color: 'primary', values: deposits.map((value) => Math.round(value)) },
      { nameKey: 'charts.withdraw', color: 'accent', values: withdrawals.map((value) => Math.round(value)) },
    ];
  }

  private applyExpenseSlices(transactions: ReadonlyArray<ApiTransaction>): void {
    const buckets = [0, 0, 0, 0];
    const withdrawals = transactions.filter((transaction) => transaction.type === 'withdraw');

    for (const transaction of withdrawals) {
      const amount = this.toNumber(transaction.amount);
      buckets[transaction.id % 4] += amount;
    }

    if (!withdrawals.length) {
      this.expenseSlices = [
        { labelKey: 'dashboard.expense.labels.entertainment', value: 0, color: '#2936f4' },
        { labelKey: 'dashboard.expense.labels.bills', value: 0, color: '#f29f3d' },
        { labelKey: 'dashboard.expense.labels.others', value: 0, color: '#5568ff' },
        { labelKey: 'dashboard.expense.labels.investment', value: 0, color: '#cc4be8' },
      ];
      return;
    }

    this.expenseSlices = [
      { labelKey: 'dashboard.expense.labels.entertainment', value: Math.round(buckets[0]), color: '#2936f4' },
      { labelKey: 'dashboard.expense.labels.bills', value: Math.round(buckets[1]), color: '#f29f3d' },
      { labelKey: 'dashboard.expense.labels.others', value: Math.round(buckets[2]), color: '#5568ff' },
      { labelKey: 'dashboard.expense.labels.investment', value: Math.round(buckets[3]), color: '#cc4be8' },
    ];
  }

  private applyBalanceHistory(transactions: ReadonlyArray<ApiTransaction>): void {
    const monthKeyByIndex = [
      'common.months.january',
      'common.months.february',
      'common.months.march',
      'common.months.april',
      'common.months.may',
      'common.months.june',
      'common.months.july',
      'common.months.august',
      'common.months.september',
      'common.months.october',
      'common.months.november',
      'common.months.december',
    ];

    const now = new Date();
    const monthPoints: Array<{ key: string; value: number }> = [];

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      monthPoints.push({
        key: monthKeyByIndex[date.getMonth()] ?? 'common.months.january',
        value: 0,
      });
    }

    for (const transaction of transactions) {
      const date = new Date(transaction.created_at);
      const key = monthKeyByIndex[date.getMonth()];
      const target = monthPoints.find((item) => item.key === key);
      if (!target) {
        continue;
      }

      const amount = this.toNumber(transaction.amount);
      target.value += transaction.type === 'deposit' ? amount : -amount;
    }

    let runningBalance = 0;
    const computedPoints = monthPoints.map((item) => {
      runningBalance += item.value;
      return Math.max(Math.round(runningBalance), 0);
    });

    if (!computedPoints.some((value) => value > 0)) {
      this.balanceLabels = monthPoints.map((item) => item.key);
      this.balancePoints = monthPoints.map(() => 0);
      return;
    }

    this.balanceLabels = monthPoints.map((item) => item.key);
    this.balancePoints = computedPoints;
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatDate(value: string): string {
    return new Date(value).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private toNumber(value: number | string): number {
    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private maskAccountNumber(accountNumber: string): string {
    const digits = accountNumber.replace(/\D/g, '');

    if (digits.length < 4) {
      return accountNumber;
    }

    return `${digits.slice(0, 4)} **** **** ${digits.slice(-4)}`;
  }

  private createAvatarDataUrl(name: string): string {
    const trimmedName = name.trim();
    const initial = (trimmedName[0] ?? '?').toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' rx='40' fill='#eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#2f35f5' font-family='Segoe UI, Arial, sans-serif' font-size='32' font-weight='700'>${initial}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
}
