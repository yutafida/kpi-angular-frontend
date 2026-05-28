export interface ReportSubmissionLog {

  id: number;

  airComponentId: number;

  airComponentName: string;

  region: string;

  reportType: string;

  logDate: string;

  status: string;

  submittedAt: string;

  reportId: number | null;

  submitted: boolean;
}