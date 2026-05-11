import { TestBed } from '@angular/core/testing';

import { AirComponentService } from './air-component.service';

describe('AirComponentService', () => {
  let service: AirComponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirComponentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
