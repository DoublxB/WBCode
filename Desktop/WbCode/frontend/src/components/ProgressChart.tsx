import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type ProgressChartProps = {
  labels: string[];
  values: number[];
};

const ProgressChart = ({ labels, values }: ProgressChartProps) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
    <Line
      data={{
        labels,
        datasets: [
          {
            label: 'XP',
            data: values,
            fill: true,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168,85,247,0.15)',
            tension: 0.4
          }
        ]
      }}
      options={{
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } }
        }
      }}
    />
  </div>
);

export default ProgressChart;



