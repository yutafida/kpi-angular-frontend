// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-report-dashboard-component',
//   imports: [],
//   templateUrl: './report-dashboard-component.html',
//   styleUrl: './report-dashboard-component.css',
// })
// export class ReportDashboardComponent {}




import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiService, ReportQuarter } from '../../services/kpi-service';
import { ReportMonth } from '../../shared/report-month';
import { FilterStateService } from '../../services/filter-state';
import { ReportViewerComponent } from '../report-viewer-component/report-viewer-component';
import { ThemeToggleComponent } from "../theme-toggle.component/theme-toggle.component";
import { RouterModule } from '@angular/router';




export type WriteUpMode =
  | 'GENERAL_MONTHLY'
  | 'GENERAL_QUARTERLY'
  | 'AIR_COMPONENT_MONTHLY'
  | 'AIR_COMPONENT_QUARTERLY';

interface ReportRow {
  scope: 'General' | 'Air Component';
  mode: WriteUpMode;
  airComponentId: number | null;
  preview: string;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportViewerComponent, RouterModule, ThemeToggleComponent],
   templateUrl: './report-dashboard-component.html',
   styleUrl: './report-dashboard-component.css',
  
})
export class ReportsDashboardComponent implements OnInit {

  private kpiService = inject(KpiService);
  private filterState = inject(FilterStateService);

  // Shared Filter State
  filterType = this.filterState.filterType;
  selectedMonth = this.filterState.selectedMonth;
  selectedQuarter = this.filterState.selectedQuarter;
  selectedYear = this.filterState.selectedYear;

  months = Object.values(ReportMonth);
  quarters: ReportQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  years = [2024, 2025, 2026, 2027];

  // UI State
  loading = signal<boolean>(false);
  reports = signal<ReportRow[]>([]);

  // Viewer State
  viewingReport = signal<boolean>(false);
  activeMode = signal<WriteUpMode>('GENERAL_MONTHLY');
  activeAirComponentId = signal<number | null>(null);

  get isMonthlyMode(): boolean {
    return this.filterType() === 'MONTH';
  }

  ngOnInit(): void {
    this.loadData();
  }

  setFilterType(type: 'MONTH' | 'QUARTER'): void {
    this.filterType.set(type);
    if (this.viewingReport()) {
      this.viewingReport.set(false);
    }
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.reports.set([]);

    const year = this.selectedYear();

    if (this.isMonthlyMode) {
      this.kpiService.getMonthlyWriteUpDashboard(this.selectedMonth() as ReportMonth, year)
        .subscribe({
          next: (res) => {
            const rows: ReportRow[] = [];
            if (res.generalReport) {
              rows.push({
                scope: 'General',
                mode: 'GENERAL_MONTHLY',
                airComponentId: null,
                preview: res.generalReport.content
              });
            }
            res.airComponentReports.forEach(r => {
              rows.push({
                scope: 'Air Component',
                mode: 'AIR_COMPONENT_MONTHLY',
                airComponentId: r.airComponentId,
                preview: r.content
              });
            });
            this.reports.set(rows);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
    } else {
      this.kpiService.getQuarterlyWriteUpDashboard(this.selectedQuarter() as ReportQuarter, year)
        .subscribe({
          next: (res) => {
            const rows: ReportRow[] = [];
            if (res.generalReport) {
              rows.push({
                scope: 'General',
                mode: 'GENERAL_QUARTERLY',
                airComponentId: null,
                preview: res.generalReport.content
              });
            }
            res.airComponentReports.forEach(r => {
              rows.push({
                scope: 'Air Component',
                mode: 'AIR_COMPONENT_QUARTERLY',
                airComponentId: r.airComponentId,
                preview: r.content
              });
            });
            this.reports.set(rows);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
    }
  }

  viewReport(mode: WriteUpMode, airComponentId: number | null): void {
    this.activeMode.set(mode);
    this.activeAirComponentId.set(airComponentId);
    this.viewingReport.set(true);
  }

  exitViewMode(): void {
    this.viewingReport.set(false);
  }

  getPreview(content: string | null | undefined): string {
    if (!content) return 'No preview available.';
    const textOnly = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (textOnly.length <= 80) return textOnly;
    return `${textOnly.slice(0, 80)}...`;
  }

  // =====================================================
  // DELETE HANDLER
  // =====================================================

  deletingReportId = signal<number | null>(null);

  deleteReport(row: ReportRow): void {
    // We need an id to delete; for general reports the backend exposes general endpoints
    // The dashboard responses don't include the persisted id in the row, so we must
    // fetch the list of reports and find the matching natural key, then delete by id.

    const confirmed = window.confirm('Delete this saved report? This action cannot be undone.');
    if (!confirmed) return;

    this.deletingReportId.set(-1);

    // Load all reports and attempt to find the matching entry
    this.kpiService.getReports().subscribe({
      next: (reports) => {
        // Determine matching report by period + scope + airComponentId
        const match = reports.find(r => {
          const isAir = (r as any).airComponentId !== undefined && (r as any).airComponentId !== null;
          if (row.scope === 'General' && !isAir) {
            if (this.isMonthlyMode) {
              return (r as any).reportMonth === this.selectedMonth() && (r as any).reportYear === this.selectedYear();
            } else {
              return (r as any).reportQuarter === this.selectedQuarter() && (r as any).reportYear === this.selectedYear();
            }
          }

          if (row.scope === 'Air Component' && isAir) {
            if ((r as any).airComponentId !== row.airComponentId) return false;
            if (this.isMonthlyMode) {
              return (r as any).reportMonth === this.selectedMonth() && (r as any).reportYear === this.selectedYear();
            } else {
              return (r as any).reportQuarter === this.selectedQuarter() && (r as any).reportYear === this.selectedYear();
            }
          }

          return false;
        });

        if (!match) {
          window.alert('Could not locate the saved report to delete.');
          this.deletingReportId.set(null);
          return;
        }

        const id = (match as any).id;
        if (!id) {
          window.alert('Matched report has no id and cannot be deleted.');
          this.deletingReportId.set(null);
          return;
        }

        this.deletingReportId.set(id);

        this.kpiService.deleteReport(id).subscribe({
          next: () => {
            // After deletion reload the dashboard
            this.loadData();
            this.deletingReportId.set(null);
          },
          error: (err) => {
            console.error('Failed to delete report', err);
            window.alert('Failed to delete report. See console for details.');
            this.deletingReportId.set(null);
          }
        });
      },
      error: (err) => {
        console.error('Failed to fetch reports', err);
        window.alert('Failed to fetch saved reports. See console for details.');
        this.deletingReportId.set(null);
      }
    });
  }


 
    
}
