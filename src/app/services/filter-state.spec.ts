import { TestBed } from '@angular/core/testing';

import { FilterState } from './filter-state';

describe('FilterState', () => {
  let service: FilterState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
