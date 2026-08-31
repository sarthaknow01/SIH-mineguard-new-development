import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { Bell, LogOut, Shield, User, Clock, AlertTriangle, CheckCircle, Menu, X, Sun, Moon, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { formatDateTime } from '../../utils/dateHelpers';
import { subscribeSyncStatus, triggerAutoSync } from '../../utils/offlineSyncManager';
import PendingSyncModal from '../inspector/PendingSyncModal';

export default function Navbar({ onNavigate, onToggleMobileMenu, isMobileMenuOpen }) {
  const { currentUser, logout } = useAuth();
  const { alerts, markAlertRead } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncState, setSyncState] = useState({ isOnline: navigator.onLine, isSyncing: false, pendingCount: 0 });

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  // Filter alerts relevant to current role
  const roleKey = currentUser?.role?.toLowerCase();
  const userAlerts = alerts.filter(a => !a.targetRoles || a.targetRoles.includes(roleKey));
  const unreadCount = userAlerts.filter(a => a.status === 'UNREAD').length;

  const officialLogoPath = `${import.meta.env.BASE_URL || './'}mineguard_name_logo.png`;

  return (
    <header className="bg-coal-900 border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-30 sticky top-0">
      {/* Brand & Logo + Mobile Menu Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <img 
            src={officialLogoPath} 
            alt="MineGuard Official Logo" 
            className="h-9 sm:h-11 w-auto object-contain shrink-0"
          />
        </div>
      </div>

      {/* Right Controls: Online/Offline Pill, Theme, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Network & Offline Sync Status Pill */}
        <button
          onClick={() => setShowSyncModal(true)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
            !syncState.isOnline
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 animate-pulse'
              : syncState.pendingCount > 0
              ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
          title="Click to view offline queue & sync status"
        >
          {!syncState.isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>OFFLINE {syncState.pendingCount > 0 ? `(${syncState.pendingCount} Pending)` : ''}</span>
            </>
          ) : syncState.pendingCount > 0 ? (
            <>
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>ONLINE ({syncState.pendingCount} Pending Sync)</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">ONLINE</span>
            </>
          )}
        </button>
        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 flex items-center gap-2"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="text-xs font-medium hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-coal-900 border border-slate-700 shadow-2xl z-50 p-3 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">System Alerts & Notifications</span>
                <span className="text-[10px] text-slate-400">{unreadCount} Unread</span>
              </div>
              <div className="divide-y divide-slate-800/60 mt-2">
                {userAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No active notifications.</p>
                ) : (
                  userAlerts.slice(0, 8).map(alert => (
                    <div 
                      key={alert.alertId}
                      onClick={() => markAlertRead(alert.alertId)}
                      className={`py-2.5 px-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors ${alert.status === 'UNREAD' ? 'bg-slate-800/30' : 'opacity-70'}`}
                    >
                      <div className="flex items-start gap-2">
                        {alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-100">{alert.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{alert.description}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">{formatDateTime(alert.createdDate)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        {currentUser && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-base">
              {currentUser.avatar || '👤'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                {currentUser.name}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                  {currentUser.badge}
                </span>
              </p>
              <p className="text-[11px] text-slate-400">{currentUser.designation}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <PendingSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
      />
    </header>
  );
}
