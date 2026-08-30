// AI-Assisted Risk Prioritization & Explainability Engine (SIH PS26024)

export function evaluateRisk({
  category,
  severity = 'MEDIUM',
  workerRole = '',
  certStatus = 'VALID',
  area = '',
  equipmentCondition = 'NORMAL',
  repeatedCount = 0,
  hasOverdueAction = false,
}) {
  let score = 30; // base score
  const reasons = [];

  // 1. Severity weight
  if (severity === 'CRITICAL') {
    score += 35;
    reasons.push('Violation severity classified as CRITICAL (immediate hazard to life/shaft integrity).');
  } else if (severity === 'HIGH') {
    score += 25;
    reasons.push('High-severity safety parameter breach detected.');
  } else if (severity === 'MEDIUM') {
    score += 15;
    reasons.push('Moderate compliance gap requiring corrective remediation.');
  } else {
    score += 5;
    reasons.push('Low-severity observational discrepancy.');
  }

  // 2. Certificate status correlation
  if (certStatus === 'EXPIRED') {
    score += 20;
    reasons.push(`Assigned personnel possesses an EXPIRED mandatory competency certificate.`);
    if (workerRole.toLowerCase().includes('electric') || workerRole.toLowerCase().includes('blast')) {
      score += 10;
      reasons.push(`High-hazard technical designation (${workerRole}) performing uncertified operations.`);
    }
  } else if (certStatus === 'EXPIRING SOON') {
    score += 8;
    reasons.push('Personnel certification enters expiry buffer within 30 days.');
  }

  // 3. High Hazard Areas
  const highRiskZones = ['substation', 'shaft', 'blasting', 'underground face', 'haulage'];
  const isHighRiskZone = highRiskZones.some(z => area.toLowerCase().includes(z));
  if (isHighRiskZone) {
    score += 12;
    reasons.push(`Occurred in high-consequence operational sector: "${area}".`);
  }

  // 4. Recurrence and Overdue actions
  if (repeatedCount > 0) {
    score += Math.min(repeatedCount * 6, 18);
    reasons.push(`Recurring safety violation: ${repeatedCount} prior incident(s) logged in this zone.`);
  }

  if (hasOverdueAction) {
    score += 15;
    reasons.push('Corrective action timeline breached without verified resolution.');
  }

  // Cap score 0 - 100
  score = Math.max(5, Math.min(98, score));

  let level = 'LOW';
  let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  let gaugeColor = '#10b981';

  if (score >= 75) {
    level = 'HIGH';
    badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';
    gaugeColor = '#ef4444';
  } else if (score >= 50) {
    level = 'MEDIUM';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    gaugeColor = '#f59e0b';
  }

  return {
    score,
    level,
    badgeColor,
    gaugeColor,
    reasons,
    summary: `Risk calculated at ${score}/100 (${level}) based on ${reasons.length} risk factor weights.`
  };
}
