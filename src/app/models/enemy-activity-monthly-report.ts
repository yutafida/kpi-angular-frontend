import { ReportMonth } from "../shared/report-month";



export interface EnemyActivityMonthlyReport {

    month: ReportMonth;
    year: number;

    strategicImpact: number;

    numberOfBaselineActivities: number;
    numberOfCurrentActivities: number;
}
