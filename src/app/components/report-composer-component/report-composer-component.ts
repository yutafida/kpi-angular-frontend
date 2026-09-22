import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  AfterViewInit,
  signal,
  effect
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { KpiService, ReportQuarter } from '../../services/kpi-service';
import { ReportMonth } from '../../shared/report-month';
import { ReportChart } from '../../models/report-chart';
import { ReportBuilderService } from '../../services/report-builder-service';
import { FilterStateService } from '../../services/filter-state';
import { AirComponentMonthlyScore } from '../../models/air-component-monthly-score';

export type WriteUpMode =
  | 'GENERAL_MONTHLY'
  | 'GENERAL_QUARTERLY'
  | 'AIR_COMPONENT_MONTHLY'
  | 'AIR_COMPONENT_QUARTERLY';

@Component({
  selector: 'app-report-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-composer-component.html',
  styleUrl: './report-composer-component.css',
})
export class ReportComposerComponent implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('documentCanvas') documentCanvas!: ElementRef<HTMLDivElement>;

  // Inputs to make the component context-aware
  @Input() aiGeneratedContent: string | null = null;
  @Input() mode: WriteUpMode = 'GENERAL_MONTHLY';
  @Input() airComponentId: number | null = null;
  @Input() monthlyScore: AirComponentMonthlyScore | null = null;
  
  // Output to notify parent when a report is saved
  @Output() reportSaved = new EventEmitter<void>();

  private kpiService = inject(KpiService);
  public reportBuilderService = inject(ReportBuilderService); // Public for HTML access
  private filterState = inject(FilterStateService);

  // Read shared filter state
  selectedMonth = this.filterState.selectedMonth;
  selectedQuarter = this.filterState.selectedQuarter;
  selectedYear = this.filterState.selectedYear;
  filterType = this.filterState.filterType;

  // Local UI State
  selectedCharts = signal<ReportChart[]>([]);
  reportContent = signal<string>('');
  submittingReport = signal<boolean>(false);
  statusMessage = signal<string>('');
  isFullscreen = signal<boolean>(false);

  // AI State
  aiPrompt = signal<string>('');
  isGeneratingAi = signal<boolean>(false);

  constructor() {
    // Listen for filter changes to seamlessly clear the canvas
    effect(() => {
      const month = this.selectedMonth();
      const quarter = this.selectedQuarter();
      const year = this.selectedYear();
      const type = this.filterType();

      // Clear the composer state when filters change
      this.reportContent.set('');
      this.aiPrompt.set('');
      this.statusMessage.set('');

      // Clear the DOM canvas if it exists
      if (this.documentCanvas?.nativeElement) {
        this.documentCanvas.nativeElement.innerHTML = '';
      }
    });
  }

  // Computed helpers
  get isAirComponentMode(): boolean {
    return this.mode === 'AIR_COMPONENT_MONTHLY' || this.mode === 'AIR_COMPONENT_QUARTERLY';
  }

  ngOnInit(): void {
    this.selectedCharts.set(this.reportBuilderService.getCharts());
  }

  // =====================================================
  // CHARTS
  // =====================================================

  removeChart(index: number): void {
    this.reportBuilderService.removeChart(index);
    this.selectedCharts.set(this.reportBuilderService.getCharts());
  }

  clearCharts(): void {
    this.reportBuilderService.clearCharts();
    this.selectedCharts.set([]);
  }

  // =====================================================
  // RICH TEXT WORKSPACE ENGINE
  // =====================================================

  onCanvasChange(rawHtml: string): void {
    this.reportContent.set(rawHtml);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aiGeneratedContent'] && this.aiGeneratedContent) {
      this.populateAiGeneratedContent(this.aiGeneratedContent);
    }
  }

  ngAfterViewInit(): void {
    if (this.aiGeneratedContent) {
      this.populateAiGeneratedContent(this.aiGeneratedContent);
    }
  }

  private populateAiGeneratedContent(content: string): void {
    this.reportContent.set(content);
    if (this.documentCanvas) {
      this.documentCanvas.nativeElement.innerHTML = content;
    }
  }

  isCanvasHasText(): boolean {
    if (!this.documentCanvas) return false;
    const plainText = this.documentCanvas.nativeElement.innerText || '';
    return plainText.trim().length > 0 || this.reportContent().includes('<img');
  }

  execCommand(command: string, value: string = ''): void {
    document.execCommand(command, false, value);
    if (this.documentCanvas) {
      this.onCanvasChange(this.documentCanvas.nativeElement.innerHTML);
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(v => !v);
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      document.execCommand('insertText', false, '        ');
      if (this.documentCanvas) {
        this.onCanvasChange(this.documentCanvas.nativeElement.innerHTML);
      }
    }
  }

  transformText(type: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const originalText = range.toString();
    if (!originalText) return;

    let newText = '';
    switch (type) {
      case 'uppercase': newText = originalText.toUpperCase(); break;
      case 'lowercase': newText = originalText.toLowerCase(); break;
      case 'capitalize': newText = originalText.replace(/\b\w/g, (char) => char.toUpperCase()); break;
      default: return;
    }

    document.execCommand('insertText', false, newText);
    if (this.documentCanvas) {
      this.onCanvasChange(this.documentCanvas.nativeElement.innerHTML);
    }
  }

  insertChartInline(chart: ReportChart): void {
    if (!this.documentCanvas) return;
    this.documentCanvas.nativeElement.focus();

    const figureBlock = document.createElement('div');
    figureBlock.className = 'my-6 p-4 rounded-2xl border border-slate-800 bg-slate-950/60 max-w-2xl mx-auto';
    figureBlock.setAttribute('contenteditable', 'false');

    const imgElement = document.createElement('img');
    imgElement.src = chart.imageBase64;
    imgElement.alt = chart.title;
    imgElement.className = 'w-full rounded-xl object-contain border border-slate-800 shadow-md';

    const captionElement = document.createElement('p');
    captionElement.className = 'text-center text-xs font-bold tracking-wide text-slate-400 uppercase mt-3';
    captionElement.innerText = `Figure: ${chart.title} (${chart.chartType})`;

    figureBlock.appendChild(imgElement);
    figureBlock.appendChild(captionElement);

    const trailingParagraph = document.createElement('p');
    trailingParagraph.innerHTML = '&#8203;';

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (this.documentCanvas.nativeElement.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(trailingParagraph);
        range.insertNode(figureBlock);
        range.setStartAfter(trailingParagraph);
        range.setEndAfter(trailingParagraph);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        this.documentCanvas.nativeElement.appendChild(figureBlock);
        this.documentCanvas.nativeElement.appendChild(trailingParagraph);
      }
    } else {
      this.documentCanvas.nativeElement.appendChild(figureBlock);
      this.documentCanvas.nativeElement.appendChild(trailingParagraph);
    }

    this.onCanvasChange(this.documentCanvas.nativeElement.innerHTML);
  }

  // =====================================================
  // AI GENERATION
  // =====================================================

  generateAiReport(): void {
    const promptText = this.aiPrompt().trim();
    if (!promptText) {
      this.statusMessage.set('Please enter a prompt for the AI assistant.');
      return;
    }

    if (this.isAirComponentMode && !this.monthlyScore) {
      this.statusMessage.set('Error: Air Component score data is missing for AI context.');
      return;
    }

    this.isGeneratingAi.set(true);
    this.statusMessage.set('Generating AI draft... Please wait.');

    const currentMode = this.mode;
    let request$!: Observable<any>;

    if (this.isAirComponentMode) {
      request$ = this.kpiService.generateAiWriteUp(promptText, currentMode, this.monthlyScore);
    } else {
      request$ = this.kpiService.generateGeneralAiWriteUp(
        promptText, 
        currentMode, 
        this.selectedMonth() as ReportMonth | null, 
        this.selectedQuarter() as ReportQuarter | null, 
        this.selectedYear()
      );
    }

    request$.subscribe({
      next: (response: any) => {
        const aiContent = response.content || response.writeUp || response; 
        this.populateAiGeneratedContent(aiContent);
        this.isGeneratingAi.set(false);
        this.statusMessage.set('AI draft loaded. Review and edit before saving.');
      },
      error: (error) => {
        console.error('AI generation failed', error);
        this.statusMessage.set('Failed to generate AI draft.');
        this.isGeneratingAi.set(false);
      }
    });
  }

  // =====================================================
  // SUBMIT REPORT
  // =====================================================

  submitReport(): void {
    if (this.isAirComponentMode && this.airComponentId == null) {
      this.statusMessage.set('Error: Air Component ID is missing.');
      return;
    }

    const content = this.reportContent().trim();
    if (!this.isCanvasHasText() || !content) {
      this.statusMessage.set('Please write your report before generating.');
      return;
    }

    this.submittingReport.set(true);
    this.statusMessage.set('');

    const year = this.selectedYear();
    const currentMode = this.mode;
    const componentId = this.airComponentId;

    let request$!: Observable<any>;

    if (currentMode === 'GENERAL_MONTHLY') {
      request$ = this.kpiService.submitGeneralMonthlyReport(this.selectedMonth() as ReportMonth, year, content);
    } else if (currentMode === 'GENERAL_QUARTERLY') {
      request$ = this.kpiService.submitGeneralQuarterlyReport(this.selectedQuarter() as ReportQuarter, year, content);
    } else if (currentMode === 'AIR_COMPONENT_MONTHLY') {
      request$ = this.kpiService.submitAirComponentMonthlyReport(componentId as number, this.selectedMonth() as ReportMonth, year, content);
    } else {
      request$ = this.kpiService.submitAirComponentQuarterlyReport(componentId as number, this.selectedQuarter() as ReportQuarter, year, content);
    }

    request$.subscribe({
      next: () => {
        this.statusMessage.set('Report saved successfully.');
        this.submittingReport.set(false);
        
        if (this.documentCanvas) {
          this.documentCanvas.nativeElement.innerHTML = '';
        }
        this.reportContent.set('');
        
        // Notify parent component so it can refresh tables or switch views
        this.reportSaved.emit();
      },
      error: (error) => {
        console.error('Failed to save report', error);
        this.statusMessage.set('Failed to save report.');
        this.submittingReport.set(false);
      }
    });
  }
}