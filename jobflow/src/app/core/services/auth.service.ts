import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

const TOKEN_KEY = 'auth_token';
const API_LOGIN = '/api/auth/login';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
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
