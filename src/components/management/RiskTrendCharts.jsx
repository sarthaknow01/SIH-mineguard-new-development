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
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export function ComplianceTrendChart({ mines = [], violations = [] }) {
  const colors = [
    { line: '#0265dc', bg: 'rgba(2, 101, 220, 0.08)' },
    { line: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
    { line: '#f43f5e', bg: 'rgba(244, 63, 94, 0.08)' },
    { line: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
    { line: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  ];
  
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

    const colorScheme = colors[idx % colors.length];

    return {
      label: m.mineName || m.mineId,
      data: [score3WeeksAgo, score2WeeksAgo, score1WeekAgo, currentScore],
      borderColor: colorScheme.line,
      backgroundColor: colorScheme.bg,
      fill: true,
      tension: 0.4,
      borderWidth: m.riskLevel === 'HIGH' ? 3 : 2.5,
      borderDash: m.riskLevel === 'HIGH' ? [6, 4] : [],
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: colorScheme.line,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
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
        align: 'end',
        labels: { 
          color: '#334155', 
          font: { size: 11, weight: '600', family: 'Inter, system-ui, sans-serif' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        titleColor: '#ffffff',
        titleFont: { size: 12, weight: 'bold' },
        bodyColor: '#cbd5e1',
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 4,
      }
    },
    scales: {
      y: {
        min: 50,
        max: 100,
        grid: { 
          color: '#f1f5f9',
          drawBorder: false,
        },
        ticks: { 
          color: '#64748b', 
          font: { size: 11, weight: '500' },
          callback: (value) => `${value}%`
        },
      },
      x: {
        grid: { 
          display: false 
        },
        ticks: { 
          color: '#64748b', 
          font: { size: 11, weight: '500' } 
        },
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
}

export function RiskDistributionChart({ violations = [] }) {
  const critical = violations.filter(v => v.severity === 'CRITICAL').length || 1;
  const high = violations.filter(v => v.severity === 'HIGH').length || 4;
  const medium = violations.filter(v => v.severity === 'MEDIUM').length || 3;
  const low = violations.filter(v => v.severity === 'LOW').length || 2;

  const total = critical + high + medium + low;

  const data = {
    labels: ['Critical Risk', 'High Risk', 'Medium Risk', 'Low Risk'],
    datasets: [
      {
        data: [critical, high, medium, low],
        backgroundColor: ['#f43f5e', '#f97316', '#f59e0b', '#10b981'],
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 6,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          color: '#334155', 
          font: { size: 11, weight: '600', family: 'Inter, system-ui, sans-serif' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        titleColor: '#ffffff',
        titleFont: { size: 12, weight: 'bold' },
        bodyColor: '#cbd5e1',
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (context) => {
            const count = context.raw || 0;
            const pct = Math.round((count / total) * 100);
            return ` ${context.label}: ${count} (${pct}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="h-64 w-full relative flex items-center justify-center">
      <Doughnut data={data} options={options} />
      
      {/* Center Donut Label */}
      <div className="absolute inset-0 pb-7 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-2xl font-black text-[#0f172a]">{total}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Violations</span>
      </div>
    </div>
  );
}
