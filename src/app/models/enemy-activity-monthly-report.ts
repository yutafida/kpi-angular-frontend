import { ReportMonth } from "../shared/report-month";



export interface EnemyActivityMonthlyReport {

    month: ReportMonth;
    year: number;

    numberOfBaselineActivities: number;
    numberOfCurrentActivities: number;

    strategicImpact: number;

    activityDrivers: string;

    
}
