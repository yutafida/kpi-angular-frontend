import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartData, ChartOptions} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { BaseChartDirective, provideCharts,withDefaultRegisterables } from 'ng2-charts';
import { KpiMonthlyDashboard } from '../../models/kpi-monthly-dashboard';
import { KpiService } from '../../services/kpi-service';
import { ReportChart } from '../../models/report-chart';
import { ChartExportService } from '../../services/chart-export-service';
import { ReportBuilderService } from '../../services/report-builder-service';
import { ThemeToggleComponent } from '../theme-toggle.component/theme-toggle.component';
import { ThemeService } from '../../services/theme.service';


Chart.register(...registerables, annotationPlugin);


@Component({
    selector: 'app-kpi-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        DecimalPipe,
        FormsModule,
        BaseChartDirective,
        RouterModule,
        ThemeToggleComponent
    ],
    providers: [provideCharts(withDefaultRegisterables())],
    templateUrl: './kpi-dashboard.html',
    styleUrls: ['./kpi-dashboard.css']
})
export class KpiDashboard implements OnInit {

    readonly theme = inject(ThemeService);

    constructor(
        private kpiService: KpiService,
        private chartExportService: ChartExportService,
        private reportBuilderService: ReportBuilderService
    ) {}

    data = signal<KpiMonthlyDashboard | null>(null);
    loading = signal(false);

    showChart = signal(true);
    showDimensionTable = signal(true);
    showTheatreTable = signal(true);
    showComparisonChart = signal(true);
    showBulletChart = signal(true);
    showObservationPane = signal<boolean>(false);

    observationNotes = signal<Record<string, string>>({});
    submittingObservation = signal<boolean>(false);

    filterType = signal<'MONTH' | 'QUARTER'>('MONTH');

    selectedMonth = signal('AUGUST');
    selectedQuarter = signal('Q3');
    selectedYear = signal(2026);

    months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    activeChartType = signal<'bar'>('bar');

    setFilterType(type: 'MONTH' | 'QUARTER') {
        this.filterType.set(type);
        this.loadData();
    }

    private readonly chartTickColor = computed(() =>
        this.theme.isDark() ? '#94a3b8' : '#64748b'
    );

    private readonly chartGridColor = computed(() =>
        this.theme.isDark() ? 'rgba(148,163,184,0.10)' : 'rgba(148,163,184,0.15)'
    );

    private readonly chartTooltipBg = computed(() =>
        this.theme.isDark() ? '#020617' : '#0f172a'
    );

    private readonly chartThresholdColor = computed(() =>
        this.theme.isDark() ? '#D4AF37' : '#00264d'
    );

    // Semantic performance colours — same in both themes
    private readonly perfGreen = 'rgba(16,185,129,0.78)';
    private readonly perfAmber = 'rgba(245,158,11,0.78)';
    private readonly perfRed = 'rgba(239,68,68,0.78)';

    // =========================================================
    // KPI DIMENSION TARGETS
    // =========================================================

    dimensionTargets = signal<Record<string, number>>({
        'Ops Effectiveness': 75,
        'Joint Coord': 75,
        'Resource Mgmt': 50,
        'Personnel Dev': 75,
        'Strategic Impact': 75,
        'Risk Assessment': 75
    });

    selectedTargetDimension = signal<string>('Ops Effectiveness');
    selectedTargetValue = signal<number>(75);

    selectedObservationKey = computed(() => {
        const period = this.filterType() === 'MONTH' ? this.selectedMonth() : this.selectedQuarter();
        return `dashboard-${period}-${this.selectedYear()}`;
    });

    // =========================================================
    // UPDATE DIMENSION TARGET
    // =========================================================

    updateDimensionTarget(): void {
        const dimension = this.selectedTargetDimension();
        const target = this.selectedTargetValue();

        this.dimensionTargets.update(current => ({
            ...current,
            [dimension]: target
        }));
    }

    insertChartIntoReport(chartId: string, title: string, chartType: string): void {
        const alreadyExists = this.reportBuilderService
            .getCharts()
            .some(chart => chart.title === title);

        if (alreadyExists) {
            alert('This chart has already been added to the report.');
            return;
        }

        const image = this.chartExportService.exportChart(chartId);

        if (!image) {
            return;
        }

        const reportChart: ReportChart = {
            title,
            chartType,
            imageBase64: image,
            createdAt: new Date()
        };

        this.reportBuilderService.addChart(reportChart);
        alert('Chart added to report successfully.');
    }

    observationText = computed(() => {
        return this.observationNotes()[this.selectedObservationKey()] || '';
    });

    selectedObservationLabel = computed(() => {
        const period = this.filterType() === 'MONTH' ? this.selectedMonth() : this.selectedQuarter();
        return `${period} ${this.selectedYear()} Dashboard`;
    });

    observationTitle = computed(() => {
        const period = this.filterType() === 'MONTH' ? this.selectedMonth() : this.selectedQuarter();
        return `${period} ${this.selectedYear()} Dashboard Observation`;
    });

    dimensions = [
        'Ops Effectiveness',
        'Joint Coord',
        'Resource Mgmt',
        'Personnel Dev',
        'Strategic Impact',
        'Risk Assessment'
    ];

    // =========================================================
    // INIT
    // =========================================================

    ngOnInit(): void {
        this.loadData();
    }

    // =========================================================
    // COMPUTED METRICS
    // =========================================================

    aboveTargetCount = computed(() => {
        return this.data()?.scores.filter(s => s.overallScore >= 75).length || 0;
    });

    belowTargetCount = computed(() => {
        return this.data()?.scores.filter(s => s.overallScore < 75).length || 0;
    });

    // =========================================================
    // MAIN CHART  (theme-reactive)
    // =========================================================

    mainChartData = computed<ChartData<'bar'> | null>(() => {
        const dashboard = this.data();

        if (!dashboard) {
            return null;
        }

        const labels = dashboard.scores.map(s => s.airComponentName);
        const values = dashboard.scores.map(s => s.overallScore);

        return {
            labels,
            datasets: [
                {
                    label: 'Performance',
                    data: values,
                    backgroundColor: values.map(v =>
                        v >= 75
                            ? this.perfGreen
                            : v >= 60
                            ? this.perfAmber
                            : this.perfRed
                    ),
                    borderColor: this.theme.isDark() ? '#0b1a2e' : '#ffffff',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false as any
                }
            ]
        };
    });

    // =========================================================
    // MAIN CHART OPTIONS  (theme-reactive)
    // =========================================================

    mainChartOptions = computed<ChartOptions<'bar'>>(() => {
        const tick = this.chartTickColor();
        const grid = this.chartGridColor();
        const tooltipBg = this.chartTooltipBg();
        const threshold75 = this.chartThresholdColor();

        return {
            responsive: true,
            maintainAspectRatio: false,
            onClick: () => {
                // Drill-down disabled: chart click no longer opens a component detail view.
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: tick },
                    grid: { color: grid }
                },
                x: {
                    ticks: { color: tick },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    padding: 10,
                    cornerRadius: 8
                },
                annotation: {
                    annotations: {
                        threshold75: {
                            type: 'line',
                            yMin: 75,
                            yMax: 75,
                            borderColor: threshold75,
                            borderWidth: 2,
                            borderDash: [6, 6]
                        },
                        threshold60: {
                            type: 'line',
                            yMin: 60,
                            yMax: 60,
                            borderColor: '#f59e0b',
                            borderWidth: 2,
                            borderDash: [6, 6]
                        }
                    }
                }
            }
        };
    });

    comparisonBarChartData = computed<ChartData<'bar' | 'line'>>(() => {
        const dashboard = this.data();

        if (!dashboard) {
            return {
                labels: [],
                datasets: []
            };
        }

        const labels = [
            'Ops Effectiveness',
            'Joint Coord',
            'Resource Mgmt',
            'Personnel Dev',
            'Strategic Impact',
            'Risk Assessment'
        ];

        const datasets: any[] = [];

        dashboard.scores.forEach((score, index) => {
            datasets.push({
                type: 'bar',
                label: score.airComponentName,
                data: [
                    score.opsEffectiveness,
                    score.jointCoord,
                    score.resourceManagement,
                    score.personnelDev,
                    score.strategicImpact,
                    score.riskAssessment
                ],
                backgroundColor: `hsl(${index * 60},70%,50%)`,
                borderRadius: 4
            });
        });

        datasets.push({
            type: 'line',
            label: 'NAF Threshold',
            data: Array(6).fill(dashboard.nafAverageScore),
            borderColor: '#ef4444',
            borderDash: [6, 6],
            borderWidth: 2,
            pointRadius: 0
        });

        return {
            labels,
            datasets
        };
    });

    // =========================================================
    // COMPARISON OPTIONS  (theme-reactive)
    // =========================================================

    comparisonBarChartOptions = computed<ChartOptions<'bar' | 'line'>>(() => {
        const tick = this.chartTickColor();
        const grid = this.chartGridColor();
        const tooltipBg = this.chartTooltipBg();

        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: tick },
                    grid: { color: grid }
                },
                x: {
                    ticks: { color: tick },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: tick }
                },
                tooltip: {
                    backgroundColor: tooltipBg,
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    padding: 10,
                    cornerRadius: 8
                }
            }
        };
    });

    // =========================================================
    // BULLET CHART CONFIGURATION  (theme-reactive)
    // =========================================================

    bulletChartData = computed<ChartData<'bar'>>(() => {
        const reports = this.data()?.reports || [];
        const labels = reports.map(r => r.dimension);
        const values = reports.map(r => r.averageOverallScore);

        return {
            labels,
            datasets: [
                {
                    label: 'Performance',
                    data: values,
                    backgroundColor: values.map(v =>
                        v >= 75
                            ? this.perfGreen
                            : v >= 60
                            ? this.perfAmber
                            : this.perfRed
                    ),
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 24
                }
            ]
        };
    });

    // Calculate annotations separately based on data and dimension targets
    bulletAnnotations = computed(() => {
        const reports = this.data()?.reports || [];
        const targets = this.dimensionTargets();
        const dynamicAnnotations: Record<string, any> = {};

        const getTargetValue = (dimensionName: string): number => {
            let cleanName = dimensionName.trim().toLowerCase()
                .replace('management', 'mgmt')
                .replace(/[^a-z0-9]/g, '');

            const match = Object.entries(targets).find(([key]) => {
                let cleanKey = key.trim().toLowerCase()
                    .replace('management', 'mgmt')
                    .replace(/[^a-z0-9]/g, '');

                return cleanKey === cleanName || cleanKey.includes(cleanName) || cleanName.includes(cleanKey);
            });

            return match ? match[1] : 75;
        };

        const lineColor = this.theme.isDark() ? '#D4AF37' : '#0b1a2e';
        const labelBg = this.theme.isDark() ? '#D4AF37' : '#0b1a2e';
        const labelColor = this.theme.isDark() ? '#0b1a2e' : '#ffffff';

        reports.forEach((report, index) => {
            const target = getTargetValue(report.dimension);

            dynamicAnnotations[`target_${index}`] = {
                type: 'line',
                xScaleID: 'x',
                yScaleID: 'y',
                xMin: target,
                xMax: target,
                yMin: index,
                yMax: index,
                borderColor: lineColor,
                borderWidth: 4,
                drawTime: 'afterDatasetsDraw',
                label: {
                    display: true,
                    content: `${target}%`,
                    position: 'center',
                    backgroundColor: labelBg,
                    color: labelColor,
                    padding: { top: 2, bottom: 2, left: 4, right: 4 },
                    font: {
                        size: 9,
                        weight: 'bold'
                    }
                }
            };
        });

        return dynamicAnnotations;
    });

    bulletChartOptions = computed<ChartOptions<'bar'>>(() => {
        const tick = this.chartTickColor();
        const grid = this.chartGridColor();

        return {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500 },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: tick,
                        callback: (value) => `${value}%`
                    },
                    grid: { color: grid }
                },
                y: {
                    ticks: { color: tick },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        };
    });

    finalBulletOptions = computed<ChartOptions<'bar'>>(() => {
        const base = this.bulletChartOptions();
        return {
            ...base,
            plugins: {
                ...base.plugins,
                annotation: {
                    annotations: this.bulletAnnotations()
                }
            }
        };
    });

    // =========================================================
    // LOAD DATA
    // =========================================================

    loadData(): void {
        this.loading.set(true);
        const year = this.selectedYear();

        if (this.filterType() === 'MONTH') {
            const month = this.selectedMonth();
            this.kpiService.getMonthlyReport(month, year)
                .subscribe({
                    next: (response) => {
                        this.data.set(response);
                        this.loading.set(false);
                    },
                    error: (error) => {
                        console.error(error);
                        this.loading.set(false);
                    }
                });
        } else {
            const quarter = this.selectedQuarter();
            this.kpiService.getQuarterlyReport(quarter, year)
                .subscribe({
                    next: (response) => {
                        this.data.set(response);
                        this.loading.set(false);
                    },
                    error: (error) => {
                        console.error(error);
                        this.loading.set(false);
                    }
                });
        }
    }

    // =========================================================
    // HELPERS
    // =========================================================

    setChartType(type: 'bar'): void {
        this.activeChartType.set(type);
    }

    toggleChart(): void {
        this.showChart.update(v => !v);
    }

    toggleDimensionTable(): void {
        this.showDimensionTable.update(v => !v);
    }

    toggleTheatreTable(): void {
        this.showTheatreTable.update(v => !v);
    }

    toggleComparisonChart(): void {
        this.showComparisonChart.update(v => !v);
    }

    toggleBulletChart(): void {
        this.showBulletChart.update(v => !v);
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

    isChartAlreadyAdded(title: string): boolean {
        return this.reportBuilderService
            .getCharts()
            .some(chart => chart.title === title);
    }

    submitObservation(): void {
        const content = this.observationText();

        if (!content.trim()) {
            console.warn('Cannot submit empty observation');
            return;
        }

        this.submittingObservation.set(true);

        // Dynamically pass month or quarter depending on filterType
        const periodValue = this.filterType() === 'MONTH' ? this.selectedMonth() : this.selectedQuarter();

        this.kpiService
            .submitDashboardObservation(periodValue as any, this.selectedYear(), content)
            .subscribe({
                next: (response) => {
                    console.log('Observation submitted successfully:', response);

                    const key = this.selectedObservationKey();

                    this.observationNotes.update(notes => ({
                        ...notes,
                        [key]: ''
                    }));

                    this.submittingObservation.set(false);
                    this.showObservationPane.set(false);
                },
                error: (error) => {
                    console.error('Failed to submit observation:', error);
                    this.submittingObservation.set(false);
                }
            });
    }
}