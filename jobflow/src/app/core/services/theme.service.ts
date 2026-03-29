import { Injectable, signal } from '@angular/core';
import { prefersReducedMotion } from '../motion-prefs';

const STORAGE_KEY = 'theme';

type DocWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> };
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** `true` = modo claro (ícone sol); `false` = modo escuro (ícone lua). */
  readonly isLight = signal(this.readInitial());

  constructor() {
    this.applyDom();
  }

  toggle(): void {
    if (typeof document === 'undefined') return;

    const nextLight = !this.isLight();
    const apply = (): void => {
      this.isLight.set(nextLight);
      this.persist();
      document.documentElement.classList.toggle('theme-light', nextLight);
    };

    if (prefersReducedMotion()) {
      apply();
      return;
    }

    const doc = document as DocWithViewTransition;
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(apply);
    } else {
      apply();
    }
  }

  private readInitial(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'light';
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, this.isLight() ? 'light' : 'dark');
  }

  private applyDom(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('theme-light', this.isLight());
  }
}
