import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AirComponentService } from '../../services/air-component.service';
import { AirComponentSummary } from '../../models/air-component-summary';
import { RouterModule } from '@angular/router';
import { KpiService } from '../../services/kpi-service';
import { AirComponentMonthlyReport } from '../../models/air-component-monthly-report';
import { ReportMonth } from '../../shared/report-month';
import { FormsModule } from '@angular/forms';
import { AirComponentMonthlyReportComponent } from "../air-component-monthly-report.component/air-component-monthly-report.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-air-component-detail.component',
  imports: [RouterModule, FormsModule, AirComponentMonthlyReportComponent, CommonModule],
  templateUrl: './air-component-detail.component.html',
  styleUrl: './air-component-detail.component.css',
})
export class AirComponentDetailComponent {

  private route = inject(ActivatedRoute);
  private service = inject(AirComponentService);
  private kpiService = inject(KpiService);

  summary = signal<AirComponentSummary | null>(null);
  monthlyReport = signal<AirComponentMonthlyReport | null>(null);
  loading = signal<boolean>(true);

  selectedMonth = signal<ReportMonth>(ReportMonth.MAY);
  selectedYear = signal<number>(2026);

  // UI toggles
  kpiExpanded = signal<boolean>(true);
  reportExpanded = signal<boolean>(false);
  filtersExpanded = signal<boolean>(true);

  // ✅ NEW: REPORT CARD TOGGLES
  reportCards = signal<Record<string, boolean>>({
    mission: false,
    crew: false,
    fleet: false,
    fuel: false,
    ordnance: false,
    joint: false
  });

  months = Object.values(ReportMonth);
  years = [2024, 2025, 2026, 2027];

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.service.getComponentSummary(id).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    effect(() => {
      const month = this.selectedMonth();
      const year = this.selectedYear();

      this.kpiService.getAirComponentMonthlyDashboard(id, year, month)
        .subscribe({
          next: (data) => this.monthlyReport.set(data),
          error: (err) => console.error(err)
        });
    });
  }

  // 🔁 MAIN REPORT TOGGLE
  toggleReport() {
    this.reportExpanded.update(v => !v);
  }

  toggleKpi() {
    this.kpiExpanded.update(v => !v);
  }

  toggleFilters() {
    this.filtersExpanded.update(v => !v);
  }

  // 🔥 CARD TOGGLE SYSTEM
  toggleReportCard(key: string) {
    this.reportCards.update(state => ({
      ...state,
      [key]: !state[key]
    }));
  }

  isReportOpen(key: string): boolean {
    return !!this.reportCards()[key];
  }
}