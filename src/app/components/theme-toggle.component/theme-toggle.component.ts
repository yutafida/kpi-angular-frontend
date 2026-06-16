// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-theme-toggle.component',
//   imports: [],
//   templateUrl: './theme-toggle.component.html',
//   styleUrl: './theme-toggle.component.css',
// })
// export class ThemeToggleComponent {}


import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';



/**
 * Reusable dark/light theme toggle button.
 *
 * Drop it into any header, sidebar, or toolbar:
 *
 *   <app-theme-toggle />
 *
 * Visual: a sliding pill with sun/moon icons that mirrors the
 * DOPLANS launcher page toggle.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.title]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      class="relative w-12 h-6 rounded-full border transition-colors duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-naf-gold/40 focus:ring-offset-2 focus:ring-offset-transparent"
      [class.bg-slate-200]="theme.isLight()"
      [class.border-slate-300]="theme.isLight()"
      [class.bg-slate-700]="theme.isDark()"
      [class.border-slate-600]="theme.isDark()">

      <!-- Sun icon (visible in light mode) -->
      <span
        class="absolute left-1.5 top-1.5 transition-transform duration-300"
        [class.translate-x-0]="theme.isLight()"
        [class.-translate-x-6]="theme.isDark()"
        [class.opacity-100]="theme.isLight()"
        [class.opacity-0]="theme.isDark()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             class="text-naf-navy">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
        </svg>
      </span>

      <!-- Moon icon (visible in dark mode) -->
      <span
        class="absolute right-1.5 top-1.5 transition-transform duration-300"
        [class.translate-x-0]="theme.isDark()"
        [class.translate-x-6]="theme.isLight()"
        [class.opacity-100]="theme.isDark()"
        [class.opacity-0]="theme.isLight()">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round"
             class="text-naf-gold">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </span>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
  `]
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
