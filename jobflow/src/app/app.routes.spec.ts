import { describe, it, expect } from 'vitest';
import { routes } from './app.routes';

describe('app.routes', () => {
  it('inclui rotas welcome, login, register, recuperar-conta e dashboard', () => {
    const paths = routes.map((r) => r.path).filter(Boolean);
    expect(paths).toContain('welcome');
    expect(paths).toContain('login');
    expect(paths).toContain('register');
    expect(paths).toContain('recuperar-conta');
    expect(paths).toContain('dashboard');
  });

  it('raiz redireciona para welcome', () => {
    const root = routes.find((r) => r.path === '');
    expect(root?.redirectTo).toBe('welcome');
  });

  it('wildcard redireciona para welcome', () => {
    const wild = routes.find((r) => r.path === '**');
    expect(wild?.redirectTo).toBe('welcome');
  });

  it('dashboard tem filhos feed, candidaturas, analytics, curriculos e definicoes', () => {
    const dash = routes.find((r) => r.path === 'dashboard');
    const children = dash && 'children' in dash ? dash.children ?? [] : [];
    const paths = children.map((c) => c.path).filter(Boolean);
    expect(paths).toEqual(
      expect.arrayContaining(['feed', 'candidaturas', 'analytics', 'curriculos', 'definicoes']),
    );
    const defaultChild = children.find((c) => c.path === '' && 'redirectTo' in c);
    expect(defaultChild && 'redirectTo' in defaultChild ? defaultChild.redirectTo : null).toBe('feed');
  });
});
