import { describe, it, expect, beforeEach } from 'vitest';
import {
  markWelcomeAnimationForFullPageLoad,
  consumeWelcomeFullPageAnimationFlag,
} from './welcome-animation-flag';

describe('welcome-animation-flag', () => {
  const key = 'jobflow-welcome-fullpage-animate';

  beforeEach(() => {
    sessionStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('markWelcome: define chave quando URL é raiz /', () => {
    window.history.pushState({}, '', '/');
    markWelcomeAnimationForFullPageLoad();
    expect(sessionStorage.getItem(key)).toBe('1');
  });

  it('markWelcome: define chave quando URL é /welcome', () => {
    window.history.pushState({}, '', '/welcome');
    markWelcomeAnimationForFullPageLoad();
    expect(sessionStorage.getItem(key)).toBe('1');
  });

  it('markWelcome: não define chave em /login', () => {
    window.history.pushState({}, '', '/login');
    markWelcomeAnimationForFullPageLoad();
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it('consumeWelcome: devolve true uma vez e remove a chave', () => {
    sessionStorage.setItem(key, '1');
    expect(consumeWelcomeFullPageAnimationFlag()).toBe(true);
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(consumeWelcomeFullPageAnimationFlag()).toBe(false);
  });

  it('consumeWelcome: devolve false sem chave', () => {
    expect(consumeWelcomeFullPageAnimationFlag()).toBe(false);
  });
});
