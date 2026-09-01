import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import { formatDate, calculateCertificateStatus } from '../../utils/dateHelpers';
import { LayoutDashboard, Users, FileCheck, ShieldAlert, AlertTriangle, ArrowRight, Plus, CheckCircle2 } from 'lucide-react';
import AddCertificateModal from './AddCertificateModal';
import CreateActionModal from './CreateActionModal';

export default function OfficerDashboard({ onNavigate }) {
  const { mines, workers, certificates, violations, correctiveActions, alerts } = useData();
  const { currentUser } = useAuth();
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [selectedViolationForAction, setSelectedViolationForAction] = useState(null);
  const [targetCertUpload, setTargetCertUpload] = useState({});

  // Focus on Mine Alpha (Officer's assigned mine)
  const currentMineId = currentUser?.mineId || 'MINE-01';
  const myMine = mines.find(m => m.mineId === currentMineId) || mines[0];
  const myWorkers = workers.filter(w => w.mineId === currentMineId);
  const myViolations = violations.filter(v => v.mineId === currentMineId && v.status !== 'RESOLVED');
  const myActions = correctiveActions.filter(ca => ca.mineId === currentMineId);

  // Expiring certs in this mine
  const expiringCerts = certificates.filter(c => {
    if (c.mineId !== currentMineId) return false;
    const st = calculateCertificateStatus(c.expiryDate).status;
    return st === 'EXPIRING SOON' || st === 'EXPIRED';
  });

  const handleOpenUploadForCert = (c) => {
    const linkedV = violations.find(v => (v.workerId === c.workerId || v.certificateId === c.certificateId) && v.status !== 'RESOLVED');
    setTargetCertUpload({
      workerId: c.workerId,
      certificateType: c.certificateType,
      certificateId: `CERT-2026-${Date.now().toString().slice(-4)}`,
      linkedViolationId: linkedV?.violationId || ''
    });
    setShowAddCertModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Mine Safety & Compliance Command</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
              {myMine.mineName}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Officer in Charge: <strong>{currentUser?.name}</strong> • {myMine.location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (expiringCerts.length > 0) {
                handleOpenUploadForCert(expiringCerts[0]);
              } else {
                setTargetCertUpload({});
                setShowAddCertModal(true);
              }
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Renewed Certificate</span>
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mine Compliance Score"
          value={`${myMine.complianceScore}%`}
          subtitle={`Risk Level: ${myMine.riskLevel}`}
          icon={LayoutDashboard}
          color={myMine.complianceScore >= 80 ? 'emerald' : 'amber'}
        />
        <StatCard
          title="Active Violations"
          value={myViolations.length}
          subtitle="Awaiting Remediation"
          icon={AlertTriangle}
          color={myViolations.length > 0 ? 'red' : 'emerald'}
          onClick={() => onNavigate('violations')}
        />
        <StatCard
          title="Expiring / Expired Certs"
          value={expiringCerts.length}
          subtitle="Immediate Action Required"
          icon={FileCheck}
          color="amber"
          onClick={() => onNavigate('certificates')}
        />
        <StatCard
          title="Active Workforce"
          value={myWorkers.length}
          subtitle="Monitored Personnel"
          icon={Users}
          color="blue"
          onClick={() => onNavigate('workers')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Violations & Corrective Actions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Open Violations requiring Officer Action */}
          <div className="bg-coal-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Violations Requiring Corrective Action ({myViolations.length})</span>
              </h3>
              <button
                onClick={() => onNavigate('violations')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>View Inbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {myViolations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-coal-950/50 rounded-lg border border-slate-800/80">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-300">No Active Violations Pending Action</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">All statutory safety parameters for {myMine.mineName} are fully verified.</p>
                </div>
              ) : (
                myViolations.slice(0, 4).map((v) => (
                  <div 
                    key={v.violationId} 
                    className={`p-3.5 bg-coal-950 rounded-xl border border-slate-800/90 hover:border-slate-700 transition-all space-y-2 relative overflow-hidden ${
                      v.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500' : v.severity === 'HIGH' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-blue-500'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{v.violationId}</span>
                        <span className="text-xs text-slate-300 font-semibold">{v.area}</span>
                        <Badge size="sm">{v.severity}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          ⚡ AI Risk: {v.riskScore || 85}/100
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-400/90">{v.category}</p>
                        <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">{v.description}</p>
                        {v.workerName && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            👤 Personnel: <span className="text-slate-300 font-semibold">{v.workerName} ({v.workerId})</span>
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setSelectedViolationForAction(v)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-600/20 transition-all flex items-center gap-1"
                        >
                          <span>Assign Action</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {myViolations.length > 4 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => onNavigate('violations')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center justify-center gap-1 mx-auto"
                  >
                    <span>+ {myViolations.length - 4} More Violations in Inbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pending Corrective Actions */}
          <div className="bg-coal-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Active Remediation Pipeline ({myActions.length})</span>
              </h3>
              <button
                onClick={() => onNavigate('actions')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Manage All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800 mt-2">
              {myActions.slice(0, 3).map((ca) => (
                <div key={ca.actionId} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{ca.actionId}</span>
                      <span className="text-slate-200 font-medium truncate max-w-sm">{ca.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Assigned to: {ca.assignedTo}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge size="sm">{ca.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Expiring Certificates & Quick Upload */}
        <div className="space-y-5">
          <div className="bg-coal-900 border border-amber-500/30 rounded-xl p-5 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>Certificates Requiring Renewal</span>
            </h4>

            <div className="space-y-3">
              {expiringCerts.slice(0, 4).map((c) => {
                const st = calculateCertificateStatus(c.expiryDate);
                return (
                  <div key={c.certificateId} className="p-3 bg-coal-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">{c.workerName}</span>
                      <Badge size="sm">{st.status}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">{c.certificateType}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                      <span>Exp: {formatDate(c.expiryDate)}</span>
                      <button
                        onClick={() => handleOpenUploadForCert(c)}
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Upload Renewed
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AddCertificateModal
        isOpen={showAddCertModal}
        onClose={() => setShowAddCertModal(false)}
        initialData={targetCertUpload}
      />
      <CreateActionModal
        isOpen={!!selectedViolationForAction}
        onClose={() => setSelectedViolationForAction(null)}
        violation={selectedViolationForAction}
      />
    </div>
  );
}
