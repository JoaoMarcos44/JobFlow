import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserSettingsService } from './user-settings.service';

describe('UserSettingsService', () => {
  let service: UserSettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserSettingsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserSettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('changePassword envia PUT /api/users/password', () => {
    service.changePassword('old', 'newpass12').subscribe((result) => expect(result.success).toBe(true));
    const passwordRequest = http.expectOne('/api/users/password');
    expect(passwordRequest.request.method).toBe('PUT');
    expect(passwordRequest.request.body).toEqual({ currentPassword: 'old', newPassword: 'newpass12' });
    passwordRequest.flush(null);
  });
});
