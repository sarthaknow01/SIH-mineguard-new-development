import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, Search, Filter, User, MapPin, Radio } from 'lucide-react';
import Badge from '../common/Badge';

export default function SOSHistoryView() {
  const { currentUser } = useAuth();
  const { sosAlerts, acknowledgeSOSAlert } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const isOfficerOrAdmin = currentUser && ['OFFICER', 'MANAGEMENT', 'AUTHORITY'].includes(currentUser.role);

  const filteredAlerts = (sosAlerts || []).filter(item => {
    const matchesSearch = 
      item.inspectorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alertId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspectorId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeCount = (sosAlerts || []).filter(a => a.status === 'ACTIVE').length;
  const acknowledgedCount = (sosAlerts || []).filter(a => a.status === 'ACKNOWLEDGED').length;

  return (
    <div className="space-y-7 selection:bg-[#0265dc] selection:text-white">
      
      {/* HEADER BANNER */}
      <div className="bg-rose-50 border border-rose-200/80 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">SOS Alerts Log</h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Real-time emergency alert log and officer response audit trail.
            </p>
          </div>
        </div>

        {/* Counter Stats */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial px-4 py-2 bg-white border border-rose-200 rounded-xl text-center shadow-xs">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Active SOS</p>
            <p className="text-lg font-black text-rose-600 font-mono">{activeCount}</p>
          </div>
          <div className="flex-1 sm:flex-initial px-4 py-2 bg-white border border-emerald-200 rounded-xl text-center shadow-xs">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Acknowledged</p>
            <p className="text-lg font-black text-emerald-600 font-mono">{acknowledgedCount}</p>
          </div>
        </div>
      </div>

      {/* SEARCH & STATUS FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Inspector, Mine, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#0265dc]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:inline-block" />
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto text-xs font-bold">
            {['ALL', 'ACTIVE', 'ACKNOWLEDGED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  statusFilter === st
                    ? st === 'ACTIVE'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : st === 'ACKNOWLEDGED'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-[#0265dc] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ALERTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-5">Alert ID</th>
                <th className="py-4 px-5">Inspector Details</th>
                <th className="py-4 px-5">Mine Location</th>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Response Details</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 font-medium">
                    No SOS emergency alerts match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item) => (
                  <tr key={item.alertId} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Alert ID */}
                    <td className="py-4 px-5 font-mono font-bold text-[#0f172a]">
                      <div className="flex items-center gap-2">
                        <Radio className={`w-4 h-4 ${item.status === 'ACTIVE' ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                        <span>{item.alertId}</span>
                      </div>
                    </td>

                    {/* Inspector Details */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#ebf3fe] text-[#0265dc] font-bold text-xs flex items-center justify-center shrink-0">
                          {item.inspectorName?.[0] || 'I'}
                        </div>
                        <div>
                          <p className="font-bold text-[#0f172a]">{item.inspectorName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {item.inspectorId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Mine Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-bold text-[#0f172a]">{item.mineName}</span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-5 font-mono text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.timestamp}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <Badge size="sm">{item.status}</Badge>
                    </td>

                    {/* Response Details */}
                    <td className="py-4 px-5 text-xs">
                      {item.status === 'ACKNOWLEDGED' ? (
                        <div className="space-y-0.5">
                          <p className="text-emerald-700 font-bold">{item.acknowledgedBy || 'Mine Officer'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.acknowledgedAt || item.acknowledgedTime}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending Response...</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-5 text-right">
                      {item.status === 'ACTIVE' && isOfficerOrAdmin ? (
                        <button
                          onClick={() => acknowledgeSOSAlert(item.alertId, `${currentUser.name} (${currentUser.role})`)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
