import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KpiMonthlyDashboard } from '../models/kpi-monthly-dashboard'; 
import { ReportMonth } from '../shared/report-month';
import { AirComponentMonthlyReport } from '../models/air-component-monthly-report';



@Injectable({
  providedIn: 'root'
})
export class KpiService {

  private baseUrl = 'http://localhost:4040/api/kpi';

  constructor(private http: HttpClient) {}

  getMonthlyReport(month: string, year: number): Observable<KpiMonthlyDashboard> {
    const params = new HttpParams()
      .set('month', month)
      .set('year', year);

    return this.http.get<KpiMonthlyDashboard>(`${this.baseUrl}/monthly`, { params });
  }

  getAirComponentMonthlyDashboard(
    airComponentId: number,
    year: number,
    month: ReportMonth
  ): Observable<AirComponentMonthlyReport> {

    return this.http.get<AirComponentMonthlyReport>(
      `${this.baseUrl}/${airComponentId}/monthly/${year}/${month}`
    );
  }
}