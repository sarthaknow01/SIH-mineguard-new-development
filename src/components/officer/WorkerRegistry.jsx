import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { calculateCertificateStatus, formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { Users, Search, Filter, Plus, FileCheck, AlertTriangle } from 'lucide-react';
import AddCertificateModal from './AddCertificateModal';

import { useAuth } from '../../context/AuthContext';

export default function WorkerRegistry() {
  const { workers, certificates, mines, violations } = useData();
  const { currentUser } = useAuth();
  const [selectedMine, setSelectedMine] = useState(currentUser?.role === 'OFFICER' ? (currentUser.mineId || 'MINE-01') : 'ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [targetWorker, setTargetWorker] = useState(null);

  const filteredWorkers = workers.filter(w => {
    if (selectedMine !== 'ALL' && w.mineId !== selectedMine) return false;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Worker Compliance & Certification Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Personnel records, technical designations, safety certification status, and renewal actions
          </p>
        </div>

        <button
          onClick={() => handleOpenAddCert(workers[0])}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Certificate</span>
        </button>
      </div>

      {/* Filter / Search bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-coal-900 border border-slate-800 p-3.5 rounded-xl text-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter by Mine</label>
          <select
            value={selectedMine}
            disabled={currentUser?.role === 'OFFICER'}
            onChange={(e) => {
              setSelectedMine(e.target.value);
              setSelectedZone('ALL');
            }}
            className={`w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none ${currentUser?.role === 'OFFICER' ? 'opacity-80 cursor-not-allowed border-amber-500/40 text-amber-300 font-semibold' : ''}`}
          >
            {currentUser?.role === 'OFFICER' ? (
              <option value={currentUser.mineId || 'MINE-01'}>Demo Mine Alpha (Assigned Unit)</option>
            ) : (
              <>
                <option value="ALL">All Mines ({workers.length} Personnel)</option>
                {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.mineName}</option>)}
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter by Zone</label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
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
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search Personnel</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker name, ID, or technical role..."
              className="w-full pl-9 pr-3 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => {
          const workerCerts = certificates.filter(c => c.workerId === worker.workerId);
          const hasExpired = workerCerts.some(c => calculateCertificateStatus(c.expiryDate).status === 'EXPIRED');
          const hasExpiring = workerCerts.some(c => calculateCertificateStatus(c.expiryDate).status === 'EXPIRING SOON');

          let overallStatus = 'VALID';
          if (hasExpired) overallStatus = 'EXPIRED';
          else if (hasExpiring) overallStatus = 'EXPIRING SOON';

          const linkedMine = mines.find(m => m.mineId === worker.mineId);

          return (
            <div key={worker.workerId} className="bg-coal-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4.5 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {worker.name}
                      <span className="text-[10px] font-mono text-slate-400">({worker.workerId})</span>
                    </h4>
                    <p className="text-xs font-semibold text-amber-400 mt-0.5">{worker.role}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{linkedMine?.mineName} • {worker.area}</p>
                  </div>
                  <Badge size="sm">{overallStatus}</Badge>
                </div>

                {/* Certificates List */}
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Compliance Certificates ({workerCerts.length})
                  </p>
                  {workerCerts.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No certificates recorded.</p>
                  ) : (
                    workerCerts.map((cert) => {
                      const st = calculateCertificateStatus(cert.expiryDate);
                      return (
                        <div key={cert.certificateId} className="p-2 rounded-lg bg-coal-950 border border-slate-800/80 text-[11px] flex items-center justify-between">
                          <div className="truncate pr-2">
                            <p className="font-semibold text-slate-200 truncate">{cert.certificateType}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Exp: {formatDate(cert.expiryDate)}</p>
                          </div>
                          <Badge size="sm">{st.status}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom Action */}
              <button
                onClick={() => handleOpenAddCert(worker)}
                className="w-full py-2 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-bold text-xs rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
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
