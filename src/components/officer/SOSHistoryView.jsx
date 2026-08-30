import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, Search, Filter, User, MapPin, Radio } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950/80 via-coal-900 to-coal-900 border border-red-900/50 p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-red-600/20 rounded-2xl border border-red-500/40 text-red-500 shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              SOS Emergency Alerts History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable real-time emergency dispatch log & officer response audit record
            </p>
          </div>
        </div>

        {/* Counter Stats */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Active SOS</p>
            <p className="text-lg font-black text-red-400 font-mono">{activeCount}</p>
          </div>
          <div className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Acknowledged</p>
            <p className="text-lg font-black text-emerald-400 font-mono">{acknowledgedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-coal-900 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Inspector, Mine, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-coal-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:inline-block" />
          <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
            {['ALL', 'ACTIVE', 'ACKNOWLEDGED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? st === 'ACTIVE'
                      ? 'bg-red-600 text-white shadow-lg'
                      : st === 'ACKNOWLEDGED'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-blue-600 text-white shadow-lg'
                    : 'bg-coal-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-coal-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-coal-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Alert ID</th>
                <th className="py-3.5 px-4">Inspector Details</th>
                <th className="py-3.5 px-4">Mine Location</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Response Details</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    No SOS emergency alerts match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item) => (
                  <tr key={item.alertId} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Alert ID */}
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <Radio className={`w-3.5 h-3.5 ${item.status === 'ACTIVE' ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                        <span>{item.alertId}</span>
                      </div>
                    </td>

                    {/* Inspector Details */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{item.inspectorName}</p>
                          <p className="text-[10px] text-amber-400 font-mono">ID: {item.inspectorId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Mine Name */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-200">{item.mineName}</span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-4 px-4 font-mono text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.timestamp}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {item.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 font-mono font-bold text-[10px] animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold text-[10px]">
                          <CheckCircle className="w-3 h-3" /> ACKNOWLEDGED
                        </span>
                      )}
                    </td>

                    {/* Response Details */}
                    <td className="py-4 px-4 text-xs">
                      {item.status === 'ACKNOWLEDGED' ? (
                        <div className="space-y-0.5">
                          <p className="text-emerald-300 font-semibold">{item.acknowledgedBy || 'Mine Officer'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.acknowledgedAt || item.acknowledgedTime}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Pending Response...</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-4 text-right">
                      {item.status === 'ACTIVE' && isOfficerOrAdmin ? (
                        <button
                          onClick={() => acknowledgeSOSAlert(item.alertId, `${currentUser.name} (${currentUser.role})`)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow transition-all border border-red-400"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
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
