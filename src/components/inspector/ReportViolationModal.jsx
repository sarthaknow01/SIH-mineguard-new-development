import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { evaluateRisk } from '../../utils/aiRiskEngine';
import { AlertTriangle, Sparkles, UploadCloud, Camera, FileText, CheckCircle2, X } from 'lucide-react';

export default function ReportViolationModal({ isOpen, onClose, initialData = {} }) {
  const { mines, workers, certificates, reportViolation, uploadFileReference } = useData();
  const { currentUser } = useAuth();
  
  const deviceFileInputRef = useRef(null);
  const cameraFileInputRef = useRef(null);

  const [mineId, setMineId] = useState('MINE-01');
  const [area, setArea] = useState('Substation Zone 3');
  const [category, setCategory] = useState('Statutory Certification Breach');
  const [severity, setSeverity] = useState('HIGH');
  const [workerId, setWorkerId] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceName, setEvidenceName] = useState('evidence_field_capture.jpg');
  const [evidencePreviewUrl, setEvidencePreviewUrl] = useState(null);
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [isCameraCapture, setIsCameraCapture] = useState(false);
  const [isImageFile, setIsImageFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state ONLY when modal transitions to open (isOpen === true)
  useEffect(() => {
    if (isOpen) {
      setMineId(initialData?.mineId || 'MINE-01');
      setArea(initialData?.area || 'Substation Zone 3');
      setCategory(initialData?.category || 'Statutory Certification Breach');
      setSeverity(initialData?.severity || 'HIGH');
      setWorkerId(initialData?.workerId || '');
      setCertificateId(initialData?.certificateId || '');
      setDescription(initialData?.description || '');
      setEvidenceName(initialData?.evidence || 'evidence_field_capture.jpg');
      setEvidencePreviewUrl(null);
      setSelectedFileObj(null);
      setIsCameraCapture(false);
      setIsImageFile(false);
    }
  }, [isOpen]);

  // Handle device file selection
  const handleDeviceFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileObj(file);
      setEvidenceName(file.name);
      setIsCameraCapture(false);
      if (file.type.startsWith('image/')) {
        setIsImageFile(true);
        setEvidencePreviewUrl(URL.createObjectURL(file));
      } else {
        setIsImageFile(false);
        setEvidencePreviewUrl('DOCUMENT');
      }
    }
  };

  // Handle camera photo capture
  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const name = file.name || `site_camera_photo_${Date.now().toString().slice(-4)}.jpg`;
      setSelectedFileObj(file);
      setEvidenceName(name);
      setIsCameraCapture(true);
      setIsImageFile(true);
      setEvidencePreviewUrl(URL.createObjectURL(file));
    }
  };

  // Remove / reset evidence file
  const handleRemoveEvidence = () => {
    setSelectedFileObj(null);
    setEvidenceName('evidence_field_capture.jpg');
    setEvidencePreviewUrl(null);
    setIsCameraCapture(false);
    setIsImageFile(false);
    if (deviceFileInputRef.current) deviceFileInputRef.current.value = '';
    if (cameraFileInputRef.current) cameraFileInputRef.current.value = '';
  };

  // Live AI Preview
  const selectedWorker = workers.find(w => w.workerId === workerId);
  const aiPreview = evaluateRisk({
    category,
    severity,
    workerRole: selectedWorker?.role || '',
    certStatus: certificateId ? 'EXPIRED' : 'VALID',
    area,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const selectedMine = mines.find(m => m.mineId === mineId);
    const tempId = `VIO-2026-${Date.now().toString().slice(-4)}`;

    if (selectedFileObj && uploadFileReference) {
      try {
        await uploadFileReference({
          file: selectedFileObj,
          relatedRecordType: 'VIOLATION',
          relatedRecordId: tempId,
          uploadedBy: currentUser?.name || 'Inspector'
        });
      } catch (err) {
        console.warn('R2 upload notice:', err);
      }
    }

    reportViolation({
      violationId: tempId,
      mineId,
      mineName: selectedMine?.mineName || 'Demo Mine',
      area,
      category,
      severity,
      workerId: workerId || null,
      workerName: selectedWorker?.name || null,
      certificateId: certificateId || null,
      description,
      evidence: evidenceName,
      evidencePreview: isImageFile ? evidencePreviewUrl : null,
      inspectionId: initialData?.inspectionId || null,
    }, currentUser?.name);

    setIsSubmitting(false);
    onClose();
  };

  const categories = [
    'Statutory Certification Breach',
    'Explosives & Blasting Safety Non-Compliance',
    'Equipment Maintenance Safety Defect',
    'Ventilation & Environmental Hazard',
    'Roof & Strata Support Discrepancy',
    'PPE & Individual Safety Violation',
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚠️ Report Mine Compliance Violation" subtitle="File a mine compliance violation with automated AI risk prioritization" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Mine</label>
            <select
              value={mineId}
              onChange={(e) => setMineId(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {mines.map(m => (
                <option key={m.mineId} value={m.mineId}>{m.mineName} ({m.location.split(',')[0]})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Area / Sector</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              placeholder="e.g. Substation Zone 3"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Violation Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Classification</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="LOW" className="text-emerald-400">LOW (Observational)</option>
              <option value="MEDIUM" className="text-amber-400">MEDIUM (Remediation Required)</option>
              <option value="HIGH" className="text-orange-400">HIGH (Major Compliance Breach)</option>
              <option value="CRITICAL" className="text-red-400">CRITICAL (Immediate Danger to Life)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Linked Worker (Optional)</label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">None / General Mine Hazard</option>
              {workers.filter(w => w.mineId === mineId).map(w => (
                <option key={w.workerId} value={w.workerId}>{w.name} ({w.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Linked Certificate (Optional)</label>
            <select
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            >
              <option value="">None</option>
              {certificates.filter(c => !workerId || c.workerId === workerId).map(c => (
                <option key={c.certificateId} value={c.certificateId}>{c.certificateId} - {c.certificateType}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Problem 1 Fix: Fully interactive description textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Detailed Violation Description & Findings
          </label>
          <textarea
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[90px] resize-y cursor-text select-text relative z-10"
            placeholder="Describe the exact safety breach observed during the inspection..."
            required
          />
        </div>

        {/* Problems 2 & 3: File Upload & Live Camera Capture */}
        <div className="p-3.5 bg-coal-950 rounded-xl border border-slate-800 space-y-3">
          {/* Hidden File Inputs */}
          <input 
            type="file" 
            ref={deviceFileInputRef} 
            onChange={handleDeviceFileSelect} 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp,.pdf" 
          />
          <input 
            type="file" 
            ref={cameraFileInputRef} 
            onChange={handleCameraCapture} 
            className="hidden" 
            accept="image/*"
            capture="environment"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <span>Photographic / Document Evidence</span>
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Attach site photo or document proof (Supported: JPG, PNG, WEBP, PDF)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => deviceFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Upload from Device</span>
              </button>

              <button 
                type="button"
                onClick={() => cameraFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Capture Photo</span>
              </button>
            </div>
          </div>

          {/* Evidence Preview / Status Display */}
          {evidencePreviewUrl ? (
            <div className="p-2.5 bg-coal-900 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {isImageFile ? (
                  <img 
                    src={evidencePreviewUrl} 
                    alt="Evidence preview" 
                    className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{evidenceName}</p>
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isCameraCapture ? 'Captured via Rear Camera' : 'Attached from Device'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveEvidence}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-xs shrink-0"
                title="Remove evidence file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-coal-900/60 rounded-lg border border-dashed border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono truncate">
                <UploadCloud className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">Default Reference: {evidenceName}</span>
              </div>
              <span className="text-[10px] text-slate-500 italic shrink-0">No custom file selected</span>
            </div>
          )}
        </div>

        {/* Real-time AI Risk Card Preview */}
        <div className="p-3 bg-coal-950 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Live AI Risk Assessment Preview:
            </span>
            <span className="text-xs font-mono font-bold text-red-400">{aiPreview.score}/100 ({aiPreview.level})</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{aiPreview.summary}</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-600/20 flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Submit Violation & Dispatch Alert</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
