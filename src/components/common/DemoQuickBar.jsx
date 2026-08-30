import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ShieldCheck, HardHat, Briefcase, Building2, Landmark, RefreshCw, HelpCircle, Sparkles } from 'lucide-react';
import DemoGuideModal from './DemoGuideModal';

export default function DemoQuickBar() {
  const { currentUser } = useAuth();
  const { resetDemoData } = useData();
  const [showGuide, setShowGuide] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 2500);
  };

  return (
    <>
      <div className="bg-coal-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-md text-xs">
        {/* Left: Prototype Tag & Guide */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-md text-amber-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SIH Prototype • Demo Data Mode</span>
          </div>

          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md font-medium transition-colors shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-blue-300">Live Presentation Script & Guide</span>
          </button>
        </div>

        {/* Center: Authenticated Session Info (No Role Switcher) */}
        <div className="flex items-center gap-2 px-3 py-1 bg-coal-950 rounded-lg border border-slate-800">
          <span className="text-[10px] font-bold uppercase text-slate-400">Authenticated Session:</span>
          <span className="text-[11px] font-extrabold text-amber-400 font-mono flex items-center gap-1.5">
            <span>{currentUser?.avatar}</span>
            <span>{currentUser?.name}</span>
            <span className="text-slate-400">({currentUser?.role})</span>
          </span>
        </div>

        {/* Right: Reset Demo Data */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-700 rounded-md text-xs transition-colors"
            title="Reset dataset to initial demonstration state"
          >
            <RefreshCw className={`w-3 h-3 ${resetConfirm ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{resetConfirm ? 'Reset Complete!' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>

      <DemoGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
}
