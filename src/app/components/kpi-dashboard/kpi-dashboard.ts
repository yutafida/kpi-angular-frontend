import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartData, ChartOptions} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { BaseChartDirective, provideCharts,withDefaultRegisterables } from 'ng2-charts';
import { KpiMonthlyDashboard } from '../../models/kpi-dashboard';
import { AirComponentMonthlyScore } from '../../models/air-component-monthly-score';
import { KpiService } from '../../services/kpi-service';
import { ReportChart } from '../../models/report-chart';
import { ChartExportService } from '../../services/chart-export-service';
import { ReportBuilderService } from '../../services/report-builder-service';
import { ThemeToggleComponent } from '../theme-toggle.component/theme-toggle.component';
import { ThemeService } from '../../services/theme.service';
import { FilterStateService } from '../../services/filter-state';


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
    private filterState = inject(FilterStateService); 


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

    showHeatMap = signal(true);


    
    filterType = this.filterState.filterType;
    selectedMonth = this.filterState.selectedMonth;
    selectedQuarter = this.filterState.selectedQuarter;
    selectedYear = this.filterState.selectedYear;

    months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

    activeChartType = signal<'bar'>('bar');

    setFilterType(type: 'MONTH' | 'QUARTER') {
        this.filterType.set(type); // Updates shared state
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

    // =========================================================
    // DRAW HEATMAP TO CANVAS FOR EXPORT
    // =========================================================

    drawHeatmapToCanvas(): void {
        const canvas = document.getElementById('heatmapCanvas') as HTMLCanvasElement;
        const dashboard = this.data();
        if (!canvas || !dashboard) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const components = dashboard.scores;
        const dimensions = this.heatMapDimensions;
        
        // Sizing
        const cellWidth = 120;
        const cellHeight = 50;
        const headerHeight = 40;
        const nameWidth = 180;
        const padding = 10;
        
        canvas.width = nameWidth + (dimensions.length * cellWidth) + (padding * 2);
        canvas.height = headerHeight + (components.length * cellHeight) + (padding * 2);

        // Background
        ctx.fillStyle = this.theme.isDark() ? '#0f172a' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Helper to get colors matching the Tailwind classes
        const getColors = (score: number) => {
            if (score >= 90) return { bg: '#10b981', text: '#ffffff' };
            if (score >= 75) return { bg: '#34d399', text: '#022c22' };
            if (score >= 70) return { bg: '#fbbf24', text: '#ffffff' };
            if (score >= 60) return { bg: '#fcd34d', text: '#451a03' };
            if (score >= 50) return { bg: '#f97316', text: '#ffffff' };
            if (score >= 40) return { bg: '#ef4444', text: '#ffffff' };
            return { bg: '#fca5a5', text: '#450a0a' };
        };

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw Header Row
        ctx.fillStyle = this.theme.isDark() ? '#1e293b' : '#f8fafc';
        ctx.fillRect(padding, padding, canvas.width - (padding * 2), headerHeight);
        
        ctx.fillStyle = this.theme.isDark() ? '#94a3b8' : '#475569';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('COMPONENT', padding + 15, padding + headerHeight / 2);

        dimensions.forEach((dim, i) => {
            ctx.textAlign = 'center';
            ctx.fillText(dim.label.toUpperCase(), padding + nameWidth + (i * cellWidth) + cellWidth / 2, padding + headerHeight / 2);
        });

        // Draw Data Rows
        components.forEach((comp, rowIndex) => {
            const y = padding + headerHeight + (rowIndex * cellHeight);
            
            // Component Name
            ctx.fillStyle = this.theme.isDark() ? '#0f172a' : '#ffffff';
            ctx.fillRect(padding, y, nameWidth, cellHeight);
            
            ctx.fillStyle = this.theme.isDark() ? '#e2e8f0' : '#1e293b';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(comp.airComponentName.toUpperCase(), padding + 15, y + cellHeight / 2);

            // Dimension Cells
            dimensions.forEach((dim, colIndex) => {
                const x = padding + nameWidth + (colIndex * cellWidth);
                
                // FIX: Use standard TS casting here instead of $any()
                const score = (comp as any)[dim.key]; 
                
                const colors = getColors(score);

                // Cell Background
                ctx.fillStyle = colors.bg;
                ctx.fillRect(x, y, cellWidth, cellHeight);

                // Cell Text
                ctx.fillStyle = colors.text;
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${score.toFixed(2)}%`, x + cellWidth / 2, y + cellHeight / 2);

                // Cell Borders
                ctx.strokeStyle = this.theme.isDark() ? '#0f172a' : '#e2e8f0';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, cellWidth, cellHeight);
            });
        });
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

    aboveTargetComponents = computed<AirComponentMonthlyScore[]>(() => {
        return (this.data()?.scores ?? []).filter(s => s.overallScore >= 75);
    });

  
    belowTargetCount = computed(() => {
        return this.data()?.scores.filter(s => s.overallScore < 75).length || 0;
    });

    belowTargetComponents = computed<AirComponentMonthlyScore[]>(() => {
        return (this.data()?.scores ?? []).filter(s => s.overallScore < 75);
    });


    bestPerformingComponent = computed<AirComponentMonthlyScore | null>(() => {
        const scores = this.data()?.scores ?? [];
        return scores.reduce<AirComponentMonthlyScore | null>((best, current) => {
            if (!best || current.overallScore > best.overallScore) {
                return current;
            }
            return best;
        }, null);
    });

    lowestPerformingComponent = computed<AirComponentMonthlyScore | null>(() => {
        const scores = this.data()?.scores ?? [];
        return scores.reduce<AirComponentMonthlyScore | null>((lowest, current) => {
            if (!lowest || current.overallScore < lowest.overallScore) {
                return current;
            }
            return lowest;
        }, null);
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

        const lineColor = this.theme.isDark() ? 'rgb(55, 212, 92)' : '#25db40';

        reports.forEach((report, index) => {
            const target = getTargetValue(report.dimension);

            dynamicAnnotations[`target_${index}`] = {
                type: 'line',
                xScaleID: 'x',
                yScaleID: 'y',
                xMin: target,
                xMax: target,
                yMin: index - 0.15,   // Limits the vertical height to create a "small bar" effect
                yMax: index + 0.15,   // Limits the vertical height to create a "small bar" effect
                borderColor: lineColor,
                borderWidth: 8,       // Makes the line thick so it looks like a small bar
                drawTime: 'afterDatasetsDraw',
                // The label object has been completely removed to hide the numbers and percentage
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



    // Heatmap dimension configuration
    heatMapDimensions = [
        { key: 'opsEffectiveness', label: 'Ops' },
        { key: 'jointCoord', label: 'Joint' },
        { key: 'resourceManagement', label: 'Resource' },
        { key: 'personnelDev', label: 'Personnel' },
        { key: 'strategicImpact', label: 'Strategic' },
        { key: 'riskAssessment', label: 'Risk' }
    ];

   
    // Returns Tailwind gradient classes based on score thresholds (Dark/Light mode aware)
    getHeatMapClasses(score: number): string {
        if (score >= 90) return 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white';
        if (score >= 75) return 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-emerald-950';
        if (score >= 70) return 'bg-gradient-to-br from-lime-300 to-amber-400 text-white';
        if (score >= 60) return 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950';
        if (score >= 50) return 'bg-gradient-to-br from-orange-400 to-red-500 text-white';
        if (score >= 40) return 'bg-gradient-to-br from-red-400 to-red-600 text-white';
        return 'bg-gradient-to-br from-red-300 to-red-400 text-red-950';
    }

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

    toggleHeatMap(): void {
        this.showHeatMap.update(v => !v);
    }

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

function $any(comp: AirComponentMonthlyScore) {
    throw new Error('Function not implemented.');
}
