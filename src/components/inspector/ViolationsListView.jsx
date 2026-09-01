import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { AlertTriangle, Filter, Search, ShieldAlert, Sparkles, Plus } from 'lucide-react';
import ReportViolationModal from './ReportViolationModal';

export default function ViolationsListView() {
  const { violations, mines } = useData();
  const { currentUser } = useAuth();
  const isSingleMineUser = currentUser?.role === 'INSPECTOR' || currentUser?.role === 'OFFICER';
  const assignedMineId = currentUser?.mineId || 'MINE-01';

  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMine, setFilterMine] = useState(isSingleMineUser ? assignedMineId : 'ALL');
  const [filterZone, setFilterZone] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  const filteredViolations = violations.filter(v => {
    if (filterSeverity !== 'ALL' && v.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    if (filterMine !== 'ALL' && v.mineId !== filterMine) return false;
    if (filterZone !== 'ALL' && !v.area?.toLowerCase().includes(filterZone.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return v.violationId.toLowerCase().includes(q) ||
             v.description.toLowerCase().includes(q) ||
             (v.workerName && v.workerName.toLowerCase().includes(q)) ||
             v.category.toLowerCase().includes(q);
    }
    return true;
  });

  const assignedMineName = mines.find(m => m.mineId === assignedMineId)?.mineName || currentUser?.mineName || 'Demo Mine Alpha';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>Mine Compliance Violations & Defect Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete database of reported non-compliances, AI risk rankings, and remediation progress
          </p>
        </div>

        {currentUser?.role === 'INSPECTOR' && (
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-600/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Violation</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-coal-900 border border-slate-800 p-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Mine Scope Indicator / Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Mine Unit</label>
          {isSingleMineUser ? (
            <div className="px-2.5 py-1.5 bg-coal-950 border border-amber-500/40 rounded-lg text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <span>🔒 {assignedMineName} ({assignedMineId})</span>
            </div>
          ) : (
            <select
              value={filterMine}
              onChange={(e) => setFilterMine(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Mines ({mines.length} Units)</option>
              {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.mineName}</option>)}
            </select>
          )}
        </div>

        {/* Operational Zone Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter Operational Zone</label>
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          >
            <option value="ALL">All Operational Zones</option>
            <option value="North Shaft">Z-01: North Shaft</option>
            <option value="South Shaft">Z-02: South Shaft</option>
            <option value="Processing Plant">Z-03: Processing Plant</option>
            <option value="Substation Zone 3">Z-04: Substation Zone 3</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter Severity</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="ACTION IN PROGRESS">ACTION IN PROGRESS</option>
            <option value="VERIFICATION REQUIRED">VERIFICATION REQUIRED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search Keywords</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worker, ID, hazard..."
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Violations List Cards */}
      <div className="space-y-3.5">
        {filteredViolations.length === 0 ? (
          <div className="p-10 text-center text-slate-400 bg-coal-900 border border-slate-800 rounded-xl text-xs space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
            <p className="font-bold text-white text-sm">No Violations Found</p>
            <p className="text-slate-400">No reported compliance violations match the selected mine or severity filter.</p>
          </div>
        ) : (
          filteredViolations.map((v) => (
            <div 
              key={v.violationId} 
              className={`bg-coal-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all shadow-lg space-y-3 ${
                v.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500' : v.severity === 'HIGH' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-blue-500'
              }`}
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-white bg-coal-950 px-2.5 py-1 rounded border border-slate-800">{v.violationId}</span>
                  <span className="text-xs text-slate-300 font-semibold">{v.mineName} — {v.area}</span>
                  <Badge size="sm">{v.severity}</Badge>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <Badge size="sm">{v.status}</Badge>
                  <span className="text-[11px] text-slate-400">{formatDate(v.date)}</span>
                </div>
              </div>

              {/* Body & Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="md:col-span-2 space-y-2">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">{v.category}</p>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">{v.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    {v.workerName && (
                      <span className="bg-coal-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        👤 Linked Worker: <strong className="text-white">{v.workerName} ({v.workerId})</strong>
                      </span>
                    )}
                    <span>
                      Reported by: <strong className="text-slate-300">{v.reportedBy}</strong>
                    </span>
                  </div>
                </div>

                {/* AI Risk Meter Column */}
                <div className="p-3 bg-coal-950 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Risk Score:
                    </span>
                    <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      {v.riskScore || 85}/100 ({v.riskLevel || v.severity})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">
                    {v.aiExplanation || 'High risk statutory compliance defect requiring priority remediation.'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ReportViolationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
