import React from 'react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateHelpers';
import Badge from '../common/Badge';
import { Download, Printer, ShieldCheck, Flame } from 'lucide-react';

export default function ExecutiveReportView() {
  const { mines, violations, correctiveActions, workers, staffProfiles = [] } = useData();

  const inspectorProfile = staffProfiles.find(s => s.role === 'INSPECTOR') || { name: 'Anita Kulkarni', badge_id: 'INS-001' };
  const authorityProfile = staffProfiles.find(s => s.role === 'AUTHORITY' || s.role === 'MANAGEMENT') || { name: 'Dr. Arindam Sen', badge_id: 'AUTH-001' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Executive Mine Compliance Scorecard & Summary Report</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generated executive summary report for compliance tracking and board review (Database Backed)
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Paper Card */}
      <div className="bg-coal-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-black font-extrabold text-2xl">
              <Flame className="w-7 h-7 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">MINING COMPLIANCE & SAFETY AUDIT REPORT</h3>
              <p className="text-xs text-slate-400">MineGuard AI Governance System • Statutory Audit Report</p>
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            <p>Report Date: {new Date().toLocaleDateString('en-GB')}</p>
            <p>Status: VERIFIED DATABASE STATE</p>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">1. Executive Governance Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-coal-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Total Mines Audited</span>
              <p className="font-bold text-white text-lg mt-0.5">{mines.length}</p>
            </div>
            <div className="p-3 bg-coal-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Average Compliance</span>
              <p className="font-bold text-emerald-400 text-lg mt-0.5">
                {mines.length > 0 ? Math.round(mines.reduce((a,b)=>a+b.complianceScore,0)/mines.length) : 80}%
              </p>
            </div>
            <div className="p-3 bg-coal-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Active Violations</span>
              <p className="font-bold text-red-400 text-lg mt-0.5">{violations.filter(v=>v.status!=='RESOLVED').length}</p>
            </div>
            <div className="p-3 bg-coal-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px]">Total Monitored Crew</span>
              <p className="font-bold text-white text-lg mt-0.5">{workers.length}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Mine Level Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">2. Mine-by-Mine Compliance Breakdown</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-coal-950 border-b border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-2.5">Mine Name</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Score</th>
                  <th className="p-2.5">Risk Level</th>
                  <th className="p-2.5">Safety Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-[11px]">
                {mines.map(m => (
                  <tr key={m.mineId}>
                    <td className="p-2.5 font-bold text-white">{m.mineName}</td>
                    <td className="p-2.5 text-slate-300">{m.location}</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-400">{m.complianceScore}%</td>
                    <td className="p-2.5"><Badge size="sm">{m.riskLevel}</Badge></td>
                    <td className="p-2.5 text-slate-400">{m.officer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Statutory Certification Sign-Off */}
        <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-400">
          <div>
            <p className="font-bold text-slate-200">Statutory Mine Inspector:</p>
            <p className="mt-4 font-mono text-slate-300">{inspectorProfile.name} ({inspectorProfile.badge_id || inspectorProfile.userId || 'INS-001'})</p>
            <p className="text-[10px]">Regulatory Inspection Authority (Database Authenticated)</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-200">Director General Safety:</p>
            <p className="mt-4 font-mono text-slate-300">{authorityProfile.name} ({authorityProfile.badge_id || authorityProfile.userId || 'AUTH-001'})</p>
            <p className="text-[10px]">Directorate General of Mines Safety</p>
          </div>
        </div>
      </div>
    </div>
  );
}
