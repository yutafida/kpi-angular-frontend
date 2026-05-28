import { Component, OnInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { KpiService } from '../../services/kpi-service';
import { ReportMonth } from '../../shared/report-month';
import { ReportChart } from '../../models/report-chart';
import { ReportBuilderService } from '../../services/report-builder-service';

@Component({
  selector: 'app-kpi-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './kpi-report.html',
  styleUrls: ['./kpi-report.css']
})
export class KpiReport implements OnInit {

  // ViewChild reference to target the interactive document canvas
  @ViewChild('documentCanvas') documentCanvas!: ElementRef<HTMLDivElement>;

  constructor(
    private kpiService: KpiService,
    public reportBuilderService: ReportBuilderService
  ) {}


    /**
   * Handles keyboard events inside the document canvas.
   * Specifically intercepts the TAB key to insert 8 spaces instead of changing focus.
   */
  handleKeyDown(event: KeyboardEvent): void {
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
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadObservations();

    // LOAD CHARTS FROM REPORT BUILDER SERVICE
    this.selectedCharts.set(
      this.reportBuilderService.getCharts()
    );
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
    const content = this.reportContent().trim();

    if (!this.isCanvasHasText() || !content) {
      this.statusMessage.set(
        'Please write your report before generating.'
      );
      return;
    }

    this.submittingReport.set(true);
    this.statusMessage.set('');

    const payload = {
      month: this.selectedMonth(),
      year: this.selectedYear(),
      content: content, // Contains complete HTML string mapping text, headings, list structures, and embedded inline figure nodes
      charts: this.selectedCharts()
    };

    // Simulated API execution pipeline container matching original scope logic
    setTimeout(() => {
      console.log('Report payload successfully prepared for review:', payload);
      this.statusMessage.set('Report generated successfully.');
      this.submittingReport.set(false);
      
      // Flush canvas layout inputs cleanly
      if (this.documentCanvas) {
        this.documentCanvas.nativeElement.innerHTML = '';
      }
      this.reportContent.set('');
      this.loadObservations();
    }, 2000);
  }
}