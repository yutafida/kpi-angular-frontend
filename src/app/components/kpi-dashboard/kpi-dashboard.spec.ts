import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiDashboard } from './kpi-dashboard';

describe('KpiDashboard', () => {
  let component: KpiDashboard;
  let fixture: ComponentFixture<KpiDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
