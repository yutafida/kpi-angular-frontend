import { ReportMonth } from "../shared/report-month";



export interface JointCoordMonthlyReport {

    month: ReportMonth;
    year: number;

    casCompletionRate: number;
    interServiceIntegration: number;
    jointCoordination: number;

    totalJointOps: number;
    jointOpsParticipated: number;

    totalCasRequests: number;
    casCompleted: number;
}
