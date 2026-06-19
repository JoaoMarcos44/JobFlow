import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('cria o formulário', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('onSubmit com e-mail inválido não chama HTTP', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.email = 'invalido';
    component.password = '123456';
    component.onSubmit();
    httpMock.expectNone('/api/auth/login');
    expect(component.message()?.type).toBe('error');
  });

  it('onSubmit com palavra-passe curta não chama HTTP', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.email = 'a@b.com';
    component.password = '12345';
    component.onSubmit();
    httpMock.expectNone('/api/auth/login');
    expect(component.message()?.type).toBe('error');
  });
});
