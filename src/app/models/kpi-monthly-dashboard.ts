
import { AirComponentMonthlyScore } from "./air-component-monthly-score"; 
import { KpiMonthlyEvaluationReport } from "./kpi-monthly-evaluation-report";


export interface KpiMonthlyDashboard {

    reports: KpiMonthlyEvaluationReport[];
    scores: AirComponentMonthlyScore[];

    nafAverageScore: number;
    nafRating: string;
    

    bestTheatre: string;
    attentionTheatre: string;
}
