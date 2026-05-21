import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReadinessChartComponent } from './readiness-chart-component';

describe('ReadinessChartComponent', () => {
  let component: ReadinessChartComponent;
  let fixture: ComponentFixture<ReadinessChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadinessChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadinessChartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
