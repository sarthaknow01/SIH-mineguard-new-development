import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export function ComplianceTrendChart({ mines }) {
  const data = {
    labels: ['Week 1 (Aug 01)', 'Week 2 (Aug 08)', 'Week 3 (Aug 15)', 'Week 4 (Current)'],
    datasets: [
      {
        label: 'Mine Alpha',
        data: [78, 82, 84, 88],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.3,
        borderWidth: 2.5,
      },
      {
        label: 'Mine Beta',
        data: [75, 78, 80, 82],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
        borderWidth: 2,
      },
      {
        label: 'Mine Gamma (High Risk)',
        data: [68, 65, 63, 61],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.3,
        borderWidth: 2.5,
        borderDash: [5, 5],
      },
      {
        label: 'Mine Delta',
        data: [88, 89, 90, 91],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        tension: 0.3,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' } },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
      }
    },
    scales: {
      y: {
        min: 50,
        max: 100,
        grid: { color: '#1e293b' },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      x: {
        grid: { color: '#1e293b' },
        ticks: { color: '#64748b', font: { size: 10 } },
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
}

export function RiskDistributionChart({ violations }) {
  const critical = violations.filter(v => v.severity === 'CRITICAL').length;
  const high = violations.filter(v => v.severity === 'HIGH').length;
  const medium = violations.filter(v => v.severity === 'MEDIUM').length;
  const low = violations.filter(v => v.severity === 'LOW').length;

  const data = {
    labels: ['Critical Risk', 'High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [critical, high, medium, low],
        backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981'],
        borderColor: '#0b0f19',
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 10 } },
      },
    },
  };

  return (
    <div className="h-56 w-full flex items-center justify-center">
      <Doughnut data={data} options={options} />
    </div>
  );
}
