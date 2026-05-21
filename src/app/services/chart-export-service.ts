import { Injectable } from '@angular/core';



@Injectable({
  providedIn: 'root',
})
export class ChartExportService {

  exportChart(chartId: string): string | null {

    const canvas = document.getElementById(chartId) as HTMLCanvasElement;

    if (!canvas) {
      return null;
    }
    return canvas.toDataURL('image/png');
  
  }

}
