import { ReportMonth } from "../shared/report-month";

export interface OrdnanceExpenditureMonthlyReport {

    month: ReportMonth;
    year: number;

    expected: number;
    actual: number;

    totalEffectivenessRatio: number;
}
