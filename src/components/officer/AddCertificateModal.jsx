import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CERTIFICATE_CATEGORIES } from '../../utils/seedData';
import { getTodayDateString } from '../../utils/dateHelpers';
import { UploadCloud, FileCheck, CheckCircle2 } from 'lucide-react';

export default function AddCertificateModal({ isOpen, onClose, initialData = {} }) {
  const { workers, mines, addOrUpdateCertificate, violations, uploadFileReference } = useData();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  const defaultWorkerId = initialData.workerId || workers[0]?.workerId || 'W-10452';
  const [workerId, setWorkerId] = useState(defaultWorkerId);
  const [certificateType, setCertificateType] = useState(initialData.certificateType || 'Electrical Competency Certificate');
  const [certificateId, setCertificateId] = useState(initialData.certificateId || `CERT-2026-${Date.now().toString().slice(-4)}`);
  const [issueDate, setIssueDate] = useState(getTodayDateString());
  const [expiryDate, setExpiryDate] = useState('2028-08-27'); // 2 years in future (VALID)
  const [issuingAuthority, setIssuingAuthority] = useState('State Directorate of Electrical & Mining Safety (Demo)');
  const [docName, setDocName] = useState('renewed_competency_certificate_2026.pdf');
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [linkedViolationId, setLinkedViolationId] = useState(initialData.linkedViolationId || '');

  useEffect(() => {
    if (isOpen) {
      const wId = initialData.workerId || workers[0]?.workerId || 'W-10452';
      setWorkerId(wId);
      setCertificateType(initialData.certificateType || 'Electrical Competency Certificate');
      setCertificateId(initialData.certificateId || `CERT-2026-${Date.now().toString().slice(-4)}`);
      setIssueDate(getTodayDateString());
      setExpiryDate('2028-08-27');
      setIssuingAuthority('State Directorate of Electrical & Mining Safety (Demo)');
      setDocName('renewed_competency_certificate_2026.pdf');
      setSelectedFileObj(null);
      setLinkedViolationId(initialData.linkedViolationId || '');
    }
  }, [isOpen, initialData, workers]);

  const selectedWorker = workers.find(w => w.workerId === workerId);
  const targetMineId = selectedWorker?.mineId || currentUser?.mineId || 'MINE-01';

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileObj(file);
      setDocName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFileObj && uploadFileReference) {
      try {
        await uploadFileReference({
          file: selectedFileObj,
          relatedRecordType: 'WORKER_CERTIFICATE',
          relatedRecordId: certificateId,
          uploadedBy: currentUser?.name || 'Mine Officer'
        });
      } catch (err) {
        console.warn('R2 upload notice:', err);
      }
    }

    addOrUpdateCertificate({
      certificateId,
      workerId,
      workerName: selectedWorker?.name || 'Worker',
      certificateType,
      issueDate,
      expiryDate,
      issuingAuthority,
      documentUrl: docName,
      mineId: targetMineId,
      verificationStatus: 'VALID'
    }, linkedViolationId || null, currentUser?.name);

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📜 Register Renewed Compliance Certificate" subtitle="Record worker's renewed competency credentials into compliance registry" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300">
          <strong>Compliance Registration Workflow:</strong> When personnel submit renewed certification documents, the Mine Officer enters the validity details here. The system updates the worker's status to 🟢 VALID and advances any linked violation to <strong>VERIFICATION REQUIRED</strong> for inspector sign-off.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Personnel</label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {workers.map(w => (
                <option key={w.workerId} value={w.workerId}>{w.name} ({w.role}) — {w.workerId}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Certificate Category</label>
            <select
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {CERTIFICATE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Certificate Document ID</label>
            <input
              type="text"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Valid Until (Expiry)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Issuing Authority / Training Body</label>
            <input
              type="text"
              value={issuingAuthority}
              onChange={(e) => setIssuingAuthority(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Link to Active Violation (Optional)</label>
            <select
              value={linkedViolationId}
              onChange={(e) => setLinkedViolationId(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="">None (Independent Registration)</option>
              {violations.filter(v => v.status !== 'RESOLVED').map(v => (
                <option key={v.violationId} value={v.violationId}>
                  {v.violationId} — {v.mineName} ({v.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Document Attachment */}
        <div className="p-3 bg-coal-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg" 
          />
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-white">Scanned Document (Demo Document Reference)</p>
              <p className="text-[10px] text-slate-400 font-mono">{docName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 font-semibold"
          >
            Browse / Attach
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Register & Submit for Verification</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
