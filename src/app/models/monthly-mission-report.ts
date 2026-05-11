import { ReportMonth } from "../shared/report-month";

export interface MonthlyMissionReport {

    month: ReportMonth;
    year: number;

    opsEffectiveness: number;
    missionSuccessRate: number;
    targetEngagementAccuracy: number;
    isrEffectiveness: number;

    totalMissions: number;
    successfulMissions: number;

    totalTargetsEngaged: number;
    totalTargetsNeutralized: number;

    totalPir: number;
    pirScore: number;
}
