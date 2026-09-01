import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { calculateCertificateStatus, formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { FileCheck, Plus, Search, Filter, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AddCertificateModal from './AddCertificateModal';

export default function CertificateManager() {
  const { certificates, workers, mines } = useData();
  const { currentUser } = useAuth();

  const isSingleMineRole = currentUser?.role === 'OFFICER' || currentUser?.role === 'INSPECTOR';
  const assignedMine = mines.find(m => m.mineId === currentUser?.mineId) || mines[0];
  const [selectedMine, setSelectedMine] = useState(isSingleMineRole ? (currentUser?.mineId || 'MINE-01') : 'ALL');
  const [filterZone, setFilterZone] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredCerts = certificates.filter(c => {
    const activeMineFilter = isSingleMineRole ? currentUser.mineId : selectedMine;
    if (activeMineFilter !== 'ALL' && c.mineId !== activeMineFilter) return false;
    if (filterZone !== 'ALL') {
      const w = workers.find(wrk => wrk.workerId === c.workerId);
      const zoneStr = (w?.zoneName || w?.area || '').toLowerCase();
      if (!zoneStr.includes(filterZone.toLowerCase())) return false;
    }
    const st = calculateCertificateStatus(c.expiryDate).status;
    if (filterStatus !== 'ALL' && st !== filterStatus) return false;
    if (filterCategory !== 'ALL' && c.certificateType !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return c.certificateId.toLowerCase().includes(q) ||
             c.workerName.toLowerCase().includes(q) ||
             c.certificateType.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <span>Master Certificate Database & Expiry Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track all safety mining competencies, upcoming expiry thresholds, and renewal archives
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload / Register Certificate</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-coal-900 border border-slate-800 p-3.5 rounded-xl text-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Target Mine Unit</label>
          {isSingleMineRole ? (
            <div className="px-2.5 py-1.5 bg-coal-950 border border-amber-500/40 rounded-lg text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <span>🔒 {assignedMine.mineName || 'Demo Mine Alpha'} ({assignedMine.mineId || 'MINE-01'})</span>
            </div>
          ) : (
            <select
              value={selectedMine}
              onChange={(e) => setSelectedMine(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
            >
              <option value="ALL">All Mines ({certificates.length} Records)</option>
              {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.mineName}</option>)}
            </select>
          )}
        </div>

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
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status Filter</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses ({certificates.length})</option>
            <option value="VALID">VALID</option>
            <option value="EXPIRING SOON">EXPIRING SOON (within 30d)</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category Filter</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          >
            <option value="ALL">All 5 Categories</option>
            <option value="Electrical Competency Certificate">Electrical Competency</option>
            <option value="Mining Safety Training Certificate">Mining Safety Training</option>
            <option value="First Aid & Emergency Response Certificate">First Aid & Emergency</option>
            <option value="Equipment Operation Certificate">Equipment Operation</option>
            <option value="Fire Safety Certificate">Fire Safety</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search Records</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worker or Cert ID..."
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-coal-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-coal-950 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-3.5">Certificate ID & Category</th>
                <th className="p-3.5">Worker Name</th>
                <th className="p-3.5">Assigned Mine</th>
                <th className="p-3.5">Issue Date</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Issuing Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCerts.map((c) => {
                const st = calculateCertificateStatus(c.expiryDate);
                const linkedMine = mines.find(m => m.mineId === c.mineId);
                return (
                  <tr key={c.certificateId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-white">{c.certificateId}</p>
                      <p className="text-[11px] text-amber-400 font-medium mt-0.5">{c.certificateType}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-white">{c.workerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.workerId}</p>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {linkedMine?.mineName || 'Demo Mine'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {formatDate(c.issueDate)}
                    </td>
                    <td className={`p-3.5 font-mono font-bold ${st.status === 'EXPIRED' ? 'text-red-400' : 'text-slate-300'}`}>
                      {formatDate(c.expiryDate)}
                    </td>
                    <td className="p-3.5">
                      <Badge size="sm">{st.status}</Badge>
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate">
                      {c.issuingAuthority}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddCertificateModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
