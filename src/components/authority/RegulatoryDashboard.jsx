import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import { Landmark, Scale, AlertTriangle, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import MineComparisonTable from '../management/MineComparisonTable';
import MineDetailModal from '../management/MineDetailModal';
import IssueDirectiveModal from './IssueDirectiveModal';

export default function RegulatoryDashboard({ onNavigate }) {
  const { mines, violations, correctiveActions } = useData();
  const { currentUser } = useAuth();
  const [selectedMine, setSelectedMine] = useState(null);
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);

  const highRiskMines = mines.filter(m => m.complianceScore < 75);
  const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
  const nationalAvg = Math.round(mines.reduce((acc, m) => acc + m.complianceScore, 0) / mines.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Regulatory Authority — Compliance Surveillance</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
              National Oversight
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Regional Director: <strong>{currentUser?.name}</strong> • AI-Assisted Compliance Monitoring (Prototype)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDirectiveModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-600/20 flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4" />
            <span>Issue Regulatory Compliance Notice</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="National Safety Index"
          value={`${nationalAvg}%`}
          subtitle="Regulatory Benchmark Threshold"
          icon={Landmark}
          color="emerald"
        />
        <StatCard
          title="Mines Flagged High Risk"
          value={highRiskMines.length}
          subtitle="Requires Special Audit"
          icon={AlertTriangle}
          color={highRiskMines.length > 0 ? 'red' : 'emerald'}
        />
        <StatCard
          title="Critical Violations"
          value={criticalViolations.length}
          subtitle="Immediate Life Hazard"
          icon={Scale}
          color="amber"
        />
        <StatCard
          title="Total Monitored Units"
          value={mines.length}
          subtitle="Opencast & Underground"
          icon={ShieldCheck}
          color="blue"
        />
      </div>

      {/* High-Risk Spotlight Banner (Dynamically derived from lowest compliance score mine) */}
      {highRiskMines.length > 0 && (() => {
        const targetMine = [...highRiskMines].sort((a,b) => a.complianceScore - b.complianceScore)[0];
        return (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-300">
                  Statutory Warning: {targetMine.mineName} ({targetMine.mineId}) Index at {targetMine.complianceScore}%
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {targetMine.mineName} has flagged {targetMine.activeViolations || 0} active compliance breach(es) with safety compliance index at {targetMine.complianceScore}%. Dynamic statutory analysis recommends focused regulatory audit inspection.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDirectiveModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg shrink-0 transition-colors"
            >
              Issue Formal Notice
            </button>
          </div>
        );
      })()}

      {/* Mine Comparison Table */}
      <MineComparisonTable
        mines={mines}
        onSelectMine={(m) => setSelectedMine(m)}
      />

      <MineDetailModal
        isOpen={!!selectedMine}
        onClose={() => setSelectedMine(null)}
        mine={selectedMine}
      />
      <IssueDirectiveModal
        isOpen={showDirectiveModal}
        onClose={() => setShowDirectiveModal(false)}
      />
    </div>
  );
}
