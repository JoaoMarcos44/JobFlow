import gsap from 'gsap';
import { animateElementsFrom, createDashboardViewStagger } from './dashboard.animations';

export interface ViewHighlightAnimation {
  selector: string;
  vars: gsap.TweenVars;
}

/** Raiz da vista dentro do host do componente (fallback: o próprio host). */
export function viewRoot(host: HTMLElement, cssSelector: string): HTMLElement {
  return (host.querySelector(cssSelector) as HTMLElement) ?? host;
}

/**
 * Animação de entrada padrão do dashboard: stagger nos filhos diretos + opcional em elementos internos.
 * Devolve contexto GSAP para `revert()` no destroy.
 */
export function mountDashboardView(root: HTMLElement, highlight?: ViewHighlightAnimation): gsap.Context {
  const ctx = createDashboardViewStagger(root);
  if (highlight) {
    queueMicrotask(() => animateElementsFrom(root, highlight.selector, highlight.vars));
  }
  return ctx;
}
