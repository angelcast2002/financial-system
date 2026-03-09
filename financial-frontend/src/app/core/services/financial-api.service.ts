import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  ApiAccount,
  ApiCustomer,
  ApiTransaction,
  CreateCustomerPayload,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class FinancialApiService {
  private readonly http = inject(HttpClient);

  getCustomers(): Observable<ApiCustomer[]> {
    return this.http.get<ApiCustomer[]>(`${API_BASE_URL}/customers/`);
  }

  getMyCustomer(): Observable<ApiCustomer> {
    return this.http.get<ApiCustomer>(`${API_BASE_URL}/customers/me`);
  }

  createCustomer(payload: CreateCustomerPayload): Observable<ApiCustomer> {
    return this.http.post<ApiCustomer>(`${API_BASE_URL}/customers/`, payload);
  }

  createMyCustomer(payload: CreateCustomerPayload): Observable<ApiCustomer> {
    return this.http.post<ApiCustomer>(`${API_BASE_URL}/customers/me`, payload);
  }

  updateCustomer(customerId: number, payload: CreateCustomerPayload): Observable<ApiCustomer> {
    return this.http.put<ApiCustomer>(`${API_BASE_URL}/customers/${customerId}`, payload);
  }

  updateMyCustomer(payload: CreateCustomerPayload): Observable<ApiCustomer> {
    return this.http.put<ApiCustomer>(`${API_BASE_URL}/customers/me`, payload);
  }

  getAccounts(): Observable<ApiAccount[]> {
    return this.http.get<ApiAccount[]>(`${API_BASE_URL}/accounts/`);
  }

  createAccount(customerId: number): Observable<ApiAccount> {
    return this.http.post<ApiAccount>(`${API_BASE_URL}/accounts/`, {
      customer_id: customerId,
    });
  }

  getTransactionsByAccount(accountId: number): Observable<ApiTransaction[]> {
    return this.http.get<ApiTransaction[]>(`${API_BASE_URL}/transactions/account/${accountId}`);
  }

  getTransactionsForAccounts(accountIds: ReadonlyArray<number>): Observable<ApiTransaction[]> {
    if (!accountIds.length) {
      return of([]);
    }

    return forkJoin(accountIds.map((id) => this.getTransactionsByAccount(id))).pipe(
      map((results) => results.flat()),
    );
  }
}
