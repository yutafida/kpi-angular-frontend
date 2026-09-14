import { ReportMonth } from '../shared/report-month';
import { GeneralMonthlyWriteUp, AirComponentMonthlyWriteUp } from './kpi-report-write-up';




export interface MonthlyWriteUpDashboard {
        reportMonth: ReportMonth;
        reportYear: number;
        generalReport: GeneralMonthlyWriteUp | null;
        airComponentReports: AirComponentMonthlyWriteUp[];
}
