import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AirComponentService } from '../../services/air-component.service';
import { AirComponentSummary } from '../../models/air-component-summary';
import { RouterModule } from '@angular/router';
import { KpiService } from '../../services/kpi-service';
import { AirComponentMonthlyReport } from '../../models/air-component-monthly-report';
import { ReportMonth } from '../../shared/report-month';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-air-component-detail.component',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
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
  componentId = signal<number | null>(null);

  selectedMonth = signal<ReportMonth>(ReportMonth.MAY);
  selectedYear = signal<number>(2026);

  // Observation pane state
  showObservationPane = signal<boolean>(false);
  observationNotes = signal<Record<string, string>>({});
  submittingObservation = signal<boolean>(false);

  // UI toggles
  kpiExpanded = signal<boolean>(true);
  reportExpanded = signal<boolean>(false);
  filtersExpanded = signal<boolean>(true);

  // Report card toggles
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

    this.componentId.set(id);
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

  selectedObservationKey = computed(() => {
    const componentId = this.componentId();
    const month = this.selectedMonth();
    const year = this.selectedYear();
    return componentId ? `aircomponent-${componentId}-${month}-${year}` : `aircomponent-unknown-${month}-${year}`;
  });

  selectedObservationLabel = computed(() => {
    const name = this.summary()?.name;
    if (name) {
      return `${name} - ${this.selectedMonth()} ${this.selectedYear()}`;
    }
    const componentId = this.componentId();
    return componentId ? `Component ${componentId} - ${this.selectedMonth()} ${this.selectedYear()}` : `${this.selectedMonth()} ${this.selectedYear()}`;
  });

  observationText = computed(() => {
    return this.observationNotes()[this.selectedObservationKey()] || '';
  });

  observationTitle = computed(() => {
    const name = this.summary()?.name;
    return name ? `${name} Observation` : `Observation for ${this.selectedMonth()} ${this.selectedYear()}`;
  });

  toggleReport() {
    this.reportExpanded.update(v => !v);
  }

  toggleKpi() {
    this.kpiExpanded.update(v => !v);
  }

  toggleFilters() {
    this.filtersExpanded.update(v => !v);
  }

  toggleObservationPane(): void {
    this.showObservationPane.update(v => !v);
  }

  setObservationText(value: string): void {
    const key = this.selectedObservationKey();
    this.observationNotes.update(notes => ({
      ...notes,
      [key]: value
    }));
  }

  toggleReportCard(key: string) {
    this.reportCards.update(state => ({
      ...state,
      [key]: !state[key]
    }));
  }

  isReportOpen(key: string): boolean {
    return !!this.reportCards()[key];
  }

  submitObservation(): void {
    const content = this.observationText();
    if (!content.trim()) {
      console.warn('Cannot submit empty observation');
      return;
    }

    const componentId = this.componentId();
    if (!componentId) {
      console.error('Component ID not available');
      return;
    }

    this.submittingObservation.set(true);

    this.kpiService.submitComponentObservation(
      componentId,
      this.selectedMonth(),
      this.selectedYear(),
      content
    ).subscribe({
      next: (response) => {
        console.log('Component observation submitted successfully:', response);
        const key = this.selectedObservationKey();
        this.observationNotes.update(notes => ({
          ...notes,
          [key]: ''
        }));
        this.submittingObservation.set(false);
        this.showObservationPane.set(false);
      },
      error: (error) => {
        console.error('Failed to submit component observation:', error);
        this.submittingObservation.set(false);
      }
    });
  }
}