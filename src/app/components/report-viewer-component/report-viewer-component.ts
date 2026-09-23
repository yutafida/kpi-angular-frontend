import {
  Component,
  input,
  output,
  computed,
  signal,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Observable, EMPTY, catchError, debounceTime, filter, switchMap } from 'rxjs';

import { KpiService, ReportQuarter } from '../../services/kpi-service';
import { ReportMonth } from '../../shared/report-month';
import { FilterStateService } from '../../services/filter-state';

export type WriteUpMode =
  | 'GENERAL_MONTHLY'
  | 'GENERAL_QUARTERLY'
  | 'AIR_COMPONENT_MONTHLY'
  | 'AIR_COMPONENT_QUARTERLY';

interface ReportResponse {
  content?: string;
  classification?: string;
  reference?: string;
}

@Component({
  selector: 'app-report-viewer-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-viewer-component.html',
  styleUrl: './report-viewer-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportViewerComponent {
  // ===== Signal inputs =====
  readonly mode = input<WriteUpMode>('GENERAL_MONTHLY');
  readonly airComponentId = input<number | null>(null);
  readonly isVisible = input<boolean>(false);

  // New: allow parent to override classification / reference. Otherwise derived.
  readonly classification = input<string>('SECRET');
  readonly reference = input<string>('');

  readonly exitViewMode = output<void>();

  // ===== Injected deps =====
  private readonly kpiService = inject(KpiService);
  private readonly filterState = inject(FilterStateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  // ===== Shared filter signals =====
  private readonly selectedMonth = this.filterState.selectedMonth;
  private readonly selectedQuarter = this.filterState.selectedQuarter;
  private readonly selectedYear = this.filterState.selectedYear;
  private readonly filterType = this.filterState.filterType;

  // ===== UI state as signals =====
  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);
  readonly reportContent = signal<SafeHtml>('');
  readonly renderKey = signal(0);

  // ===== Computed =====
  readonly periodLabel = computed(() => {
    const m = this.mode();
    const isMonthly = m === 'GENERAL_MONTHLY' || m === 'AIR_COMPONENT_MONTHLY';
    const period = isMonthly
      ? String(this.selectedMonth() ?? '')
      : String(this.selectedQuarter() ?? '');
    const year = this.selectedYear() ?? '';
    return `${period} ${year}`.trim();
  });

  readonly hasContent = computed(() => !!this.reportContent());

  /**
   * Single load pipeline.
   *  - debounceTime  → rapid filter changes coalesce into one request.
   *  - filter        → only when the panel is actually visible.
   *  - switchMap     → cancels any in-flight request automatically.
   *  - catchError   → a failed fetch can never kill the pipeline.
   *  - takeUntilDestroyed → auto-unsubscribes on destroy.
   */
  private readonly loadTrigger$ = new Subject<void>();

  constructor() {
    this.loadTrigger$       .pipe(
        debounceTime(60),
        filter(() => this.isVisible()),
        switchMap(() =>
          this.buildRequest$().pipe(
            catchError((err) => {
              this.handleError(err);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((report) => this.handleReport(report as ReportResponse));

    effect(() => {
      this.isVisible();
      this.mode();
      this.airComponentId();
      this.selectedMonth();
      this.selectedQuarter();
      this.selectedYear();
      this.filterType();

      untracked(() => this.loadTrigger$.next());
    });
  }

  /** Public hook in case the parent wants to force a reload. */
  reload(): void {
    this.loadTrigger$.next();
  }

  /** Print / Save-as-PDF the rendered report. */
  print(): void {
    if (!this.hasContent()) return;
    window.print();
  }

  // ---------- internals ----------

  private buildRequest$(): Observable<ReportResponse> {
    const mode = this.mode();
    const airId = this.airComponentId();

    if (
      (mode === 'AIR_COMPONENT_MONTHLY' || mode === 'AIR_COMPONENT_QUARTERLY') &&
      airId == null
    ) {
      this.loading.set(false);
      this.notFound.set(true);
      this.error.set(null);
      this.reportContent.set('');
      return EMPTY;
    }

    this.loading.set(true);
    this.notFound.set(false);
    this.error.set(null);
    this.reportContent.set('');

    const year = this.selectedYear();
    const month = this.selectedMonth() as ReportMonth;
    const quarter = this.selectedQuarter() as ReportQuarter;

    if (mode === 'GENERAL_MONTHLY') {
      return this.kpiService.getGeneralMonthlyWriteUp(month, year);
    }
    if (mode === 'GENERAL_QUARTERLY') {
      return this.kpiService.getGeneralQuarterlyWriteUp(quarter, year);
    }
    if (mode === 'AIR_COMPONENT_MONTHLY') {
      return this.kpiService.getAirComponentMonthlyWriteUp(month, year, airId as number);
    }
    return this.kpiService.getAirComponentQuarterlyWriteUp(quarter, year, airId as number);
  }

  private handleReport(report: ReportResponse): void {
    const content: string = report?.content ?? '';

    if (!content || !content.trim()) {
      this.notFound.set(true);
      this.loading.set(false);
      this.reportContent.set('');
      return;
    }

    this.reportContent.set(this.sanitizer.bypassSecurityTrustHtml(content));
    this.loading.set(false);
    this.notFound.set(false);
    this.error.set(null);
    this.renderKey.update((v) => v + 1);
  }

  private handleError(err: unknown): void {
    console.error('Failed to load saved report', err);
    this.loading.set(false);
    this.notFound.set(true);
    this.error.set('Unable to load this report. Please try again.');
    this.reportContent.set('');
  }
}