import { ReportMonth } from "../shared/report-month";



export interface FuelConsumptionMonthlyReport {

    month: ReportMonth;
    year: number;

    flightHours: string;
    expectedFuelConsumption: number;
    actualFuelConsumption: number;
    fuelEfficiencyIndex: number;

    variance: number;
}

