import { ReportMonth } from "../shared/report-month";
import { AirComponentMonthlyScore } from "./air-component-monthly-score";
import { AircraftServiceabilityMonthlyReport } from "./aircraft-serviceability-monthly-report";
import { CrewCurrencyMonthlyReport } from "./crew-currency-monthly-report";
import { EnemyActivityMonthlyReport } from "./enemy-activity-monthly-report";
import { FuelConsumptionMonthlyReport } from "./fuel-consumption-monthly-report";
import { JointCoordMonthlyReport } from "./joint-coord-monthly-report";
import { MonthlyMissionReport } from "./monthly-mission-report";
import { OrdnanceExpenditureMonthlyReport } from "./ordnance-expenditure-monthly-report";
import { RiskAssessmentMonthlyReport } from "./risk-assessment-monthly-report";



export interface AirComponentMonthlyReport {

    airComponentId: number;
    airComponentName: string;

    reportMonth: ReportMonth;
    reportYear: number;

    missionReport?: MonthlyMissionReport;
    riskReport?: RiskAssessmentMonthlyReport;
    enemyReport?: EnemyActivityMonthlyReport;
    jointReport?: JointCoordMonthlyReport;
    crewReport?: CrewCurrencyMonthlyReport;
    serviceabilityReport?: AircraftServiceabilityMonthlyReport;
    ordnanceReport?: OrdnanceExpenditureMonthlyReport;
    fuelReport?: FuelConsumptionMonthlyReport;
    monthlyScoreReport?: AirComponentMonthlyScore;
}
