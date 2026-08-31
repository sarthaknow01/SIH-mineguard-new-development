import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const variantClasses = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    red: 'bg-red-500/15 text-red-400 border border-red-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  };

  // Helper matching common statuses
  let selectedVariant = variant;
  const upper = String(children || '').toUpperCase();
  if (upper.includes('VALID') || upper.includes('PASSED') || upper.includes('RESOLVED') || upper.includes('COMPLETED') || upper.includes('VERIFIED') || upper === 'LOW') {
    selectedVariant = 'green';
  } else if (upper.includes('EXPIRING') || upper.includes('IN PROGRESS') || upper.includes('PENDING') || upper === 'MEDIUM' || upper.includes('WARNING')) {
    selectedVariant = 'amber';
  } else if (upper.includes('EXPIRED') || upper.includes('FAILED') || upper.includes('OPEN') || upper === 'HIGH' || upper === 'CRITICAL' || upper.includes('OVERDUE')) {
    selectedVariant = 'red';
  } else if (upper.includes('VERIFICATION REQUIRED')) {
    selectedVariant = 'blue';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider ${sizeClasses[size]} ${variantClasses[selectedVariant]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse"></span>
      {children}
    </span>
  );
}
