import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const PUBLIC_AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const requestUrl = request.url;
  const isJobFlowApi = requestUrl.startsWith('/api/');
  const isPublicAuthEndpoint = PUBLIC_AUTH_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint));

  if (token && isJobFlowApi && !isPublicAuthEndpoint) {
    return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(request);
};
