import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Scale, Send } from 'lucide-react';

export default function IssueDirectiveModal({ isOpen, onClose }) {
  const { mines, issueDirective } = useData();
  const { currentUser } = useAuth();

  const [mineId, setMineId] = useState('MINE-03'); // Default to Gamma
  const [title, setTitle] = useState('Mandatory Ventilation Recalibration & Blasting Protocol Audit');
  const [description, setDescription] = useState('Notice: Compliance scores in Deep Seam IV have breached threshold. AI-assisted analysis recommends immediate engineering audit within 48 hours. This is a prototype-generated notice.');
  const [severity, setSeverity] = useState('CRITICAL');

  const handleSubmit = (e) => {
    e.preventDefault();
    issueDirective({
      mineId,
      title,
      description,
      severity,
    }, currentUser?.name);

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚖️ Issue Regulatory Compliance Notice" subtitle="Issue an AI-assisted compliance notice to a non-compliant mine (Prototype)" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Target Non-Compliant Mine</label>
          <select
            value={mineId}
            onChange={(e) => setMineId(e.target.value)}
            className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {mines.map(m => (
              <option key={m.mineId} value={m.mineId}>{m.mineName} (Compliance: {m.complianceScore}%)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Compliance Notice Title / Reference</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Compliance Remediation Directives</label>
          <textarea
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-coal-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
            required
          />
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
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-red-600/20 flex items-center gap-1.5"
          >
            <Scale className="w-4 h-4" />
            <span>Issue Compliance Notice</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
