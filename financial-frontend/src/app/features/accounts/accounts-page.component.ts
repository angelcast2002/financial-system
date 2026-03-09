import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ApiAccount, ApiCustomer, ApiTransaction } from '../../core/models/api.models';
import { FinancialApiService } from '../../core/services/financial-api.service';
import { BarChartComponent } from '../../shared/components/bar-chart/bar-chart.component';
import { BankCardComponent } from '../../shared/components/bank-card/bank-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PanelComponent } from '../../shared/components/panel/panel.component';
import { StatTileComponent } from '../../shared/components/stat-tile/stat-tile.component';
import { TransactionListComponent } from '../../shared/components/transaction-list/transaction-list.component';
import { ChartSeries, StatTileData, TransactionListItem } from '../../shared/models/ui.models';

type AccountsSectionId = 'recent' | 'card' | 'summary' | 'scheduled';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [
    DragDropModule,
    TranslateModule,
    PageHeaderComponent,
    PanelComponent,
    StatTileComponent,
    TransactionListComponent,
    BankCardComponent,
    BarChartComponent,
  ],
  templateUrl: './accounts-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsPageComponent implements OnInit {
  private readonly financialApiService = inject(FinancialApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  sections: AccountsSectionId[] = ['recent', 'card', 'summary', 'scheduled'];

  stats: Array<StatTileData> = [
    { labelKey: 'accounts.stats.balance', value: '$0', icon: 'wallet', tone: 'warning' },
    { labelKey: 'accounts.stats.savings', value: '$0', icon: 'savings', tone: 'accent' },
    { labelKey: 'accounts.stats.expenses', value: '$0', icon: 'expense', tone: 'danger' },
    { labelKey: 'accounts.stats.income', value: '$0', icon: 'income', tone: 'primary' },
  ];

  recentTransactions: TransactionListItem[] = [];

  summaryLabels: string[] = [
    'common.months.august',
    'common.months.september',
    'common.months.october',
    'common.months.november',
    'common.months.december',
    'common.months.january',
    'common.months.february',
  ];

  summarySeries: ChartSeries[] = [
    {
      nameKey: 'accounts.summary.debit',
      color: 'primary',
      values: Array.from({ length: 7 }, () => 0),
    },
    {
      nameKey: 'accounts.summary.credit',
      color: 'warning',
      values: Array.from({ length: 7 }, () => 0),
    },
  ];

  scheduledPayments: TransactionListItem[] = [];

  primaryCard: { balance: string; holder: string; expiry: string; number: string } | null = null;

  ngOnInit(): void {
    this.loadAccountsData();
  }

  trackByStat(_index: number, item: StatTileData): string {
    return item.labelKey;
  }

  reorderStats(event: CdkDragDrop<StatTileData[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.stats, event.previousIndex, event.currentIndex);
  }

  reorderSections(event: CdkDragDrop<AccountsSectionId[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
  }

  private loadAccountsData(): void {
    forkJoin({
      customers: this.financialApiService.getCustomers().pipe(catchError(() => of([] as ApiCustomer[]))),
      accounts: this.financialApiService.getAccounts().pipe(catchError(() => of([] as ApiAccount[]))),
    })
      .pipe(
        switchMap(({ customers, accounts }) => {
          this.applyPrimaryCard(customers, accounts);

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
          this.applyStats(accounts, transactions);
          this.applyRecentTransactions(accounts, customers, transactions);
          this.applySummaryChart(transactions);
          this.applyScheduledPayments(accounts, customers, transactions);
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  private applyPrimaryCard(customers: ReadonlyArray<ApiCustomer>, accounts: ReadonlyArray<ApiAccount>): void {
    const account = accounts[0];
    if (!account) {
      this.primaryCard = null;
      return;
    }

    const customer = customers.find((item) => item.id === account.customer_id);

    this.primaryCard = {
      balance: this.formatMoney(this.toNumber(account.balance)),
      holder: customer ? `${customer.first_name} ${customer.last_name}` : this.maskShortAccount(account.account_number),
      expiry: '—',
      number: this.maskAccountNumber(account.account_number),
    };
  }

  private applyStats(accounts: ReadonlyArray<ApiAccount>, transactions: ReadonlyArray<ApiTransaction>): void {
    const totalBalance = accounts.reduce((sum, account) => sum + this.toNumber(account.balance), 0);
    const totalIncome = transactions
      .filter((transaction) => transaction.type === 'deposit')
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);
    const totalExpenses = transactions
      .filter((transaction) => transaction.type === 'withdraw')
      .reduce((sum, transaction) => sum + this.toNumber(transaction.amount), 0);
    const totalSavings = Math.max(totalIncome - totalExpenses, 0);

    this.stats = [
      { labelKey: 'accounts.stats.balance', value: this.formatMoney(totalBalance), icon: 'wallet', tone: 'warning' },
      { labelKey: 'accounts.stats.savings', value: this.formatMoney(totalSavings), icon: 'savings', tone: 'accent' },
      { labelKey: 'accounts.stats.expenses', value: this.formatMoney(totalExpenses), icon: 'expense', tone: 'danger' },
      { labelKey: 'accounts.stats.income', value: this.formatMoney(totalIncome), icon: 'income', tone: 'primary' },
    ];
  }

  private applyRecentTransactions(
    accounts: ReadonlyArray<ApiAccount>,
    customers: ReadonlyArray<ApiCustomer>,
    transactions: ReadonlyArray<ApiTransaction>,
  ): void {
    const accountMap = new Map(accounts.map((account) => [account.id, account]));
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]));

    this.recentTransactions = [...transactions]
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 3)
      .map((transaction) => {
        const account = accountMap.get(transaction.account_id);
        const customer = account ? customerMap.get(account.customer_id) : undefined;
        const holder = customer ? `${customer.first_name} ${customer.last_name}` : 'Cuenta';
        const isDeposit = transaction.type === 'deposit';
        const amount = this.toNumber(transaction.amount);

        return {
          icon: isDeposit ? 'deposit' : 'withdraw',
          title: holder,
          subtitle: this.formatDate(transaction.created_at),
          category: isDeposit ? 'Depósito' : 'Retiro',
          account: account ? this.maskShortAccount(account.account_number) : '----',
          status: 'Completado',
          amount: `${isDeposit ? '+' : '-'}${this.formatMoney(amount)}`,
          amountTone: isDeposit ? 'success' : 'danger',
        } as TransactionListItem;
      });
  }

  private applySummaryChart(transactions: ReadonlyArray<ApiTransaction>): void {
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
    const months: Array<{ key: string; debit: number; credit: number }> = [];

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      months.push({ key: monthKeyByIndex[date.getMonth()], debit: 0, credit: 0 });
    }

    for (const transaction of transactions) {
      const date = new Date(transaction.created_at);
      const key = monthKeyByIndex[date.getMonth()];
      const targetMonth = months.find((item) => item.key === key);
      if (!targetMonth) {
        continue;
      }

      const amount = this.toNumber(transaction.amount);
      if (transaction.type === 'withdraw') {
        targetMonth.debit += amount;
      } else if (transaction.type === 'deposit') {
        targetMonth.credit += amount;
      }
    }

    this.summaryLabels = months.map((item) => item.key);
    this.summarySeries = [
      {
        nameKey: 'accounts.summary.debit',
        color: 'primary',
        values: months.map((item) => Math.round(item.debit)),
      },
      {
        nameKey: 'accounts.summary.credit',
        color: 'warning',
        values: months.map((item) => Math.round(item.credit)),
      },
    ];
  }

  private applyScheduledPayments(
    accounts: ReadonlyArray<ApiAccount>,
    customers: ReadonlyArray<ApiCustomer>,
    transactions: ReadonlyArray<ApiTransaction>,
  ): void {
    const accountMap = new Map(accounts.map((account) => [account.id, account]));
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]));

    this.scheduledPayments = [...transactions]
      .filter((transaction) => transaction.type === 'withdraw')
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 4)
      .map((transaction) => {
        const account = accountMap.get(transaction.account_id);
        const customer = account ? customerMap.get(account.customer_id) : undefined;
        const title = customer ? `${customer.first_name} ${customer.last_name}` : 'Pago';

        return {
          icon: 'service',
          title,
          subtitle: this.formatDate(transaction.created_at),
          amount: this.formatMoney(this.toNumber(transaction.amount)),
          amountTone: 'muted',
        } as TransactionListItem;
      });
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

  private maskShortAccount(accountNumber: string): string {
    const digits = accountNumber.replace(/\D/g, '');
    return `${digits.slice(0, 4)} ****`;
  }
}
