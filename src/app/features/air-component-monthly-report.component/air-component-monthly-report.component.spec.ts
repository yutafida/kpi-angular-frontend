import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirComponentMonthlyReportComponent } from './air-component-monthly-report.component';

describe('AirComponentMonthlyReportComponent', () => {
  let component: AirComponentMonthlyReportComponent;
  let fixture: ComponentFixture<AirComponentMonthlyReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirComponentMonthlyReportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AirComponentMonthlyReportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
