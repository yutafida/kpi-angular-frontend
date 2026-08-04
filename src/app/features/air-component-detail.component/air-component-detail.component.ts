import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AirComponentService } from '../../services/air-component.service';
import { AirComponentSummary } from '../../models/air-component-summary';
import { RouterModule } from '@angular/router';
import { KpiService, ReportPeriod, ReportQuarter } from '../../services/kpi-service';
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
export class AirComponentDetailComponent implements OnInit {

    private route = inject(ActivatedRoute);
    private service = inject(AirComponentService);
    private kpiService = inject(KpiService);

    summary = signal<AirComponentSummary | null>(null);
    monthlyReport = signal<AirComponentMonthlyReport | null>(null);
    loading = signal<boolean>(true);
    componentId = signal<number | null>(null);

    // Replaced selectedPeriod with filterType to match KpiDashboard
    filterType = signal<'MONTH' | 'QUARTER'>('MONTH');
    selectedMonth = signal<ReportMonth>(ReportMonth.AUGUST);
    
    // Properly typed as ReportQuarter
    selectedQuarter = signal<ReportQuarter>('Q3');
    quarters: ReportQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']; 
    
    selectedYear = signal<number>(2026);

    months = Object.values(ReportMonth);
    years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

    // Observation pane state
    showObservationPane = signal<boolean>(false);
    observationNotes = signal<Record<string, string>>({});
    submittingObservation = signal<boolean>(false);

    // Report card toggles
    reportCards = signal<Record<string, boolean>>({
        mission: true,
        crew: true,
        fleet: true,
        fuel: true,
        ordnance: true,
        joint: true
    });

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
    }

    ngOnInit(): void { 
        this.loadReportData(); 
    }

    setFilterType(type: 'MONTH' | 'QUARTER') {
        this.filterType.set(type);
        this.loadReportData();
    }

    loadReportData(): void { 
        const id = this.componentId();
        if (!id) return;

        const period: ReportPeriod = this.filterType() === 'MONTH' ? 'MONTHLY' : 'QUARTERLY';
        const month = this.filterType() === 'MONTH' ? this.selectedMonth() : undefined;
        const quarter = this.filterType() === 'QUARTER' ? this.selectedQuarter() : undefined;

        this.kpiService.getAirComponentDashboard(
            id, 
            this.selectedYear(), 
            period,
            month,
            quarter
        )
        .subscribe({
            next: (data) => this.monthlyReport.set(data),
            error: (err) => console.error(err)
        });
    }

    // Clamps percentage values between 0 and 100 for safe UI rendering
    getSafePercentage(value: number | undefined | null, isDecimal: boolean = false): number {
        if (value == null) return 0;
        const val = isDecimal ? value * 100 : value;
        return Math.min(Math.max(val, 0), 100);
    }

    // Helper computed to dynamically display the correct period label
    periodLabel = computed(() => {
        return this.filterType() === 'QUARTER' ? this.selectedQuarter() : this.selectedMonth();
    });

    selectedObservationKey = computed(() => {
        const componentId = this.componentId();
        const label = this.periodLabel();
        const year = this.selectedYear();
        return componentId ? `aircomponent-${componentId}-${label}-${year}` : `aircomponent-unknown-${label}-${year}`;
    });

    selectedObservationLabel = computed(() => {
        const name = this.summary()?.name;
        const label = this.periodLabel();
        if (name) {
            return `${name} - ${label} ${this.selectedYear()}`;
        }
        const componentId = this.componentId();
        return componentId ? `Component ${componentId} - ${label} ${this.selectedYear()}` : `${label} ${this.selectedYear()}`;
    });

    observationText = computed(() => {
        return this.observationNotes()[this.selectedObservationKey()] || '';
    });

    observationTitle = computed(() => {
        const name = this.summary()?.name;
        const label = this.periodLabel();
        return name ? `${name} Observation` : `Observation for ${label} ${this.selectedYear()}`;
    });

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

        // Pass the dynamically selected month or quarter as the period context
        const observationPeriod = this.filterType() === 'MONTH' ? this.selectedMonth() : this.selectedQuarter();

        this.kpiService.submitComponentObservation(
            componentId,
            observationPeriod as any,
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