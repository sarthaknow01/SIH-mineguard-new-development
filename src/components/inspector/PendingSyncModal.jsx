import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import { getAllPendingItems, triggerAutoSync } from '../../utils/offlineSyncManager';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, FileText, ClipboardCheck, ShieldAlert } from 'lucide-react';

export default function PendingSyncModal({ isOpen, onClose }) {
  const [pendingState, setPendingState] = useState({ inspections: [], violations: [], evidence: [], totalPending: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const refreshPendingList = async () => {
    const data = await getAllPendingItems();
    setPendingState(data);
  };

  useEffect(() => {
    if (isOpen) {
      refreshPendingList();
      setSyncMsg('');
    }
  }, [isOpen]);

  const handleSyncNow = async () => {
    if (!navigator.onLine) {
      setSyncMsg('Cannot sync: Device is currently OFFLINE.');
      return;
    }

    setIsSyncing(true);
    setSyncMsg('Synchronizing pending records to Supabase & Backblaze B2...');
    try {
      const res = await triggerAutoSync();
      await refreshPendingList();
      if (res.success) {
        setSyncMsg(`✅ Successfully synced ${res.syncedCount} item(s) to cloud database.`);
      } else {
        setSyncMsg(`Synced ${res.syncedCount} item(s). Encountered ${res.errorsCount} error(s).`);
      }
    } catch (err) {
      setSyncMsg('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const isOnline = navigator.onLine;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📡 Offline Sync Manager & Queue"
      subtitle="Pending field inspections, violations, and evidence queued for cloud synchronization"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Network & Sync Status Header */}
        <div className="p-3 bg-coal-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Wifi className="w-4 h-4 text-emerald-400" />
                ONLINE (Internet Connected)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
                OFFLINE (Local Mode Active)
              </span>
            )}
            <span className="text-slate-400 font-mono text-[11px]">
              • {pendingState.totalPending} Pending Item(s)
            </span>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing || pendingState.totalPending === 0 || !isOnline}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
              isOnline && pendingState.totalPending > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {syncMsg && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 font-mono">
            {syncMsg}
          </div>
        )}

        {/* Pending Items List */}
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {pendingState.totalPending === 0 ? (
            <div className="p-8 border border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-white">All Records Synchronized</p>
              <p>No offline inspection or violation items currently queued in IndexedDB.</p>
            </div>
          ) : (
            <>
              {/* Pending Inspections */}
              {pendingState.inspections.map((insp) => (
                <div key={insp.inspectionId} className="p-3 bg-coal-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ClipboardCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Inspection {insp.inspectionId}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                          {insp.overallResult}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mine: {insp.mineName || insp.mineId} ({insp.area}) • Saved Offline: {new Date(insp.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge size="sm">PENDING SYNC</Badge>
                </div>
              ))}

              {/* Pending Violations */}
              {pendingState.violations.map((vio) => (
                <div key={vio.violationId} className="p-3 bg-coal-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Violation {vio.violationId}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                          {vio.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Category: {vio.category} • Mine: {vio.mineName || vio.mineId} ({vio.area})
                      </p>
                    </div>
                  </div>
                  <Badge size="sm">PENDING SYNC</Badge>
                </div>
              ))}

              {/* Pending Evidence Files */}
              {pendingState.evidence.map((ev) => (
                <div key={ev.fileId} className="p-3 bg-coal-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">
                        <span>File: {ev.fileName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Target Record: {ev.relatedRecordId} ({ev.relatedRecordType})
                      </p>
                    </div>
                  </div>
                  <Badge size="sm">PENDING B2 UPLOAD</Badge>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
