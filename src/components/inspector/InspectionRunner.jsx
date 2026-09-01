import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle, AlertTriangle, Send, Sparkles, UserCheck, MapPin, RefreshCw } from 'lucide-react';
import ReportViolationModal from './ReportViolationModal';

export default function InspectionRunner({ onComplete }) {
  const { mines, workers, certificates, createInspection } = useData();
  const { currentUser } = useAuth();

  const isSingleMineRole = currentUser?.role === 'OFFICER' || currentUser?.role === 'INSPECTOR';

  const [mineId, setMineId] = useState(() => {
    if (isSingleMineRole && currentUser?.mineId) {
      return currentUser.mineId;
    }
    return 'MINE-01';
  });

  const selectedMine = mines.find(m => m.mineId === mineId) || mines[0];
  const [area, setArea] = useState(selectedMine?.zones?.[0]?.zoneName || 'North Shaft');
  const [inspectionType, setInspectionType] = useState('Electrical & Personnel Compliance Safety Inspection');
  const [generalNotes, setGeneralNotes] = useState('');
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [submittedInspection, setSubmittedInspection] = useState(null);
  const [inspectionSuccessMsg, setInspectionSuccessMsg] = useState('');

  useEffect(() => {
    if (isSingleMineRole && currentUser?.mineId) {
      setMineId(currentUser.mineId);
    }
  }, [currentUser, isSingleMineRole]);

  // GPS Geolocation State
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('IDLE'); // IDLE, CAPTURING, CAPTURED, UNAVAILABLE, DENIED
  const [gpsMessage, setGpsMessage] = useState('');

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('UNAVAILABLE');
      setGpsMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('CAPTURING');
    setGpsMessage('Requesting device location...');

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
          setGpsMessage('Location permission denied. Saved coordinates as NULL.');
        } else {
          setGpsStatus('UNAVAILABLE');
          setGpsMessage('Location service unavailable. Saved coordinates as NULL.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    requestGpsLocation();
  }, []);

  // Update area when mineId changes
  const handleMineChange = (newMineId) => {
    setMineId(newMineId);
    const m = mines.find(x => x.mineId === newMineId);
    if (m && m.zones && m.zones.length > 0) {
      setArea(m.zones[0].zoneName);
    }
  };

  // Find workers and candidate cert for the selected mine and zone
  const mineWorkers = workers.filter(w => w.mineId === mineId);
  const zoneWorkers = mineWorkers.filter(w => w.zoneName === area || w.area === area);
  const activeWorkersPool = zoneWorkers.length > 0 ? zoneWorkers : mineWorkers;

  const candidateWorker = activeWorkersPool.find(w => {
    return certificates.some(c => c.workerId === w.workerId && new Date(c.expiryDate) < new Date());
  }) || activeWorkersPool[0];

  // Dynamic SOP Checklist Templates per Audit Type
  const SOP_CHECKLIST_TEMPLATES = {
    'Electrical & Personnel Compliance Safety Inspection': [
      { id: 1, category: 'Safety & Signage', item: 'Danger High Voltage signage & isolation barriers in place', status: 'PASS', notes: 'Visible and illuminated' },
      { id: 2, category: 'Safety & Signage', item: 'Emergency fire extinguishers inspected and charged (CO2/Dry Powder)', status: 'PASS', notes: 'Pressure gauges nominal' },
      { id: 3, category: 'Equipment Safety', item: 'Transformer grounding & earth leakage circuit breakers tested', status: 'PASS', notes: 'Ground resistance nominal' },
      { id: 4, category: 'Equipment Safety', item: 'Insulated rubber floor matting in front of power panels', status: 'PASS', notes: 'Tested and stamp verified' },
      { id: 5, category: 'Worker Compliance', item: 'On-duty personnel possess valid mandatory competency certificate', status: 'FAIL', notes: 'Assigned personnel competency certificate expired' },
      { id: 6, category: 'Worker Compliance', item: 'Mandatory PPE (Arc-flash shield / helmet / safety boots) worn', status: 'PASS', notes: 'PPE in proper use' },
    ],
    'Ventilation & Gas Testing Audit': [
      { id: 1, category: 'Gas Safety', item: 'Multi-gas detector calibrated and operational (CH4, CO, O2, H2S)', status: 'PASS', notes: 'Gas sensor bump test verified' },
      { id: 2, category: 'Gas Safety', item: 'Flammable Methane gas concentration below statutory limit (<0.75%)', status: 'PASS', notes: 'CH4 reading: 0.12% (Safe)' },
      { id: 3, category: 'Ventilation Flow', item: 'Anemometer airflow velocity at main return airway within norm (>1.5 m/s)', status: 'PASS', notes: 'Air speed measured at 2.1 m/s' },
      { id: 4, category: 'Ventilation Flow', item: 'Auxiliary fan ducting continuous with zero leakage or tears', status: 'FAIL', notes: 'Minor tear detected in flexible ducting at joint 4' },
      { id: 5, category: 'Dust Suppression', item: 'Water atomizing spray nozzles active at transfer points', status: 'PASS', notes: 'High-pressure mist sprays operational' },
      { id: 6, category: 'Emergency Prep', item: 'Self-Contained Self-Rescuer (SCSR) packs inspected & ready', status: 'PASS', notes: 'Seals unbroken and valid expiry date' },
    ],
    'Roof Support & Strata Control Inspection': [
      { id: 1, category: 'Strata Monitoring', item: 'Tell-tale convergence indicators checked for roof strata movement', status: 'PASS', notes: 'Displacement within safe 2mm limit' },
      { id: 2, category: 'Roof Support', item: 'Hydraulic props and chocks pressurized to minimum setting load', status: 'PASS', notes: 'Setting pressure 150 bar verified' },
      { id: 3, category: 'Roof Support', item: 'Resin-anchored roof bolts tension tested in active working face', status: 'FAIL', notes: 'Torque test failed on 2 bolts near face' },
      { id: 4, category: 'Timbering & Mesh', item: 'W-strap steel mesh & wood lagging tightly installed without gaps', status: 'PASS', notes: 'Lagging secure' },
      { id: 5, category: 'Hazard Assessment', item: 'Rib spalling and side pillar cracking inspected and rated', status: 'PASS', notes: 'Minor flaking, no structural threat' },
      { id: 6, category: 'Geological Audit', item: 'Geological fault lines and water seepage logged in shift report', status: 'PASS', notes: 'Dry condition, no water ingress' },
    ],
    'HEMM Machinery & Transport Safety Audit': [
      { id: 1, category: 'Heavy Machinery', item: 'Haul Truck & Loader dual braking system (Service & Emergency) tested', status: 'PASS', notes: 'Brake holding capacity verified' },
      { id: 2, category: 'Transport Safety', item: 'Proximity Warning System & rear-view cameras functioning', status: 'PASS', notes: 'Sensor alert distance 15m active' },
      { id: 3, category: 'Conveyor Safety', item: 'Pull-cord emergency stop switches tested along conveyor belt', status: 'PASS', notes: 'Immediate trip confirmed' },
      { id: 4, category: 'Machine Maintenance', item: 'Automatic fire suppression system (AFSS) pressure gauge green', status: 'PASS', notes: 'Fire suppression active' },
      { id: 5, category: 'Haul Road Safety', item: 'Haul road berm height maintained at minimum full-wheel diameter', status: 'FAIL', notes: 'Berm height degraded near junction B' },
      { id: 6, category: 'Operator Licensing', item: 'HEMM Operator holds valid DGMS Heavy Operator Permit', status: 'PASS', notes: 'License verified valid till 2028' },
    ]
  };

  const [shift, setShift] = useState('Shift A (06:00 - 14:00)');
  const [checklist, setChecklist] = useState(SOP_CHECKLIST_TEMPLATES['Electrical & Personnel Compliance Safety Inspection']);

  const handleAuditTypeChange = (newType) => {
    setInspectionType(newType);
    if (SOP_CHECKLIST_TEMPLATES[newType]) {
      setChecklist(SOP_CHECKLIST_TEMPLATES[newType]);
    }
  };

  const updateItemStatus = (id, newStatus) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const updateItemNotes = (id, notes) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  };

  const hasFailures = checklist.some(item => item.status === 'FAIL');

  const handleSubmit = (e) => {
    e.preventDefault();
    const overallResult = hasFailures ? 'FAILED' : 'PASSED';
    const newInsp = createInspection({
      mineId,
      mineName: selectedMine?.mineName || 'Demo Mine Alpha',
      area,
      shift,
      inspectionType,
      checklistResults: checklist,
      overallResult,
      notes: generalNotes || (hasFailures ? 'Inspection logged compliance failures requiring immediate rectification.' : 'All statutory safety parameters verified in nominal condition.'),
      evidence: 'evidence_field_inspection_01.jpg',
      inspectorId: currentUser?.userId || 'inspector01',
      inspectorName: currentUser?.name || 'Rajesh Kumar',
      latitude: gpsLocation?.latitude ?? null,
      longitude: gpsLocation?.longitude ?? null,
      locationTimestamp: gpsLocation?.locationTimestamp ?? null,
    }, currentUser?.name);

    setSubmittedInspection(newInsp);
    const offlineNotice = !navigator.onLine ? ' (Saved Offline — Pending Sync)' : '';
    if (hasFailures) {
      setShowViolationModal(true);
    } else {
      setInspectionSuccessMsg(`Inspection ${newInsp.inspectionId} submitted successfully${offlineNotice}.`);
    }
  };

  const candidateCert = candidateWorker ? certificates.find(c => c.workerId === candidateWorker.workerId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-400" />
            <span>Digital Field Safety Inspection Runner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard Operating Procedure (SOP) safety & compliance evaluation checklist
          </p>
        </div>

        {/* GPS Location Status Badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 font-mono ${
            gpsStatus === 'CAPTURED' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : gpsStatus === 'CAPTURING' 
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{gpsMessage || 'GPS Idle'}</span>
            <button
              type="button"
              onClick={requestGpsLocation}
              title="Refresh GPS Location"
              className="ml-1 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'CAPTURING' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {inspectionSuccessMsg && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{inspectionSuccessMsg}</span>
          </div>
          <button
            onClick={() => {
              setInspectionSuccessMsg('');
              if (onComplete) onComplete();
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Inspection Header Controls */}
        <div className="bg-coal-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Coal Mine</label>
            <select
              value={mineId}
              disabled={isSingleMineRole}
              onChange={(e) => handleMineChange(e.target.value)}
              className={`w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-medium ${isSingleMineRole ? 'opacity-80 cursor-not-allowed border-amber-500/40 text-amber-300 font-semibold' : ''}`}
            >
              {isSingleMineRole ? (
                <option value={mineId}>
                  {(selectedMine?.mineName || currentUser?.mineName || 'Assigned Mine')} ({mineId}) (Assigned Unit)
                </option>
              ) : (
                mines.map(m => (
                  <option key={m.mineId} value={m.mineId}>{m.mineName} ({m.mineId})</option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Inspected Mine Zone / Operational Area</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              {selectedMine?.zones ? (
                selectedMine.zones.map(z => (
                  <option key={z.zoneId} value={z.zoneName}>{z.zoneId}: {z.zoneName}</option>
                ))
              ) : (
                <>
                  <option value="North Shaft">North Shaft</option>
                  <option value="South Shaft">South Shaft</option>
                  <option value="Processing Plant">Processing Plant</option>
                  <option value="Substation">Substation</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Operational Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="Shift A (06:00 - 14:00)">Shift A (06:00 - 14:00)</option>
              <option value="Shift B (14:00 - 22:00)">Shift B (14:00 - 22:00)</option>
              <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">SOP Audit Type (Dynamic Checklist)</label>
            <select
              value={inspectionType}
              onChange={(e) => handleAuditTypeChange(e.target.value)}
              className="w-full px-3 py-2 bg-coal-950 border border-amber-500/60 text-amber-300 font-bold rounded-lg text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="Electrical & Personnel Compliance Safety Inspection">Electrical & Personnel Compliance</option>
              <option value="Ventilation & Gas Testing Audit">Ventilation & Gas Testing Audit</option>
              <option value="Roof Support & Strata Control Inspection">Roof Support & Strata Control</option>
              <option value="HEMM Machinery & Transport Safety Audit">HEMM Machinery & Transport Safety</option>
            </select>
          </div>
        </div>

        {/* Checklist Table */}
        <div className="bg-coal-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Safety Evaluation Checklist ({checklist.length} Items)
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pass
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="w-3.5 h-3.5" /> Fail (Violation)
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <MinusCircle className="w-3.5 h-3.5" /> N/A
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {checklist.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-1.5">{item.item}</p>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    placeholder="Add inspector field observation notes..."
                    className="mt-2 w-full max-w-lg px-2.5 py-1 bg-coal-950 border border-slate-700/80 rounded text-[11px] text-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* PASS / FAIL / NA Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateItemStatus(item.id, 'PASS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      item.status === 'PASS'
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                        : 'bg-coal-950 text-slate-400 hover:text-emerald-400 border border-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateItemStatus(item.id, 'FAIL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      item.status === 'FAIL'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse'
                        : 'bg-coal-950 text-slate-400 hover:text-red-400 border border-slate-800'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>FAIL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateItemStatus(item.id, 'N/A')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      item.status === 'N/A'
                        ? 'bg-slate-700 text-white'
                        : 'bg-coal-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>N/A</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Notes & Submit */}
        <div className="bg-coal-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Inspector Overall Concluding Remarks</label>
          <textarea
            rows="2"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            placeholder="Summarize key inspection findings, immediate hazard warnings, or verbal instructions given..."
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              {hasFailures ? (
                <div className="flex items-center gap-1.5 text-red-400 font-semibold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Compliance Failures Detected — Filing violation ticket will be required</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All evaluated safety parameters PASS</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs rounded-lg shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Field Inspection Report</span>
            </button>
          </div>
        </div>
      </form>

      {/* Auto Report Violation Modal upon failure */}
      <ReportViolationModal
        isOpen={showViolationModal}
        onClose={() => {
          setShowViolationModal(false);
          if (onComplete) onComplete();
        }}
        initialData={{
          mineId,
          area,
          category: 'Statutory Certification Breach',
          severity: 'HIGH',
          workerId: candidateWorker?.workerId || '',
          certificateId: candidateCert?.certificateId || '',
          description: candidateWorker 
            ? `${candidateWorker.role} ${candidateWorker.name} (${candidateWorker.workerId}) observed on duty in ${area} with expired safety competency certification.`
            : `Safety non-compliance detected in ${area} requiring immediate remediation.`,
          inspectionId: submittedInspection?.inspectionId
        }}
      />
    </div>
  );
}
