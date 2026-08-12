import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AirComponentService } from '../../services/air-component.service';
import { AirComponentSummary } from '../../models/air-component-summary';
import { RouterModule } from '@angular/router';
import { KpiService, ReportPeriod, ReportQuarter } from '../../services/kpi-service';
import { AirComponentMonthlyReport } from '../../models/air-component-monthly-report';
import { ReportMonth } from '../../shared/report-month';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FilterStateService } from '../../services/filter-state';



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
    private filterState = inject(FilterStateService); 
    
    summary = signal<AirComponentSummary | null>(null);
    monthlyReport = signal<AirComponentMonthlyReport | null>(null);
    loading = signal<boolean>(true);
    componentId = signal<number | null>(null);

    // Bind to shared state (casted to expected types)
    filterType = this.filterState.filterType as WritableSignal<'MONTH' | 'QUARTER'>;
    selectedMonth = this.filterState.selectedMonth as WritableSignal<ReportMonth>;
    selectedQuarter = this.filterState.selectedQuarter as WritableSignal<ReportQuarter>;
    selectedYear = this.filterState.selectedYear;

    quarters: ReportQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']; 
    months = Object.values(ReportMonth);
    years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

    showObservationPane = signal<boolean>(false);
    observationNotes = signal<Record<string, string>>({});
    submittingObservation = signal<boolean>(false);

    activeReport = signal<string>('mission');

    reportCardConfig = [
        { key: 'mission', label: 'Mission' },
        { key: 'crew', label: 'Crew' },
        { key: 'fleet', label: 'Fleet' },
        { key: 'fuel', label: 'Fuel' },
        { key: 'ordnance', label: 'Ordnance' },
        { key: 'joint', label: 'Joint' },
        { key: 'risk', label: 'Risk' },
        { key: 'enemy', label: 'Enemy' }
    ];

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
        this.filterType.set(type); // Updates shared state globally
        this.loadReportData();
    }

    loadReportData(): void { 
        const id = this.componentId();
        if (!id) return;

        const period: ReportPeriod = this.filterType() === 'MONTH' ? 'MONTHLY' : 'QUARTERLY';
        const month = this.filterType() === 'MONTH' ? this.selectedMonth() as ReportMonth : undefined;
        const quarter = this.filterType() === 'QUARTER' ? this.selectedQuarter() as ReportQuarter : undefined;

        this.kpiService.getAirComponentDashboard(id, this.selectedYear(), period, month, quarter)
        .subscribe({
            next: (data) => this.monthlyReport.set(data),
            error: (err) => console.error(err)
        });
    }

    getSafePercentage(value: number | undefined | null, isDecimal: boolean = false): number {
        if (value == null) return 0;
        const val = isDecimal ? value * 100 : value;
        return Math.min(Math.max(val, 0), 100);
    }

    periodLabel = computed(() => {
        return this.filterType() === 'QUARTER' ? this.selectedQuarter() : this.selectedMonth();
    });

    activeReportLabel = computed(() => {
        const key = this.activeReport();
        return this.reportCardConfig.find(c => c.key === key)?.label ?? key;
    });

    activeReportIndex = computed(() => {
        return this.reportCardConfig.findIndex(c => c.key === this.activeReport());
    });

    setActiveReport(key: string): void {
        this.activeReport.set(key);
    }

    nextReport(): void {
        const idx = this.activeReportIndex();
        const next = (idx + 1) % this.reportCardConfig.length;
        this.activeReport.set(this.reportCardConfig[next].key);
    }

    prevReport(): void {
        const idx = this.activeReportIndex();
        const prev = (idx - 1 + this.reportCardConfig.length) % this.reportCardConfig.length;
        this.activeReport.set(this.reportCardConfig[prev].key);
    }

    isReportOpen(key: string): boolean {
        return this.activeReport() === key;
    }

    selectedObservationKey = computed(() => {
        const componentId = this.componentId();
        const label = this.periodLabel();
        const year = this.selectedYear();
        return componentId ? `aircomponent-${componentId}-${label}-${year}` : `aircomponent-unknown-${label}-${year}`;
    });

    selectedObservationLabel = computed(() => {
        const name = this.summary()?.name;
        const label = this.periodLabel();
        if (name) return `${name} - ${label} ${this.selectedYear()}`;
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
        this.observationNotes.update(notes => ({ ...notes, [key]: value }));
    }

    submitObservation(): void {
        const content = this.observationText();
        if (!content.trim()) return;

        const componentId = this.componentId();
        if (!componentId) return;

        this.submittingObservation.set(true);
        const observationPeriod = this.filterType() === 'MONTH' ? this.selectedMonth() as ReportMonth : this.selectedQuarter() as ReportQuarter;

        this.kpiService.submitComponentObservation(
            componentId, observationPeriod as any, this.selectedYear(), content
        ).subscribe({
            next: () => {
                const key = this.selectedObservationKey();
                this.observationNotes.update(notes => ({ ...notes, [key]: '' }));
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