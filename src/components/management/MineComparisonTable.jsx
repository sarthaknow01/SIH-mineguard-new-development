import React from 'react';
import Badge from '../common/Badge';
import { Layers, ArrowRight } from 'lucide-react';

export default function MineComparisonTable({ mines, onSelectMine }) {
  return (
    <div className="bg-coal-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Fictional Demonstration Mines Benchmark (5 Mines)</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-coal-950 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-3.5">Mine Name & ID</th>
              <th className="p-3.5">Coalfield Location</th>
              <th className="p-3.5">Compliance Score</th>
              <th className="p-3.5">Risk Rating</th>
              <th className="p-3.5">Active Violations</th>
              <th className="p-3.5">Safety Officer</th>
              <th className="p-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {mines.map((m) => (
              <tr key={m.mineId} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5">
                  <p className="font-bold text-white text-xs">{m.mineName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{m.mineId} • {m.type}</p>
                </td>
                <td className="p-3.5 text-slate-300">
                  {m.location}
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-extrabold text-sm ${m.complianceScore >= 80 ? 'text-emerald-400' : m.complianceScore >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {m.complianceScore}%
                    </span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.complianceScore >= 80 ? 'bg-emerald-500' : m.complianceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${m.complianceScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <Badge size="sm">{m.riskLevel}</Badge>
                </td>
                <td className="p-3.5">
                  <span className={`font-mono font-bold ${m.activeViolations > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {m.activeViolations} Active
                  </span>
                </td>
                <td className="p-3.5 text-slate-400 text-[11px]">
                  {m.officer?.split('(')[0]}
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => onSelectMine(m)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 ml-auto"
                  >
                    <span>Audit</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
