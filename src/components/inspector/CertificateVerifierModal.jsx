import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { calculateCertificateStatus, formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { QrCode, Search, CheckCircle2, AlertTriangle, FileText, User } from 'lucide-react';

export default function CertificateVerifierModal({ isOpen, onClose }) {
  const { certificates, workers, mines } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState(() => certificates[0]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    const found = certificates.find(
      c => c.certificateId.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
           c.workerName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
           c.workerId.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    if (found) {
      setSelectedCert(found);
    }
  };

  const handleSelectCertId = (id) => {
    const found = certificates.find(c => c.certificateId === id);
    if (found) {
      setSelectedCert(found);
      setSearchQuery(found.certificateId);
    }
  };

  const statusObj = selectedCert ? calculateCertificateStatus(selectedCert.expiryDate) : null;
  const linkedWorker = selectedCert ? workers.find(w => w.workerId === selectedCert.workerId) : null;
  const linkedMine = selectedCert ? mines.find(m => m.mineId === selectedCert.mineId) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔍 Certificate Verification & Compliance Lookup" subtitle="Verify worker competency credentials against active compliance registry" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Search & Certificate Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID or Worker Name..."
                className="w-full pl-9 pr-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Search</span>
            </button>
          </form>

          <div>
            <select
              value={selectedCert?.certificateId || ''}
              onChange={(e) => handleSelectCertId(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              {certificates.map(c => (
                <option key={c.certificateId} value={c.certificateId}>
                  {c.certificateId} — {c.workerName} ({c.certificateType.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Demo Pre-set Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-slate-400">Demo Quick Select:</span>
          {certificates.slice(0, 4).map(c => {
            const st = calculateCertificateStatus(c.expiryDate).status;
            return (
              <button
                key={c.certificateId}
                type="button"
                onClick={() => handleSelectCertId(c.certificateId)}
                className={`px-2 py-1 border rounded text-[11px] font-mono transition-colors ${
                  st === 'EXPIRED' 
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30' 
                    : st === 'EXPIRING SOON' 
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {c.certificateId} ({c.workerName.split(' ')[0]} - {st})
              </button>
            );
          })}
        </div>

        {/* Certificate Display Card */}
        {selectedCert ? (
          <div className="bg-coal-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-xl">
            {/* Watermark */}
            <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
              <QrCode className="w-32 h-32 text-slate-400" />
            </div>

            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Coal Mine Safety Authority Verification Record
                </span>
                <h4 className="text-base font-extrabold text-white mt-1">{selectedCert.certificateType}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {selectedCert.certificateId}</p>
              </div>
              <Badge size="md">{statusObj?.status}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Worker Name</span>
                <p className="font-bold text-white mt-0.5">{selectedCert.workerName}</p>
                <p className="text-[10px] text-slate-400 font-mono">({selectedCert.workerId})</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Designation</span>
                <p className="font-medium text-slate-200 mt-0.5">{linkedWorker?.role || 'Mining Crew'}</p>
                <p className="text-[10px] text-slate-400">{linkedWorker?.area}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Mine</span>
                <p className="font-medium text-slate-200 mt-0.5">{linkedMine?.mineName || 'Demo Mine'}</p>
                <p className="text-[10px] text-slate-400">{linkedMine?.location?.split(',')[0]}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Issue Date</span>
                <p className="font-mono text-slate-300 mt-0.5">{formatDate(selectedCert.issueDate)}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Expiry Date</span>
                <p className={`font-mono font-bold mt-0.5 ${statusObj?.status === 'EXPIRED' ? 'text-red-400' : 'text-slate-300'}`}>
                  {formatDate(selectedCert.expiryDate)}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Issuing Authority</span>
                <p className="text-slate-300 mt-0.5 truncate">{selectedCert.issuingAuthority}</p>
              </div>
            </div>

            {/* Status explanation notice */}
            <div className={`mt-4 p-3 rounded-lg border text-xs flex items-center gap-2 ${
              statusObj?.status === 'EXPIRED'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : statusObj?.status === 'EXPIRING SOON'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              {statusObj?.status === 'EXPIRED' ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>
                <strong>System Verdict:</strong> {statusObj?.label}. {statusObj?.status === 'EXPIRED' ? 'Mandatory non-compliance if deployed in operational zone.' : 'Eligible for active duty.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 bg-coal-950 rounded-xl border border-slate-800">
            No matching certificate record found in database.
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
          >
            Close Verifier
          </button>
        </div>
      </div>
    </Modal>
  );
}
