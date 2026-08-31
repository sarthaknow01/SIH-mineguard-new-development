import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  ClipboardCheck, 
  TrendingUp, 
  Award, 
  BellRing, 
  Eye, 
  EyeOff,
  Check
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!userId.trim()) {
      setError('Please enter your User ID or Employee ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(userId, password);
      if (!res.success) {
        setError(res.message || 'Invalid credentials. Please check your ID and password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoPath = `${import.meta.env.BASE_URL || './'}mineguard-logo.png`;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans flex flex-col justify-between relative overflow-hidden selection:bg-[#0265dc] selection:text-white">
      
      {/* Decorative Background Dotted Pattern Top-Right */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-40 z-0" 
        style={{
          backgroundImage: 'radial-gradient(#0265dc 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }} 
      />

      {/* Main Container: 2-Column Responsive Layout */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 relative z-10">
        
        {/* LEFT HERO & BRANDING SECTION */}
        <div className="w-full lg:w-7/12 space-y-8">
          
          {/* Top Brand Logo Header */}
          <div className="flex items-center gap-3">
            <img 
              src={logoPath} 
              alt="MINEGUARD" 
              className="h-10 sm:h-12 w-auto object-contain"
              onError={(e) => {
                // Fallback to SVG logo if PNG image fails to load
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'flex';
                }
              }}
            />
            {/* Inline SVG Fallback Logo */}
            <div className="hidden items-center gap-2.5">
              <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none">
                <path d="M50 8 L15 28 L15 60 C15 80 50 95 50 95 C50 95 85 80 85 60 L85 28 Z" fill="#0f172a" stroke="#f59e0b" strokeWidth="4"/>
                <path d="M50 25 L50 70 M30 45 L70 45" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="50" cy="35" r="6" fill="#0265dc"/>
              </svg>
              <span className="text-2xl font-black tracking-wider text-[#0f172a] font-mono">MINEGUARD</span>
            </div>
          </div>

          {/* Main Hero Headings */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight leading-[1.15]">
              Smart Mine Governance &<br />
              <span className="text-[#0265dc]">Safety Management</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
              Unified inspection, compliance, risk assessment, and emergency response platform for coal mine operations.
            </p>
          </div>

          {/* 2x2 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            
            {/* Card 1 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0f172a]">Digital Inspections</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">SOP-based field audits</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0f172a]">AI Risk Scoring</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Automated risk prioritization</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0f172a]">Certificate Registry</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Compliance tracking</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0f172a]">Emergency SOS</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Real-time alert dispatch</p>
              </div>
            </div>

          </div>

          {/* Sub-tagline */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 pt-1">
            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Built for safer, smarter and more accountable mining.</span>
          </div>

          {/* Subtle Mining Graphic (Bottom Left Decorative Art) */}
          <div className="pt-4 opacity-40 pointer-events-none hidden sm:block">
            <svg className="w-72 h-20 text-[#60a5fa]" viewBox="0 0 300 80" fill="none">
              {/* Headframe Derrick Tower */}
              <g stroke="currentColor" strokeWidth="1.5">
                <line x1="60" y1="75" x2="75" y2="20" />
                <line x1="90" y1="75" x2="75" y2="20" />
                <line x1="65" y1="60" x2="85" y2="60" />
                <line x1="68" y1="45" x2="82" y2="45" />
                <line x1="71" y1="30" x2="79" y2="30" />
                <circle cx="75" cy="18" r="6" />
              </g>

              {/* Haul Truck */}
              <g fill="currentColor" opacity="0.8">
                <rect x="120" y="55" width="28" height="12" rx="2" />
                <rect x="148" y="58" width="10" height="9" rx="1" />
                <circle cx="128" cy="68" r="4" fill="#60a5fa" />
                <circle cx="142" cy="68" r="4" fill="#60a5fa" />
              </g>

              {/* Mountain Hills Background */}
              <path d="M0 75 Q40 50 90 75 Q160 40 220 75 Q260 55 300 75 L300 80 L0 80 Z" fill="currentColor" opacity="0.15" />
            </svg>
          </div>

        </div>

        {/* RIGHT COLUMN: WHITE LOGIN CARD */}
        <div className="w-full lg:w-5/12 max-w-md">
          
          <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-100 shadow-2xl shadow-slate-200/70 space-y-6 relative">
            
            {/* Blue Lock Top Icon */}
            <div className="w-12 h-12 rounded-xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            {/* Header Text */}
            <div>
              <h2 className="text-2xl font-black text-[#0f172a] tracking-tight">Secure Login</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Enter your credentials to access the governance portal
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* User ID Field */}
              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-1.5">
                  User / Employee ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. INS-001, MO-001"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0265dc] focus:ring-2 focus:ring-[#0265dc]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0265dc] focus:ring-2 focus:ring-[#0265dc]/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0265dc] border-slate-300 focus:ring-[#0265dc]"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => alert('For password resets or access recovery, please contact your Mine System Administrator or Officer.')}
                  className="font-bold text-[#0265dc] hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#0265dc] hover:bg-[#0052b4] active:bg-[#004192] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#0265dc]/25 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In & Continue'}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>

            </form>

            {/* Horizontal Divider */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Authorized access only</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="w-full text-center py-4 text-xs font-medium text-slate-400 relative z-10 border-t border-slate-200/50">
        © 2026 MineGuard · All rights reserved
      </footer>

    </div>
  );
}
