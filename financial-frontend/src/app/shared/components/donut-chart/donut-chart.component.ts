import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DonutSlice } from '../../models/ui.models';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [TranslateModule, BaseChartDirective],
  templateUrl: './donut-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutChartComponent implements OnChanges {
  private readonly translateService = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) slices!: ReadonlyArray<DonutSlice>;

  chartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

  readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#2f3a63',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      },
    },
  };

  constructor() {
    this.translateService.onLangChange.subscribe(() => {
      this.syncChartData();
      this.cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slices']) {
      this.syncChartData();
    }
  }

  trackByLabel(_index: number, item: DonutSlice): string {
    return item.labelKey;
  }

  get total(): number {
    return this.slices.reduce((sum, item) => sum + item.value, 0);
  }

  get translatedSlices(): ReadonlyArray<{ label: string; value: number; color: string }> {
    return this.slices.map((item) => ({
      label: this.translateService.instant(item.labelKey),
      value: item.value,
      color: item.color,
    }));
  }

  get gradientStyle(): string {
    if (!this.slices.length || this.total === 0) {
      return '#e8ecf6';
    }

    let current = 0;
    const segments = this.slices.map((item) => {
      const start = (current / this.total) * 360;
      current += item.value;
      const end = (current / this.total) * 360;
      return `${item.color} ${start}deg ${end}deg`;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  getPercent(value: number): string {
    if (this.total === 0) {
      return '0%';
    }

    return `${Math.round((value / this.total) * 100)}%`;
  }

  private syncChartData(): void {
    this.chartData = {
      labels: this.slices.map((item) => this.translateService.instant(item.labelKey)),
      datasets: [
        {
          data: this.slices.map((item) => item.value),
          backgroundColor: this.slices.map((item) => item.color),
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 8,
        },
      ],
    };
  }
}
