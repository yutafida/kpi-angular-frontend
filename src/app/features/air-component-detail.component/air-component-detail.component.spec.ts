import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AirComponentDetailComponent } from './air-component-detail.component';

describe('AirComponentDetailComponent', () => {
  let component: AirComponentDetailComponent;
  let fixture: ComponentFixture<AirComponentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirComponentDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AirComponentDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
