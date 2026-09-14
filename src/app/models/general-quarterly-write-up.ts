import { ReportQuarter } from "../shared/report-quarter";



export interface GeneralQuarterlyWriteUp {
  reportQuarter: ReportQuarter;
  reportYear: number;
  content: string;
  quarterlyEvaluationReportId?: number;
}

