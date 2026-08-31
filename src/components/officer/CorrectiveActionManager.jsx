import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { ShieldAlert, CheckCircle2, Clock, Plus, ArrowRight, UserCheck, Search, Filter, FileText, Send, Building2 } from 'lucide-react';
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
    <div className="space-y-7 selection:bg-[#0265dc] selection:text-white">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Corrective Actions</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Track compliance remediation from initial assignment through evidence submission and inspector verification.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#0265dc] hover:bg-[#0052b4] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0265dc]/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Corrective Action</span>
          </button>
          <button
            onClick={() => {
              setTargetCertData({});
              setShowAddCertModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <span>+ Upload Renewed Cert</span>
          </button>
        </div>
      </div>

      {/* ACTION LIFECYCLE PIPELINE VISUALIZER */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Remediation Lifecycle Stages
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs font-semibold">
          
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] text-slate-400 font-bold block">STAGE 1</span>
            <span className="font-bold text-[#0f172a] mt-1 block">ASSIGNED</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700">
            <span className="text-[10px] text-amber-600 font-bold block">STAGE 2</span>
            <span className="font-bold mt-1 block">IN PROGRESS</span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/80 text-[#0265dc]">
            <span className="text-[10px] text-[#0265dc] font-bold block">STAGE 3</span>
            <span className="font-bold mt-1 block">EVIDENCE SUBMITTED</span>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-700">
            <span className="text-[10px] text-purple-600 font-bold block">STAGE 4</span>
            <span className="font-bold mt-1 block">VERIFY REQUIRED</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700">
            <span className="text-[10px] text-emerald-600 font-bold block">STAGE 5</span>
            <span className="font-bold mt-1 block">VERIFIED & CLOSED</span>
          </div>

        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Filter by Mine</label>
          <select
            value={selectedMine}
            disabled={currentUser?.role === 'OFFICER'}
            onChange={(e) => setSelectedMine(e.target.value)}
            className={`w-full px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none ${currentUser?.role === 'OFFICER' ? 'cursor-not-allowed opacity-80' : ''}`}
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
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status Filter</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses ({correctiveActions.length})</option>
            <option value="PENDING">PENDING</option>
            <option value="IN PROGRESS">IN PROGRESS</option>
            <option value="VERIFICATION REQUIRED">VERIFICATION REQUIRED</option>
            <option value="VERIFIED">VERIFIED</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Priority Filter</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Search CAPA</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action, ticket ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/70 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:bg-white focus:border-[#0265dc]"
            />
          </div>
        </div>

      </div>

      {/* CORRECTIVE ACTIONS CARDS */}
      <div className="space-y-4">
        {filteredActions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-xs text-slate-400 font-medium shadow-sm">
            No corrective actions match the selected filter.
          </div>
        ) : (
          filteredActions.map((ca) => {
            const linkedViolation = violations.find(v => v.violationId === ca.violationId);
            const linkedMine = mines.find(m => m.mineId === ca.mineId);
            const isCertRelated = linkedViolation?.category?.includes('Cert') || linkedViolation?.certificateId;

            return (
              <div key={ca.actionId} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
                
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0f172a] text-sm">{ca.actionId}</span>
                    <span className="text-xs text-slate-500 font-medium">• For {ca.violationId} ({linkedMine?.mineName || ca.mineId})</span>
                    <Badge size="sm">{ca.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge size="sm">{ca.status}</Badge>
                    <span className="text-xs text-slate-500 font-mono">Due: {formatDate(ca.dueDate)}</span>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-700">
                  
                  <div className="md:col-span-2 space-y-1.5">
                    <h4 className="font-bold text-[#0f172a] text-base">{ca.title}</h4>
                    <p className="text-slate-600 leading-relaxed">{ca.description}</p>
                    <p className="text-xs text-slate-400 pt-1">
                      <strong>Assigned To:</strong> {ca.assignedTo} • <strong>Created:</strong> {formatDate(ca.createdDate)}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                    <p className="font-bold text-[#0f172a]">Remediation Status:</p>
                    <p className="text-slate-600 leading-relaxed">
                      {ca.completionNotes || 'Remediation currently in progress.'}
                    </p>
                    {ca.evidence && (
                      <p className="text-xs text-emerald-600 font-mono font-bold flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Evidence: {ca.evidence}
                      </p>
                    )}

                    {ca.status !== 'VERIFIED' && ca.status !== 'RESOLVED' && ca.status !== 'VERIFICATION REQUIRED' && (
                      <div className="pt-2">
                        {isCertRelated ? (
                          <button
                            onClick={() => handleOpenCertModalForAction(ca)}
                            className="w-full py-2 bg-[#0265dc] hover:bg-[#0052b4] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <span>Upload Renewed Certificate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActionForRemediation(ca);
                              setRemediationNotes(ca.completionNotes || '');
                            }}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
              <span className="font-mono text-slate-500 font-bold">Action: {actionForRemediation.actionId}</span>
              <p className="font-bold text-[#0f172a]">{actionForRemediation.title}</p>
            </div>

            <div>
              <label className="block font-bold text-[#0f172a] mb-1.5">Completion & Remediation Notes</label>
              <textarea
                rows="3"
                value={remediationNotes}
                onChange={(e) => setRemediationNotes(e.target.value)}
                placeholder="Describe actions taken, parts replaced, sensor recalibrations, or procedural fixes completed..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white focus:border-[#0265dc]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#0f172a] mb-1.5">Evidence Document Attachment (Cloudflare R2 Storage)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={remediationDoc}
                  onChange={(e) => setRemediationDoc(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:border-[#0265dc]"
                  required
                />
                <label className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer flex items-center gap-1.5 shrink-0">
                  <FileText className="w-4 h-4 text-emerald-600" />
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

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionForRemediation(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-600/20"
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
