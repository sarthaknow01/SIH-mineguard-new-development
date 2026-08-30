import React from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/dateHelpers';
import { Building2, Users, AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';

export default function MineDetailModal({ isOpen, onClose, mine }) {
  const { workers, violations, correctiveActions, certificates } = useData();

  if (!mine) return null;

  const mineWorkers = workers.filter(w => w.mineId === mine.mineId);
  const mineViolations = violations.filter(v => v.mineId === mine.mineId);
  const mineActions = correctiveActions.filter(ca => ca.mineId === mine.mineId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`🏢 ${mine.mineName} — Executive Performance Audit`} subtitle={mine.location} maxWidth="max-w-3xl">
      <div className="space-y-5">
        {/* Top Score Banner */}
        <div className="p-4 bg-coal-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Statutory Compliance Rating</span>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-3xl font-extrabold font-mono ${mine.complianceScore >= 80 ? 'text-emerald-400' : mine.complianceScore >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                {mine.complianceScore}%
              </span>
              <Badge size="md">{mine.riskLevel} RISK</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="p-2 bg-coal-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Workforce</span>
              <p className="font-bold text-white text-base mt-0.5">{mineWorkers.length}</p>
            </div>
            <div className="p-2 bg-coal-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Open Violations</span>
              <p className="font-bold text-red-400 text-base mt-0.5">{mineViolations.filter(v => v.status !== 'RESOLVED').length}</p>
            </div>
            <div className="p-2 bg-coal-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">CAPA Actions</span>
              <p className="font-bold text-amber-400 text-base mt-0.5">{mineActions.length}</p>
            </div>
          </div>
        </div>

        {/* Violations in this mine */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Logged Compliance Violations ({mineViolations.length})
          </h4>
          <div className="space-y-2">
            {mineViolations.length === 0 ? (
              <p className="p-4 bg-coal-950 rounded-lg border border-slate-800 text-xs text-slate-400 text-center">No compliance violations reported for this mine.</p>
            ) : (
              mineViolations.map(v => (
                <div key={v.violationId} className="p-3 bg-coal-950 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{v.violationId}</span>
                      <span className="text-slate-400 font-semibold">{v.area}</span>
                      <Badge size="sm">{v.severity}</Badge>
                    </div>
                    <p className="text-slate-200 mt-1">{v.description}</p>
                  </div>
                  <Badge size="sm">{v.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workforce in this mine */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Assigned Personnel ({mineWorkers.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mineWorkers.map(w => (
              <div key={w.workerId} className="p-2.5 bg-coal-950 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{w.name}</p>
                  <p className="text-[11px] text-amber-400 font-medium">{w.role}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400">{w.workerId}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold"
          >
            Close Mine Profile
          </button>
        </div>
      </div>
    </Modal>
  );
}
