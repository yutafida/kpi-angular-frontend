import { Component, Input } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';


@Component({
  selector: 'app-readiness-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <canvas
      baseChart
      [data]="chartData"
      [options]="chartOptions"
      [type]="'bar'">
    </canvas>
  `
})
export class ReadinessChartComponent {

  @Input() chartData!: ChartData<'bar'>;

  @Input() chartOptions!: ChartOptions<'bar'>;
}