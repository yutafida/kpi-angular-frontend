import { ReportMonth } from "../shared/report-month";



export interface CrewCurrencyMonthlyReport {

    month: ReportMonth;
    year: number;

    fullyCurrentCrew: number;
    current75Crew: number;
    current50Crew: number;
    current25Crew: number;
    notCurrentCrew: number;
}
