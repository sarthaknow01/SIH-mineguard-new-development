import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import { Building2, Layers, AlertTriangle, ShieldCheck, Activity, FileText, ArrowRight, Download } from 'lucide-react';
import { ComplianceTrendChart, RiskDistributionChart } from './RiskTrendCharts';
import MineComparisonTable from './MineComparisonTable';
import MineDetailModal from './MineDetailModal';
import InteractiveGisMap from '../common/InteractiveGisMap';

export default function ManagementDashboard({ onNavigate }) {
  const { mines, violations, correctiveActions, certificates, workers, getOverdueActions, getMTTR, getRecurringViolations } = useData();
  const { currentUser } = useAuth();
  const [selectedMine, setSelectedMine] = useState(null);

  const avgCompliance = mines.length > 0 ? Math.round(mines.reduce((acc, m) => acc + m.complianceScore, 0) / mines.length) : 80;
  const totalOpenViolations = violations.filter(v => v.status !== 'RESOLVED').length;
  const highRiskMines = mines.filter(m => m.riskLevel === 'HIGH' || m.complianceScore < 70);
  const resolvedCount = violations.filter(v => v.status === 'RESOLVED').length;

  const overdueActions = getOverdueActions ? getOverdueActions() : [];
  const mttrInfo = getMTTR ? getMTTR() : { avgDays: 2.5 };
  const recurringList = getRecurringViolations ? getRecurringViolations() : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Corporate Mining Safety & Governance Executive Board</span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono">
              HQ Dashboard
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Executive Director: <strong>{currentUser?.name}</strong> • Multi-Mine Compliance Oversight
          </p>
        </div>

        <button
          onClick={() => onNavigate('compliance-reports')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>Export Compliance Scorecard</span>
        </button>
      </div>

      {/* 4 Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Org Compliance"
          value={`${avgCompliance}%`}
          subtitle="Average Across Monitored Mines"
          icon={Building2}
          color="emerald"
        />
        <StatCard
          title="Monitored Mines"
          value={mines.length}
          subtitle={`${highRiskMines.length} Classified High Risk`}
          icon={Layers}
          color={highRiskMines.length > 0 ? 'amber' : 'blue'}
        />
        <StatCard
          title="Open Compliance Breaches"
          value={totalOpenViolations}
          subtitle={`${overdueActions.length} Overdue CAPA Items`}
          icon={AlertTriangle}
          color={overdueActions.length > 0 ? 'red' : 'amber'}
        />
        <StatCard
          title="Resolved Safety Tickets"
          value={resolvedCount}
          subtitle={`MTTR: ~${mttrInfo.avgDays} Days`}
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Recurring Failure & Overdue CAPA Banner */}
      {(overdueActions.length > 0 || recurringList.length > 0) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">Statutory Remediation & Recurrence Alert</p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                {overdueActions.length} Overdue CAPA item(s) pending verification • {recurringList.length} Recurring safety hazard area(s) detected across operational sectors.
              </p>
            </div>
          </div>
          <Badge size="sm">{overdueActions.length} Overdue Actions</Badge>
        </div>
      )}

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-coal-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>4-Week Compliance Score Trajectory by Mine</span>
          </h3>
          <ComplianceTrendChart mines={mines} violations={violations} />
        </div>

        <div className="bg-coal-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Violation Severity Breakdown</span>
          </h3>
          <RiskDistributionChart violations={violations} />
        </div>
      </div>

      {/* Interactive GIS Spatial Hazard Map */}
      <InteractiveGisMap initialMineFilter="ALL" />

      {/* Comparison Benchmark Table */}
      <MineComparisonTable
        mines={mines}
        onSelectMine={(mine) => setSelectedMine(mine)}
      />

      <MineDetailModal
        isOpen={!!selectedMine}
        onClose={() => setSelectedMine(null)}
        mine={selectedMine}
      />
    </div>
  );
}
