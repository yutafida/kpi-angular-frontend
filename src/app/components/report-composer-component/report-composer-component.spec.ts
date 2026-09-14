import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportComposerComponent } from './report-composer-component';

describe('ReportComposerComponent', () => {
  let component: ReportComposerComponent;
  let fixture: ComponentFixture<ReportComposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportComposerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportComposerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
