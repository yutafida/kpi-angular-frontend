import { ReportMonth } from '../shared/report-month';
import { ReportQuarter } from '../shared/report-quarter';

export interface KpiWriteUpBase {
  id: number;
  reportYear: number;
  content: string;
  timestamp: string;
  coppRemarks?: string;
  casRemarks?: string;
}

export interface GeneralMonthlyWriteUp extends KpiWriteUpBase {
  reportMonth: ReportMonth;
}

export interface GeneralQuarterlyWriteUp extends KpiWriteUpBase {
  reportQuarter: ReportQuarter;
}

export interface AirComponentMonthlyWriteUp extends KpiWriteUpBase {
  reportMonth: ReportMonth;
  airComponentId: number;
}

export interface AirComponentQuarterlyWriteUp extends KpiWriteUpBase {
  reportQuarter: ReportQuarter;
  airComponentId: number;
}

// Union type for endpoints that return a mix of all four (e.g. getReports(), getLatestReport())
export type KpiReportWriteUp =
  | GeneralMonthlyWriteUp
  | GeneralQuarterlyWriteUp
  | AirComponentMonthlyWriteUp
  | AirComponentQuarterlyWriteUp;

// Type guards — useful when narrowing a KpiReportWriteUp from the combined list
export function isMonthlyWriteUp(
  r: KpiReportWriteUp
): r is GeneralMonthlyWriteUp | AirComponentMonthlyWriteUp {
  return (r as any).reportMonth !== undefined;
}

export function isQuarterlyWriteUp(
  r: KpiReportWriteUp
): r is GeneralQuarterlyWriteUp | AirComponentQuarterlyWriteUp {
  return (r as any).reportQuarter !== undefined;
}

export function isAirComponentWriteUp(
  r: KpiReportWriteUp
): r is AirComponentMonthlyWriteUp | AirComponentQuarterlyWriteUp {
  return (r as any).airComponentId !== undefined;
}


// import { Observable } from 'rxjs';
// import { ReportMonth } from '../shared/report-month';

// export interface KpiReportWriteUp {
//   id: number;
//   reportMonth: ReportMonth;
//   reportYear: number;
//   content: string;
//   timestamp: string;
//   coppRemarks?: string;
//   casRemarks?: string;
// }