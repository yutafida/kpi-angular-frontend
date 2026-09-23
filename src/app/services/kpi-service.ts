import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KpiMonthlyDashboard } from '../models/kpi-dashboard';
import { ReportMonth } from '../shared/report-month';
import { AirComponentMonthlyReport } from '../models/air-component-monthly-report';
import {
        KpiReportWriteUp,
        GeneralMonthlyWriteUp,
        GeneralQuarterlyWriteUp,
        AirComponentMonthlyWriteUp,
        AirComponentQuarterlyWriteUp
} from '../models/kpi-report-write-up';
import { MonthlyWriteUpDashboard } from '../models/monthly-write-up-dashboard';
import { QuarterlyWriteUpDashboard } from '../models/quarterly-write-up-dashboard';

export type DashboardPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type ReportQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

@Injectable({
        providedIn: 'root'
})
export class KpiService {

        //private baseUrl = 'http://localhost:8080/api/kpi';

        private baseUrl = '/api/kpi';
        filterState: any;

        constructor(private http: HttpClient) {}

        // =====================================================
        // AI REPORT GENERATION
        // =====================================================

        // For Air Component Reports (uses Score ID)
        generateAiWriteUp(prompt: string, mode: string, monthlyScore: any): Observable<{ content: string }> {
                const body = {
                        scoreId: monthlyScore?.id || null,
                        mode: mode,
                        prompt: prompt
                };
                return this.http.post<{ content: string }>(`${this.baseUrl}/reports/ai-writeup`, body);
        }

        // For General KPI Reports (uses Month/Quarter & Year)
        generateGeneralAiWriteUp(
                prompt: string,
                mode: string,
                reportMonth: ReportMonth | null,
                reportQuarter: ReportQuarter | null,
                reportYear: number
        ): Observable<{ content: string }> {
                const body = {
                        mode: mode,
                        prompt: prompt,
                        reportMonth: reportMonth,
                        reportQuarter: reportQuarter,
                        reportYear: reportYear
                };
                return this.http.post<{ content: string }>(`${this.baseUrl}/reports/general/ai-writeup`, body);
        }

        // =====================================================
        // KPI REPORT WRITE-UPS — DASHBOARD (all reports for a period)
        // =====================================================

        getMonthlyWriteUpDashboard(month: ReportMonth, year: number): Observable<MonthlyWriteUpDashboard> {
                const params = new HttpParams()
                        .set('month', month)
                        .set('year', year);

                return this.http.get<MonthlyWriteUpDashboard>(
                        `${this.baseUrl}/reports/dashboard/monthly`,
                        { params }
                );
        }

        getQuarterlyWriteUpDashboard(quarter: ReportQuarter, year: number): Observable<QuarterlyWriteUpDashboard> {
                const params = new HttpParams()
                        .set('quarter', quarter)
                        .set('year', year);

                return this.http.get<QuarterlyWriteUpDashboard>(
                        `${this.baseUrl}/reports/dashboard/quarterly`,
                        { params }
                );
        }

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

        getAirComponentDashboard(
                airComponentId: number,
                year: number,
                period: DashboardPeriod = 'MONTHLY',
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

        submitDashboardObservation(reportMonth: ReportMonth, reportYear: number, content: string): Observable<any> {
                const payload = {
                        reportMonth,
                        reportYear,
                        content,
                        timestamp: new Date().toISOString()
                };

                return this.http.post(`${this.baseUrl}/observations/dashboard`, payload);
        }

        submitComponentObservation(airComponentId: number, month: string, year: number, content: string): Observable<any> {
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

        // =====================================================
        // KPI REPORT WRITE-UPS — GENERATE (create-or-update by natural key)
        // =====================================================

        submitGeneralMonthlyReport(reportMonth: ReportMonth, reportYear: number, content: string): Observable<GeneralMonthlyWriteUp> {
                const payload = {
                        reportMonth,
                        reportYear,
                        content,
                        timestamp: new Date().toISOString()
                };

                return this.http.post<GeneralMonthlyWriteUp>(
                        `${this.baseUrl}/reports/general/monthly/generate`,
                        payload
                );
        }

        submitGeneralQuarterlyReport(reportQuarter: ReportQuarter, reportYear: number, content: string): Observable<GeneralQuarterlyWriteUp> {
                const payload = {
                        reportQuarter,
                        reportYear,
                        content,
                        timestamp: new Date().toISOString()
                };

                return this.http.post<GeneralQuarterlyWriteUp>(
                        `${this.baseUrl}/reports/general/quarterly/generate`,
                        payload
                );
        }

        submitAirComponentMonthlyReport(airComponentId: number, reportMonth: ReportMonth, reportYear: number, content: string): Observable<AirComponentMonthlyWriteUp> {
                const payload = {
                        airComponentId,
                        reportMonth,
                        reportYear,
                        content,
                        timestamp: new Date().toISOString()
                };

                return this.http.post<AirComponentMonthlyWriteUp>(
                        `${this.baseUrl}/reports/air-component/monthly/generate`,
                        payload
                );
        }

        submitAirComponentQuarterlyReport(airComponentId: number, reportQuarter: ReportQuarter, reportYear: number, content: string): Observable<AirComponentQuarterlyWriteUp> {
                const payload = {
                        airComponentId,
                        reportQuarter,
                        reportYear,
                        content,
                        timestamp: new Date().toISOString()
                };

                return this.http.post<AirComponentQuarterlyWriteUp>(
                        `${this.baseUrl}/reports/air-component/quarterly/generate`,
                        payload
                );
        }

        // =====================================================
        // KPI REPORT WRITE-UPS — FETCH BY NATURAL KEY
        // =====================================================

        getGeneralMonthlyWriteUp(reportMonth: ReportMonth, reportYear: number): Observable<GeneralMonthlyWriteUp> {
                return this.http.get<GeneralMonthlyWriteUp>(
                        `${this.baseUrl}/reports/general/monthly/${reportMonth}/${reportYear}`
                );
        }

        getGeneralQuarterlyWriteUp(reportQuarter: ReportQuarter, reportYear: number): Observable<GeneralQuarterlyWriteUp> {
                return this.http.get<GeneralQuarterlyWriteUp>(
                        `${this.baseUrl}/reports/general/quarterly/${reportQuarter}/${reportYear}`
                );
        }

        getAirComponentMonthlyWriteUp(reportMonth: ReportMonth, reportYear: number, airComponentId: number): Observable<AirComponentMonthlyWriteUp> {
                const params = new HttpParams().set('airComponentId', airComponentId);

                return this.http.get<AirComponentMonthlyWriteUp>(
                        `${this.baseUrl}/reports/air-component/monthly/${reportMonth}/${reportYear}`,
                        { params }
                );
        }

        getAirComponentQuarterlyWriteUp(reportQuarter: ReportQuarter, reportYear: number, airComponentId: number): Observable<AirComponentQuarterlyWriteUp> {
                const params = new HttpParams().set('airComponentId', airComponentId);

                return this.http.get<AirComponentQuarterlyWriteUp>(
                        `${this.baseUrl}/reports/air-component/quarterly/${reportQuarter}/${reportYear}`,
                        { params }
                );
        }

        // =====================================================
        // KPI REPORT WRITE-UPS — LIST / LATEST / DELETE / REMARKS
        // =====================================================

        getReports(): Observable<KpiReportWriteUp[]> {
                return this.http.get<KpiReportWriteUp[]>(
                        `${this.baseUrl}/reports`
                );
        }

        getLatestReport(): Observable<KpiReportWriteUp> {
                return this.http.get<KpiReportWriteUp>(
                        `${this.baseUrl}/reports/latest`
                );
        }

        deleteReport(reportId: number): Observable<void> {
                return this.http.delete<void>(
                        `${this.baseUrl}/reports/${reportId}`
                );
        }

        updateCoppRemarks(reportId: number, remarks: string): Observable<KpiReportWriteUp> {
                return this.http.patch<KpiReportWriteUp>(
                        `${this.baseUrl}/reports/${reportId}/copp-remarks`,
                        remarks
                );
        }

        updateCasRemarks(reportId: number, remarks: string): Observable<KpiReportWriteUp> {
                return this.http.patch<KpiReportWriteUp>(
                        `${this.baseUrl}/reports/${reportId}/cas-remarks`,
                        remarks
                );
        }
}