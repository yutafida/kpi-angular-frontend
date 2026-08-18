import { ReportMonth } from "../shared/report-month";



export interface RiskAssessmentMonthlyReport {

    month: ReportMonth;
    year: number;

    roeComplianceRate: number;
    numberOfRoeCompliantFlights: number;

    opsecComplianceRate: number;
    numberOfOpsecCompliantFlights: number;

    safetyComplianceRate: number;
    numberOfSafetyCompliantFlights: number;
 
    scofeScore: number;
}
