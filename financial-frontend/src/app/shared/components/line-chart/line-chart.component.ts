import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './line-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent implements OnChanges {
  private readonly translateService = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) points!: ReadonlyArray<number>;
  @Input({ required: true }) labels!: ReadonlyArray<string>;

  chartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };

  readonly chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
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
    if (changes['points'] || changes['labels']) {
      this.syncChartData();
    }
  }

  private syncChartData(): void {
    const translatedLabels = this.labels.map((item) => this.translateService.instant(item));

    this.chartData = {
      labels: translatedLabels,
      datasets: [
        {
          data: [...this.points],
          borderColor: '#2f35f5',
          backgroundColor: 'rgba(47, 53, 245, 0.08)',
          fill: true,
          tension: 0.42,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#2f35f5',
          borderWidth: 4,
        },
      ],
    };
  }
}
