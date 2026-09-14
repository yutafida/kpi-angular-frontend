import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { KpiService, ReportQuarter } from '../../services/kpi-service';
import { ReportMonth } from '../../shared/report-month';
import { ThemeToggleComponent } from '../theme-toggle.component/theme-toggle.component';
import { KpiReportWriteUp } from '../../models/kpi-report-write-up';
import { FilterStateService } from '../../services/filter-state';
import { ReportComposerComponent } from '../report-composer-component/report-composer-component';
import { ReportViewerComponent } from '../report-viewer-component/report-viewer-component';



@Component({
  selector: 'app-kpi-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent, ReportViewerComponent, ReportComposerComponent],
  templateUrl: './kpi-report.html',
  styleUrls: ['./kpi-report.css']
})
export class KpiReport implements OnInit {

  readonly reportsPerPage = 10;
  private filterState = inject(FilterStateService); 

  constructor(private kpiService: KpiService) {}

  // =====================================================
  // SHARED FILTER STATE
  // =====================================================

  filterType = this.filterState.filterType;
  selectedMonth = this.filterState.selectedMonth;
  selectedQuarter = this.filterState.selectedQuarter;
  selectedYear = this.filterState.selectedYear;

  months = Object.values(ReportMonth);
  quarters: ReportQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  years = [2024, 2025, 2026, 2027];

  // =====================================================
  // MODE (Period only, locked to General Scope)
  // =====================================================

  isMonthlyMode = signal<boolean>(true);
  isQuarterlyMode = computed(() => !this.isMonthlyMode());

  get currentWriteUpMode(): 'GENERAL_MONTHLY' | 'GENERAL_QUARTERLY' {
    return this.isMonthlyMode() ? 'GENERAL_MONTHLY' : 'GENERAL_QUARTERLY';
  }

  setPeriod(period: 'MONTHLY' | 'QUARTERLY') {
    this.isMonthlyMode.set(period === 'MONTHLY');
    this.filterType.set(period === 'MONTHLY' ? 'MONTH' : 'QUARTER');
    this.loadSavedReports();
    
    // If viewing a report, switch back to the composer when period changes
    if (this.viewingReport()) {
      this.viewingReport.set(false);
    }
  }

  // =====================================================
  // VIEW-MODE SIGNALS
  // =====================================================

  viewingReport = signal<boolean>(false);

  // =====================================================
  // SAVED REPORTS TABLE STATE
  // =====================================================

  savedReportsExpanded = signal<boolean>(false);
  savedReports = signal<KpiReportWriteUp[]>([]);
  loadingSavedReports = signal<boolean>(false);
  deletingReportId = signal<number | null>(null);
  currentReportsPage = signal<number>(1);

  get paginatedSavedReports(): KpiReportWriteUp[] {
    const start = (this.currentReportsPage() - 1) * this.reportsPerPage;
    const end = start + this.reportsPerPage;
    return this.savedReports().slice(start, end);
  }

  get totalReportsPages(): number {
    return Math.max(1, Math.ceil(this.savedReports().length / this.reportsPerPage));
  }

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadSavedReports();
  }

  // =====================================================
  // VIEW MODE TOGGLES
  // =====================================================

  viewReport(): void {
    this.viewingReport.set(true);
  }

  exitViewMode(): void {
    this.viewingReport.set(false);
  }

  // =====================================================
  // SAVED REPORTS TABLE LOGIC
  // =====================================================

  toggleSavedReportsSection(): void {
    this.savedReportsExpanded.update((expanded) => !expanded);
    if (this.savedReportsExpanded() && this.savedReports().length === 0) {
      this.loadSavedReports();
    }
  }

  private matchesCurrentMode(report: KpiReportWriteUp): boolean {
    const isMonthly = 'reportMonth' in report && !!report.reportMonth;
    const isQuarterly = 'reportQuarter' in report && !!report.reportQuarter;
    const isAirComponent = 'airComponentId' in report && report.airComponentId != null;

    // We only want General reports on this page
    if (this.isMonthlyMode()) {
      return isMonthly && !isAirComponent;
    } else {
      return isQuarterly && !isAirComponent;
    }
  }

  loadSavedReports(): void {
    this.loadingSavedReports.set(true);

    this.kpiService.getReports().subscribe({
      next: (reports) => {
        const filtered = (reports || []).filter((r) => this.matchesCurrentMode(r));

        const sortedReports = [...filtered].sort((a, b) => {
          const aTime = new Date(a.timestamp).getTime();
          const bTime = new Date(b.timestamp).getTime();
          return bTime - aTime;
        });

        this.savedReports.set(sortedReports);

        if (this.currentReportsPage() > this.totalReportsPages) {
          this.currentReportsPage.set(this.totalReportsPages);
        }

        this.loadingSavedReports.set(false);
      },
      error: (error) => {
        console.error('Failed to load saved reports', error);
        this.loadingSavedReports.set(false);
      }
    });
  }

  goToReportsPage(page: number): void {
    if (page < 1 || page > this.totalReportsPages) return;
    this.currentReportsPage.set(page);
  }

  getReportPeriodLabel(report: KpiReportWriteUp): string {
    if ('reportMonth' in report && report.reportMonth) {
      return `${report.reportMonth} ${report.reportYear}`;
    }
    if ('reportQuarter' in report && report.reportQuarter) {
      return `${report.reportQuarter} ${report.reportYear}`;
    }
    return `${report.reportYear}`;
  }

  openReportFromTable(report: KpiReportWriteUp): void {
    this.selectedYear.set(report.reportYear);

    if ('reportMonth' in report && report.reportMonth) {
      this.selectedMonth.set(report.reportMonth as ReportMonth);
      this.isMonthlyMode.set(true);
      this.filterType.set('MONTH');
    } else if ('reportQuarter' in report && report.reportQuarter) {
      this.selectedQuarter.set(report.reportQuarter as ReportQuarter);
      this.isMonthlyMode.set(false);
      this.filterType.set('QUARTER');
    }

    this.viewingReport.set(true);
  }

  getReportPreview(content: string, maxLength: number = 80): string {
    const textOnly = (content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!textOnly) return 'No content preview available.';
    if (textOnly.length <= maxLength) return textOnly;

    return `${textOnly.slice(0, maxLength)}...`;
  }

  deleteSavedReport(report: KpiReportWriteUp): void {
    const label = this.getReportPeriodLabel(report);

    const confirmed = window.confirm(
      `Delete saved report for ${label}? This action cannot be undone.`
    );

    if (!confirmed) return;

    this.deletingReportId.set(report.id);

    this.kpiService.deleteReport(report.id).subscribe({
      next: () => {
        if (this.viewingReport()) {
          this.viewingReport.set(false);
        }
        this.loadSavedReports();
        this.deletingReportId.set(null);
      },
      error: (error) => {
        console.error('Failed to delete report', error);
        this.deletingReportId.set(null);
      }
    });
  }
}