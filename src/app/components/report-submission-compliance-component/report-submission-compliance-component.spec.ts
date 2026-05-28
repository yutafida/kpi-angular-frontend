import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportSubmissionComplianceComponent } from './report-submission-compliance-component';

describe('ReportSubmissionComplianceComponent', () => {
  let component: ReportSubmissionComplianceComponent;
  let fixture: ComponentFixture<ReportSubmissionComplianceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportSubmissionComplianceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSubmissionComplianceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
