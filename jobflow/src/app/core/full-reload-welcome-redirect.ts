/**
 * Só em **recarregamento completo** (F5) **a partir da rota de login** envia para `/welcome`.
 * Recarregar no dashboard ou noutras rotas mantém o URL atual.
 * Navegações internas da SPA não passam por aqui.
 *
 * @returns `true` se iniciou `location.replace` — não deve chamar `bootstrapApplication` depois.
 */
export function redirectFullReloadToWelcome(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const entry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (!entry || entry.type !== 'reload') {
      return false;
    }

    const path = (window.location.pathname || '/').replace(/\/$/, '') || '/';
    if (path !== '/login') {
      return false;
    }

    const { origin, search, hash } = window.location;
    window.location.replace(`${origin}/welcome${search}${hash}`);
    return true;
  } catch {
    return false;
  }
}
