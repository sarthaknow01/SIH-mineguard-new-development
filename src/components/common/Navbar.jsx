import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Bell, 
  LogOut, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  ChevronDown,
  Building2
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateHelpers';
import { subscribeSyncStatus } from '../../utils/offlineSyncManager';
import PendingSyncModal from '../inspector/PendingSyncModal';

export default function Navbar({ onNavigate, onToggleMobileMenu, isMobileMenuOpen }) {
  const { currentUser, logout } = useAuth();
  const { alerts, markAlertRead, selectedMineId, setSelectedMineId, mines } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncState, setSyncState] = useState({ isOnline: navigator.onLine, isSyncing: false, pendingCount: 0 });

  const officialLogoPath = `${import.meta.env.BASE_URL || './'}mineguard_name_logo.png`;

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

  const currentMine = mines.find(m => m.mineId === selectedMineId) || mines[0];

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between z-30 sticky top-0 shadow-xs selection:bg-[#0265dc] selection:text-white">
      
      {/* Left: Brand Logo & Mobile Menu Toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <img 
            src={officialLogoPath} 
            alt="MINEGUARD" 
            className="h-9 sm:h-10 w-auto object-contain shrink-0"
          />
        </div>

        {/* Online Status Badge Pill */}
        <button
          onClick={() => setShowSyncModal(true)}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            !syncState.isOnline
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : syncState.pendingCount > 0
              ? 'bg-blue-50 border-blue-200 text-[#0265dc]'
              : 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
          }`}
          title="Click to view offline queue & sync status"
        >
          <span className={`w-2 h-2 rounded-full ${!syncState.isOnline ? 'bg-amber-500 animate-pulse' : syncState.pendingCount > 0 ? 'bg-[#0265dc] animate-spin' : 'bg-emerald-500'}`} />
          {!syncState.isOnline ? (
            <span>Offline ({syncState.pendingCount})</span>
          ) : syncState.pendingCount > 0 ? (
            <span>Syncing ({syncState.pendingCount})</span>
          ) : (
            <span>Online</span>
          )}
        </button>

      </div>

      {/* Right Controls: Notifications, Theme, User, Assigned Mine Dropdown */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200/60"
            title="Notifications & Alerts"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white border border-slate-100 shadow-2xl z-50 p-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">System Alerts</span>
                <span className="text-[10px] font-bold text-[#0265dc] bg-[#ebf3fe] px-2 py-0.5 rounded-full">{unreadCount} Unread</span>
              </div>
              <div className="divide-y divide-slate-100 mt-2">
                {userAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center font-medium">No active notifications.</p>
                ) : (
                  userAlerts.slice(0, 8).map(alert => (
                    <div 
                      key={alert.alertId}
                      onClick={() => markAlertRead(alert.alertId)}
                      className={`py-3 px-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors ${alert.status === 'UNREAD' ? 'bg-blue-50/40' : 'opacity-75'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-[#0265dc] shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-bold text-[#0f172a]">{alert.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed font-medium">{alert.description}</p>
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

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200/60"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
        </button>

        {/* User Card Profile Badge */}
        {currentUser && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200/80">
            <div className="w-9 h-9 rounded-full bg-[#ebf3fe] text-[#0265dc] font-bold text-sm flex items-center justify-center shrink-0 border border-blue-100">
              {currentUser.avatar || '👤'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-[#0f172a]">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">{currentUser.designation?.split('(')[0] || currentUser.role}</p>
            </div>
          </div>
        )}

        {/* Assigned Mine Selector Dropdown */}
        {mines && mines.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0f172a]">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedMineId || currentMine?.mineId}
              onChange={(e) => setSelectedMineId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-[#0f172a] focus:outline-none cursor-pointer pr-1"
            >
              {mines.map(m => (
                <option key={m.mineId} value={m.mineId}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Logout Button */}
        {currentUser && (
          <button
            onClick={logout}
            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        )}

      </div>

      <PendingSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
      />
    </header>
  );
}
