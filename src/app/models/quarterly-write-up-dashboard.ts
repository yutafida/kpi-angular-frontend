import { ReportMonth } from '../shared/report-month';
import { ReportQuarter } from '../shared/report-quarter';
import { AirComponentQuarterlyWriteUp } from './air-component-quarterly-write-up';
import { GeneralQuarterlyWriteUp } from './kpi-report-write-up';




export interface QuarterlyWriteUpDashboard{
        reportQuarter: ReportQuarter;
        reportYear: number;
        generalReport: GeneralQuarterlyWriteUp | null;
        airComponentReports: AirComponentQuarterlyWriteUp[];
}
