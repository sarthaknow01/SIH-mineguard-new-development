import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../common/StatCard';
import Badge from '../common/Badge';
import { formatDate, calculateCertificateStatus } from '../../utils/dateHelpers';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Search, 
  Filter, 
  ChevronRight, 
  FileText, 
  UserPlus, 
  ShieldCheck, 
  TrendingUp,
  ClipboardCheck
} from 'lucide-react';
import AddCertificateModal from './AddCertificateModal';
import CreateActionModal from './CreateActionModal';

export default function OfficerDashboard({ onNavigate }) {
  const { mines, workers, certificates, violations, correctiveActions, alerts } = useData();
  const { currentUser } = useAuth();
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [selectedViolationForAction, setSelectedViolationForAction] = useState(null);
  const [targetCertUpload, setTargetCertUpload] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Focus on Mine Alpha (Officer's assigned mine)
  const currentMineId = currentUser?.mineId || 'MINE-01';
  const myMine = mines.find(m => m.mineId === currentMineId) || mines[0];
  const myWorkers = workers.filter(w => w.mineId === currentMineId);
  const myViolations = violations.filter(v => v.mineId === currentMineId && v.status !== 'RESOLVED');
  const myActions = correctiveActions.filter(ca => ca.mineId === currentMineId);

  // Expiring certs in this mine
  const expiringCerts = certificates.filter(c => {
    if (c.mineId !== currentMineId) return false;
    const st = calculateCertificateStatus(c.expiryDate).status;
    return st === 'EXPIRING SOON' || st === 'EXPIRED';
  });

  const handleOpenUploadForCert = (c) => {
    const linkedV = violations.find(v => (v.workerId === c.workerId || v.certificateId === c.certificateId) && v.status !== 'RESOLVED');
    setTargetCertUpload({
      workerId: c.workerId,
      certificateType: c.certificateType,
      certificateId: `CERT-2026-${Date.now().toString().slice(-4)}`,
      linkedViolationId: linkedV?.violationId || ''
    });
    setShowAddCertModal(true);
  };

  const filteredMines = mines.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 selection:bg-[#0265dc] selection:text-white">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">Mine Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Complete overview of mine operations, compliance status and key metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker Button */}
          <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>31 Aug 2026 – 31 Aug 2026</span>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              if (expiringCerts.length > 0) {
                handleOpenUploadForCert(expiringCerts[0]);
              } else {
                setTargetCertUpload({});
                setShowAddCertModal(true);
              }
            }}
            className="px-4 py-2.5 bg-[#0265dc] hover:bg-[#0052b4] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0265dc]/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Inspection</span>
          </button>
        </div>
      </div>

      {/* 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Mines"
          value={mines.length || 5}
          trend="↑ 1 new this month"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Total Workers"
          value={workers.length || 248}
          trend="↑ 12% from last month"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Compliance Score"
          value={`${myMine.complianceScore}%`}
          trend="↑ 6% from last month"
          icon={ShieldCheck}
          color="amber"
        />
        <StatCard
          title="Open Violations"
          value={myViolations.length || 8}
          trend="↑ 3 new this week"
          icon={AlertTriangle}
          color="red"
          onClick={() => onNavigate('violations')}
        />
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        
        {/* LEFT COLUMN: MINE STATUS & ASSIGNED MINES TABLE (2 COLS) */}
        <div className="lg:col-span-2 space-y-7">
          
          {/* Mine Status Overview & Safety at a Glance */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left Donut Breakdown */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-bold text-base text-[#0f172a]">Mine Status Overview</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Real-time status of all assigned mines</p>
              </div>

              <div className="flex items-center gap-6">
                {/* Visual Circular Doughnut Chart Representation */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-emerald-500"
                      strokeWidth="4"
                      strokeDasharray="60, 100"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-amber-400"
                      strokeWidth="4"
                      strokeDasharray="20, 100"
                      strokeDashoffset="-60"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-rose-500"
                      strokeWidth="4"
                      strokeDasharray="20, 100"
                      strokeDashoffset="-80"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-[#0f172a]">{mines.length || 5}</span>
                    <span className="text-[10px] font-bold text-slate-400">Total Mines</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="space-y-2 text-xs font-semibold text-slate-600 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Healthy</span>
                    </div>
                    <span className="font-bold text-[#0f172a]">3 (60%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Warning</span>
                    </div>
                    <span className="font-bold text-[#0f172a]">1 (20%)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span>Critical</span>
                    </div>
                    <span className="font-bold text-[#0f172a]">1 (20%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Banner Box */}
            <div className="w-full md:w-64 bg-[#ebf3fe] rounded-2xl p-5 border border-blue-100/70 space-y-3 shrink-0">
              <div className="flex items-center gap-2 text-[#0265dc]">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-xs uppercase tracking-wider">Safety at a Glance</h4>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Overall mine operations are stable with minor risks requiring attention.
              </p>
              <button 
                onClick={() => onNavigate('inspections-log')}
                className="w-full py-2 px-3 bg-[#0265dc] hover:bg-[#0052b4] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Detailed Report</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Assigned Mines Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-[#0f172a]">Assigned Mines</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage and monitor all your assigned mine sites.</p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search mines..."
                    className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0265dc]"
                  />
                </div>
                <button className="p-1.5 rounded-xl border border-slate-200/70 bg-slate-50 hover:bg-slate-100 text-slate-600">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-5">Mine Name</th>
                    <th className="py-3 px-5">Location</th>
                    <th className="py-3 px-5">Compliance Score</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Last Inspection</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredMines.map((m) => {
                    const score = m.complianceScore || 85;
                    const statusText = score >= 85 ? 'Healthy' : score >= 65 ? 'Warning' : 'Critical';
                    return (
                      <tr key={m.mineId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5 font-bold text-[#0f172a] flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${score >= 85 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-400' : 'bg-rose-500'}`} />
                          <span>{m.name}</span>
                        </td>
                        <td className="py-4 px-5 text-slate-500">{m.location}</td>
                        <td className="py-4 px-5">
                          <div className="space-y-1 w-32">
                            <span className="font-bold text-[#0f172a]">{score}%</span>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${score >= 85 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                                style={{ width: `${score}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <Badge size="sm">{statusText}</Badge>
                        </td>
                        <td className="py-4 px-5 text-slate-500 font-mono">28 Aug 2026</td>
                        <td className="py-4 px-5 text-right">
                          <button 
                            onClick={() => onNavigate('inspections-log')}
                            className="px-3 py-1 bg-blue-50 text-[#0265dc] hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITY & QUICK ACTIONS */}
        <div className="space-y-7">
          
          {/* Recent Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0f172a]">Recent Activity</h3>
              <button 
                onClick={() => onNavigate('inspections-log')}
                className="text-xs font-bold text-[#0265dc] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Activity 1 */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0265dc] flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">New inspection completed</p>
                    <p className="text-slate-500 font-medium mt-0.5">Demo Mine Alpha - Block A</p>
                    <p className="text-[10px] text-slate-400 mt-1">2 hours ago</p>
                  </div>
                </div>
                <Badge size="sm" variant="green">Completed</Badge>
              </div>

              {/* Activity 2 */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">Worker registered</p>
                    <p className="text-slate-500 font-medium mt-0.5">Rahul Kumar (EMP-104)</p>
                    <p className="text-[10px] text-slate-400 mt-1">4 hours ago</p>
                  </div>
                </div>
                <Badge size="sm" variant="blue">Info</Badge>
              </div>

              {/* Activity 3 */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">High risk violation detected</p>
                    <p className="text-slate-500 font-medium mt-0.5">Demo Mine Beta - Zone 3</p>
                    <p className="text-[10px] text-slate-400 mt-1">5 hours ago</p>
                  </div>
                </div>
                <Badge size="sm" variant="red">Critical</Badge>
              </div>

              {/* Activity 4 */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#0f172a]">Certificate expired</p>
                    <p className="text-slate-500 font-medium mt-0.5">Safety Training - Amit Sharma</p>
                    <p className="text-[10px] text-slate-400 mt-1">6 hours ago</p>
                  </div>
                </div>
                <Badge size="sm" variant="amber">Expiring Soon</Badge>
              </div>

            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-[#0f172a]">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              
              <button
                onClick={() => {
                  if (expiringCerts.length > 0) {
                    handleOpenUploadForCert(expiringCerts[0]);
                  } else {
                    setTargetCertUpload({});
                    setShowAddCertModal(true);
                  }
                }}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-100 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center mb-3">
                  <ClipboardCheck className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-bold text-xs text-[#0f172a] group-hover:text-[#0265dc]">Conduct Inspection</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Start a new site inspection</p>
              </button>

              <button
                onClick={() => onNavigate('workers')}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-100 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-bold text-xs text-[#0f172a] group-hover:text-[#0265dc]">Register Worker</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Add new worker details</p>
              </button>

              <button
                onClick={() => onNavigate('certificates')}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-100 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <FileCheck className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-bold text-xs text-[#0f172a] group-hover:text-[#0265dc]">Manage Certificates</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">View and verify certificates</p>
              </button>

              <button
                onClick={() => onNavigate('violations')}
                className="p-4 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-100 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-bold text-xs text-[#0f172a] group-hover:text-[#0265dc]">View Violations</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Check open violations</p>
              </button>

            </div>
          </div>

        </div>

      </div>

      <AddCertificateModal
        isOpen={showAddCertModal}
        onClose={() => setShowAddCertModal(false)}
        initialData={targetCertUpload}
      />
      <CreateActionModal
        isOpen={!!selectedViolationForAction}
        onClose={() => setSelectedViolationForAction(null)}
        violation={selectedViolationForAction}
      />
    </div>
  );
}
