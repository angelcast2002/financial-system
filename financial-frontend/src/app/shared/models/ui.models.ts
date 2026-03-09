export type IconName =
  | 'brand'
  | 'home'
  | 'transactions'
  | 'accounts'
  | 'register'
  | 'integration'
  | 'settings'
  | 'notification'
  | 'wallet'
  | 'income'
  | 'expense'
  | 'savings'
  | 'card'
  | 'deposit'
  | 'withdraw'
  | 'service'
  | 'transfer'
  | 'pending'
  | 'send'
  | 'drag'
  | 'chevron-right'
  | 'edit'
  | 'user'
  | 'mail'
  | 'id'
  | 'calendar'
  | 'location'
  | 'account_balance'
  | 'logout';

export type Tone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

export interface StatTileData {
  labelKey: string;
  value: string;
  icon: IconName;
  tone?: Tone;
}

export type AmountTone = 'success' | 'danger' | 'muted';

export interface TransactionListItem {
  icon: IconName;
  title: string;
  subtitle: string;
  category?: string;
  account?: string;
  status?: string;
  amount: string;
  amountTone: AmountTone;
}

export type SeriesColor = 'primary' | 'accent' | 'warning' | 'danger' | 'success';

export interface ChartSeries {
  nameKey: string;
  values: ReadonlyArray<number>;
  color: SeriesColor;
}

export interface DonutSlice {
  labelKey: string;
  value: number;
  color: string;
}

export interface QuickContact {
  name: string;
  relation: string;
  avatarUrl: string;
}

export interface SelectOption {
  label: string;
  value: string;
}
