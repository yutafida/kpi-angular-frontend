import { ReportMonth } from "../shared/report-month";



export interface AircraftServiceabilityMonthlyReport {

    month: ReportMonth;
    year: number;

    totalOperableAircraft: number;
    totalServiceableAircraft: number;

    serviceabilityRate: number;

}
