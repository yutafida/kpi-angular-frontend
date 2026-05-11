
export interface KpiMonthlyEvaluationReport {

    id: number;
    reportMonth: string;
    reportYear: number;
    dimension: string;

    averageOverallScore: number;
    bestScore: number;
    bestPerformingTheater: string;
    bestPerformingTheaterId: number;

    lowestScore: number;
    lowestPerformingTheater: string;
    lowestPerformingTheaterId: number;

    stdDev: number;

    date: string;

    validated: boolean;
    validatedAt: string | null;
    validatedBy: string | null;
}
