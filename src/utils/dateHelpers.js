// Date and Certificate Status Calculation Helpers

export function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function calculateCertificateStatus(expiryDateStr) {
  if (!expiryDateStr) return 'UNKNOWN';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return {
      status: 'EXPIRED',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
      daysRemaining: diffDays,
      label: `Expired (${Math.abs(diffDays)}d ago)`
    };
  } else if (diffDays <= 30) {
    return {
      status: 'EXPIRING SOON',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      daysRemaining: diffDays,
      label: `Expiring Soon (${diffDays}d left)`
    };
  } else {
    return {
      status: 'VALID',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      daysRemaining: diffDays,
      label: `Valid (${diffDays}d left)`
    };
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(isoStr) {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoStr;
  }
}
