import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterStateService } from '../../services/filter-state';
import { KpiService } from '../../services/kpi-service';
import { ReportMonth } from '../../shared/report-month';
import { ReportQuarter } from '../../shared/report-quarter';



export type WriteUpMode =
  | 'GENERAL_MONTHLY'
  | 'GENERAL_QUARTERLY'
  | 'AIR_COMPONENT_MONTHLY'
  | 'AIR_COMPONENT_QUARTERLY';




@Component({
  selector: 'app-report-viewer-component',
  imports: [],
  templateUrl: './report-viewer-component.html',
  styleUrl: './report-viewer-component.css',
})
// export class ReportViewerComponent {}
export class ReportViewerComponent implements OnChanges {

  @ViewChild('documentCanvas') documentCanvas!: ElementRef<HTMLDivElement>;

  // Inputs driven by the parent composer
  @Input() mode: WriteUpMode = 'GENERAL_MONTHLY';
  @Input() airComponentId: number | null = null;
  @Input() isVisible: boolean = false;

  // Output to tell parent to close the viewer
  @Output() exitViewMode = new EventEmitter<void>();

  private kpiService = inject(KpiService);
  private filterState = inject(FilterStateService);

  // Read shared filter state
  selectedMonth = this.filterState.selectedMonth;
  selectedQuarter = this.filterState.selectedQuarter;
  selectedYear = this.filterState.selectedYear;

  // Internal UI state
  loading = false;
  notFound = false;
  reportContent = '';

  // Computed label for UI display
  get periodLabel(): string {
    const isMonthly = this.mode === 'GENERAL_MONTHLY' || this.mode === 'AIR_COMPONENT_MONTHLY';
    const period = isMonthly ? String(this.selectedMonth()) : String(this.selectedQuarter());
    return `${period} ${this.selectedYear()}`;
  }

  // Listen for changes to inputs or filter state to auto-reload
  // FIX: Added SimpleChanges parameter and import to satisfy strict type checking
  ngOnChanges(changes: SimpleChanges): void {
    if (this.isVisible) {
      this.loadReport();
    }
  }

  // =====================================================
  // LOAD REPORT DATA
  // =====================================================

  loadReport(): void {
    if ((this.mode === 'AIR_COMPONENT_MONTHLY' || this.mode === 'AIR_COMPONENT_QUARTERLY') && this.airComponentId == null) {
      this.notFound = true;
      return;
    }

    this.loading = true;
    this.notFound = false;

    const year = this.selectedYear();
    const currentMode = this.mode;
    const componentId = this.airComponentId;

    let request$!: Observable<any>;

    if (currentMode === 'GENERAL_MONTHLY') {
      request$ = this.kpiService.getGeneralMonthlyWriteUp(this.selectedMonth() as ReportMonth, year);
    } else if (currentMode === 'GENERAL_QUARTERLY') {
      request$ = this.kpiService.getGeneralQuarterlyWriteUp(this.selectedQuarter() as ReportQuarter, year);
    } else if (currentMode === 'AIR_COMPONENT_MONTHLY') {
      request$ = this.kpiService.getAirComponentMonthlyWriteUp(this.selectedMonth() as ReportMonth, year, componentId as number);
    } else {
      request$ = this.kpiService.getAirComponentQuarterlyWriteUp(this.selectedQuarter() as ReportQuarter, year, componentId as number);
    }

    request$.subscribe({
      next: (report) => {
        const content: string = report?.content ?? '';

        if (!content || !content.trim()) {
          this.notFound = true;
          this.reportContent = '';
          this.loading = false;
          return;
        }

        this.reportContent = content;

        // Inject HTML safely into the DOM
        if (this.documentCanvas) {
          this.documentCanvas.nativeElement.innerHTML = content;
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load saved report', error);
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  // =====================================================
  // EXPORT TO MS WORD
  // =====================================================

  exportToWord(): void {
    if (!this.documentCanvas || !this.reportContent.trim()) {
      return;
    }

    const innerContent = this.documentCanvas.nativeElement.innerHTML;
    const label = this.periodLabel;

    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${label} KPI Report</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowInsertionsAndDeletions/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page WordSection1 { size: 8.5in 11.0in; mso-page-orientation: portrait; margin: 1.0in 1.0in 1.0in 1.0in; }
          div.WordSection1 { page: WordSection1; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; }
          img { max-width: 100%; height: auto; }
          h1, h2, h3 { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          <h1 style="text-align: center; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px;">${label} KPI Report</h1>
          <br/>
          ${innerContent}
        </div>
      </body>
    </html>`;

    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const filename = `KPI_Report_${label.replace(/\s+/g, '_')}.doc`;

    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }
}
