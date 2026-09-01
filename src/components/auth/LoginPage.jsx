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
  EyeOff
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

  const officialLogoPath = `${import.meta.env.BASE_URL || './'}mineguard_name_logo.png`;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans flex flex-col justify-between relative overflow-hidden selection:bg-[#0265dc] selection:text-white">
      
      {/* Decorative Background Dotted Pattern Top-Right */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-40 z-0" 
        style={{
          backgroundImage: 'radial-gradient(#0265dc 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px'
        }} 
      />

      {/* Main Container: 2-Column Responsive Layout matching Reference */}
      <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-10 lg:px-16 py-10 lg:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 relative z-10">
        
        {/* LEFT HERO & BRANDING SECTION */}
        <div className="w-full lg:w-7/12 space-y-10">
          
          {/* Top Brand Official Logo */}
          <div className="flex items-center mb-8">
            <img 
              src={officialLogoPath} 
              alt="MINEGUARD" 
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain"
            />
          </div>

          {/* Main Hero Headings */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-[#0f172a] tracking-tight leading-[1.12]">
              Smart Mine Governance &<br />
              <span className="text-[#0265dc]">Safety Management</span>
            </h1>
            <p className="text-slate-500 text-base sm:text-lg font-medium max-w-xl leading-relaxed pt-1">
              Unified inspection, compliance, risk assessment, and emergency response platform for coal mine operations.
            </p>
          </div>

          {/* 2x2 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
            
            {/* Card 1 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-base text-[#0f172a]">Digital Inspections</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">SOP-based field audits</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center shrink-0">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-base text-[#0f172a]">AI Risk Scoring</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Automated risk prioritization</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-base text-[#0f172a]">Certificate Registry</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Compliance tracking</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center shrink-0">
                <BellRing className="w-7 h-7" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-base text-[#0f172a]">Emergency SOS</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Real-time alert dispatch</p>
              </div>
            </div>

          </div>

          {/* Sub-tagline */}
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 pt-2">
            <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0" />
            <span>Built for safer, smarter and more accountable mining.</span>
          </div>

          {/* Subtle Mining Graphic (Bottom Left Decorative Vector Art) */}
          <div className="pt-4 opacity-35 pointer-events-none hidden sm:block">
            <svg className="w-80 h-24 text-[#60a5fa]" viewBox="0 0 320 90" fill="none">
              {/* Headframe Derrick Tower */}
              <g stroke="currentColor" strokeWidth="1.5">
                <line x1="60" y1="85" x2="75" y2="25" />
                <line x1="90" y1="85" x2="75" y2="25" />
                <line x1="65" y1="70" x2="85" y2="70" />
                <line x1="68" y1="55" x2="82" y2="55" />
                <line x1="71" y1="40" x2="79" y2="40" />
                <circle cx="75" cy="22" r="7" />
              </g>

              {/* Haul Truck */}
              <g fill="currentColor" opacity="0.8">
                <rect x="130" y="65" width="32" height="14" rx="2" />
                <rect x="162" y="68" width="12" height="11" rx="1" />
                <circle cx="138" cy="80" r="5" fill="#60a5fa" />
                <circle cx="156" cy="80" r="5" fill="#60a5fa" />
              </g>

              {/* Mountain Hills Background */}
              <path d="M0 85 Q40 55 90 85 Q170 45 230 85 Q270 60 320 85 L320 90 L0 90 Z" fill="currentColor" opacity="0.18" />
            </svg>
          </div>

        </div>

        {/* RIGHT COLUMN: LARGE WHITE LOGIN CARD */}
        <div className="w-full lg:w-[480px] max-w-lg">
          
          <div className="bg-white rounded-[32px] p-8 sm:p-10 lg:p-12 border border-slate-100 shadow-2xl shadow-slate-200/80 space-y-7 relative">
            
            {/* Blue Lock Top Icon Container */}
            <div className="w-14 h-14 rounded-2xl bg-[#ebf3fe] text-[#0265dc] flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>

            {/* Header Text */}
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-[#0f172a] tracking-tight">Secure Login</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Enter your credentials to access the governance portal
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* User ID Field */}
              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-2">
                  User / Employee ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. INS-M01, MO-M01"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0265dc] focus:ring-4 focus:ring-[#0265dc]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0265dc] focus:ring-4 focus:ring-[#0265dc]/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
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
                className="w-full py-4 px-6 bg-[#0265dc] hover:bg-[#0052b4] active:bg-[#004192] text-white font-bold text-base rounded-2xl shadow-xl shadow-[#0265dc]/30 transition-all flex items-center justify-center gap-2 mt-6"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In & Continue'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

            </form>

            {/* Horizontal Divider */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Authorized access only</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="w-full text-center py-5 text-xs font-medium text-slate-400 relative z-10 border-t border-slate-200/60">
        © 2026 MineGuard · All rights reserved
      </footer>

    </div>
  );
}
