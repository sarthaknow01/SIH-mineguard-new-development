import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { evaluateRisk } from '../../utils/aiRiskEngine';
import { AlertTriangle, Sparkles, UploadCloud, Camera, FileText, CheckCircle2, X, MapPin, RefreshCw, Lock } from 'lucide-react';

export default function ReportViolationModal({ isOpen, onClose, initialData = {} }) {
  const { mines, workers, certificates, reportViolation, uploadFileReference } = useData();
  const { currentUser } = useAuth();
  
  const isSingleMineRole = currentUser?.role === 'OFFICER' || currentUser?.role === 'INSPECTOR';

  const deviceFileInputRef = useRef(null);
  const cameraFileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [mineId, setMineId] = useState(() => {
    if (isSingleMineRole && currentUser?.mineId) return currentUser.mineId;
    return initialData?.mineId || 'MINE-01';
  });

  const selectedMine = mines.find(m => m.mineId === mineId) || mines[0];

  const [area, setArea] = useState('North Shaft');
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

  // Live Camera Viewfinder state
  const [showCameraViewfinder, setShowCameraViewfinder] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // GPS Geolocation State
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('IDLE'); // IDLE, CAPTURING, CAPTURED, UNAVAILABLE, DENIED
  const [gpsMessage, setGpsMessage] = useState('');

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('UNAVAILABLE');
      setGpsMessage('Geolocation not supported by browser.');
      return;
    }

    setGpsStatus('CAPTURING');
    setGpsMessage('Requesting GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locationTimestamp: new Date(pos.timestamp || Date.now()).toISOString()
        };
        setGpsLocation(coords);
        setGpsStatus('CAPTURED');
        setGpsMessage(`GPS Captured: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('DENIED');
          setGpsMessage('Location permission denied. Saved as NULL.');
        } else {
          setGpsStatus('UNAVAILABLE');
          setGpsMessage('Location service unavailable. Saved as NULL.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  // Stop live camera stream
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraViewfinder(false);
  };

  // Start live WebRTC camera stream
  const startLiveCamera = async () => {
    setCameraError('');
    setShowCameraViewfinder(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Live camera access warning, launching native device camera input:', err);
      setCameraError('Live video stream unavailable. Opening camera input fallback...');
      setTimeout(() => {
        stopLiveCamera();
        cameraFileInputRef.current?.click();
      }, 800);
    }
  };

  // Capture frame from live video stream to Blob
  const takePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `site_camera_capture_${Date.now().toString().slice(-4)}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        setSelectedFileObj(file);
        setEvidenceName(file.name);
        setIsCameraCapture(true);
        setIsImageFile(true);
        setEvidencePreviewUrl(previewUrl);
        stopLiveCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  // Sync state ONLY when modal transitions to open (isOpen === true)
  useEffect(() => {
    if (isOpen) {
      setMineId(isSingleMineRole && currentUser?.mineId ? currentUser.mineId : (initialData?.mineId || 'MINE-01'));
      setArea(initialData?.area || 'North Shaft');
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
      requestGpsLocation();
    } else {
      stopLiveCamera();
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

  // Handle camera photo capture (fallback)
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
      latitude: gpsLocation?.latitude ?? null,
      longitude: gpsLocation?.longitude ?? null,
      locationTimestamp: gpsLocation?.locationTimestamp ?? null,
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
        {/* GPS Location Status Indicator */}
        <div className="p-2.5 bg-coal-950 border border-slate-800 rounded-lg flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <MapPin className={`w-4 h-4 shrink-0 ${gpsStatus === 'CAPTURED' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={gpsStatus === 'CAPTURED' ? 'text-emerald-300 font-bold' : 'text-amber-300'}>
              {gpsMessage || 'Capturing GPS Location...'}
            </span>
          </div>
          <button
            type="button"
            onClick={requestGpsLocation}
            title="Refresh GPS Coordinates"
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${gpsStatus === 'CAPTURING' ? 'animate-spin' : ''}`} />
            <span>Re-scan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Mine</label>
            {isSingleMineRole ? (
              <div className="w-full px-3 py-2 bg-coal-950/80 border border-amber-500/40 rounded-lg text-xs text-amber-300 font-semibold flex items-center justify-between cursor-not-allowed">
                <span className="truncate">{(mines.find(m => m.mineId === mineId)?.mineName || currentUser?.mineName || 'Assigned Mine')} ({mineId})</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono shrink-0 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Assigned Unit</span>
                </span>
              </div>
            ) : (
              <select
                value={mineId}
                onChange={(e) => setMineId(e.target.value)}
                className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {mines.map(m => (
                  <option key={m.mineId} value={m.mineId}>{m.mineName} ({m.location.split(',')[0]})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Area / Sector</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              {selectedMine?.zones && selectedMine.zones.length > 0 ? (
                selectedMine.zones.map(z => (
                  <option key={z.zoneId} value={z.zoneName}>{z.zoneId}: {z.zoneName}</option>
                ))
              ) : (
                <>
                  <option value="North Shaft">Z-01: North Shaft</option>
                  <option value="South Shaft">Z-02: South Shaft</option>
                  <option value="Processing Plant">Z-03: Processing Plant</option>
                  <option value="Substation Zone 3">Z-04: Substation Zone 3</option>
                </>
              )}
            </select>
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
                onClick={startLiveCamera}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
                <span>Capture Photo</span>
              </button>
            </div>
          </div>

          {/* Live WebRTC Camera Viewfinder Overlay */}
          {showCameraViewfinder && (
            <div className="p-3 bg-coal-900 border border-amber-500/50 rounded-xl space-y-2 relative overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Live Site Camera Viewfinder</span>
                </span>
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                >
                  Close Camera
                </button>
              </div>

              {cameraError ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-lg flex items-center justify-between">
                  <span>{cameraError}</span>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden bg-black border border-slate-700 flex items-center justify-center min-h-[220px]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-56 object-cover rounded-lg"
                  />
                  {/* Camera Reticle Target Overlay */}
                  <div className="absolute inset-0 border-2 border-dashed border-amber-400/40 rounded-lg pointer-events-none flex items-center justify-center">
                    <div className="w-12 h-12 border border-amber-400/60 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                    </div>
                  </div>

                  {/* Shutter Capture Button */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <button
                      type="button"
                      onClick={takePhotoFromStream}
                      className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs rounded-full shadow-xl border-2 border-white flex items-center gap-2 transform hover:scale-105 transition-all"
                    >
                      <Camera className="w-4 h-4 text-black" />
                      <span>📸 SNAP & USE PHOTO</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
