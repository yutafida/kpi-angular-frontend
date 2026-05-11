import { Routes } from '@angular/router';
import { AirComponentDetailComponent } from './features/air-component-detail.component/air-component-detail.component';
import { KpiDashboard } from './components/kpi-dashboard/kpi-dashboard';



export const routes: Routes = [
    
    // { path: '', component: DashboardComponent },
    { path: '', component: KpiDashboard },
    
    { path: 'air-component/:id', component: AirComponentDetailComponent }

];
