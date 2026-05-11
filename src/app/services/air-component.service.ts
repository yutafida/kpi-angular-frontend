import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AirComponent } from '../models/air-component';
import { AirComponentSummary } from '../models/air-component-summary';
import { Observable } from 'rxjs/internal/Observable';
import { inject } from '@angular/core/primitives/di';

@Injectable({ providedIn: 'root' })
export class AirComponentService {

  private apiUrl = 'http://localhost:3000';
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:4040/api/kpi';

  
  getComponentSummary(id: number): Observable<AirComponentSummary> {
    return this.http.get<AirComponentSummary>(
      `${this.baseUrl}/component/${id}/summary`
    );
  }



  private airComponents = signal<AirComponent[]>([]);
  private selectedComponent = signal<AirComponent | null>(null);

  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  readonly components = this.airComponents.asReadonly();
  readonly selected = this.selectedComponent.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly errorMsg = this.error.asReadonly();



  private compareList = signal<AirComponent[]>([]);

  readonly compare = this.compareList.asReadonly();
  readonly isCompareMode = computed(() => this.compareList().length === 2);


  readonly summary = computed(() => {
    const c = this.selectedComponent();

    return {
      title: c?.name ?? 'No Component Selected',
      theater: c?.theater ?? '-',
      status: c ? 'ACTIVE SELECTION' : 'CLICK A COMPONENT'
    };
  });

  // constructor(private http: HttpClient) {}


  loadData() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<AirComponent[]>(`${this.apiUrl}/airComponents`)
      .subscribe({
        next: (data) => {
          this.airComponents.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load air components');
          this.loading.set(false);
        }
      });
  }


  selectComponent(component: AirComponent) {
    this.selectedComponent.set(component);
  }

  clearSelection() {
    this.selectedComponent.set(null);
  }

  addToCompare(component: AirComponent) {
  const current = this.compareList();


  if (current.find(c => c.id === component.id)) return;


  if (current.length >= 2) {
    this.compareList.set([current[1], component]); // shift compare
  } else {
    this.compareList.set([...current, component]);
  }
}

clearCompare() {
  this.compareList.set([]);
}


}