import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { ShieldCheck, CheckCircle2, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';

export default function VerificationList() {
  const { violations, correctiveActions, verifyAndResolveViolation } = useData();
  const { currentUser } = useAuth();
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState('Verified renewed competency certificate document. Remediation conforms with applicable safety requirements.');
  const [isResolving, setIsResolving] = useState(false);

  // Filter violations awaiting verification
  const pendingVerifications = violations.filter(v => v.status === 'VERIFICATION REQUIRED');
  const resolvedViolations = violations.filter(v => v.status === 'RESOLVED');

  const handleVerify = () => {
    if (!selectedViolation) return;
    setIsResolving(true);
    verifyAndResolveViolation(selectedViolation.violationId, verifyNotes, currentUser?.name);
    setIsResolving(false);
    setSelectedViolation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Inspector Verification & Closure Sign-Off</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review completed corrective actions submitted by Mine Officers and formally sign-off compliance resolution
          </p>
        </div>
        <Badge size="md">{pendingVerifications.length} Awaiting Sign-Off</Badge>
      </div>

      {/* Pending Verifications Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Remediations Awaiting Compliance Verification
        </h3>

        {pendingVerifications.length === 0 ? (
          <div className="p-8 text-center bg-coal-900 border border-slate-800 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-white">No Pending Verifications</p>
            <p className="text-[11px] text-slate-400 mt-1">
              All submitted corrective actions have been verified and formally resolved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pendingVerifications.map((v) => {
              const linkedAction = correctiveActions.find(ca => ca.violationId === v.violationId);
              return (
                <div key={v.violationId} className="p-4 bg-coal-900 border border-blue-500/30 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{v.violationId}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">• {v.mineName} ({v.area})</span>
                      <Badge size="sm">{v.severity}</Badge>
                      <Badge size="sm">VERIFICATION REQUIRED</Badge>
                    </div>

                    <p className="text-xs font-semibold text-slate-200">{v.description}</p>

                    {linkedAction && (
                      <div className="p-2.5 rounded-lg bg-coal-950 border border-slate-800 text-[11px] text-slate-300">
                        <p className="font-semibold text-blue-400">Mine Officer Remediation Notes:</p>
                        <p className="text-slate-300 mt-0.5">{linkedAction.completionNotes || 'Renewed documentation submitted.'}</p>
                        {linkedAction.evidence && (
                          <p className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                            <FileText className="w-3 h-3 text-emerald-400" /> Attached Doc: {linkedAction.evidence}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedViolation(v)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Review & Sign-Off</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolved History */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Recently Resolved & Verified Compliance Records ({resolvedViolations.length})
        </h3>
        <div className="bg-coal-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-800">
            {resolvedViolations.map(v => (
              <div key={v.violationId} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{v.violationId}</span>
                    <span className="text-slate-400 font-semibold">{v.mineName}</span>
                    <Badge size="sm">RESOLVED</Badge>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">{v.description}</p>
                </div>
                <div className="text-right font-mono text-[11px] text-slate-400 shrink-0">
                  <span>Resolved: {formatDate(v.resolvedDate || v.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review & Verify Modal */}
      {selectedViolation && (
        <Modal isOpen={!!selectedViolation} onClose={() => setSelectedViolation(null)} title="✅ Inspector Verification Sign-Off" subtitle="Confirm that compliance remediation meets safety requirements">
          <div className="space-y-4">
            <div className="p-3.5 bg-coal-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-white">{selectedViolation.violationId}</span>
                <span className="text-slate-400">{selectedViolation.mineName} — {selectedViolation.area}</span>
              </div>
              <p className="text-xs text-slate-200">{selectedViolation.description}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Inspector Verification Notes</label>
              <textarea
                rows="3"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Clicking sign-off will transition the violation to <strong>RESOLVED</strong>, recalculate the mine compliance scorecard, and notify Management & Regulatory Authority.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedViolation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={isResolving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-600/20"
              >
                Formally Sign-Off & Close Violation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
