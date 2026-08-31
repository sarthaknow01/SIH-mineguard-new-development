import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, onClick, className = '' }) {
  const iconBgMap = {
    blue: 'bg-[#ebf3fe] text-[#0265dc]',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`w-13 h-13 rounded-2xl ${iconBgMap[color]} flex items-center justify-center shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 tracking-wide">{title}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <p className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
