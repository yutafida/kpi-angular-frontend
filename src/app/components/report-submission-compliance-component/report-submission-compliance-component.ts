import {
  Component,
  inject,
  signal,
  computed
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


import { KpiService } from '../../services/kpi-service';

import { ReportSubmissionLog } from '../../models/report-submission-log';

@Component({
  selector:
    'app-report-submission-compliance-component',

  standalone: true,

  imports: [
    FormsModule,
    CommonModule, RouterModule
  ],

  templateUrl:
    './report-submission-compliance-component.html',

  styleUrl:
    './report-submission-compliance-component.css',
})
export class ReportSubmissionComplianceComponent {

  private kpiService =
    inject(KpiService);

  logs =
    signal<ReportSubmissionLog[]>([]);

  loading =
    signal(false);

  selectedDate =
    signal('');

  selectedStatus =
    signal('');

  selectedAirComponentId =
    signal<number | null>(null);

  selectedComponent =
    signal<any | null>(null);

  groupedLogs = computed(() => {

    const grouped =
      this.logs().reduce((acc, log) => {

        const name =
          log.airComponentName;

        if (!acc[name]) {

          acc[name] = {
            airComponentName: name,
            logs: []
          };
        }

        acc[name].logs.push(log);

        return acc;

      }, {} as Record<string, any>);

    return Object.values(grouped);
  });

  ngOnInit(): void {

    this.loadLogs();
  }

  loadLogs(): void {

    this.loading.set(true);

    this.selectedComponent.set(null);

    this.kpiService
      .getReportSubmissionLogs(

        this.selectedAirComponentId()
          ?? undefined,

        this.selectedStatus()
          ? this.selectedStatus()
          : undefined,

        this.selectedDate()
          ? this.selectedDate()
          : undefined
      )

      .subscribe({

        next: (response) => {

          this.logs.set(response);

          this.loading.set(false);
        },

        error: (error) => {

          console.error(
            'Failed to load logs',
            error
          );

          this.loading.set(false);
        }
      });
  }

  openComponent(
    component: any
  ): void {

    this.selectedComponent.set(
      component
    );
  }

  closeComponent(): void {

    this.selectedComponent.set(
      null
    );
  }

  getStatusCount(
    logs: ReportSubmissionLog[],
    status: string
  ): number {

    return logs.filter(
      log => log.status === status
    ).length;
  }

  filterPending(): void {

    this.selectedStatus.set(
      'PENDING'
    );

    this.loadLogs();
  }

  filterSubmitted(): void {

    this.selectedStatus.set(
      'SUBMITTED'
    );

    this.loadLogs();
  }

  clearFilters(): void {

    this.selectedDate.set('');

    this.selectedStatus.set('');

    this.selectedAirComponentId.set(
      null
    );

    this.loadLogs();
  }

  updateDate(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement)
        .value;

    this.selectedDate.set(value);
  }

  updateStatus(
    event: Event
  ): void {

    const value =
      (event.target as HTMLSelectElement)
        .value;

    this.selectedStatus.set(value);
  }

  updateAirComponent(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement)
        .value;

    this.selectedAirComponentId.set(
      value ? +value : null
    );
  }
}