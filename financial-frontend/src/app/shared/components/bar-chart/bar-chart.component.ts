import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { TranslateService } from '@ngx-translate/core';

import { ChartSeries } from '../../models/ui.models';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './bar-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements OnChanges {
  private readonly translateService = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) labels!: ReadonlyArray<string>;
  @Input({ required: true }) series!: ReadonlyArray<ChartSeries>;

  chartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          color: '#95a0bf',
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
      tooltip: {
        backgroundColor: '#2f3a63',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#95a0bf',
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e8ecf6',
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#95a0bf',
          font: {
            size: 11,
            weight: 600,
          },
        },
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
    if (changes['labels'] || changes['series']) {
      this.syncChartData();
    }
  }

  private syncChartData(): void {
    const translatedLabels = this.labels.map((item) => this.translateService.instant(item));

    this.chartData = {
      labels: translatedLabels,
      datasets: this.series.map((item) => ({
        label: this.translateService.instant(item.nameKey),
        data: [...item.values],
        backgroundColor: this.getSeriesColor(item.color),
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 16,
        categoryPercentage: 0.72,
        barPercentage: 0.82,
      })),
    };
  }

  private getSeriesColor(color: ChartSeries['color']): string {
    switch (color) {
      case 'accent':
        return '#6ddfc7';
      case 'warning':
        return '#f2b84b';
      case 'danger':
        return '#ff7c9c';
      case 'success':
        return '#43d39e';
      case 'primary':
      default:
        return '#2f35f5';
    }
  }
}
