import { Component, OnInit, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { KpiService } from '../../services/kpi-service';
import { ReportMonth } from '../../shared/report-month';
import { ReportChart } from '../../models/report-chart';
import { ReportBuilderService } from '../../services/report-builder-service';
import { ThemeToggleComponent } from '../theme-toggle.component/theme-toggle.component';
import { KpiReportWriteUp } from '../../models/kpi-report-write-up';



@Component({
  selector: 'app-kpi-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './kpi-report.html',
  styleUrls: ['./kpi-report.css']
})
export class KpiReport implements OnInit {

  readonly reportsPerPage = 10;

  // ViewChild reference to target the interactive document canvas
  @ViewChild('documentCanvas') documentCanvas!: ElementRef<HTMLDivElement>;

  constructor(
    private kpiService: KpiService,
    public reportBuilderService: ReportBuilderService
  ) {}

  /**
   * Loads a previously saved report for the supplied month/year and renders
   * it inside the document canvas in READ-ONLY view mode.
   *
   * The canvas is switched out of contenteditable so the user can review the
   * report without accidentally modifying it. The user can return to the
   * composer at any time via `exitViewMode()`.
   */
  loadReport(month: ReportMonth, year: number): void {
    this.loadingReport.set(true);
    this.statusMessage.set('');
    this.reportNotFound.set(false);

    this.kpiService
      .getReport(month, year)
      .subscribe({
        next: (report) => {
          // Handle the case where the backend returns an empty / null payload
          const content: string = report?.content ?? '';

          if (!content || !content.trim()) {
            this.reportNotFound.set(true);
            this.statusMessage.set(
              `No saved report found for ${month} ${year}.`
            );
            this.loadingReport.set(false);
            return;
          }

          this.reportContent.set(content);

          if (this.documentCanvas) {
            this.documentCanvas.nativeElement.innerHTML = content;
          }

          // Flip the UI into read-only view mode
          this.viewingReport.set(true);
          this.loadingReport.set(false);
          this.statusMessage.set(
            `Viewing saved report for ${month} ${year}.`
          );
        },
        error: (error) => {
          console.error('Failed to load saved report', error);
          this.reportNotFound.set(true);
          this.statusMessage.set(
            `No saved report found for ${month} ${year}.`
          );
          this.loadingReport.set(false);
        }
      });
  }

  /**
   * Convenience wrapper invoked from the template. Pulls the currently
   * selected month/year from the signals and delegates to `loadReport`.
   */
  viewReport(): void {
    this.loadReport(this.selectedMonth(), this.selectedYear());
  }

  /**
   * Returns the workspace to compose/edit mode. Clears the canvas and any
   * view-mode flags so the user can begin drafting a fresh report.
   */
  exitViewMode(): void {
    this.viewingReport.set(false);
    this.reportNotFound.set(false);

    if (this.documentCanvas) {
      this.documentCanvas.nativeElement.innerHTML = '';
    }

    this.reportContent.set('');
    this.statusMessage.set('');
  }

  /**
   * Handles keyboard events inside the document canvas.
   * Specifically intercepts the TAB key to insert 8 spaces instead of changing focus.
   */
  handleKeyDown(event: KeyboardEvent): void {
    // When in view-mode the canvas is non-editable; ignore all keystrokes.
    if (this.viewingReport()) return;

    if (event.key === 'Tab') {
      // Prevent the browser from moving focus to the next element
      event.preventDefault();

      // Insert 8 standard spaces at the cursor position
      document.execCommand('insertText', false, '        ');

      // Sync the state with the new HTML content
      if (this.documentCanvas) {
        this.onCanvasChange(this.documentCanvas.nativeElement.innerHTML);
      }
    }
  }
  /**
   * Transforms the text case of the current selection.
   * Replaces the selected text with the transformed version.
   *
   * Note: This uses 'insertText', which replaces the selection with plain text.
   * Any inline formatting (bold/italic) within the specific selection will be removed
   * and replaced by the new text case.
   */
  transformText(type: string): void {
    const selection = window.getSelection();

    // Check if there is a valid text selection
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const originalText = range.toString();

    if (!originalText) return;

    let newText = '';

    switch (type) {
      case 'uppercase':
        newText = originalText.toUpperCase();
        break;
      case 'lowercase':
        newText = originalText.toLowerCase();
        break;
      case 'capitalize':
        // Capitalize the first letter of every word
        newText = originalText.replace(/\b\w/g, (char) => char.toUpperCase());
        break;
      default:
        return;
    }

    // Use execCommand to replace the selection.
    // This maintains the Undo/Redo stack history better than manual DOM manipulation.
    document.execCommand('insertText', false, newText);

    // Sync the state with the new HTML
    if (this.documentCanvas) {
      this.onCanvasChange(this.documentCanvas.nativeElement.innerHTML);
    }
  }

  // =====================================================
  // SIGNALS
  // =====================================================

  selectedCharts = signal<ReportChart[]>([]);

  selectedMonth = signal<ReportMonth>(ReportMonth.MAY);

  selectedYear = signal<number>(2026);

  reportContent = signal<string>('');

  observations = signal<
    Array<{
      id?: number;
      period: string;
      year: number;
      content: string;
      timestamp: string;
    }>
  >([]);

  loadingObservations = signal<boolean>(false);

  submittingReport = signal<boolean>(false);

  statusMessage = signal<string>('');

  months = Object.values(ReportMonth);

  years = [2024, 2025, 2026, 2027];

  // NEW: Signal to track Fullscreen/Focus Mode
  isFullscreen = signal<boolean>(false);

  // =====================================================
  // VIEW-MODE SIGNALS
  // =====================================================

  /** When true the canvas is rendering a previously saved report (read-only). */
  viewingReport = signal<boolean>(false);

  /** True while the saved report is being fetched from the backend. */
  loadingReport = signal<boolean>(false);

  /** True when the request came back empty / errored — drives the empty-state UI. */
  reportNotFound = signal<boolean>(false);

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadObservations();
    this.loadSavedReports();

    // LOAD CHARTS FROM REPORT BUILDER SERVICE
    this.selectedCharts.set(
      this.reportBuilderService.getCharts()
    );
  }

  // =====================================================
  // SAVED REPORTS TABLE
  // =====================================================

  savedReportsExpanded = signal<boolean>(false);

  savedReports = signal<KpiReportWriteUp[]>([]);

  loadingSavedReports = signal<boolean>(false);

  deletingReportId = signal<number | null>(null);

  currentReportsPage = signal<number>(1);

  get paginatedSavedReports(): KpiReportWriteUp[] {
    const start = (this.currentReportsPage() - 1) * this.reportsPerPage;
    const end = start + this.reportsPerPage;
    return this.savedReports().slice(start, end);
  }

  get totalReportsPages(): number {
    return Math.max(
      1,
      Math.ceil(this.savedReports().length / this.reportsPerPage)
    );
  }

  toggleSavedReportsSection(): void {
    this.savedReportsExpanded.update((expanded) => !expanded);

    if (this.savedReportsExpanded() && this.savedReports().length === 0) {
      this.loadSavedReports();
    }
  }

  loadSavedReports(): void {
    this.loadingSavedReports.set(true);

    this.kpiService.getReports().subscribe({
      next: (reports) => {
        const sortedReports = [...(reports || [])].sort((a, b) => {
          const aTime = new Date(a.timestamp).getTime();
          const bTime = new Date(b.timestamp).getTime();
          return bTime - aTime;
        });

        this.savedReports.set(sortedReports);

        if (this.currentReportsPage() > this.totalReportsPages) {
          this.currentReportsPage.set(this.totalReportsPages);
        }

        this.loadingSavedReports.set(false);
      },
      error: (error) => {
        console.error('Failed to load saved reports', error);
        this.loadingSavedReports.set(false);
      }
    });
  }

  goToReportsPage(page: number): void {
    if (page < 1 || page > this.totalReportsPages) return;
    this.currentReportsPage.set(page);
  }

  openReportFromTable(report: KpiReportWriteUp): void {
    this.selectedMonth.set(report.reportMonth);
    this.selectedYear.set(report.reportYear);
    this.loadReport(report.reportMonth, report.reportYear);
  }

  getReportPreview(content: string, maxLength: number = 80): string {
    const textOnly = (content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!textOnly) {
      return 'No content preview available.';
    }

    if (textOnly.length <= maxLength) {
      return textOnly;
    }

    return `${textOnly.slice(0, maxLength)}...`;
  }

  deleteSavedReport(report: KpiReportWriteUp): void {
    if (!report.id) {
      this.statusMessage.set('Unable to delete report: invalid report id.');
      return;
    }

    const confirmed = window.confirm(
      `Delete saved report for ${report.reportMonth} ${report.reportYear}? This action cannot be undone.`
    );

    if (!confirmed) return;

    this.deletingReportId.set(report.id);

    this.kpiService.deleteReport(report.id).subscribe({
      next: () => {
        this.statusMessage.set(
          `Deleted report for ${report.reportMonth} ${report.reportYear}.`
        );

        if (
          this.viewingReport() &&
          this.selectedMonth() === report.reportMonth &&
          this.selectedYear() === report.reportYear
        ) {
          this.exitViewMode();
        }

        this.loadSavedReports();
        this.deletingReportId.set(null);
      },
      error: (error) => {
        console.error('Failed to delete report', error);
        this.statusMessage.set('Failed to delete report.');
        this.deletingReportId.set(null);
      }
    });
  }

  // =====================================================
  // LOAD OBSERVATIONS
  // =====================================================

  loadObservations(): void {
    this.loadingObservations.set(true);
    this.statusMessage.set('');

    this.kpiService
      .getDashboardObservations(
        this.selectedMonth(),
        this.selectedYear()
      )
      .subscribe({
        next: (response) => {
          this.observations.set(response || []);
          this.loadingObservations.set(false);
        },
        error: (error) => {
          console.error(
            'Failed to load dashboard observations',
            error
          );
          this.statusMessage.set(
            'Unable to load observations.'
          );
          this.loadingObservations.set(false);
        }
      });
  }

  // =====================================================
  // REMOVE CHART
  // =====================================================

  removeChart(index: number): void {
    this.reportBuilderService.removeChart(index);
    this.selectedCharts.set(
      this.reportBuilderService.getCharts()
    );
  }

  // =====================================================
  // CLEAR CHARTS
  // =====================================================

  clearCharts(): void {
    this.reportBuilderService.clearCharts();
    this.selectedCharts.set([]);
  }

  // =====================================================
  // RICH TEXT WORKSPACE ENGINE METHODS
  // =====================================================

  /**
   * Tracks character inputs and inner HTML structures built inside the document workspace.
   */
  onCanvasChange(rawHtml: string): void {
    // Ignore change events while in view mode — content is read-only.
    if (this.viewingReport()) return;
    this.reportContent.set(rawHtml);
  }

  /**
   * Checks whether the document canvas contains valid textual logs or image asset vectors.
   */
  isCanvasHasText(): boolean {
    if (!this.documentCanvas) return false;
    const plainText = this.documentCanvas.nativeElement.innerText || '';
    return plainText.trim().length > 0 || this.reportContent().includes('<img');
  }

  /**
   * Maps traditional text styling macros onto the active editable canvas zone.
   */
  execCommand(command: string, value: string = ''): void {
    // Block formatting commands while the canvas is in read-only view mode.
    if (this.viewingReport()) return;
    document.execCommand(command, false, value);
    if (this.documentCanvas) {
      this.onCanvasChange(this.documentCanvas.nativeElement.innerHTML);
    }
  }

  /**
   * NEW: Toggles Fullscreen mode for the writing canvas
   */
  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
  }

  /**
   * Inserts an active dashboard chart image block directly where the user's cursor is resting.
   */
  insertChartInline(chart: ReportChart): void {
    // Disable chart injection while viewing a saved report
    if (this.viewingReport()) return;
    if (!this.documentCanvas) return;

    // Shift window focus context back to document frame if lost
    this.documentCanvas.nativeElement.focus();

    // Create a self-contained figure wrapper block matching professional report layouts
    const figureBlock = document.createElement('div');
    figureBlock.className = 'my-6 p-4 rounded-2xl border border-slate-800 bg-slate-950/60 max-w-2xl mx-auto';
    figureBlock.setAttribute('contenteditable', 'false'); // Protect the primary image from accidental distortion

    const imgElement = document.createElement('img');
    imgElement.src = chart.imageBase64;
    imgElement.alt = chart.title;
    imgElement.className = 'w-full rounded-xl object-contain border border-slate-800 shadow-md';

    const captionElement = document.createElement('p');
    captionElement.className = 'text-center text-xs font-bold tracking-wide text-slate-400 uppercase mt-3';
    captionElement.innerText = `Figure: ${chart.title} (${chart.chartType})`;

    // Append node children inside container
    figureBlock.appendChild(imgElement);
    figureBlock.appendChild(captionElement);

    // Create a following blank paragraph container so text navigation remains fluid below the image
    const trailingParagraph = document.createElement('p');
    trailingParagraph.innerHTML = '&#8203;'; // Hidden zero-width white space anchor

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Verify selection range is structurally nested inside the document canvas
      if (this.documentCanvas.nativeElement.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(trailingParagraph);
        range.insertNode(figureBlock);

        // Advance cursor position past the newly added element array block cleanly
        range.setStartAfter(trailingParagraph);
        range.setEndAfter(trailingParagraph);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback boundary handling
        this.documentCanvas.nativeElement.appendChild(figureBlock);
        this.documentCanvas.nativeElement.appendChild(trailingParagraph);
      }
    } else {
      // Append directly if DOM Selection scope has dropped out completely
      this.documentCanvas.nativeElement.appendChild(figureBlock);
      this.documentCanvas.nativeElement.appendChild(trailingParagraph);
    }

    // Sync state payload with updated structure
    this.onCanvasChange(this.documentCanvas.nativeElement.innerHTML);
  }

  // =====================================================
  // SUBMIT REPORT
  // =====================================================

  submitReport(): void {

    // Submission is disabled in view mode — guard regardless.
    if (this.viewingReport()) return;

    const content = this.reportContent().trim();

    if (!this.isCanvasHasText() || !content) {

      this.statusMessage.set(
        'Please write your report before generating.'
      );

      return;
    }

    this.submittingReport.set(true);

    this.statusMessage.set('');

    this.kpiService
      .submitKpiReport(
        this.selectedMonth(),
        this.selectedYear(),
        content
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Report saved successfully',
            response
          );

          this.statusMessage.set(
            'Report saved successfully.'
          );

          this.submittingReport.set(false);

          if (this.documentCanvas) {
            this.documentCanvas.nativeElement.innerHTML = '';
          }

          this.reportContent.set('');

          this.loadObservations();
        },

        error: (error) => {

          console.error(
            'Failed to save report',
            error
          );

          this.statusMessage.set(
            'Failed to save report.'
          );

          this.submittingReport.set(false);
        }
      });
  }

}
