import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prefersReducedMotion } from './motion-prefs';

function mockMediaQueryList(matches: boolean, media: string): MediaQueryList {
  return {
    matches,
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe('prefersReducedMotion', () => {
  const original = typeof window !== 'undefined' ? window.matchMedia : undefined;

  beforeEach(() => {
    window.matchMedia = vi.fn();
  });

  afterEach(() => {
    if (original) {
      window.matchMedia = original;
    }
  });

  it('devolve false quando prefers-reduced-motion: no-preference', () => {
    vi.mocked(window.matchMedia).mockReturnValue(mockMediaQueryList(false, ''));
    expect(prefersReducedMotion()).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('devolve true quando prefers-reduced-motion: reduce', () => {
    vi.mocked(window.matchMedia).mockReturnValue(
      mockMediaQueryList(true, '(prefers-reduced-motion: reduce)'),
    );
    expect(prefersReducedMotion()).toBe(true);
  });
});
