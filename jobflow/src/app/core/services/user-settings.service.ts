import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { readApiErrorMessage } from '../http/api-error';

export type SettingsResult = { success: true } | { success: false; error: string };

@Injectable({ providedIn: 'root' })
export class UserSettingsService {
  constructor(private http: HttpClient) {}

  changePassword(currentPassword: string, newPassword: string): Observable<SettingsResult> {
    return this.http
      .put<void>('/api/users/password', { currentPassword, newPassword })
      .pipe(
        map(() => ({ success: true as const })),
        catchError((error) =>
          of({
            success: false as const,
            error: readApiErrorMessage(error, `Erro (${error?.status ?? 'rede'}).`),
          }),
        ),
      );
  }

  changeEmail(newEmail: string, password: string): Observable<SettingsResult> {
    return this.http
      .put<void>('/api/users/email', { newEmail: newEmail.trim(), password })
      .pipe(
        map(() => ({ success: true as const })),
        catchError((error) =>
          of({
            success: false as const,
            error: readApiErrorMessage(error, `Erro (${error?.status ?? 'rede'}).`),
          }),
        ),
      );
  }
}
