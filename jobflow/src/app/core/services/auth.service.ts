import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

const TOKEN_KEY = 'auth_token';
const API_LOGIN = '/api/auth/login';
const API_REGISTER = '/api/auth/register';
const API_FORGOT_PASSWORD = '/api/auth/forgot-password';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  name?: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<{ success: true; token: string } | { success: false; error: string }> {
    return this.http
      .post<LoginResponse>(API_LOGIN, { email: email.trim(), password } as LoginRequest)
      .pipe(
        map((res) => {
          const token = res?.token;
          if (!token) return { success: false as const, error: 'Token não retornado pela API.' };
          this.setToken(token);
          return { success: true as const, token };
        }),
        catchError((err) => {
          const msg =
            err?.error?.error ||
            err?.error?.message ||
            (err?.status === 401 ? 'Email ou palavra-passe inválidos.' : `Erro ao fazer login (${err?.status || 'rede'}).`);
          return of({ success: false as const, error: msg });
        })
      );
  }

  requestPasswordReset(
    email: string,
  ): Observable<{ success: true } | { success: false; error: string }> {
    return this.http.post<{ message?: string }>(API_FORGOT_PASSWORD, { email: email.trim() }).pipe(
      map(() => ({ success: true as const })),
      catchError((err) => {
        const msg =
          err?.error?.error ||
          err?.error?.message ||
          `Não foi possível enviar o e-mail (${err?.status || 'rede'}).`;
        return of({ success: false as const, error: msg });
      }),
    );
  }

  register(
    payload: RegisterRequest,
  ): Observable<{ success: true; token: string } | { success: false; error: string }> {
    const body = {
      email: payload.email.trim(),
      password: payload.password,
      ...(payload.name?.trim() ? { name: payload.name.trim() } : {}),
    };
    return this.http.post<LoginResponse>(API_REGISTER, body).pipe(
      map((res) => {
        const token = res?.token;
        if (!token) return { success: false as const, error: 'Token não retornado pela API.' };
        this.setToken(token);
        return { success: true as const, token };
      }),
      catchError((err) => {
        const msg =
          err?.error?.error ||
          err?.error?.message ||
          (err?.status === 409
            ? 'Este e-mail já está registado.'
            : `Erro ao criar conta (${err?.status || 'rede'}).`);
        return of({ success: false as const, error: msg });
      }),
    );
  }

  getToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }

  setToken(token: string): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
  }

  removeToken(): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
