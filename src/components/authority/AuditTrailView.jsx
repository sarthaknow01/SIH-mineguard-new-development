import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { History, Search, Filter, ShieldCheck, User } from 'lucide-react';
import Badge from '../common/Badge';

export default function AuditTrailView() {
  const { auditTrail, mines } = useData();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterMine, setFilterMine] = useState(currentUser?.role === 'OFFICER' ? (currentUser.mineId || 'MINE-01') : 'ALL');

  const filteredLogs = auditTrail.filter(item => {
    if (currentUser?.role === 'OFFICER' && item.mineId && item.mineId !== (currentUser.mineId || 'MINE-01')) return false;
    if (filterMine !== 'ALL' && item.mineId && item.mineId !== filterMine) return false;
    if (filterRole !== 'ALL' && item.role.toUpperCase() !== filterRole) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.details.toLowerCase().includes(q) ||
             item.actor.toLowerCase().includes(q) ||
             item.action.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <span>Mine Compliance Governance Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable chronological record of inspections, violations, alerts, and corrective action handoffs
          </p>
        </div>
        <Badge size="md">{auditTrail.length} Logged Events</Badge>
      </div>

      {/* Filters */}
      <div className="bg-coal-900 border border-slate-800 p-3.5 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter by Actor Role</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="INSPECTOR">Inspector</option>
            <option value="OFFICER">Mine Officer</option>
            <option value="MANAGEMENT">Management</option>
            <option value="AUTHORITY">Regulatory Authority</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search Audit Logs</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, ticket ID..."
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-coal-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="divide-y divide-slate-800">
          {filteredLogs.map((entry) => (
            <div key={entry.auditId} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono text-purple-400 shrink-0 mt-0.5">
                <History className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{entry.actor}</span>
                    <Badge size="sm">{entry.role}</Badge>
                    <span className="text-[10px] font-mono font-bold text-amber-400">[{entry.action}]</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{entry.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{entry.details}</p>
                <p className="text-[10px] text-slate-400 font-mono">Entity ID: {entry.auditId} • Target Mine: {entry.mineId}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
