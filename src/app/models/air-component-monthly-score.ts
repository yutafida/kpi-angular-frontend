import { ReportMonth } from "../shared/report-month";



export interface AirComponentMonthlyScore {

    id: number;

    // Metadata
    airComponentId: number;
    airComponentName: string;
    region: string;

    // Performance Metrics
    opsEffectiveness: number;
    jointCoord: number;
    resourceManagement: number;
    personnelDev: number;
    strategicImpact: number;
    riskAssessment: number;

    // Scoring and Ranking
    overallScore: number;
    rating: string;
    scoreRank: number;

    // Staff Remarks
    doplansRemarks: string;
    coppRemarks: string;
    casRemarks: string;

    // Reporting Period
    reportMonth: ReportMonth;
    reportYear: number;

}
