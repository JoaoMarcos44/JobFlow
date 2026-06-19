import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { readApiErrorMessage } from '../http/api-error';

const TOKEN_STORAGE_KEY = 'auth_token';
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

export type AuthResult =
  | { success: true; token: string }
  | { success: false; error: string };

export type SimpleAuthResult = { success: true } | { success: false; error: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResult> {
    return this.http
      .post<LoginResponse>(API_LOGIN, { email: email.trim(), password } as LoginRequest)
      .pipe(
        map((response) => this.handleTokenResponse(response)),
        catchError((error) =>
          of({
            success: false as const,
            error: readApiErrorMessage(
              error,
              error?.status === 401
                ? 'Email ou palavra-passe inválidos.'
                : `Erro ao fazer login (${error?.status || 'rede'}).`,
            ),
          }),
        ),
      );
  }

  requestPasswordReset(email: string): Observable<SimpleAuthResult> {
    return this.http.post<{ message?: string }>(API_FORGOT_PASSWORD, { email: email.trim() }).pipe(
      map(() => ({ success: true as const })),
      catchError((error) =>
        of({
          success: false as const,
          error: readApiErrorMessage(
            error,
            `Não foi possível enviar o e-mail (${error?.status || 'rede'}).`,
          ),
        }),
      ),
    );
  }

  register(payload: RegisterRequest): Observable<AuthResult> {
    const body = {
      email: payload.email.trim(),
      password: payload.password,
      ...(payload.name?.trim() ? { name: payload.name.trim() } : {}),
    };
    return this.http.post<LoginResponse>(API_REGISTER, body).pipe(
      map((response) => this.handleTokenResponse(response)),
      catchError((error) =>
        of({
          success: false as const,
          error: readApiErrorMessage(
            error,
            error?.status === 409
              ? 'Este e-mail já está registado.'
              : `Erro ao criar conta (${error?.status || 'rede'}).`,
          ),
        }),
      ),
    );
  }

  private handleTokenResponse(response: LoginResponse): AuthResult {
    const token = response?.token;
    if (!token) return { success: false as const, error: 'Token não retornado pela API.' };
    this.setToken(token);
    return { success: true as const, token };
  }

  getToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  }

  setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }

  removeToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
