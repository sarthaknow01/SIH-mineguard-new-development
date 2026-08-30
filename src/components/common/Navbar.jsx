import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { Bell, LogOut, Shield, User, Clock, AlertTriangle, CheckCircle, Flame, Menu, X, Sun, Moon } from 'lucide-react';
import { formatDateTime } from '../../utils/dateHelpers';

export default function Navbar({ onNavigate, onToggleMobileMenu, isMobileMenuOpen }) {
  const { currentUser, logout } = useAuth();
  const { alerts, markAlertRead } = useData();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter alerts relevant to current role
  const roleKey = currentUser?.role?.toLowerCase();
  const userAlerts = alerts.filter(a => !a.targetRoles || a.targetRoles.includes(roleKey));
  const unreadCount = userAlerts.filter(a => a.status === 'UNREAD').length;

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
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-extrabold text-base sm:text-lg shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1">
                MineGuard <span className="text-amber-400">AI</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700 hidden sm:inline-block">
                v1.0
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 tracking-wide hidden md:block">
              Smart Governance & Compliance Monitoring System for Coal Mines
            </p>
          </div>
        </div>
      </div>

      {/* Right User & Notification Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
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
    </header>
  );
}
