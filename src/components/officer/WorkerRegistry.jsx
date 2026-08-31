import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { calculateCertificateStatus, formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { Users, Search, Filter, Plus, FileCheck, AlertTriangle, Building2, UserCheck, ShieldCheck } from 'lucide-react';
import AddCertificateModal from './AddCertificateModal';
import { useAuth } from '../../context/AuthContext';

export default function WorkerRegistry() {
  const { workers, certificates, mines, violations } = useData();
  const { currentUser } = useAuth();
  const isSingleMineRole = currentUser?.role === 'OFFICER' || currentUser?.role === 'INSPECTOR';
  const assignedMine = mines.find(m => m.mineId === currentUser?.mineId) || mines[0];
  const [selectedMine, setSelectedMine] = useState(isSingleMineRole ? (currentUser?.mineId || 'MINE-01') : 'ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [targetWorker, setTargetWorker] = useState(null);

  const filteredWorkers = workers.filter(w => {
    const activeMineFilter = isSingleMineRole ? currentUser.mineId : selectedMine;
    if (activeMineFilter !== 'ALL' && w.mineId !== activeMineFilter) return false;
    if (selectedZone !== 'ALL' && w.zoneId !== selectedZone && w.zoneName !== selectedZone && w.area !== selectedZone) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return w.name.toLowerCase().includes(q) ||
             w.workerId.toLowerCase().includes(q) ||
             w.role.toLowerCase().includes(q) ||
             (w.zoneName && w.zoneName.toLowerCase().includes(q)) ||
             (w.area && w.area.toLowerCase().includes(q));
    }
    return true;
  });

  const handleOpenAddCert = (worker) => {
    setTargetWorker(worker);
    setShowAddCertModal(true);
  };

  return (
    <div className="space-y-7 selection:bg-[#0265dc] selection:text-white">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Worker Registry</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Personnel records, technical designations, safety certification status, and renewal actions.
          </p>
        </div>

        <button
          onClick={() => handleOpenAddCert(workers[0])}
          className="px-4 py-2.5 bg-[#0265dc] hover:bg-[#0052b4] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0265dc]/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Certificate</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Filter by Mine</label>
          <select
            value={isSingleMineRole ? currentUser.mineId : selectedMine}
            disabled={isSingleMineRole}
            onChange={(e) => {
              if (!isSingleMineRole) {
                setSelectedMine(e.target.value);
                setSelectedZone('ALL');
              }
            }}
            className={`w-full px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none ${isSingleMineRole ? 'cursor-not-allowed opacity-80' : ''}`}
          >
            {isSingleMineRole ? (
              <option value={currentUser.mineId}>{assignedMine.mineName || 'Assigned Unit'} (Assigned Unit)</option>
            ) : (
              <>
                <option value="ALL">All Mines ({workers.length} Personnel)</option>
                {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.mineName}</option>)}
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Filter by Zone</label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Zones</option>
            <option value="North Shaft">North Shaft</option>
            <option value="South Shaft">South Shaft</option>
            <option value="Processing Plant">Processing Plant</option>
            <option value="Substation">Substation</option>
            <option value="Workshop">Workshop</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Search Personnel</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker name, ID, or technical role..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#0265dc]"
            />
          </div>
        </div>

      </div>

      {/* WORKERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWorkers.map((worker) => {
          const workerCerts = certificates.filter(c => c.workerId === worker.workerId);
          const hasExpired = workerCerts.some(c => calculateCertificateStatus(c.expiryDate).status === 'EXPIRED');
          const hasExpiring = workerCerts.some(c => calculateCertificateStatus(c.expiryDate).status === 'EXPIRING SOON');

          let overallStatus = 'VALID';
          if (hasExpired) overallStatus = 'EXPIRED';
          else if (hasExpiring) overallStatus = 'EXPIRING SOON';

          const linkedMine = mines.find(m => m.mineId === worker.mineId);

          return (
            <div key={worker.workerId} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
              
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                      <span>{worker.name}</span>
                      <span className="text-xs font-mono font-bold text-slate-400">({worker.workerId})</span>
                    </h4>
                    <p className="text-xs font-bold text-[#0265dc] mt-0.5">{worker.role}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{linkedMine?.mineName} • {worker.area}</p>
                  </div>
                  <Badge size="sm">{overallStatus}</Badge>
                </div>

                {/* Certificates List */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Compliance Certificates ({workerCerts.length})
                  </p>
                  {workerCerts.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No certificates recorded.</p>
                  ) : (
                    workerCerts.map((cert) => {
                      const st = calculateCertificateStatus(cert.expiryDate);
                      return (
                        <div key={cert.certificateId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                          <div className="truncate pr-2">
                            <p className="font-bold text-[#0f172a] truncate">{cert.certificateType}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Exp: {formatDate(cert.expiryDate)}</p>
                          </div>
                          <Badge size="sm">{st.status}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Action Button */}
              <button
                onClick={() => handleOpenAddCert(worker)}
                className="w-full py-2.5 bg-slate-50 hover:bg-blue-50 text-[#0265dc] font-bold text-xs rounded-xl border border-slate-200/70 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>+ Add / Renew Certificate</span>
              </button>

            </div>
          );
        })}
      </div>

      <AddCertificateModal
        isOpen={showAddCertModal}
        onClose={() => {
          setShowAddCertModal(false);
          setTargetWorker(null);
        }}
        initialData={{
          workerId: targetWorker?.workerId || '',
          certificateType: targetWorker?.role?.toLowerCase().includes('electric') 
            ? 'Electrical Competency Certificate'
            : targetWorker?.role?.toLowerCase().includes('blast')
            ? 'Mining Safety Training Certificate'
            : 'Mining Safety Training Certificate',
          linkedViolationId: violations.find(v => v.workerId === targetWorker?.workerId && v.status !== 'RESOLVED')?.violationId || ''
        }}
      />
    </div>
  );
}
