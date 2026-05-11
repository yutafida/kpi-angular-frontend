import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import {
  Chart,
  registerables,
  ChartConfiguration,
  ChartData,
  ChartDataset,
  ChartOptions,
  ChartType,
  ActiveElement
} from 'chart.js';

import annotationPlugin from 'chartjs-plugin-annotation';

import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables
} from 'ng2-charts';

import { HeaderComponent } from '../../shared/header.component/header.component';

import { KpiMonthlyDashboard } from '../../models/kpi-monthly-dashboard';
import { AirComponentMonthlyScore } from '../../models/air-component-monthly-score';

import { KpiService } from '../../services/kpi-service';

Chart.register(...registerables, annotationPlugin);

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    HeaderComponent,
    BaseChartDirective,
    RouterModule
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './kpi-dashboard.html',
  styleUrls: ['./kpi-dashboard.css']
})
export class KpiDashboard implements OnInit {

  constructor(private kpiService: KpiService) {}

  // =========================================================
  // SIGNALS
  // =========================================================

  data = signal<KpiMonthlyDashboard | null>(null);
  loading = signal(false);

  selectedTheater = signal<AirComponentMonthlyScore | null>(null);

  showChart = signal(true);
  showDimensionTable = signal(true);
  showTheatreTable = signal(true);
  showComparisonChart = signal(true);
  showBulletChart = signal(true);

  filterType = signal<'MONTH' | 'QUARTER'>('MONTH');

  selectedMonth = signal('MAY');
  selectedQuarter = signal('Q2');
  selectedYear = signal(2026);

  activeChartType = signal<'bar'>('bar');

  months = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER'
  ];

  quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

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
  // MAIN CHART
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
              ? 'rgba(16,185,129,0.7)'
              : v >= 60
              ? 'rgba(245,158,11,0.7)'
              : 'rgba(239,68,68,0.7)'
          ),
          borderColor: '#0B1221',
          borderWidth: 1
        }
      ]
    };
  });

  // =========================================================
  // MAIN CHART OPTIONS
  // =========================================================

  mainChartOptions = computed<ChartOptions<'bar'>>(() => ({

    responsive: true,

    maintainAspectRatio: false,

    onClick: (_, elements) => {
      this.onChartClick(elements);
    },

    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#64748b'
        }
      },
      x: {
        ticks: {
          color: '#64748b'
        }
      }
    },

    plugins: {

      legend: {
        display: false
      },

      annotation: {
        annotations: {

          threshold75: {
            type: 'line',
            yMin: 75,
            yMax: 75,
            borderColor: '#2563eb',
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
  }));

  // =========================================================
  // DRILLDOWN RADAR CHART
  // =========================================================

  drillDownChartData = computed<ChartData<'radar'> | null>(() => {

    const t = this.selectedTheater();

    if (!t) {
      return null;
    }

    return {
      labels: [
        'Ops Effectiveness',
        'Joint Coord',
        'Resource Mgmt',
        'Personnel Dev',
        'Strategic Impact',
        'Risk Assessment'
      ],
      datasets: [
        {
          label: t.airComponentName,
          data: [
            t.opsEffectiveness,
            t.jointCoord,
            t.resourceManagement,
            t.personnelDev,
            t.strategicImpact,
            t.riskAssessment
          ],
          backgroundColor: 'rgba(212,175,55,0.2)',
          borderColor: '#D4AF37',
          pointBackgroundColor: '#D4AF37',
          fill: true
        }
      ]
    };
  });

  // =========================================================
  // BULLET CHART DATA
  // =========================================================

  bulletChartData = computed<ChartData<'bar'>>(() => {
    const reports = this.data()?.reports || [];
    const labels = reports.map(r => r.dimension);
    const values = reports.map(r => r.averageOverallScore);

    return {
      labels,
      datasets: [{
        label: 'NAF Average',
        data: values,
        backgroundColor: values.map(v =>
          v >= 75 ? 'rgba(16,185,129,0.7)' :
          v >= 60 ? 'rgba(245,158,11,0.7)' :
          'rgba(239,68,68,0.7)'
        ),
        borderRadius: 4,
        borderSkipped: false
      }]
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
  // COMPARISON OPTIONS
  // =========================================================

  comparisonBarChartOptions: ChartOptions<'bar' | 'line'> = {

    responsive: true,

    maintainAspectRatio: false,

    scales: {

      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#64748b'
        },
        grid: {
          color: 'rgba(148,163,184,0.15)'
        }
      },

      x: {
        ticks: {
          color: '#64748b'
        },
        grid: {
          display: false
        }
      }
    },

    plugins: {

      legend: {
        position: 'bottom'
      },

      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff'
      }
    }
  };

  // =========================================================
  // BULLET CHART OPTIONS
  // =========================================================

  bulletChartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y', // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(148,163,184,0.15)' }
      },
      y: {
        ticks: { color: '#64748b' },
        grid: { display: false }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  loadData(): void {

    this.loading.set(true);

    const period =
      this.filterType() === 'MONTH'
        ? this.selectedMonth()
        : this.selectedQuarter();

    this.kpiService.getMonthlyReport(period, this.selectedYear())
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

  // =========================================================
  // CHART CLICK
  // =========================================================

  onChartClick(elements: ActiveElement[]): void {

    if (!elements.length) {
      return;
    }

    const index = elements[0].index;

    const theater = this.data()?.scores[index];

    if (theater) {
      this.selectedTheater.set(theater);
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  setFilterType(type: 'MONTH' | 'QUARTER'): void {
    this.filterType.set(type);
    this.loadData();
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
  toggleBulletChart() {
    this.showBulletChart.update(v => !v);
  }}