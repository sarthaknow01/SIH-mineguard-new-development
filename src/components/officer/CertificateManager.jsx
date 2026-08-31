import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { calculateCertificateStatus, formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { FileCheck, Plus, Search, Filter, AlertTriangle, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import AddCertificateModal from './AddCertificateModal';

export default function CertificateManager() {
  const { certificates, workers, mines } = useData();
  const { currentUser } = useAuth();

  const isSingleMineRole = currentUser?.role === 'OFFICER' || currentUser?.role === 'INSPECTOR';
  const assignedMine = mines.find(m => m.mineId === currentUser?.mineId) || mines[0];
  const [selectedMine, setSelectedMine] = useState(isSingleMineRole ? (currentUser?.mineId || 'MINE-01') : 'ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredCerts = certificates.filter(c => {
    const activeMineFilter = isSingleMineRole ? currentUser.mineId : selectedMine;
    if (activeMineFilter !== 'ALL' && c.mineId !== activeMineFilter) return false;
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
    <div className="space-y-7 selection:bg-[#0265dc] selection:text-white">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Certificate Manager</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Track all safety mining competencies, upcoming expiry thresholds, and renewal archives.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#0265dc] hover:bg-[#0052b4] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0265dc]/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload / Register Certificate</span>
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Filter by Mine</label>
          <select
            value={isSingleMineRole ? currentUser.mineId : selectedMine}
            disabled={isSingleMineRole}
            onChange={(e) => {
              if (!isSingleMineRole) setSelectedMine(e.target.value);
            }}
            className={`w-full px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none ${isSingleMineRole ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            {isSingleMineRole ? (
              <option value={currentUser.mineId}>{assignedMine.mineName || 'Assigned Unit'} (Assigned Unit)</option>
            ) : (
              <>
                <option value="ALL">All Mines ({certificates.length} Records)</option>
                {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.mineName}</option>)}
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status Filter</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses ({certificates.length})</option>
            <option value="VALID">VALID</option>
            <option value="EXPIRING SOON">EXPIRING SOON (within 30d)</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category Filter</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Electrical Competency Certificate">Electrical Competency</option>
            <option value="Mining Safety Training Certificate">Mining Safety Training</option>
            <option value="First Aid & Emergency Response Certificate">First Aid & Emergency</option>
            <option value="Equipment Operation Certificate">Equipment Operation</option>
            <option value="Fire Safety Certificate">Fire Safety</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Search Records</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search worker or Cert ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#0265dc]"
            />
          </div>
        </div>

      </div>

      {/* CERTIFICATES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-5">Certificate ID & Category</th>
                <th className="py-4 px-5">Worker Name</th>
                <th className="py-4 px-5">Assigned Mine</th>
                <th className="py-4 px-5">Issue Date</th>
                <th className="py-4 px-5">Expiry Date</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Issuing Authority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.map((c) => {
                const st = calculateCertificateStatus(c.expiryDate);
                const linkedMine = mines.find(m => m.mineId === c.mineId);
                return (
                  <tr key={c.certificateId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-mono font-bold text-[#0f172a]">{c.certificateId}</p>
                      <p className="text-xs text-[#0265dc] font-bold mt-0.5">{c.certificateType}</p>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-bold text-[#0f172a]">{c.workerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.workerId}</p>
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      {linkedMine?.mineName || 'Demo Mine'}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-500">
                      {formatDate(c.issueDate)}
                    </td>
                    <td className={`py-4 px-5 font-mono font-bold ${st.status === 'EXPIRED' ? 'text-rose-600' : 'text-slate-700'}`}>
                      {formatDate(c.expiryDate)}
                    </td>
                    <td className="py-4 px-5">
                      <Badge size="sm">{st.status}</Badge>
                    </td>
                    <td className="py-4 px-5 text-slate-500 text-xs max-w-xs truncate">
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
