import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

type SettingsResult = { success: true } | { success: false; error: string };

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  constructor(private http: HttpClient) {}

  changePassword(currentPassword: string, newPassword: string): Observable<SettingsResult> {
    return this.http
      .put<void>('/api/users/password', { currentPassword, newPassword })
      .pipe(
        map(() => ({ success: true as const })),
        catchError((err) => of({ success: false as const, error: this.readError(err) })),
      );
  }

  changeEmail(newEmail: string, password: string): Observable<SettingsResult> {
    return this.http
      .put<void>('/api/users/email', { newEmail: newEmail.trim(), password })
      .pipe(
        map(() => ({ success: true as const })),
        catchError((err) => of({ success: false as const, error: this.readError(err) })),
      );
  }

  private readError(err: { error?: { error?: string; message?: string }; status?: number }): string {
    return (
      err?.error?.error ||
      err?.error?.message ||
      (err?.status === 400 ? 'Dados inválidos. Verifique os campos.' : `Erro (${err?.status ?? 'rede'}).`)
    );
  }
}
