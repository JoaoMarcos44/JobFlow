import gsap from 'gsap';
import { prefersReducedMotion } from '../../core/motion-prefs';

export function createDashboardShellEntrance(host: HTMLElement): gsap.Context {
  if (prefersReducedMotion()) {
    return gsap.context(() => {}, host);
  }
  return gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.dash-anim-sidebar', { x: -32, opacity: 0, duration: 0.55 })
      .from('.dash-anim-topbar', { y: -18, opacity: 0, duration: 0.48 }, '-=0.38')
      .from('.dash-anim-outlet', { opacity: 0, y: 14, duration: 0.42 }, '-=0.32');
  }, host);
}

/** Blocos de topo da vista (filhos diretos do root). */
export function createDashboardViewStagger(root: HTMLElement): gsap.Context {
  if (prefersReducedMotion()) {
    return gsap.context(() => {}, root);
  }
  return gsap.context(() => {
    const blocks = root.querySelectorAll(':scope > *');
    if (blocks.length) {
      gsap.from(blocks, {
        y: 18,
        opacity: 0,
        duration: 0.44,
        stagger: 0.07,
        ease: 'power3.out',
      });
    }
  }, root);
}

export function animateElementsFrom(root: HTMLElement, selector: string, vars: gsap.TweenVars): void {
  if (prefersReducedMotion()) return;
  const els = root.querySelectorAll(selector);
  if (els.length) gsap.from(els, vars);
}
