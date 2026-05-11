import { ReportMonth } from "../shared/report-month";



export interface FuelConsumptionMonthlyReport {

    month: ReportMonth;
    year: number;

    flightHours: number;
    expectedFuelConsumption: number;
    actualFuelConsumption: number;

    variance: number;
}
