import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('theme-light');
    TestBed.resetTestingModule();
  });

  it('aplica theme-light no html quando localStorage theme=light', () => {
    localStorage.setItem('theme', 'light');
    TestBed.configureTestingModule({});
    TestBed.inject(ThemeService);
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
  });

  it('não aplica theme-light por omissão (dark)', () => {
    TestBed.configureTestingModule({});
    TestBed.inject(ThemeService);
    expect(document.documentElement.classList.contains('theme-light')).toBe(false);
  });

  it('toggle alterna classe e persiste em localStorage', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    const wasLight = service.isLight();
    service.toggle();
    expect(service.isLight()).toBe(!wasLight);
    expect(localStorage.getItem('theme')).toBe(!wasLight ? 'light' : 'dark');
    expect(document.documentElement.classList.contains('theme-light')).toBe(!wasLight);
  });
});
