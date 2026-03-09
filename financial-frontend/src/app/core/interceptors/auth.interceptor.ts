import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh')
  );
}

function withAuthorization(request: Parameters<HttpInterceptorFn>[0], token: string) {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function getRequestBearerToken(request: Parameters<HttpInterceptorFn>[0]): string | null {
  const headerValue = request.headers.get('Authorization');
  if (!headerValue?.startsWith('Bearer ')) {
    return null;
  }

  return headerValue.slice('Bearer '.length).trim() || null;
}

function isStaleAuthFailure(request: Parameters<HttpInterceptorFn>[0], authService: AuthService): boolean {
  const requestToken = getRequestBearerToken(request);
  const currentToken = authService.getAccessToken();

  return !!requestToken && (!currentToken || requestToken !== currentToken);
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const authRequest = !isAuthEndpoint(request.url) && token
    ? withAuthorization(request, token)
    : request;

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      const httpError = error as HttpErrorResponse;
      if (httpError.status !== 401 || isAuthEndpoint(request.url)) {
        return throwError(() => error);
      }

      if (isStaleAuthFailure(authRequest, authService)) {
        return throwError(() => error);
      }

      if (!authService.getRefreshToken()) {
        authService.logout();
        return throwError(() => error);
      }

      return authService.refreshAccessToken().pipe(
        switchMap((newToken) => next(withAuthorization(request, newToken))),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
