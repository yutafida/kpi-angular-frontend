import { Injectable, signal, WritableSignal } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class FilterState {}


@Injectable({ providedIn: 'root' })
export class FilterStateService {
  
    // Shared signals for filters across components
    filterType: WritableSignal<'MONTH' | 'QUARTER'> = signal('MONTH');
    selectedMonth: WritableSignal<string> = signal('AUGUST');
    selectedQuarter: WritableSignal<string> = signal('Q3');
    selectedYear: WritableSignal<number> = signal(2026);
}
