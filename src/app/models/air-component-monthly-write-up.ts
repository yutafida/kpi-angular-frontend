import { ReportMonth } from "../shared/report-month";

export interface AirComponentMonthlyWriteUp{
  reportMonth: ReportMonth;
  reportYear: number;
  content: string;
  airComponentId: number;
  monthlyEvaluationReportId?: number;
}



