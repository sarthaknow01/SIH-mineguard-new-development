import React from 'react';
import Modal from './Modal';
import { PlayCircle, CheckCircle2, ArrowRight, ShieldAlert, FileText, UserCheck } from 'lucide-react';

export default function DemoGuideModal({ isOpen, onClose }) {
  const steps = [
    {
      num: '1',
      role: '👷 INSPECTOR',
      title: 'Conduct Inspection & Detect Compliance Issue',
      desc: '1. Select any coal mine (e.g. "Demo Mine Alpha") and operational area.\n2. Execute the digital SOP checklist: mark passed items.\n3. Mark a failing compliance parameter (e.g. expired competency certificate or equipment issue).\n4. Click "Submit" -> Report Violation -> Observe the explainable AI-Assisted Risk Score (e.g. 86/100) generated with specific risk factor breakdown.',
      highlight: 'Demonstrates digital field inspection, explainable AI risk scoring, and automated alert dispatch.'
    },
    {
      num: '2',
      role: '🧑‍💼 MINE OFFICER',
      title: 'Remediate Issue & Register Corrective Action',
      desc: '1. Switch to Mine Officer role.\n2. Review the new High-Severity Alert in the notification stream.\n3. Open Corrective Actions -> Click "+ Create Corrective Action" to assign a remediation team and target due date.\n4. Open Worker Registry -> Click "+ Add / Renew Certificate" to register renewed competency documentation.\n5. Worker status updates to 🟢 VALID and the issue automatically moves to "VERIFICATION REQUIRED".',
      highlight: 'Demonstrates internal mine compliance management, corrective action lifecycle, and worker certificate registry.'
    },
    {
      num: '3',
      role: '👷 INSPECTOR',
      title: 'Review Remediation & Verify Closure',
      desc: '1. Switch back to Inspector role.\n2. Open "Verification Sign-Off" tab.\n3. Review the uploaded remediation documentation and officer notes.\n4. Click "Review & Sign-Off" -> Formally mark the issue as RESOLVED.',
      highlight: 'Demonstrates dual-party statutory verification and closed-loop issue resolution.'
    },
    {
      num: '4',
      role: '🏢 MANAGEMENT & 🏛️ REGULATORY',
      title: 'Executive Oversight & Cross-Mine Surveillance',
      desc: '1. Switch to Management: Watch the mine compliance score improve realistically (e.g. 84% -> 88%), risk drop, and trend charts update.\n2. Switch to Regulatory Authority: Inspect cross-mine compliance benchmarks across 5 coalfields (e.g. high-risk flags like Mine Gamma at 61%), issue regulatory notices, and review the tamper-evident Audit Trail.',
      highlight: 'Proves centralized connected governance and visibility across all organizational tiers.'
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏆 SIH Presentation Walkthrough & Demonstration Flow" subtitle="Recommended step-by-step presentation script to demonstrate the complete compliance lifecycle" maxWidth="max-w-3xl">
      <div className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-xs text-amber-300">
          <strong>Core Presentation Message:</strong> "MineGuard AI demonstrates an explainable, closed-loop compliance and safety governance system for coal mines. When a hazard or expired credential is detected, the AI evaluates its risk, alerts mine management, tracks corrective remediation, and requires dual-party verification before updating executive compliance scores."
        </div>

        <div className="space-y-3 mt-4">
          {steps.map((s, idx) => (
            <div key={idx} className="bg-coal-950 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center font-mono">
                    {s.num}
                  </span>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{s.role}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Step {s.num} of 4</span>
              </div>

              <h4 className="text-sm font-bold text-white mt-2">{s.title}</h4>
              <p className="text-xs text-slate-300 whitespace-pre-line mt-1.5 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 font-mono">
                {s.desc}
              </p>

              <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span><strong>Key Takeaway:</strong> {s.highlight}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Start Demonstration
          </button>
        </div>
      </div>
    </Modal>
  );
}
