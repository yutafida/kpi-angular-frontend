import { Injectable } from '@angular/core';
import { ReportChart } from '../models/report-chart';

@Injectable({
  providedIn: 'root'
})
export class ReportBuilderService {

  private charts: ReportChart[] = [];

  addChart(chart: ReportChart): void {

    this.charts.push(chart);
  }

  getCharts(): ReportChart[] {

    return this.charts;
  }

  removeChart(index: number): void {

    this.charts.splice(index, 1);
  }

  clearCharts(): void {

    this.charts = [];
  }
}