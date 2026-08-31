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

export function ComplianceTrendChart({ mines = [], violations = [] }) {
  const colors = ['#10b981', '#3b82f6', '#ef4444', '#a855f7', '#f59e0b'];
  
  const labels = ['3 Weeks Ago', '2 Weeks Ago', 'Last Week', 'Current Week'];

  const datasets = mines.slice(0, 5).map((m, idx) => {
    const mineVios = violations.filter(v => v.mineId === m.mineId);
    const resolvedCount = mineVios.filter(v => v.status === 'RESOLVED').length;
    const openCount = mineVios.filter(v => v.status !== 'RESOLVED').length;

    // Calculate dynamic trajectory leading up to current complianceScore
    const currentScore = m.complianceScore || 80;
    const score3WeeksAgo = Math.max(40, Math.min(98, currentScore - (resolvedCount * 2) + (openCount * 2)));
    const score2WeeksAgo = Math.max(40, Math.min(98, currentScore - (resolvedCount * 1) + (openCount * 1)));
    const score1WeekAgo = Math.max(40, Math.min(98, Math.round((score2WeeksAgo + currentScore) / 2)));

    return {
      label: m.mineName || m.mineId,
      data: [score3WeeksAgo, score2WeeksAgo, score1WeekAgo, currentScore],
      borderColor: colors[idx % colors.length],
      backgroundColor: `${colors[idx % colors.length]}33`,
      tension: 0.3,
      borderWidth: m.riskLevel === 'HIGH' ? 2.5 : 2,
      borderDash: m.riskLevel === 'HIGH' ? [5, 5] : [],
    };
  });

  const data = {
    labels,
    datasets,
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
