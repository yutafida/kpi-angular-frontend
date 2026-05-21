import { TestBed } from '@angular/core/testing';

import { ReportBuilderService } from './report-builder-service';

describe('ReportBuilderService', () => {
  let service: ReportBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
