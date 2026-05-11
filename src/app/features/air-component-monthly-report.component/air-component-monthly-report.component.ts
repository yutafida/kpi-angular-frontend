import { Component, Input } from '@angular/core';
import { AirComponentMonthlyReport } from '../../models/air-component-monthly-report';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-air-component-monthly-report',
  imports: [CommonModule],
  templateUrl: './air-component-monthly-report.component.html',
  styleUrl: './air-component-monthly-report.component.css',
})
export class AirComponentMonthlyReportComponent {

   @Input() report: AirComponentMonthlyReport | null = null;

   


}
