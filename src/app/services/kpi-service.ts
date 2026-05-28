import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KpiMonthlyDashboard } from '../models/kpi-monthly-dashboard'; 
import { ReportMonth } from '../shared/report-month';
import { AirComponentMonthlyReport } from '../models/air-component-monthly-report';
import { ReportSubmissionLog } from '../models/report-submission-log';



@Injectable({
  providedIn: 'root'
})
export class KpiService {

  private baseUrl = 'http://localhost:4040/api/kpi';

  constructor(private http: HttpClient) {}

  getReportSubmissionLogs(
    airComponentId?: number,
    status?: string,
    date?: string
  ): Observable<ReportSubmissionLog[]> {

    let params = new HttpParams();

    if (airComponentId !== undefined && airComponentId !== null) {

      params = params.set(
        'airComponentId',
        airComponentId.toString()
      );
    }

    if (status) {

      params = params.set(
        'status',
        status
      );
    }

    if (date) {

      params = params.set(
        'date',
        date
      );
    }

    return this.http.get<ReportSubmissionLog[]>(
      `${this.baseUrl}/report-submission-logs`,
      { params }
    );
  }

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

  submitDashboardObservation(period: string, year: number, content: string): Observable<any> {
    const payload = {
      period,
      year,
      content,
      timestamp: new Date().toISOString()
    };

    return this.http.post(`${this.baseUrl}/observations/dashboard`, payload);
  }

  submitComponentObservation(
    airComponentId: number,
    month: string,
    year: number,
    content: string
  ): Observable<any> {
    const payload = {
      airComponentId,
      month,
      year,
      content,
      timestamp: new Date().toISOString()
    };

    return this.http.post(`${this.baseUrl}/observations/component`, payload);
  }

  getDashboardObservations(month: string, year: number): Observable<Array<{ id?: number; period: string; year: number; content: string; timestamp: string }>> {
    const params = new HttpParams()
      .set('month', month)
      .set('year', year);

    return this.http.get<Array<{ id?: number; period: string; year: number; content: string; timestamp: string }>>(
      `${this.baseUrl}/observations/dashboard`,
      { params }
    );
  }

  submitKpiReport(period: string, year: number, content: string): Observable<any> {
    const payload = {
      period,
      year,
      content,
      timestamp: new Date().toISOString()
    };

    return this.http.post(`${this.baseUrl}/reports/generate`, payload);
  }
}