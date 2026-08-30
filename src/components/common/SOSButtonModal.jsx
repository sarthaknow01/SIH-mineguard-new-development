import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AlertOctagon, Radio, CheckCircle, X, ShieldAlert } from 'lucide-react';

export default function SOSButtonModal() {
  const { currentUser } = useAuth();
  const { sendSOSAlert } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Security guard: Only Inspector role can send SOS
  if (!currentUser || currentUser.role !== 'INSPECTOR') {
    return null;
  }

  const handleConfirmSOS = async () => {
    setIsSending(true);
    try {
      await sendSOSAlert({
        inspectorName: currentUser.name || 'Anita Kulkarni',
        inspectorId: currentUser.badge || 'INS-001',
        mineName: currentUser.mineName || 'Demo Mine Alpha',
        mineId: currentUser.mineId || 'MINE-01'
      });
    } catch (err) {
      console.error('Error sending SOS from modal:', err);
    } finally {
      setIsSending(false);
      setIsOpen(false);
      setToastMessage('Emergency SOS sent successfully.');

      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[120] bg-emerald-950 border-2 border-emerald-500 text-emerald-200 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-extrabold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Floating Red SOS Emergency Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm uppercase tracking-wider rounded-full shadow-[0_0_25px_rgba(225,29,72,0.6)] hover:shadow-[0_0_35px_rgba(225,29,72,0.8)] border-2 border-red-400 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none"
          title="Trigger Emergency SOS Alert"
        >
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
          <AlertOctagon className="w-5 h-5 text-white animate-pulse" />
          <span className="drop-shadow-md">SOS Emergency</span>
        </button>
      </div>

      {/* SOS Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-coal-900 border-2 border-red-600 rounded-2xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(225,29,72,0.4)] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-500 border border-red-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  🚨 Emergency SOS
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-200 leading-relaxed">
                Are you sure you want to send an emergency alert to the Mine Officer?
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  Real-time High Priority Broadcast:
                </p>
                <p className="text-[11px] text-slate-300">
                  This action will instantly sound the emergency alarm and trigger a full-screen alert overlay on all active Mine Officer dashboards.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSending}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSOS}
                disabled={isSending}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/30 border border-red-500 transition-all flex items-center gap-2"
              >
                {isSending ? (
                  <span>Sending SOS...</span>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4" />
                    <span>Send SOS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
