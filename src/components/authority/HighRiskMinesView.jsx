import React from 'react';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import { AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

export default function HighRiskMinesView({ onSelectMine }) {
  const { mines, violations } = useData();
  const highRiskList = [...mines]
    .filter(m => m.riskLevel === 'HIGH' || m.complianceScore < 75)
    .sort((a, b) => a.complianceScore - b.complianceScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>High-Risk Mines & Critical Intervention Watchlist</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mines exhibiting compliance breaches below safety compliance thresholds (Score &lt; 75%)
          </p>
        </div>
        <Badge size="md">{highRiskList.length} High-Risk Units</Badge>
      </div>

      <div className="space-y-4">
        {highRiskList.map((m) => {
          const mineViolations = violations.filter(v => v.mineId === m.mineId && v.status !== 'RESOLVED');
          return (
            <div key={m.mineId} className="bg-coal-900 border border-red-500/30 rounded-xl p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {m.mineName}
                    <Badge size="sm">CRITICAL OVERSIGHT</Badge>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{m.location} • {m.type}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-2xl font-extrabold text-red-400">{m.complianceScore}%</span>
                  <p className="text-[10px] text-slate-400">Compliance Score</p>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <p className="font-semibold text-slate-200">Active High-Consequence Violations ({mineViolations.length}):</p>
                {mineViolations.map(v => (
                  <div key={v.violationId} className="p-2.5 bg-coal-950 rounded-lg border border-slate-800 text-[11px] flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-red-400">{v.violationId}</span>: {v.description}
                    </div>
                    <Badge size="sm">{v.severity}</Badge>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => onSelectMine && onSelectMine(m)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
                >
                  <span>Open Detailed Risk Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
