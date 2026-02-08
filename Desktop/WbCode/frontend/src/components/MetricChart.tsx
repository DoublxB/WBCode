import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

type MetricSeries = {
  label: string;
  values: number[];
  color: string;
  fillColor?: string;
};

type MetricChartProps = {
  labels: string[];
  series: MetricSeries[];
};

const MetricChart = ({ labels, series }: MetricChartProps) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
    <Line
      data={{
        labels,
        datasets: series.map((s) => ({
          label: s.label,
          data: s.values,
          fill: Boolean(s.fillColor),
          borderColor: s.color,
          backgroundColor: s.fillColor ?? 'rgba(148,163,184,0.1)',
          tension: 0.35,
          pointRadius: 2
        }))
      }}
      options={{
        plugins: {
          legend: { display: series.length > 1, labels: { color: '#94a3b8' } },
          tooltip: { intersect: false, mode: 'index' }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
        }
      }}
    />
  </div>
);

export default MetricChart;
