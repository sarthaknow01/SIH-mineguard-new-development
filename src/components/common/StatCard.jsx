import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, onClick, className = '' }) {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-400 border-blue-500/20 group-hover:border-blue-500/40',
    emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/20 group-hover:border-amber-500/40',
    red: 'from-red-500/10 to-red-600/5 text-red-400 border-red-500/20 group-hover:border-red-500/40',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40',
  };

  const iconBgMap = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-sm transition-all duration-200 ${colorMap[color]} ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-white font-mono tracking-tight">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <p className="mt-2 text-xs font-medium text-slate-300">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconBgMap[color]} transition-transform duration-200 group-hover:scale-110`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
