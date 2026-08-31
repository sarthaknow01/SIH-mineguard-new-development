import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import LoginPage from './components/auth/LoginPage';
import DemoQuickBar from './components/common/DemoQuickBar';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Inspector Views
import InspectorDashboard from './components/inspector/InspectorDashboard';
import InspectionRunner from './components/inspector/InspectionRunner';
import ViolationsListView from './components/inspector/ViolationsListView';
import VerificationList from './components/inspector/VerificationList';
import CertificateVerifierModal from './components/inspector/CertificateVerifierModal';

// Officer Views
import OfficerDashboard from './components/officer/OfficerDashboard';
import WorkerRegistry from './components/officer/WorkerRegistry';
import CertificateManager from './components/officer/CertificateManager';
import CorrectiveActionManager from './components/officer/CorrectiveActionManager';
import SOSHistoryView from './components/officer/SOSHistoryView';

// Common Emergency Components
import SOSButtonModal from './components/common/SOSButtonModal';
import SOSEmergencyOverlay from './components/common/SOSEmergencyOverlay';

// Management Views
import ManagementDashboard from './components/management/ManagementDashboard';
import MineComparisonTable from './components/management/MineComparisonTable';
import ExecutiveReportView from './components/management/ExecutiveReportView';
import MineDetailModal from './components/management/MineDetailModal';

// Authority Views
import RegulatoryDashboard from './components/authority/RegulatoryDashboard';
import HighRiskMinesView from './components/authority/HighRiskMinesView';
import AuditTrailView from './components/authority/AuditTrailView';

function MainApp() {
  const { currentUser } = useAuth();
  const { mines } = useData();
  // Role Authorization Guard Map
  const roleAllowedTabs = {
    INSPECTOR: ['dashboard', 'inspections', 'verify-cert', 'violations', 'verifications', 'sos-history'],
    OFFICER: ['dashboard', 'workers', 'certificates', 'actions', 'violations', 'inspections-log', 'sos-history'],
    MANAGEMENT: ['dashboard', 'mines-compare', 'risk-analytics', 'compliance-reports', 'audit-log', 'sos-history'],
    AUTHORITY: ['dashboard', 'high-risk', 'directives', 'audit-log', 'compliance-reports', 'sos-history']
  };

  // Helper to parse route from URL hash
  const parseRouteFromHash = (userRole) => {
    const rawHash = window.location.hash.replace(/^#\/?/, '');
    if (!rawHash) return null;

    const parts = rawHash.split('/');
    let targetTab = null;

    if (parts.length >= 2) {
      targetTab = parts[1];
    } else if (parts.length === 1) {
      const seg = parts[0].toLowerCase();
      if (['inspector', 'officer', 'management', 'authority'].includes(seg)) {
        targetTab = 'dashboard';
      } else {
        targetTab = seg;
      }
    }

    if (userRole && roleAllowedTabs[userRole]?.includes(targetTab)) {
      return targetTab;
    }
    return null;
  };

  // Initialize currentTab from URL hash or localStorage
  const [currentTab, setCurrentTab] = useState(() => {
    const role = currentUser?.role;
    if (role) {
      const fromHash = parseRouteFromHash(role);
      if (fromHash) return fromHash;
      const savedTab = localStorage.getItem('mineguard_current_tab');
      if (savedTab && roleAllowedTabs[role]?.includes(savedTab)) {
        return savedTab;
      }
    }
    return 'dashboard';
  });

  const [showQuickVerifier, setShowQuickVerifier] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAuditMine, setSelectedAuditMine] = useState(null);

  // Sync tab with URL Hash and Local Storage + Role Authorization Guard
  useEffect(() => {
    if (!currentUser?.role) return;

    const role = currentUser.role;
    const allowed = roleAllowedTabs[role];

    if (allowed && !allowed.includes(currentTab)) {
      setCurrentTab('dashboard');
      return;
    }

    localStorage.setItem('mineguard_current_tab', currentTab);
    const expectedHash = `#/${role.toLowerCase()}/${currentTab}`;
    if (window.location.hash !== expectedHash) {
      window.history.replaceState(null, '', expectedHash);
    }
  }, [currentUser?.role, currentTab]);

  // Sync on browser back/forward or hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (!currentUser?.role) return;
      const routeTab = parseRouteFromHash(currentUser.role);
      if (routeTab && routeTab !== currentTab) {
        setCurrentTab(routeTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser?.role, currentTab]);

  if (!currentUser) {
    return <LoginPage />;
  }

  const role = currentUser.role;
  const isAuthorizedTab = roleAllowedTabs[role]?.includes(currentTab);

  // Render role-specific tab content
  const renderContent = () => {
    if (!isAuthorizedTab) {
      return (
        <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl text-center space-y-3">
          <h3 className="text-lg font-bold text-red-400">Access Denied — Unauthorized Department Route</h3>
          <p className="text-xs text-slate-300">
            Your account ({currentUser.name} - {currentUser.role}) does not have permission to view this department page.
          </p>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shadow-lg"
          >
            Return to Authorized {currentUser.role} Dashboard
          </button>
        </div>
      );
    }

    if (role === 'INSPECTOR') {
      switch (currentTab) {
        case 'dashboard':
          return <InspectorDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'inspections':
          return <InspectionRunner onComplete={() => setCurrentTab('violations')} />;
        case 'verify-cert':
          return <CertificateVerifierModal isOpen={true} onClose={() => setCurrentTab('dashboard')} />;
        case 'violations':
          return <ViolationsListView />;
        case 'verifications':
          return <VerificationList />;
        case 'sos-history':
          return <SOSHistoryView />;
        default:
          return <InspectorDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      }
    }

    if (role === 'OFFICER') {
      switch (currentTab) {
        case 'dashboard':
          return <OfficerDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'workers':
          return <WorkerRegistry />;
        case 'certificates':
          return <CertificateManager />;
        case 'actions':
          return <CorrectiveActionManager />;
        case 'violations':
          return <ViolationsListView />;
        case 'inspections-log':
          return <AuditTrailView />;
        case 'sos-history':
          return <SOSHistoryView />;
        default:
          return <OfficerDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      }
    }

    if (role === 'MANAGEMENT') {
      switch (currentTab) {
        case 'dashboard':
          return <ManagementDashboard onNavigate={(tab) => setCurrentTab(tab)} onSelectMine={(m) => setSelectedAuditMine(m)} />;
        case 'mines-compare':
          return <MineComparisonTable mines={mines} onSelectMine={(m) => setSelectedAuditMine(m)} />;
        case 'risk-analytics':
          return <ManagementDashboard onNavigate={(tab) => setCurrentTab(tab)} onSelectMine={(m) => setSelectedAuditMine(m)} />;
        case 'compliance-reports':
          return <ExecutiveReportView />;
        case 'audit-log':
          return <AuditTrailView />;
        case 'sos-history':
          return <SOSHistoryView />;
        default:
          return <ManagementDashboard onNavigate={(tab) => setCurrentTab(tab)} onSelectMine={(m) => setSelectedAuditMine(m)} />;
      }
    }

    if (role === 'AUTHORITY') {
      switch (currentTab) {
        case 'dashboard':
          return <RegulatoryDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'high-risk':
          return <HighRiskMinesView />;
        case 'directives':
          return <RegulatoryDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
        case 'audit-log':
          return <AuditTrailView />;
        case 'compliance-reports':
          return <ExecutiveReportView />;
        case 'sos-history':
          return <SOSHistoryView />;
        default:
          return <RegulatoryDashboard onNavigate={(tab) => setCurrentTab(tab)} />;
      }
    }

    return <div className="p-8 text-center text-slate-400">Select a valid menu item from the sidebar.</div>;
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex flex-col font-sans text-slate-800 selection:bg-[#0265dc] selection:text-white overflow-x-hidden">
      {/* 1. Quick Role Switcher Bar */}
      <DemoQuickBar />

      {/* 2. Top Header / Navbar */}
      <Navbar 
        onNavigate={(tab) => setCurrentTab(tab)}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* 3. Main Body: Sidebar + Dynamic Dashboard Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar 
          currentTab={currentTab} 
          onSelectTab={(tab) => { setCurrentTab(tab); setMobileMenuOpen(false); }}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-110px)] w-full max-w-full">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Audit Mine Modal if triggered */}
      {selectedAuditMine && (
        <MineDetailModal
          isOpen={!!selectedAuditMine}
          onClose={() => setSelectedAuditMine(null)}
          mine={selectedAuditMine}
        />
      )}

      {/* Floating SOS Trigger Button (Inspectors) */}
      <SOSButtonModal />

      {/* Full Screen SOS Emergency Overlay (Officers/Management/Authority) */}
      <SOSEmergencyOverlay />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <MainApp />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
