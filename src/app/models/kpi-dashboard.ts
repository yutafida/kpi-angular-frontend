
import { AirComponentMonthlyScore } from "./air-component-monthly-score"; 
import { KpiEvaluationReport } from "./kpi-evaluation-report";


export interface KpiMonthlyDashboard {

    reports: KpiEvaluationReport[];
    scores: AirComponentMonthlyScore[];

    nafAverageScore: number;
    nafRating: string;
    

    bestTheatre: string;
    attentionTheatre: string;

    stdDev: number; 
}
