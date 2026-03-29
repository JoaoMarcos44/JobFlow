import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { redirectFullReloadToWelcome } from './full-reload-welcome-redirect';

describe('redirectFullReloadToWelcome', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  function mockPerformanceNavigation(type: string | undefined) {
    const entry = type ? { type } : undefined;
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue(
      entry ? ([entry] as unknown as PerformanceEntryList) : [],
    );
  }

  it('não redireciona quando não é reload', () => {
    mockPerformanceNavigation('navigate');
    window.history.pushState({}, '', '/login');
    expect(redirectFullReloadToWelcome()).toBe(false);
  });

  it('não redireciona em reload se não estiver em /login', () => {
    mockPerformanceNavigation('reload');
    window.history.pushState({}, '', '/dashboard/feed');
    expect(redirectFullReloadToWelcome()).toBe(false);
  });

  it('em reload em /login devolve true (location.replace é chamado no browser)', () => {
    mockPerformanceNavigation('reload');
    window.history.pushState({}, '', '/login');
    const replaceMock = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/login',
        origin: 'http://localhost:4200',
        search: '',
        hash: '',
        replace: replaceMock,
      },
    });

    expect(redirectFullReloadToWelcome()).toBe(true);
    expect(replaceMock).toHaveBeenCalledWith('http://localhost:4200/welcome');

    vi.restoreAllMocks();
  });
});
