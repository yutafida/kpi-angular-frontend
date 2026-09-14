
import { ReportQuarter } from '../shared/report-quarter';

export interface AirComponentQuarterlyWriteUp {
  reportQuarter: ReportQuarter;
  reportYear: number;
  content: string;
  airComponentId: number;
  quarterlyEvaluationReportId?: number;
}