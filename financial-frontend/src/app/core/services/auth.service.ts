import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthTokenPair, AuthUser } from '../models/api.models';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly accessToken = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly refreshToken = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));

  readonly user = signal<AuthUser | null>(null);
  readonly sessionChecked = signal(false);
  readonly isAuthenticated = computed(() => !!this.accessToken());

  bootstrapSession(): Observable<void> {
    const token = this.accessToken();
    if (!token) {
      this.sessionChecked.set(true);
      return of(void 0);
    }

    return this.getProfile().pipe(
      tap((profile) => this.user.set(profile)),
      map(() => void 0),
      catchError(() => {
        const currentToken = this.accessToken();
        const isStaleBootstrapRequest = !!currentToken && currentToken !== token;

        if (!isStaleBootstrapRequest) {
          this.clearTokens();
          this.user.set(null);
        }

        return of(void 0);
      }),
      finalize(() => this.sessionChecked.set(true)),
    );
  }

  login(usernameOrEmail: string, password: string): Observable<void> {
    const body = new HttpParams({
      fromObject: {
        username: usernameOrEmail,
        password,
      },
    }).toString();

    return this.http
      .post<AuthTokenPair>(`${API_BASE_URL}/auth/login`, body, {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
      .pipe(
        tap((tokens) => this.saveTokens(tokens)),
        switchMap(() => this.getProfile()),
        tap((profile) => {
          this.user.set(profile);
          this.sessionChecked.set(true);
        }),
        map(() => void 0),
      );
  }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthTokenPair>(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .pipe(
        map((tokens) => {
          const currentRefreshToken = this.refreshToken();
          if (!currentRefreshToken || currentRefreshToken !== refreshToken) {
            throw new Error('Stale refresh response ignored');
          }

          this.saveTokens(tokens);
          return tokens.access_token;
        }),
      );
  }

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API_BASE_URL}/auth/me`);
  }

  uploadProfileImage(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<AuthUser>(`${API_BASE_URL}/auth/me/avatar`, formData)
      .pipe(
        tap((profile) => this.user.set(profile)),
        map(() => void 0),
      );
  }

  logout(navigateToLogin = true): void {
    this.clearTokens();
    this.user.set(null);
    this.sessionChecked.set(true);

    if (navigateToLogin && this.router.url !== '/login') {
      void this.router.navigateByUrl('/login');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  getRefreshToken(): string | null {
    return this.refreshToken();
  }

  private saveTokens(tokens: AuthTokenPair): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    this.accessToken.set(tokens.access_token);
    this.refreshToken.set(tokens.refresh_token);
  }

  private clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.accessToken.set(null);
    this.refreshToken.set(null);
  }
}
