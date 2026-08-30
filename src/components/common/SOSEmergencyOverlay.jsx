import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { sosAlarmSound } from '../../utils/sosAlarmSound';
import { AlertTriangle, CheckCircle, Volume2, ShieldAlert, User, MapPin, Clock } from 'lucide-react';

export default function SOSEmergencyOverlay() {
  const { currentUser } = useAuth();
  const { sosAlerts, acknowledgeSOSAlert } = useData();

  // Security guard: Full-screen emergency popup & alarm sound strictly for Mine Officer
  const userRole = (currentUser?.role || '').toUpperCase();
  const isMineOfficer = userRole === 'OFFICER' || userRole === 'MINE_OFFICER';

  // Find active SOS alerts
  const activeSos = Array.isArray(sosAlerts) ? sosAlerts.find(item => item.status === 'ACTIVE') : null;

  // Control repeating emergency audio sound playback
  useEffect(() => {
    if (isMineOfficer && activeSos) {
      sosAlarmSound.start();
    } else {
      sosAlarmSound.stop();
    }

    return () => {
      sosAlarmSound.stop();
    };
  }, [isMineOfficer, activeSos?.alertId]);

  if (!isMineOfficer || !activeSos) {
    return null;
  }

  const handleAcknowledge = () => {
    sosAlarmSound.stop();
    acknowledgeSOSAlert(activeSos.alertId, `${currentUser.name} (${currentUser.role})`);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      {/* Background Pulsing Red Glow */}
      <div className="absolute inset-0 bg-red-600/10 animate-pulse pointer-events-none"></div>

      <div className="relative w-full max-w-xl bg-coal-950 border-4 border-red-600 rounded-3xl shadow-[0_0_60px_rgba(239,68,68,0.7)] p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
        
        {/* Flashing Red Emergency Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 text-red-500 shadow-lg shadow-red-500/30 animate-bounce">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>

          <div className="p-2 bg-red-600/20 border border-red-500/40 rounded-xl">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-red-400 flex items-center justify-center gap-2 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <span>🚨 EMERGENCY SOS ALERT</span>
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </h2>
          </div>
        </div>

        {/* SOS Details Card */}
        <div className="bg-coal-900 border border-red-900/60 p-4 sm:p-5 rounded-2xl text-left space-y-3 shadow-inner">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" /> Inspector Name
              </span>
              <p className="text-sm font-extrabold text-white">{activeSos.inspectorName}</p>
              <p className="text-[10px] font-mono text-amber-400">ID: {activeSos.inspectorId}</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400" /> Mine Location
              </span>
              <p className="text-sm font-extrabold text-white">{activeSos.mineName}</p>
              <p className="text-[10px] font-mono text-slate-400">ID: {activeSos.mineId}</p>
            </div>

          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Alert Timestamp
              </span>
              <p className="text-xs font-mono font-bold text-slate-200">{activeSos.timestamp}</p>
            </div>
            <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/30">
              <Volume2 className="w-4 h-4 animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Alarm Active</span>
            </div>
          </div>

          <div className="p-3 bg-red-950/80 border border-red-600/50 rounded-xl text-center">
            <p className="text-xs font-extrabold text-red-300 uppercase tracking-widest animate-pulse">
              ⚠️ Immediate Attention Required — Respond Immediately
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleAcknowledge}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(225,29,72,0.6)] border-2 border-red-400 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-white" />
            <span>Acknowledge Alert & Silence Alarm</span>
          </button>
        </div>

      </div>
    </div>
  );
}
