import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('login com token guarda auth_token no localStorage', async () => {
    const promise = firstValueFrom(service.login('dev@test.com', 'secret12'));
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.body).toEqual({ email: 'dev@test.com', password: 'secret12' });
    req.flush({ token: 'jwt-token' });
    const res = await promise;
    expect(res).toEqual({ success: true, token: 'jwt-token' });
    expect(localStorage.getItem('auth_token')).toBe('jwt-token');
  });

  it('login sem token na resposta devolve erro', async () => {
    const promise = firstValueFrom(service.login('a@b.com', 'secret12'));
    httpMock.expectOne('/api/auth/login').flush({});
    const res = await promise;
    expect(res).toEqual({ success: false, error: 'Token não retornado pela API.' });
  });

  it('login 401 devolve mensagem de credenciais', async () => {
    const promise = firstValueFrom(service.login('a@b.com', 'wrongpwd'));
    httpMock.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    const res = await promise;
    expect(res).toEqual({ success: false, error: 'Email ou palavra-passe inválidos.' });
  });

  it('requestPasswordReset sucesso', async () => {
    const promise = firstValueFrom(service.requestPasswordReset('a@b.com'));
    httpMock.expectOne('/api/auth/forgot-password').flush({});
    expect(await promise).toEqual({ success: true });
  });

  it('register com token guarda auth_token', async () => {
    const promise = firstValueFrom(
      service.register({ email: 'n@b.com', password: 'secret12' }),
    );
    httpMock.expectOne('/api/auth/register').flush({ token: 'reg-token' });
    const res = await promise;
    expect(res).toEqual({ success: true, token: 'reg-token' });
    expect(localStorage.getItem('auth_token')).toBe('reg-token');
  });

  it('register 409 devolve e-mail já registado', async () => {
    const promise = firstValueFrom(
      service.register({ email: 'x@b.com', password: 'secret12' }),
    );
    httpMock.expectOne('/api/auth/register').flush({}, { status: 409, statusText: 'Conflict' });
    const res = await promise;
    expect(res).toEqual({ success: false, error: 'Este e-mail já está registado.' });
  });

  it('removeToken limpa localStorage', () => {
    localStorage.setItem('auth_token', 'x');
    service.removeToken();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
