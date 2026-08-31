import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px] font-bold',
    md: 'px-3 py-1 text-xs font-bold',
    lg: 'px-3.5 py-1.5 text-xs font-bold',
  };

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/70',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    red: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    blue: 'bg-blue-50 text-[#0265dc] border border-blue-200/80',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/80',
  };

  // Helper matching common statuses
  let selectedVariant = variant;
  const upper = String(children || '').toUpperCase();
  if (upper.includes('VALID') || upper.includes('PASSED') || upper.includes('RESOLVED') || upper.includes('COMPLETED') || upper.includes('VERIFIED') || upper === 'LOW' || upper === 'HEALTHY') {
    selectedVariant = 'green';
  } else if (upper.includes('EXPIRING') || upper.includes('IN PROGRESS') || upper.includes('PENDING') || upper === 'MEDIUM' || upper.includes('WARNING')) {
    selectedVariant = 'amber';
  } else if (upper.includes('EXPIRED') || upper.includes('FAILED') || upper.includes('OPEN') || upper === 'HIGH' || upper === 'CRITICAL' || upper.includes('OVERDUE')) {
    selectedVariant = 'red';
  } else if (upper.includes('VERIFICATION REQUIRED') || upper.includes('INFO')) {
    selectedVariant = 'blue';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full tracking-wide capitalize ${sizeClasses[size]} ${variantClasses[selectedVariant]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0"></span>
      {children}
    </span>
  );
}
