import {
  Injectable,
  signal,
  effect,
  computed,
  inject,
  Injector,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private static readonly STORAGE_KEY = 'doplans-theme';

  // ── Core signal ──
  private readonly _theme = signal<ThemeMode>('dark');
  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');
  readonly isLight = computed(() => this._theme() === 'light');

  // ── DI deps (declared BEFORE the effect that uses them) ──
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  /**
   * Auto-sync effect. Uses an explicit `injector` option so it works
   * even if Angular's strict injection-context check would otherwise
   * reject a field-level effect on your Angular version.
   */
  private readonly syncEffect = effect(() => {
    const mode = this._theme();
    const root = this.document.documentElement;

    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', mode);
    this.writeStoredTheme(mode);
  }, { injector: this.injector });

  /** Seed the initial mode from storage or OS preference. Call once at bootstrap. */
  init(): void {
    const stored = this.readStoredTheme();
    const initial = stored ?? this.readSystemPreference();
    this._theme.set(initial);
  }

  toggle(): void {
    this._theme.update(m => (m === 'dark' ? 'light' : 'dark'));
  }

  setTheme(mode: ThemeMode): void {
    this._theme.set(mode);
  }

  // ── helpers ──
  private readStoredTheme(): ThemeMode | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(ThemeService.STORAGE_KEY);
      return raw === 'light' || raw === 'dark' ? raw : null;
    } catch {
      return null;
    }
  }

  private writeStoredTheme(mode: ThemeMode): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(ThemeService.STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  private readSystemPreference(): ThemeMode {
    if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}