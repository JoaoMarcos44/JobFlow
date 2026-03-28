const STORAGE_KEY = 'jobflow-welcome-fullpage-animate';

/**
 * Chamado em main.ts em cada carregamento completo do documento.
 * Só marca animação se o URL inicial for a raiz ou /welcome (antes do router redirecionar).
 */
export function markWelcomeAnimationForFullPageLoad(): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    const path = (window.location.pathname || '/').replace(/\/$/, '') || '/';
    const landsOnWelcome = path === '/' || path === '/welcome';
    if (landsOnWelcome) {
      sessionStorage.setItem(STORAGE_KEY, '1');
    }
  } catch {
    /* private mode / storage blocked */
  }
}

/**
 * Devolve true uma vez por carregamento completo quando a welcome deve animar;
 * em navegações internas para /welcome a chave não existe.
 */
export function consumeWelcomeFullPageAnimationFlag(): boolean {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    if (sessionStorage.getItem(STORAGE_KEY) !== '1') return false;
    sessionStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
