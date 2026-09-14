import { ReportMonth } from "../shared/report-month";



export interface GeneralMonthlyWriteUp {
  reportMonth: ReportMonth;
  reportYear: number;
  content: string;
  monthlyEvaluationReportId?: number;
}
