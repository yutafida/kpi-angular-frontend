import { ReportMonth } from "../shared/report-month";



export interface RiskAssessmentMonthlyReport {

    month: ReportMonth;
    year: number;

    roeComplianceRate: number;
    opsecComplianceRate: number;
    safetyComplianceRate: number;

    scofeScore: number;
}
