import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { ShieldAlert, CheckCircle2, Clock, Plus, ArrowRight, UserCheck, Search, Filter, FileText, Send } from 'lucide-react';
import CreateActionModal from './CreateActionModal';
import AddCertificateModal from './AddCertificateModal';
import Modal from '../common/Modal';

export default function CorrectiveActionManager() {
  const { correctiveActions, violations, mines, updateCorrectiveAction, uploadFileReference } = useData();
  const { currentUser } = useAuth();
  const [selectedViolationForAction, setSelectedViolationForAction] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [targetCertData, setTargetCertData] = useState({});

  // Direct Remediation Submission Modal State
  const [actionForRemediation, setActionForRemediation] = useState(null);
  const [remediationNotes, setRemediationNotes] = useState('');
  const [remediationDoc, setRemediationDoc] = useState('remediation_evidence_report.pdf');
  const [remediationFileObj, setRemediationFileObj] = useState(null);

  // Filters
  const [selectedMine, setSelectedMine] = useState(currentUser?.role === 'OFFICER' ? (currentUser.mineId || 'MINE-01') : 'ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActions = correctiveActions.filter(ca => {
    if (selectedMine !== 'ALL' && ca.mineId !== selectedMine) return false;
    if (filterStatus !== 'ALL' && ca.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && ca.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ca.actionId.toLowerCase().includes(q) ||
             ca.title.toLowerCase().includes(q) ||
             ca.violationId.toLowerCase().includes(q) ||
             ca.assignedTo.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenCertModalForAction = (ca) => {
    const linkedV = violations.find(v => v.violationId === ca.violationId);
    setTargetCertData({
      workerId: linkedV?.workerId || 'W-10452',
      linkedViolationId: ca.violationId,
      certificateType: 'Electrical Competency Certificate'
    });
    setShowAddCertModal(true);
  };

  const handleSubmitRemediation = async (e) => {
    e.preventDefault();
    if (!actionForRemediation) return;

    if (remediationFileObj && uploadFileReference) {
      try {
        await uploadFileReference({
          file: remediationFileObj,
          relatedRecordType: 'CORRECTIVE_ACTION',
          relatedRecordId: actionForRemediation.actionId,
          uploadedBy: currentUser?.name || 'Mine Officer'
        });
      } catch (err) {
        console.warn('R2 remediation upload notice:', err);
      }
    }

    updateCorrectiveAction(actionForRemediation.actionId, {
      status: 'VERIFICATION REQUIRED',
      completionNotes: remediationNotes || 'Remediation completed by maintenance & safety desk. Awaiting Inspector verification.',
      evidence: remediationDoc
    }, 'Mine Safety Officer');

    setActionForRemediation(null);
    setRemediationNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Corrective & Preventive Action (CAPA) Lifecycle</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track compliance remediation from initial assignment through evidence submission and inspector verification
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Corrective Action</span>
          </button>
          <button
            onClick={() => {
              setTargetCertData({});
              setShowAddCertModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <span>+ Upload Renewed Cert</span>
          </button>
        </div>
      </div>

      {/* Action Lifecycle Pipeline Visualizer */}
      <div className="bg-coal-900 border border-slate-800 p-4 rounded-xl shadow-lg">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Remediation Lifecycle Stages
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-coal-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block">STAGE 1</span>
            <span className="font-bold text-white mt-1 block">ASSIGNED</span>
          </div>
          <div className="p-2.5 rounded-lg bg-coal-950 border border-amber-500/30 text-amber-400">
            <span className="text-[10px] text-amber-400 font-bold block">STAGE 2</span>
            <span className="font-bold mt-1 block">IN PROGRESS</span>
          </div>
          <div className="p-2.5 rounded-lg bg-coal-950 border border-blue-500/30 text-blue-400">
            <span className="text-[10px] text-blue-400 font-bold block">STAGE 3</span>
            <span className="font-bold mt-1 block">EVIDENCE SUBMITTED</span>
          </div>
          <div className="p-2.5 rounded-lg bg-coal-950 border border-purple-500/30 text-purple-400">
            <span className="text-[10px] text-purple-400 font-bold block">STAGE 4</span>
            <span className="font-bold mt-1 block">VERIFY REQUIRED</span>
          </div>
          <div className="p-2.5 rounded-lg bg-coal-950 border border-emerald-500/30 text-emerald-400">
            <span className="text-[10px] text-emerald-400 font-bold block">STAGE 5</span>
            <span className="font-bold mt-1 block">VERIFIED & CLOSED</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-coal-900 border border-slate-800 p-3.5 rounded-xl text-xs">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter by Mine</label>
          <select
            value={selectedMine}
            disabled={currentUser?.role === 'OFFICER'}
            onChange={(e) => setSelectedMine(e.target.value)}
            className={`w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none ${currentUser?.role === 'OFFICER' ? 'opacity-80 cursor-not-allowed border-amber-500/40 text-amber-300 font-semibold' : ''}`}
          >
            {currentUser?.role === 'OFFICER' ? (
              <option value={currentUser.mineId || 'MINE-01'}>Demo Mine Alpha (Assigned Unit)</option>
            ) : (
              <>
                <option value="ALL">All Mines ({correctiveActions.length} Actions)</option>
                {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.mineName}</option>)}
              </>
            )}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status Filter</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses ({correctiveActions.length})</option>
            <option value="PENDING">PENDING</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
            <option value="VERIFICATION REQUIRED">VERIFICATION REQUIRED</option>
            <option value="VERIFIED">VERIFIED</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Priority Filter</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search CAPA</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, ticket ID, team..."
            className="w-full px-2.5 py-1.5 bg-coal-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Corrective Actions Table */}
      <div className="space-y-3">
        {filteredActions.length === 0 ? (
          <p className="p-8 text-center text-slate-400 bg-coal-900 border border-slate-800 rounded-xl text-xs">
            No corrective actions match the selected filter.
          </p>
        ) : (
          filteredActions.map((ca) => {
            const linkedViolation = violations.find(v => v.violationId === ca.violationId);
            const linkedMine = mines.find(m => m.mineId === ca.mineId);
            const isCertRelated = linkedViolation?.category?.includes('Cert') || linkedViolation?.certificateId;

            return (
              <div key={ca.actionId} className="p-4 bg-coal-900 border border-slate-800 hover:border-slate-700 rounded-xl shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{ca.actionId}</span>
                    <span className="text-xs text-slate-400 font-semibold">• For {ca.violationId} ({linkedMine?.mineName || ca.mineId})</span>
                    <Badge size="sm">{ca.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge size="sm">{ca.status}</Badge>
                    <span className="text-[11px] text-slate-400 font-mono">Due: {formatDate(ca.dueDate)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <h4 className="font-bold text-white">{ca.title}</h4>
                    <p className="text-slate-300 leading-relaxed">{ca.description}</p>
                    <p className="text-[11px] text-slate-400 pt-1">
                      <strong>Assigned To:</strong> {ca.assignedTo} • <strong>Created:</strong> {formatDate(ca.createdDate)}
                    </p>
                  </div>

                  <div className="p-3 bg-coal-950 rounded-lg border border-slate-800 text-[11px] space-y-2">
                    <p className="font-bold text-slate-300">Remediation Status:</p>
                    <p className="text-slate-400 leading-relaxed">
                      {ca.completionNotes || 'Remediation currently in progress.'}
                    </p>
                    {ca.evidence && (
                      <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Evidence: {ca.evidence}
                      </p>
                    )}

                    {ca.status !== 'VERIFIED' && ca.status !== 'RESOLVED' && ca.status !== 'VERIFICATION REQUIRED' && (
                      <div className="pt-1 flex flex-col gap-1.5">
                        {isCertRelated ? (
                          <button
                            onClick={() => handleOpenCertModalForAction(ca)}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Upload Renewed Certificate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActionForRemediation(ca);
                              setRemediationNotes(ca.completionNotes || '');
                            }}
                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-[11px] transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Submit Remediation & Request Verification</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for creating action */}
      <CreateActionModal
        isOpen={showCreateModal || !!selectedViolationForAction}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedViolationForAction(null);
        }}
        violation={selectedViolationForAction}
      />

      {/* Modal for registering certificate */}
      <AddCertificateModal
        isOpen={showAddCertModal}
        onClose={() => setShowAddCertModal(false)}
        initialData={targetCertData}
      />

      {/* Modal for submitting non-cert remediation evidence */}
      {actionForRemediation && (
        <Modal
          isOpen={!!actionForRemediation}
          onClose={() => setActionForRemediation(null)}
          title="📝 Submit Action Remediation & Evidence"
          subtitle={`Submit completion notes for Action ${actionForRemediation.actionId}`}
        >
          <form onSubmit={handleSubmitRemediation} className="space-y-4 text-xs">
            <div className="p-3 bg-coal-950 rounded-lg border border-slate-800 space-y-1">
              <span className="font-mono text-slate-400">Action: {actionForRemediation.actionId}</span>
              <p className="font-bold text-white">{actionForRemediation.title}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Completion & Remediation Notes</label>
              <textarea
                rows="3"
                value={remediationNotes}
                onChange={(e) => setRemediationNotes(e.target.value)}
                placeholder="Describe actions taken, parts replaced, sensor recalibrations, or procedural fixes completed..."
                className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Evidence Document Attachment (Cloudflare R2 Storage)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={remediationDoc}
                  onChange={(e) => setRemediationDoc(e.target.value)}
                  className="flex-1 px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  required
                />
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer flex items-center gap-1.5 shrink-0">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Attach File</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setRemediationFileObj(file);
                        setRemediationDoc(file.name);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActionForRemediation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Inspector Verification</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
