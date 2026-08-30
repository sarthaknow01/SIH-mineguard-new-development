import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Info, ArrowUpRight } from 'lucide-react';
import Badge from '../common/Badge';

export default function AIRiskCard({ score = 75, level = 'HIGH', explanation = '', reasons = [], onOpenExplainer, compact = false }) {
  let scoreColor = 'text-emerald-400';
  let barColor = 'bg-emerald-500';
  let badgeVariant = 'green';

  if (score >= 75) {
    scoreColor = 'text-red-400';
    barColor = 'bg-red-500';
    badgeVariant = 'red';
  } else if (score >= 50) {
    scoreColor = 'text-amber-400';
    barColor = 'bg-amber-500';
    badgeVariant = 'amber';
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-coal-950 border border-slate-800">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[11px] font-mono text-slate-300">AI Risk Score:</span>
        <span className={`text-xs font-bold font-mono ${scoreColor}`}>{score}/100</span>
        <Badge size="sm">{level}</Badge>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-coal-950 to-slate-900 border border-slate-800 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              AI-Assisted Risk Prioritization
            </h4>
            <p className="text-[10px] text-slate-400">Dynamic Risk Factor Calculation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className={`text-xl font-extrabold font-mono ${scoreColor}`}>{score}</span>
            <span className="text-xs text-slate-400 font-mono">/100</span>
          </div>
          <Badge size="sm">{level} RISK</Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Explanation Text */}
      {explanation && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
          <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Info className="w-3 h-3 text-blue-400" />
            AI Rationale Breakdown:
          </p>
          <p className="text-[11px] text-slate-300">{explanation}</p>
        </div>
      )}

      {reasons && reasons.length > 0 && (
        <ul className="mt-2 space-y-1">
          {reasons.map((r, i) => (
            <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
              <span className="text-amber-400 mt-0.5">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
