import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KpiMonthlyDashboard } from '../models/kpi-dashboard'; 
import { ReportMonth } from '../shared/report-month';
import { AirComponentMonthlyReport } from '../models/air-component-monthly-report';
import { ReportSubmissionLog } from '../models/report-submission-log';
import { KpiReportWriteUp } from '../models/kpi-report-write-up';



export type ReportPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type ReportQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';



@Injectable({
  providedIn: 'root'
})
export class KpiService {

  private baseUrl = 'http://localhost:8080/api/kpi';

  // private baseUrl = '/api/kpi';


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

  // getMonthlyReport(month: string, year: number): Observable<KpiMonthlyDashboard> {
  //   const params = new HttpParams()
  //     .set('month', month)
  //     .set('year', year);

  //   return this.http.get<KpiMonthlyDashboard>(`${this.baseUrl}/monthly`, { params });
  // }

    getMonthlyReport(month: string, year: number): Observable<KpiMonthlyDashboard> {
    const params = new HttpParams()
      .set('month', month)
      .set('year', year)
      .set('period', 'MONTHLY');

    return this.http.get<KpiMonthlyDashboard>(`${this.baseUrl}/monthly`, { params });
  }

  getQuarterlyReport(quarter: string, year: number): Observable<KpiMonthlyDashboard> {
    const params = new HttpParams()
      .set('quarter', quarter)
      .set('year', year)
      .set('period', 'QUARTERLY');

    return this.http.get<KpiMonthlyDashboard>(`${this.baseUrl}/monthly`, { params });
  }

  getReport(
    year: number,
    period: 'MONTH' | 'QUARTER',
    month?: string,
    quarter?: string
  ): Observable<KpiReportWriteUp> {
    let params = new HttpParams().set('year', year.toString()).set('period', period);
    if (period === 'MONTH' && month) params = params.set('month', month);
    if (period === 'QUARTER' && quarter) params = params.set('quarter', quarter);

    return this.http.get<KpiReportWriteUp>(`${this.baseUrl}/reports`, { params });
  }


  

  getAirComponentDashboard(
    airComponentId: number,
    year: number,
    period: ReportPeriod = 'MONTHLY',
    month?: ReportMonth,
    quarter?: ReportQuarter
  ): Observable<AirComponentMonthlyReport> {
    
    let params = new HttpParams().set('period', period);
    
    if (month) {
      params = params.set('month', month);
    }
    if (quarter) {
      params = params.set('quarter', quarter);
    }

    return this.http.get<AirComponentMonthlyReport>(
      `${this.baseUrl}/${airComponentId}/dashboard/${year}`,
      { params }
    );
  }


  // getAirComponentMonthlyDashboard(
  //   airComponentId: number,
  //   year: number,
  //   month: ReportMonth
  // ): Observable<AirComponentMonthlyReport> {

  //   return this.http.get<AirComponentMonthlyReport>(
  //     `${this.baseUrl}/${airComponentId}/monthly/${year}/${month}`
  //   );
  // }

  
  submitDashboardObservation(
    reportMonth: ReportMonth,
    reportYear: number,
    content: string
  ): Observable<any> {

    const payload = {
      reportMonth,
      reportYear,
      content,
      timestamp: new Date().toISOString()
    };

    return this.http.post(
      `${this.baseUrl}/observations/dashboard`,
      payload
    );
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


  submitKpiReport(
    reportMonth: ReportMonth,
    reportYear: number,
    content: string
  ): Observable<any> {

    const payload = {
      reportMonth,
      reportYear,
      content,
      timestamp: new Date().toISOString()
    };

    console.log('Sending KPI Report:', payload);

    return this.http.post(
      `${this.baseUrl}/reports/generate`,
      payload
    );
  }

  // getReport(
  //   reportMonth: ReportMonth,
  //   reportYear: number
  // ): Observable<KpiReportWriteUp> {

  //   return this.http.get<KpiReportWriteUp>(
  //     `${this.baseUrl}/reports/${reportMonth}/${reportYear}`
  //   );
  // }

  getReports(): Observable<KpiReportWriteUp[]> {
    return this.http.get<KpiReportWriteUp[]>(
      `${this.baseUrl}/reports`
    );
  }

  deleteReport(
    reportId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/reports/${reportId}`
    );
  }
  
}