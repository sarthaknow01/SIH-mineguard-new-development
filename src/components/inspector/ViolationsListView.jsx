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
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMine, setFilterMine] = useState(currentUser?.role === 'OFFICER' ? (currentUser.mineId || 'MINE-01') : 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  const filteredViolations = violations.filter(v => {
    if (filterSeverity !== 'ALL' && v.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && v.status !== filterStatus) return false;
    if (filterMine !== 'ALL' && v.mineId !== filterMine) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return v.violationId.toLowerCase().includes(q) ||
             v.description.toLowerCase().includes(q) ||
             (v.workerName && v.workerName.toLowerCase().includes(q)) ||
             v.category.toLowerCase().includes(q);
    }
    return true;
  });

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

        <button
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Violation</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-coal-900 border border-slate-800 p-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter by Mine</label>
          <select
            value={filterMine}
            disabled={currentUser?.role === 'OFFICER'}
            onChange={(e) => setFilterMine(e.target.value)}
            className={`w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none ${currentUser?.role === 'OFFICER' ? 'opacity-80 cursor-not-allowed border-amber-500/40 text-amber-300 font-semibold' : ''}`}
          >
            {currentUser?.role === 'OFFICER' ? (
              <option value={currentUser.mineId || 'MINE-01'}>
                {(mines.find(m => m.mineId === currentUser?.mineId)?.mineName || currentUser?.mineName || 'Assigned Mine')} (Assigned Unit)
              </option>
            ) : (
              <>
                <option value="ALL">All Mines</option>
                {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.mineName}</option>)}
              </>
            )}
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
      <div className="space-y-3">
        {filteredViolations.length === 0 ? (
          <p className="p-8 text-center text-slate-400 bg-coal-900 border border-slate-800 rounded-xl text-xs">
            No violations match the selected filters.
          </p>
        ) : (
          filteredViolations.map((v) => (
            <div key={v.violationId} className="bg-coal-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">{v.violationId}</span>
                  <span className="text-xs text-slate-400 font-semibold">{v.mineName} — {v.area}</span>
                  <Badge size="sm">{v.severity}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge size="sm">{v.status}</Badge>
                  <span className="text-[11px] text-slate-400 font-mono">{formatDate(v.date)}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <p className="text-xs font-bold text-amber-400">{v.category}</p>
                  <p className="text-xs text-slate-200 leading-relaxed">{v.description}</p>
                  
                  {v.workerName && (
                    <p className="text-[11px] text-slate-400">
                      <strong>Linked Personnel:</strong> {v.workerName} ({v.workerId})
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400">
                    Reported by: <span className="text-slate-300 font-semibold">{v.reportedBy}</span>
                  </p>
                </div>

                {/* AI Risk Card Column */}
                <div className="p-3 bg-coal-950 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> AI Risk:
                    </span>
                    <span className="text-xs font-mono font-bold text-red-400">{v.riskScore || 75}/100</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {v.aiExplanation || 'High risk statutory certification deficiency.'}
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
