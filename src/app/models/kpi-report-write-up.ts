import { Observable } from 'rxjs';
import { ReportMonth } from '../shared/report-month';




export interface KpiReportWriteUp {
  id: number;
  reportMonth: ReportMonth;
  reportYear: number;
  content: string;
  timestamp: string;
  coppRemarks?: string;
  casRemarks?: string;
}