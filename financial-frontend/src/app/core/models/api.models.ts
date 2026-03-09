export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | string;
  is_active: boolean;
  profile_image_url?: string | null;
  created_at: string;
}

export interface ApiCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  dpi?: string;
  birth_date?: string;
  address?: string;
  department?: string;
  municipality?: string;
}

export interface ApiAccount {
  id: number;
  customer_id: number;
  account_number: string;
  balance: number | string;
}

export interface ApiTransaction {
  id: number;
  account_id: number;
  amount: number | string;
  type: 'deposit' | 'withdraw' | string;
  created_at: string;
}

export interface CreateCustomerPayload {
  first_name: string;
  last_name: string;
  email: string;
  dpi: string;
  birth_date: string;
  address: string;
  department: string;
  municipality: string;
}
