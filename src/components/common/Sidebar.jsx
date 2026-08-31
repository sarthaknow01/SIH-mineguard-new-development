import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardCheck,
  AlertTriangle,
  FileCheck,
  Users,
  ShieldAlert,
  BarChart3,
  Layers,
  Activity,
  History,
  Scale,
  Radio,
  Settings,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentTab, onSelectTab, isOpen, onClose }) {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'INSPECTOR';

  const officialLogoPath = `${import.meta.env.BASE_URL || './'}mineguard_name_logo.png`;

  // Define navigation tabs per role
  const getNavItems = () => {
    switch (role) {
      case 'INSPECTOR':
        return [
          { id: 'dashboard', label: 'Inspector Dashboard', icon: LayoutDashboard },
          { id: 'inspections', label: 'Conduct Inspection', icon: ClipboardCheck },
          { id: 'verify-cert', label: 'Verify Certificate', icon: FileCheck },
          { id: 'violations', label: 'Violations & Reports', icon: AlertTriangle },
          { id: 'verifications', label: 'Verification Sign-Off', icon: ShieldAlert },
          { id: 'sos-history', label: 'SOS Alerts Log', icon: Radio },
        ];
      case 'OFFICER':
        return [
          { id: 'dashboard', label: 'Mine Overview', icon: LayoutDashboard },
          { id: 'workers', label: 'Worker Registry', icon: Users },
          { id: 'certificates', label: 'Certificate Manager', icon: FileCheck },
          { id: 'actions', label: 'Corrective Actions', icon: ShieldAlert },
          { id: 'violations', label: 'Violations Inbox', icon: AlertTriangle },
          { id: 'inspections-log', label: 'Inspection History', icon: History },
          { id: 'sos-history', label: 'SOS Alerts Log', icon: Radio },
        ];
      case 'MANAGEMENT':
        return [
          { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
          { id: 'mines-compare', label: 'Mines Benchmark', icon: Layers },
          { id: 'risk-analytics', label: 'AI Risk Analytics', icon: Activity },
          { id: 'compliance-reports', label: 'Compliance Reports', icon: BarChart3 },
          { id: 'audit-log', label: 'Governance Audit Trail', icon: History },
          { id: 'sos-history', label: 'SOS Alerts Log', icon: Radio },
        ];
      case 'AUTHORITY':
        return [
          { id: 'dashboard', label: 'National Overview', icon: LayoutDashboard },
          { id: 'high-risk', label: 'High-Risk Mines', icon: AlertTriangle },
          { id: 'directives', label: 'Regulatory Notices', icon: Scale },
          { id: 'audit-log', label: 'Compliance Audit Trail', icon: History },
          { id: 'compliance-reports', label: 'Safety Reports', icon: BarChart3 },
          { id: 'sos-history', label: 'SOS Alerts Log', icon: Radio },
        ];
      default:
        return [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 sm:p-5 space-y-6 selection:bg-[#0265dc] selection:text-white">
      
      <div className="space-y-6">
        
        {/* Mobile Header Logo */}
        <div className="lg:hidden pb-4 border-b border-slate-100 flex items-center justify-between">
          <img 
            src={officialLogoPath} 
            alt="MINEGUARD" 
            className="h-8 w-auto object-contain"
          />
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">
            MAIN NAVIGATION
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#ebf3fe] text-[#0265dc] font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#0f172a]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0265dc]' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Secondary System Navigation */}
        <div className="pt-2 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">
            SYSTEM
          </p>
          
          <button 
            onClick={() => alert('MineGuard Settings: Configured per mine site assignment.')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-[#0f172a] transition-all"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          <button 
            onClick={() => alert('MineGuard Support: Contact Ministry of Coal Governance Helpdesk.')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-[#0f172a] transition-all"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help & Support</span>
          </button>
        </div>

      </div>

      {/* Bottom Operational Status Card */}
      <div className="pt-4 border-t border-slate-100">
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Status</p>
              <p className="font-bold text-emerald-600 text-xs">Operational</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col shrink-0 min-h-[calc(100vh-68px)]">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col z-50 h-full overflow-y-auto shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
