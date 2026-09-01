import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import {
  DEMO_MINES,
  DEMO_WORKERS,
  DEMO_CERTIFICATES,
  DEMO_INSPECTIONS,
  DEMO_VIOLATIONS,
  DEMO_ALERTS,
  DEMO_CORRECTIVE_ACTIONS,
  DEMO_AUDIT_TRAIL,
  DEMO_SOS_ALERTS,
  DEMO_ACCOUNTS
} from '../utils/seedData';
import { calculateCertificateStatus, getTodayDateString } from '../utils/dateHelpers';
import { evaluateRisk } from '../utils/aiRiskEngine';
import { uploadFileToR2, mapSupabaseToFileReference } from '../utils/r2StorageService';
import { savePendingInspection, savePendingViolation, savePendingEvidence } from '../utils/offlineSyncManager';

const DataContext = createContext();

const STORAGE_KEY_PREFIX = 'mineguard_state_v2_';

function mapSupabaseToMine(row) {
  if (!row) return null;
  return {
    mineId: row.mine_id || row.mineId || row.id,
    code: row.code || '',
    mineName: row.mine_name || row.mineName || '',
    location: row.location || '',
    type: row.type || '',
    status: row.status || 'ACTIVE',
    complianceScore: row.compliance_score ?? row.complianceScore ?? 80,
    riskLevel: row.risk_level || row.riskLevel || 'LOW',
    officer: row.officer || '',
    officerId: row.officer_id || row.officerId || '',
    workersCount: row.workers_count ?? row.workersCount ?? 0,
    activeViolations: row.active_violations ?? row.activeViolations ?? 0,
    pendingActions: row.pending_actions ?? row.pendingActions ?? 0,
  };
}

function mapMineToSupabaseRow(m) {
  if (!m || !m.mineId) return null;
  return {
    mine_id: m.mineId,
    code: m.code || null,
    mine_name: m.mineName || null,
    location: m.location || null,
    type: m.type || null,
    status: m.status || 'ACTIVE',
    compliance_score: m.complianceScore ?? 80,
    risk_level: m.riskLevel || 'LOW',
    officer: m.officer || null,
    officer_id: m.officerId || null,
    workers_count: m.workersCount ?? 0,
    active_violations: m.activeViolations ?? 0,
    pending_actions: m.pendingActions ?? 0,
  };
}

async function saveMinesToSupabase(minesArr) {
  if (!minesArr || minesArr.length === 0) return;
  try {
    const rows = minesArr.map(mapMineToSupabaseRow).filter(Boolean);
    const { data, error } = await supabase
      .from('mines')
      .insert(rows)
      .select();

    if (error) {
      console.error('Supabase mines insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save mines exception:', err);
  }
}

function mapSupabaseToWorker(row) {
  if (!row) return null;
  return {
    workerId: row.worker_id || row.workerId || row.id,
    name: row.name || '',
    mineId: row.mine_id || row.mineId || '',
    mineName: row.mine_name || row.mineName || '',
    zoneId: row.zone_id || row.zoneId || '',
    zoneName: row.zone_name || row.zoneName || '',
    area: row.area || '',
    role: row.role || '',
    status: row.status || 'ACTIVE',
    joiningDate: row.joining_date || row.joiningDate || '',
    bloodGroup: row.blood_group || row.bloodGroup || '',
    contact: row.contact || '',
  };
}

function mapWorkerToSupabaseRow(w) {
  if (!w || !w.workerId) return null;
  return {
    worker_id: w.workerId,
    name: w.name || null,
    mine_id: w.mineId || null,
    mine_name: w.mineName || null,
    zone_id: w.zoneId || null,
    zone_name: w.zoneName || null,
    area: w.area || null,
    role: w.role || null,
    status: w.status || 'ACTIVE',
    joining_date: w.joiningDate || null,
    blood_group: w.bloodGroup || null,
    contact: w.contact || null,
  };
}

async function saveWorkersToSupabase(workersArr) {
  if (!workersArr || workersArr.length === 0) return;
  try {
    const rows = workersArr.map(mapWorkerToSupabaseRow).filter(Boolean);
    const { data, error } = await supabase
      .from('workers')
      .insert(rows)
      .select();

    if (error) {
      console.error('Supabase workers insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save workers exception:', err);
  }
}

function mapSupabaseToCertificate(row) {
  if (!row) return null;
  return {
    certificateId: row.certificate_id || row.certificateId || row.id,
    workerId: row.worker_id || row.workerId || '',
    workerName: row.worker_name || row.workerName || '',
    certificateType: row.certificate_type || row.certificateType || '',
    issueDate: row.issue_date || row.issueDate || '',
    expiryDate: row.expiry_date || row.expiryDate || '',
    issuingAuthority: row.issuing_authority || row.issuingAuthority || '',
    documentUrl: row.document_url || row.documentUrl || '',
    verificationStatus: row.verification_status || row.verificationStatus || 'VALID',
    mineId: row.mine_id || row.mineId || '',
    zoneId: row.zone_id || row.zoneId || '',
    area: row.area || '',
  };
}

function mapCertificateToSupabaseRow(c) {
  if (!c || !c.certificateId) return null;
  return {
    certificate_id: c.certificateId,
    worker_id: c.workerId || null,
    worker_name: c.workerName || null,
    certificate_type: c.certificateType || null,
    issue_date: c.issueDate || null,
    expiry_date: c.expiryDate || null,
    issuing_authority: c.issuingAuthority || null,
    document_url: c.documentUrl || null,
    verification_status: c.verificationStatus || 'VALID',
    mine_id: c.mineId || null,
    zone_id: c.zoneId || null,
    area: c.area || null,
  };
}

async function saveCertificatesToSupabase(certsArr) {
  if (!certsArr || certsArr.length === 0) return;
  try {
    const rows = certsArr.map(mapCertificateToSupabaseRow).filter(Boolean);
    const { data, error } = await supabase
      .from('certificates')
      .insert(rows)
      .select();

    if (error) {
      console.error('Supabase certificates insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save certificates exception:', err);
  }
}

async function saveCertificateToSupabase(c) {
  if (!c || !c.certificateId) return;
  try {
    const row = mapCertificateToSupabaseRow(c);
    const { data, error } = await supabase
      .from('certificates')
      .insert(row)
      .select();

    if (error) {
      console.error('Supabase single certificate insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save certificate exception:', err);
  }
}

function mapSupabaseToInspection(row) {
  if (!row) return null;
  return {
    inspectionId: row.inspection_id || row.inspectionId || row.id,
    mineId: row.mine_id || row.mineId || '',
    mineName: row.mine_name || row.mineName || '',
    area: row.area || '',
    zoneId: row.zone_id || row.zoneId || '',
    date: row.date || '',
    inspectionType: row.inspection_type || row.inspectionType || '',
    overallResult: row.overall_result || row.overallResult || 'COMPLETED',
    inspectorId: row.inspector_id || row.inspectorId || '',
    inspectorName: row.inspector_name || row.inspectorName || '',
    checklistResults: row.checklist_results || row.checklistResults || [],
    notes: row.notes || '',
    latitude: row.latitude ?? row.lat ?? null,
    longitude: row.longitude ?? row.lng ?? null,
    locationTimestamp: row.location_timestamp || row.locationTimestamp || null,
  };
}

function mapInspectionToSupabaseRow(i) {
  if (!i || !i.inspectionId) return null;
  return {
    inspection_id: i.inspectionId,
    mine_id: i.mineId || null,
    mine_name: i.mineName || null,
    area: i.area || null,
    zone_id: i.zoneId || null,
    date: i.date || null,
    inspection_type: i.inspectionType || null,
    overall_result: i.overallResult || 'COMPLETED',
    inspector_id: i.inspectorId || null,
    inspector_name: i.inspectorName || null,
    checklist_results: i.checklistResults || [],
    notes: i.notes || null,
    latitude: i.latitude ?? null,
    longitude: i.longitude ?? null,
    location_timestamp: i.locationTimestamp || i.location_timestamp || null,
  };
}

async function saveInspectionsToSupabase(inspsArr) {
  if (!inspsArr || inspsArr.length === 0) return;
  try {
    const rows = inspsArr.map(mapInspectionToSupabaseRow).filter(Boolean);
    const { data, error } = await supabase
      .from('inspections')
      .insert(rows)
      .select();

    if (error) {
      console.error('Supabase inspections insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save inspections exception:', err);
  }
}

async function saveInspectionToSupabase(i) {
  if (!i || !i.inspectionId) return;
  try {
    const row = mapInspectionToSupabaseRow(i);
    const { data, error } = await supabase
      .from('inspections')
      .upsert(row, { onConflict: 'inspection_id' })
      .select();

    if (error) {
      console.error('Supabase single inspection insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save inspection exception:', err);
  }
}

function mapSupabaseToViolation(row) {
  if (!row) return null;
  return {
    violationId: row.violation_id || row.violationId || row.id,
    mineId: row.mine_id || row.mineId,
    mineName: row.mine_name || row.mineName,
    area: row.area,
    zoneId: row.zone_id || row.zoneId || null,
    category: row.category,
    severity: row.severity,
    workerId: row.worker_id || row.workerId || null,
    workerName: row.worker_name || row.workerName || null,
    certificateId: row.certificate_id || row.certificateId || null,
    description: row.description || '',
    reportedBy: row.reported_by || row.reportedBy || '',
    date: row.reported_date || row.date || '',
    reportedDate: row.reported_date || row.date || '',
    status: row.status,
    evidence: row.evidence || '',
    riskScore: row.risk_score ?? row.riskScore ?? 0,
    riskLevel: row.risk_level || row.riskLevel || 'LOW',
    aiExplanation: row.ai_explanation || row.aiExplanation || '',
    inspectionId: row.inspection_id || row.inspectionId || null,
    resolvedDate: row.resolved_date || row.resolvedDate || null,
    verificationNotes: row.verification_notes || row.verificationNotes || null,
    latitude: row.latitude ?? row.lat ?? null,
    longitude: row.longitude ?? row.lng ?? null,
    locationTimestamp: row.location_timestamp || row.locationTimestamp || null,
  };
}

async function saveViolationToSupabase(v) {
  if (!v || !v.violationId) return;
  try {
    const dbRow = mapViolationToSupabaseRow(v);
    const { data, error } = await supabase
      .from('violations')
      .upsert(dbRow, { onConflict: 'violation_id' })
      .select();

    if (error) {
      console.error('Supabase saveViolationToSupabase error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save violation exception:', err);
  }
}

function mapViolationToSupabaseRow(v) {
  if (!v || !v.violationId) return null;
  return {
    violation_id: v.violationId,
    mine_id: v.mineId || null,
    mine_name: v.mineName || null,
    area: v.area || null,
    zone_id: v.zoneId || v.zone_id || null,
    category: v.category || null,
    severity: v.severity || null,
    worker_id: v.workerId || null,
    worker_name: v.workerName || null,
    certificate_id: v.certificateId || null,
    description: v.description || '',
    reported_by: v.reportedBy || null,
    reported_date: v.reportedDate || v.date || null,
    status: v.status || 'OPEN',
    evidence: v.evidence || null,
    risk_score: v.riskScore ?? null,
    risk_level: v.riskLevel || null,
    ai_explanation: v.aiExplanation || null,
    inspection_id: v.inspectionId || null,
    resolved_date: v.resolvedDate || null,
    verification_notes: v.verificationNotes || null,
    latitude: v.latitude ?? null,
    longitude: v.longitude ?? null,
    location_timestamp: v.locationTimestamp || v.location_timestamp || null,
  };
}

async function saveViolationsToSupabase(vArr) {
  if (!vArr || vArr.length === 0) return;
  try {
    const rows = vArr.map(mapViolationToSupabaseRow).filter(Boolean);
    const { data, error } = await supabase
      .from('violations')
      .upsert(rows, { onConflict: 'violation_id' })
      .select();

    if (error) {
      console.error('Supabase batch violations insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase saveViolationsToSupabase exception:', err);
  }
}

function mapSupabaseToCorrectiveAction(row) {
  if (!row) return null;
  return {
    actionId: row.action_id || row.actionId || row.id,
    violationId: row.violation_id || row.violationId || '',
    mineId: row.mine_id || row.mineId || '',
    title: row.title || '',
    description: row.description || '',
    assignedTo: row.assigned_to || row.assignedTo || '',
    dueDate: row.due_date || row.dueDate || '',
    priority: row.priority || 'MEDIUM',
    status: row.status || 'IN PROGRESS',
    createdDate: row.created_date || row.createdDate || '',
    completionNotes: row.completion_notes || row.completionNotes || '',
    evidence: row.evidence || '',
    resolvedDate: row.resolved_date || row.resolvedDate || null,
  };
}

function mapCorrectiveActionToSupabaseRow(ca) {
  if (!ca || !ca.actionId) return null;
  return {
    action_id: ca.actionId,
    violation_id: ca.violationId || null,
    mine_id: ca.mineId || null,
    title: ca.title || null,
    description: ca.description || null,
    assigned_to: ca.assignedTo || null,
    due_date: ca.dueDate || null,
    priority: ca.priority || 'MEDIUM',
    status: ca.status || 'IN PROGRESS',
    created_date: ca.createdDate || null,
    completion_notes: ca.completionNotes || null,
    evidence: ca.evidence || null,
    resolved_date: ca.resolvedDate || null,
  };
}

async function saveCorrectiveActionsToSupabase(actionsArr) {
  if (!actionsArr || actionsArr.length === 0) return;
  try {
    const rows = actionsArr.map(mapCorrectiveActionToSupabaseRow).filter(Boolean);
    const { data, error } = await supabase
      .from('corrective_actions')
      .upsert(rows, { onConflict: 'action_id' })
      .select();

    if (error) {
      console.error('Supabase corrective_actions insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save corrective_actions exception:', err);
  }
}

async function saveCorrectiveActionToSupabase(ca) {
  if (!ca || !ca.actionId) return;
  try {
    const row = mapCorrectiveActionToSupabaseRow(ca);
    const { data, error } = await supabase
      .from('corrective_actions')
      .upsert(row, { onConflict: 'action_id' })
      .select();

    if (error) {
      console.error('Supabase single corrective_action upsert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save corrective_action exception:', err);
  }
}

function mapSupabaseToAlert(row) {
  if (!row) return null;
  const isRead = row.is_read ?? (row.status === 'READ');
  return {
    alertId: row.alert_id || row.alertId || row.id,
    mineId: row.mine_id || row.mineId || '',
    violationId: row.violation_id || row.violationId || row.related_entity || row.relatedEntity || '',
    relatedEntity: row.related_entity || row.relatedEntity || row.violation_id || '',
    title: row.title || '',
    message: row.message || row.description || '',
    description: row.description || row.message || '',
    type: row.type || 'VIOLATION_REPORTED',
    severity: row.severity || 'MEDIUM',
    timestamp: row.timestamp || row.created_date || row.createdDate || '',
    createdDate: row.created_date || row.timestamp || row.createdDate || '',
    isRead: isRead,
    status: row.status || (isRead ? 'READ' : 'UNREAD'),
    targetRoles: Array.isArray(row.target_roles) ? row.target_roles : (row.targetRoles || ['officer', 'management', 'authority', 'inspector']),
  };
}

function mapAlertToSupabaseRow(a) {
  if (!a || !a.alertId) return null;
  const isRead = a.isRead ?? (a.status === 'READ');
  return {
    alert_id: a.alertId,
    mine_id: a.mineId || null,
    violation_id: a.violationId || a.relatedEntity || null,
    related_entity: a.relatedEntity || a.violationId || null,
    title: a.title || null,
    message: a.message || a.description || null,
    description: a.description || a.message || null,
    type: a.type || 'VIOLATION_REPORTED',
    severity: a.severity || 'MEDIUM',
    timestamp: a.timestamp || a.createdDate || null,
    created_date: a.createdDate || a.timestamp || null,
    is_read: isRead,
    status: a.status || (isRead ? 'READ' : 'UNREAD'),
    target_roles: a.targetRoles || ['officer', 'management', 'authority', 'inspector'],
  };
}

async function saveAlertsToSupabase(alertsArr) {
  if (!alertsArr || alertsArr.length === 0) return;
  try {
    const rows = alertsArr.map(mapAlertToSupabaseRow).filter(Boolean);
    const { data, error } = await supabase
      .from('alerts')
      .insert(rows)
      .select();

    if (error) {
      console.error('Supabase alerts insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save alerts exception:', err);
  }
}

async function saveAlertToSupabase(a) {
  if (!a || !a.alertId) return;
  try {
    const row = mapAlertToSupabaseRow(a);
    const { data, error } = await supabase
      .from('alerts')
      .insert(row)
      .select();

    if (error) {
      console.error('Supabase single alert insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save alert exception:', err);
  }
}

function mapSupabaseToAuditLog(row) {
  if (!row) return null;
  return {
    auditId: row.audit_id || row.auditId || row.id,
    timestamp: row.timestamp || row.created_at || '',
    actor: row.actor || '',
    role: row.role || '',
    action: row.action || '',
    details: row.details || '',
    mineId: row.mine_id || row.mineId || 'MINE-01',
  };
}

function mapAuditLogToSupabaseRow(a) {
  if (!a || !a.auditId) return null;
  return {
    audit_id: a.auditId,
    timestamp: a.timestamp || null,
    actor: a.actor || null,
    role: a.role || null,
    action: a.action || null,
    details: a.details || null,
    mine_id: a.mineId || 'MINE-01',
  };
}

async function saveAuditLogsToSupabase(logsArr) {
  if (!logsArr || logsArr.length === 0) return;
  try {
    const rows = logsArr.map(mapAuditLogToSupabaseRow).filter(Boolean);
    const { data, error } = await supabase
      .from('audit_trail')
      .insert(rows)
      .select();

    if (error) {
      console.error('Supabase audit_trail insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save audit logs exception:', err);
  }
}

async function saveAuditLogToSupabase(a) {
  if (!a || !a.auditId) return;
  try {
    const row = mapAuditLogToSupabaseRow(a);
    const { data, error } = await supabase
      .from('audit_trail')
      .insert(row)
      .select();

    if (error) {
      console.error('Supabase single audit_log insert error:', error);
    }
    return data;
  } catch (err) {
    console.error('Supabase save audit log exception:', err);
  }
}

function mapSupabaseToSosAlert(row) {
  if (!row) return null;
  return {
    alertId: row.alert_id || row.alertId || row.id,
    inspectorName: row.inspector_name || row.inspectorName || '',
    inspectorId: row.inspector_id || row.inspectorId || '',
    mineName: row.mine_name || row.mineName || '',
    mineId: row.mine_id || row.mineId || '',
    timestamp: row.timestamp || row.created_at || '',
    status: row.status || 'ACTIVE',
    alertType: 'SOS',
    acknowledgedBy: row.acknowledged_by || row.acknowledgedBy || null,
    acknowledgedAt: row.acknowledged_at || row.acknowledged_time || row.acknowledgedAt || null,
    acknowledgedTime: row.acknowledged_time || row.acknowledged_at || row.acknowledgedTime || null,
  };
}

function mapSosAlertToSupabaseRow(sos) {
  if (!sos || !sos.alertId) return null;
  return {
    alert_id: sos.alertId,
    inspector_name: sos.inspectorName || null,
    inspector_id: sos.inspectorId || null,
    mine_name: sos.mineName || null,
    mine_id: sos.mineId || null,
    timestamp: sos.timestamp || null,
    status: sos.status || 'ACTIVE',
    acknowledged_by: sos.acknowledgedBy || null,
    acknowledged_at: sos.acknowledgedAt || sos.acknowledgedTime || null,
  };
}

async function saveSosAlertToSupabase(sos) {
  if (!sos || !sos.alertId) return;
  try {
    const row = mapSosAlertToSupabaseRow(sos);
    console.log('[Supabase SOS] Inserting row into sos_alerts table:', row);
    const { data, error } = await supabase
      .from('sos_alerts')
      .insert(row)
      .select();

    if (error) {
      console.error('❌ [Supabase SOS] Insert FAILURE:', error.message || error);
    } else {
      console.log('✅ [Supabase SOS] Insert SUCCESS:', data);
    }
    return data;
  } catch (err) {
    console.error('❌ [Supabase SOS] Insert EXCEPTION:', err);
  }
}

async function updateSosAlertInSupabase(alertId, acknowledgedBy, acknowledgedTime) {
  if (!alertId) return;
  try {
    console.log(`[Supabase SOS] Updating alert ${alertId} in sos_alerts table to ACKNOWLEDGED...`);
    const { data, error } = await supabase
      .from('sos_alerts')
      .update({
        status: 'ACKNOWLEDGED',
        acknowledged_by: acknowledgedBy || 'Mine Officer',
        acknowledged_at: acknowledgedTime || new Date().toISOString()
      })
      .eq('alert_id', alertId)
      .select();

    if (error) {
      console.error('❌ [Supabase SOS] Update FAILURE:', error.message || error);
    } else {
      console.log('✅ [Supabase SOS] Update SUCCESS:', data);
    }
    return data;
  } catch (err) {
    console.error('❌ [Supabase SOS] Update EXCEPTION:', err);
  }
}

export function DataProvider({ children }) {
  const [mines, setMines] = useState(() => loadFromStorage('mines', DEMO_MINES));
  const [workers, setWorkers] = useState(() => loadFromStorage('workers', DEMO_WORKERS));
  const [certificates, setCertificates] = useState(() => loadFromStorage('certificates', DEMO_CERTIFICATES));
  const [inspections, setInspections] = useState(() => loadFromStorage('inspections', DEMO_INSPECTIONS));
  const [violations, setViolations] = useState(() => loadFromStorage('violations', DEMO_VIOLATIONS));
  const [alerts, setAlerts] = useState(() => loadFromStorage('alerts', DEMO_ALERTS));
  const [correctiveActions, setCorrectiveActions] = useState(() => loadFromStorage('correctiveActions', DEMO_CORRECTIVE_ACTIONS));
  const [auditTrail, setAuditTrail] = useState(() => loadFromStorage('auditTrail', DEMO_AUDIT_TRAIL));
  const [sosAlerts, setSosAlerts] = useState(() => loadFromStorage('sos_alerts', []));
  const [fileReferences, setFileReferences] = useState(() => loadFromStorage('fileReferences', []));
  const sosRealtimeChannelRef = useRef(null);

  function loadFromStorage(key, fallback) {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return fallback;
  }

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'mines', JSON.stringify(mines));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'workers', JSON.stringify(workers));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'certificates', JSON.stringify(certificates));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'inspections', JSON.stringify(inspections));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'violations', JSON.stringify(violations));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'alerts', JSON.stringify(alerts));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'correctiveActions', JSON.stringify(correctiveActions));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'auditTrail', JSON.stringify(auditTrail));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'sos_alerts', JSON.stringify(sosAlerts));
    localStorage.setItem(STORAGE_KEY_PREFIX + 'fileReferences', JSON.stringify(fileReferences));
  }, [mines, workers, certificates, inspections, violations, alerts, correctiveActions, auditTrail, sosAlerts, fileReferences]);

  // Upload file to Backblaze B2 and store metadata in Supabase file_references (Online or Offline IndexedDB Queue)
  const uploadFileReference = async ({ file, relatedRecordType, relatedRecordId, uploadedBy }) => {
    if (!file) return null;

    if (!navigator.onLine) {
      console.log('Offline: Queuing evidence Blob in IndexedDB for later B2 upload.');
      const pendingEv = await savePendingEvidence({ file, relatedRecordType, relatedRecordId, uploadedBy });
      const tempRef = {
        fileId: pendingEv.fileId,
        fileName: pendingEv.fileName,
        fileType: pendingEv.fileType,
        fileSize: pendingEv.fileSize,
        r2ObjectKey: '',
        fileUrl: '',
        uploadedBy: pendingEv.uploadedBy,
        uploadedAt: pendingEv.createdAt,
        relatedRecordType: pendingEv.relatedRecordType,
        relatedRecordId: pendingEv.relatedRecordId,
        syncStatus: 'PENDING',
      };
      setFileReferences(prev => [tempRef, ...prev]);
      return tempRef;
    }

    try {
      const fileRef = await uploadFileToR2({
        file,
        relatedRecordType,
        relatedRecordId,
        uploadedBy
      });
      if (fileRef) {
        setFileReferences(prev => [fileRef, ...prev.filter(f => f.fileId !== fileRef.fileId)]);
      }
      return fileRef;
    } catch (err) {
      console.warn('Network error during evidence upload, queuing in IndexedDB:', err);
      const pendingEv = await savePendingEvidence({ file, relatedRecordType, relatedRecordId, uploadedBy });
      return pendingEv;
    }
  };

  // BroadcastChannel for 0ms instant real-time sync across tabs/windows
  useEffect(() => {
    let bc;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('mineguard_sos_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'SOS_UPDATED' && Array.isArray(event.data.sosAlerts)) {
          console.log('📡 [BroadcastChannel] Received instant SOS update:', event.data.sosAlerts);
          setSosAlerts(event.data.sosAlerts);
        }
      };
    }
    return () => {
      if (bc) bc.close();
    };
  }, []);

  const broadcastSOSUpdate = (updatedList) => {
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('mineguard_sos_channel');
        bc.postMessage({ type: 'SOS_UPDATED', sosAlerts: updatedList });
        bc.close();
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  };

  // Subscribe to Supabase Realtime changes & Broadcast events on 'mineguard_global_sos_channel'
  useEffect(() => {
    async function fetchInitialSosAlerts() {
      try {
        const { data, error } = await supabase
          .from('sos_alerts')
          .select('*')
          .order('timestamp', { ascending: false });

        if (error) {
          console.warn('⚠️ [Supabase SOS] Fetch initial sos_alerts notice:', error.message || error);
        } else if (data) {
          const mapped = data.map(mapSupabaseToSosAlert).filter(Boolean);
          setSosAlerts(mapped);
          localStorage.setItem(STORAGE_KEY_PREFIX + 'sos_alerts', JSON.stringify(mapped));
        }
      } catch (err) {
        console.warn('⚠️ [Supabase SOS] Exception fetching initial sos_alerts:', err);
      }
    }

    fetchInitialSosAlerts();

    const channel = supabase.channel('mineguard_global_sos_channel', {
      config: {
        broadcast: { self: true }
      }
    });

    sosRealtimeChannelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sos_alerts' },
        (payload) => {
          console.log(`🔔 [Supabase Postgres Realtime] Event Received [${payload.eventType}]:`, payload);
          if (payload.eventType === 'INSERT' && payload.new) {
            const newAlert = mapSupabaseToSosAlert(payload.new);
            if (newAlert) {
              setSosAlerts((prev) => {
                const updated = prev.some((a) => a.alertId === newAlert.alertId)
                  ? prev.map((a) => (a.alertId === newAlert.alertId ? newAlert : a))
                  : [newAlert, ...prev];
                localStorage.setItem(STORAGE_KEY_PREFIX + 'sos_alerts', JSON.stringify(updated));
                return updated;
              });
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedAlert = mapSupabaseToSosAlert(payload.new);
            if (updatedAlert) {
              setSosAlerts((prev) => {
                const updated = prev.map((a) => (a.alertId === updatedAlert.alertId ? updatedAlert : a));
                localStorage.setItem(STORAGE_KEY_PREFIX + 'sos_alerts', JSON.stringify(updated));
                return updated;
              });
            }
          }
        }
      )
      .on('broadcast', { event: 'sos_trigger' }, ({ payload }) => {
        console.log('🚨 [Supabase Realtime Broadcast] SOS received from remote device:', payload);
        if (payload && payload.alertId) {
          setSosAlerts((prev) => {
            if (prev.some((a) => a.alertId === payload.alertId)) return prev;
            const updated = [payload, ...prev];
            localStorage.setItem(STORAGE_KEY_PREFIX + 'sos_alerts', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .on('broadcast', { event: 'sos_acknowledge' }, ({ payload }) => {
        console.log('✅ [Supabase Realtime Broadcast] Acknowledgment received from remote device:', payload);
        if (payload && payload.alertId) {
          setSosAlerts((prev) => {
            const updated = prev.map((a) => (a.alertId === payload.alertId ? { ...a, ...payload } : a));
            localStorage.setItem(STORAGE_KEY_PREFIX + 'sos_alerts', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .subscribe((status, err) => {
        console.log(`📡 [Supabase Realtime Status] Channel status: ${status}`, err || '');
      });

    const pollInterval = setInterval(() => {
      fetchInitialSosAlerts();
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
      sosRealtimeChannelRef.current = null;
    };
  }, []);

  // Live Supabase DB Polling & Sync for Violations, Inspections, Certificates, Actions, Alerts across devices
  useEffect(() => {
    async function syncAllSupabaseTables() {
      try {
        // Violations
        const { data: vData } = await supabase.from('violations').select('*').order('reported_date', { ascending: false });
        if (vData && vData.length > 0) {
          const mappedV = vData.map(mapSupabaseToViolation).filter(Boolean);
          setViolations(prev => {
            const map = new Map();
            mappedV.forEach(item => map.set(item.violationId, item));
            prev.forEach(item => { if (!map.has(item.violationId)) map.set(item.violationId, item); });
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY_PREFIX + 'violations', JSON.stringify(merged));
            return merged;
          });
        }

        // Inspections
        const { data: iData } = await supabase.from('inspections').select('*').order('date', { ascending: false });
        if (iData && iData.length > 0) {
          const mappedI = iData.map(mapSupabaseToInspection).filter(Boolean);
          setInspections(prev => {
            const map = new Map();
            mappedI.forEach(item => map.set(item.inspectionId, item));
            prev.forEach(item => { if (!map.has(item.inspectionId)) map.set(item.inspectionId, item); });
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY_PREFIX + 'inspections', JSON.stringify(merged));
            return merged;
          });
        }

        // Mines
        const { data: mData } = await supabase.from('mines').select('*');
        if (mData && mData.length > 0) {
          const mappedM = mData.map(mapSupabaseToMine).filter(Boolean);
          setMines(prev => {
            const map = new Map();
            mappedM.forEach(item => {
              const existing = prev.find(p => p.mineId === item.mineId);
              if (existing && existing.complianceScore !== undefined) {
                map.set(item.mineId, {
                  ...item,
                  complianceScore: existing.complianceScore,
                  riskLevel: existing.riskLevel,
                  activeViolations: existing.activeViolations ?? item.activeViolations,
                  pendingActions: existing.pendingActions ?? item.pendingActions,
                  overdueActions: existing.overdueActions ?? item.overdueActions
                });
              } else {
                map.set(item.mineId, item);
              }
            });
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY_PREFIX + 'mines', JSON.stringify(merged));
            return merged;
          });
        }

        // Workers
        const { data: wData } = await supabase.from('workers').select('*');
        if (wData && wData.length > 0) {
          const mappedW = wData.map(mapSupabaseToWorker).filter(Boolean);
          setWorkers(prev => {
            const map = new Map();
            mappedW.forEach(item => map.set(item.workerId, item));
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY_PREFIX + 'workers', JSON.stringify(merged));
            return merged;
          });
        }

        // Certificates
        const { data: cData } = await supabase.from('certificates').select('*');
        if (cData && cData.length > 0) {
          const mappedC = cData.map(mapSupabaseToCertificate).filter(Boolean);
          setCertificates(prev => {
            const map = new Map();
            mappedC.forEach(item => map.set(item.certificateId, item));
            prev.forEach(item => { if (!map.has(item.certificateId)) map.set(item.certificateId, item); });
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY_PREFIX + 'certificates', JSON.stringify(merged));
            return merged;
          });
        }

        // Corrective Actions
        const { data: caData } = await supabase.from('corrective_actions').select('*').order('created_date', { ascending: false });
        if (caData && caData.length > 0) {
          const mappedCA = caData.map(mapSupabaseToCorrectiveAction).filter(Boolean);
          setCorrectiveActions(prev => {
            const map = new Map();
            mappedCA.forEach(item => map.set(item.actionId, item));
            prev.forEach(item => { if (!map.has(item.actionId)) map.set(item.actionId, item); });
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY_PREFIX + 'correctiveActions', JSON.stringify(merged));
            return merged;
          });
        }

        // System Alerts
        const { data: aData } = await supabase.from('alerts').select('*').order('created_date', { ascending: false });
        if (aData && aData.length > 0) {
          const mappedA = aData.map(mapSupabaseToAlert).filter(Boolean);
          setAlerts(prev => {
            const map = new Map();
            mappedA.forEach(item => map.set(item.alertId, item));
            prev.forEach(item => { if (!map.has(item.alertId)) map.set(item.alertId, item); });
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY_PREFIX + 'alerts', JSON.stringify(merged));
            return merged;
          });
        }

        // File References (Cloudflare R2 metadata stored in Supabase)
        const { data: fData } = await supabase.from('file_references').select('*').order('uploaded_at', { ascending: false });
        if (fData && fData.length > 0) {
          const mappedF = fData.map(mapSupabaseToFileReference).filter(Boolean);
          setFileReferences(prev => {
            const map = new Map();
            mappedF.forEach(item => map.set(item.fileId, item));
            prev.forEach(item => { if (!map.has(item.fileId)) map.set(item.fileId, item); });
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY_PREFIX + 'fileReferences', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Supabase DB multi-table poll error:', err);
      }
    }

    syncAllSupabaseTables();
    const interval = setInterval(syncAllSupabaseTables, 4000);
    return () => clearInterval(interval);
  }, []);

  // Native Supabase Realtime WebSocket Subscriptions for live multi-device synchronization
  useEffect(() => {
    const channel = supabase
      .channel('mineguard_live_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, (payload) => {
        if (payload.new) {
          const item = mapSupabaseToInspection(payload.new);
          if (item) {
            setInspections(prev => {
              const map = new Map();
              prev.forEach(i => map.set(i.inspectionId, i));
              map.set(item.inspectionId, item);
              return Array.from(map.values());
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'violations' }, (payload) => {
        if (payload.new) {
          const item = mapSupabaseToViolation(payload.new);
          if (item) {
            setViolations(prev => {
              const map = new Map();
              prev.forEach(v => map.set(v.violationId, v));
              map.set(item.violationId, item);
              return Array.from(map.values());
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'corrective_actions' }, (payload) => {
        if (payload.new) {
          const item = mapSupabaseToCorrectiveAction(payload.new);
          if (item) {
            setCorrectiveActions(prev => {
              const map = new Map();
              prev.forEach(ca => map.set(ca.actionId, ca));
              map.set(item.actionId, item);
              return Array.from(map.values());
            });
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.new) {
          const item = mapSupabaseToAlert(payload.new);
          if (item) {
            setAlerts(prev => {
              const map = new Map();
              prev.forEach(a => map.set(a.alertId, a));
              map.set(item.alertId, item);
              return Array.from(map.values());
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Listen for storage events to synchronize data across multiple tabs/windows in real time
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith(STORAGE_KEY_PREFIX)) {
        const key = e.key.replace(STORAGE_KEY_PREFIX, '');
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (key === 'mines') setMines(parsed);
            if (key === 'workers') setWorkers(parsed);
            if (key === 'certificates') setCertificates(parsed);
            if (key === 'inspections') setInspections(parsed);
            if (key === 'violations') setViolations(parsed);
            if (key === 'alerts') setAlerts(parsed);
            if (key === 'correctiveActions') setCorrectiveActions(parsed);
            if (key === 'auditTrail') setAuditTrail(parsed);
            if (key === 'sos_alerts') setSosAlerts(parsed);
          } catch (err) {
            console.error('Storage sync error:', err);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch and seed mines from Supabase on mount
  useEffect(() => {
    async function initSupabaseMines() {
      try {
        // Ensure 5 demo mines exist in Supabase
        await saveMinesToSupabase(DEMO_MINES);

        // Fetch mines from Supabase
        const { data, error } = await supabase.from('mines').select('*');
        if (error) {
          console.error('Error fetching mines from Supabase:', error);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map(mapSupabaseToMine).filter(Boolean);
          setMines(prev => {
            const map = new Map();
            prev.forEach(m => map.set(m.mineId, m));
            mapped.forEach(m => {
              const existing = map.get(m.mineId);
              map.set(m.mineId, {
                ...existing,
                ...m,
                zones: existing?.zones || m.zones || []
              });
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Exception syncing mines with Supabase:', err);
      }
    }

    initSupabaseMines();
  }, []);

  // Fetch and seed workers from Supabase on mount
  useEffect(() => {
    async function initSupabaseWorkers() {
      try {
        // Ensure demo workers exist in Supabase
        await saveWorkersToSupabase(DEMO_WORKERS);

        // Fetch workers from Supabase
        const { data, error } = await supabase.from('workers').select('*');
        if (error) {
          console.error('Error fetching workers from Supabase:', error);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map(mapSupabaseToWorker).filter(Boolean);
          setWorkers(prev => {
            const map = new Map();
            prev.forEach(w => map.set(w.workerId, w));
            mapped.forEach(w => map.set(w.workerId, w));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Exception syncing workers with Supabase:', err);
      }
    }

    initSupabaseWorkers();
  }, []);

  // Fetch and seed certificates from Supabase on mount
  useEffect(() => {
    async function initSupabaseCertificates() {
      try {
        // Ensure demo certificates exist in Supabase
        await saveCertificatesToSupabase(DEMO_CERTIFICATES);

        // Fetch certificates from Supabase
        const { data, error } = await supabase.from('certificates').select('*');
        if (error) {
          console.error('Error fetching certificates from Supabase:', error);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map(mapSupabaseToCertificate).filter(Boolean);
          setCertificates(prev => {
            const map = new Map();
            prev.forEach(c => map.set(c.certificateId, c));
            mapped.forEach(c => map.set(c.certificateId, c));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Exception syncing certificates with Supabase:', err);
      }
    }

    initSupabaseCertificates();
  }, []);

  // Fetch and seed inspections from Supabase on mount
  useEffect(() => {
    async function initSupabaseInspections() {
      try {
        const { data, error } = await supabase.from('inspections').select('*');
        if (error) {
          console.error('Error fetching inspections from Supabase:', error);
          return;
        }

        if (!data || data.length === 0) {
          await saveInspectionsToSupabase(DEMO_INSPECTIONS);
          const { data: seeded } = await supabase.from('inspections').select('*');
          if (seeded) setInspections(seeded.map(mapSupabaseToInspection).filter(Boolean));
        } else {
          const mapped = data.map(mapSupabaseToInspection).filter(Boolean);
          setInspections(prev => {
            const map = new Map();
            mapped.forEach(i => map.set(i.inspectionId, i));
            prev.forEach(i => { if (!map.has(i.inspectionId)) map.set(i.inspectionId, i); });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Exception syncing inspections with Supabase:', err);
      }
    }

    initSupabaseInspections();
  }, []);

  // Fetch violations from Supabase table on mount
  useEffect(() => {
    async function fetchSupabaseViolations() {
      try {
        const { data, error } = await supabase.from('violations').select('*');
        if (error) {
          console.error('Error fetching violations from Supabase:', error);
          return;
        }
        if (!data || data.length === 0) {
          await saveViolationsToSupabase(DEMO_VIOLATIONS);
          const { data: seeded } = await supabase.from('violations').select('*');
          if (seeded) setViolations(seeded.map(mapSupabaseToViolation).filter(Boolean));
        } else {
          const mapped = data.map(mapSupabaseToViolation).filter(Boolean);
          setViolations(prev => {
            const map = new Map();
            mapped.forEach(v => map.set(v.violationId, v));
            prev.forEach(v => { if (!map.has(v.violationId)) map.set(v.violationId, v); });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Exception fetching violations from Supabase:', err);
      }
    }

    fetchSupabaseViolations();
  }, []);

  // Fetch and seed corrective actions from Supabase on mount
  useEffect(() => {
    async function initSupabaseCorrectiveActions() {
      try {
        const { data, error } = await supabase.from('corrective_actions').select('*');
        if (error) {
          console.error('Error fetching corrective actions from Supabase:', error);
          return;
        }

        if (!data || data.length === 0) {
          await saveCorrectiveActionsToSupabase(DEMO_CORRECTIVE_ACTIONS);
          const { data: seeded } = await supabase.from('corrective_actions').select('*');
          if (seeded) setCorrectiveActions(seeded.map(mapSupabaseToCorrectiveAction).filter(Boolean));
        } else {
          const mapped = data.map(mapSupabaseToCorrectiveAction).filter(Boolean);
          setCorrectiveActions(prev => {
            const map = new Map();
            mapped.forEach(ca => map.set(ca.actionId, ca));
            prev.forEach(ca => { if (!map.has(ca.actionId)) map.set(ca.actionId, ca); });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Exception syncing corrective actions with Supabase:', err);
      }
    }

    initSupabaseCorrectiveActions();
  }, []);

  // Fetch and seed alerts from Supabase on mount
  useEffect(() => {
    async function initSupabaseAlerts() {
      try {
        const { data, error } = await supabase.from('alerts').select('*');
        if (error) {
          console.error('Error fetching alerts from Supabase:', error);
          return;
        }

        if (!data || data.length === 0) {
          await saveAlertsToSupabase(DEMO_ALERTS);
          const { data: seeded } = await supabase.from('alerts').select('*');
          if (seeded) setAlerts(seeded.map(mapSupabaseToAlert).filter(Boolean));
        } else {
          const mapped = data.map(mapSupabaseToAlert).filter(Boolean);
          setAlerts(prev => {
            const map = new Map();
            mapped.forEach(a => map.set(a.alertId, a));
            prev.forEach(a => { if (!map.has(a.alertId)) map.set(a.alertId, a); });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Exception syncing alerts with Supabase:', err);
      }
    }

    initSupabaseAlerts();
  }, []);

  // Fetch and seed audit trail from Supabase on mount
  useEffect(() => {
    async function initSupabaseAuditTrail() {
      try {
        // Ensure demo audit logs exist in Supabase
        await saveAuditLogsToSupabase(DEMO_AUDIT_TRAIL);

        // Fetch audit trail from Supabase
        const { data, error } = await supabase.from('audit_trail').select('*');
        if (error) {
          console.error('Error fetching audit trail from Supabase:', error);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map(mapSupabaseToAuditLog).filter(Boolean);
          setAuditTrail(prev => {
            const map = new Map();
            prev.forEach(a => map.set(a.auditId, a));
            mapped.forEach(a => map.set(a.auditId, a));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Exception syncing audit trail with Supabase:', err);
      }
    }

    initSupabaseAuditTrail();
  }, []);

  const [staffProfiles, setStaffProfiles] = useState(DEMO_ACCOUNTS);

  // Fetch staff profiles from Supabase staff_profiles table on mount
  useEffect(() => {
    async function fetchStaffProfiles() {
      try {
        const { data, error } = await supabase.from('staff_profiles').select('*');
        if (!error && data && data.length > 0) {
          setStaffProfiles(data);
        } else {
          setStaffProfiles(DEMO_ACCOUNTS);
        }
      } catch (err) {
        console.warn('Exception fetching staff_profiles from Supabase:', err);
        setStaffProfiles(DEMO_ACCOUNTS);
      }
    }
    fetchStaffProfiles();
  }, []);

  // Overdue CAPA Analytics (due_date < NOW and status != VERIFIED & CLOSED)
  const getOverdueActions = (caList = correctiveActions) => {
    const todayStr = getTodayDateString();
    return caList.filter(ca => 
      ca.status !== 'VERIFIED & CLOSED' && 
      ca.status !== 'RESOLVED' && 
      ca.dueDate && 
      ca.dueDate < todayStr
    );
  };

  // Mean Time to Remediation (MTTR) Analytics (resolved_date - created_date in days)
  const getMTTR = (caList = correctiveActions, vList = violations) => {
    const resolvedActions = caList.filter(ca => 
      (ca.status === 'VERIFIED & CLOSED' || ca.status === 'RESOLVED') && ca.createdDate && ca.resolvedDate
    );

    if (resolvedActions.length === 0) {
      const resolvedVios = vList.filter(v => v.status === 'RESOLVED' && (v.reportedDate || v.date) && v.resolvedDate);
      if (resolvedVios.length === 0) return { avgDays: 2.5, totalResolved: 0 };
      
      const totalDays = resolvedVios.reduce((acc, v) => {
        const start = new Date(v.reportedDate || v.date).getTime();
        const end = new Date(v.resolvedDate).getTime();
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        return acc + days;
      }, 0);

      return {
        avgDays: Math.round((totalDays / resolvedVios.length) * 10) / 10,
        totalResolved: resolvedVios.length
      };
    }

    const totalDays = resolvedActions.reduce((acc, ca) => {
      const start = new Date(ca.createdDate).getTime();
      const end = new Date(ca.resolvedDate).getTime();
      const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      return acc + days;
    }, 0);

    return {
      avgDays: Math.round((totalDays / resolvedActions.length) * 10) / 10,
      totalResolved: resolvedActions.length
    };
  };

  // Recurring Violation Analytics (Grouped by mineId + area + category)
  const getRecurringViolations = (vList = violations) => {
    const groups = new Map();
    vList.forEach(v => {
      if (!v.mineId || !v.area || !v.category) return;
      const key = `${v.mineId}|${v.area}|${v.category}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          mineId: v.mineId,
          mineName: v.mineName || v.mineId,
          area: v.area,
          category: v.category,
          count: 0,
          violations: []
        });
      }
      const g = groups.get(key);
      g.count += 1;
      g.violations.push(v);
    });

    return Array.from(groups.values())
      .filter(g => g.count >= 2)
      .sort((a, b) => b.count - a.count);
  };

  // Recalculate Mine Scores dynamically based on a multi-factor weighted compliance model (NO HARDCODED BASELINES)
  const recalculateMineScores = (vArr = violations, cArr = certificates, aArr = correctiveActions, wArr = workers) => {
    setMines(prevMines => {
      return prevMines.map(m => {
        const base = 100;
        const mineViolations = vArr.filter(v => v.mineId === m.mineId);
        const openViolations = mineViolations.filter(v => v.status !== 'RESOLVED');
        const resolvedViolations = mineViolations.filter(v => v.status === 'RESOLVED');
        const activeViolationsCount = openViolations.length;

        const mineActions = aArr.filter(ca => ca.mineId === m.mineId);
        const pendingActionsCount = mineActions.filter(ca => ca.status !== 'RESOLVED' && ca.status !== 'VERIFIED & CLOSED' && ca.status !== 'VERIFIED').length;
        const verifiedActionsCount = mineActions.filter(ca => ca.status === 'VERIFIED' || ca.status === 'VERIFIED & CLOSED' || ca.status === 'RESOLVED').length;

        // 1. Violation severity deductions
        let violationDeduction = 0;
        openViolations.forEach(v => {
          if (v.severity === 'CRITICAL') violationDeduction += 12;
          else if (v.severity === 'HIGH') violationDeduction += 8;
          else if (v.severity === 'MEDIUM') violationDeduction += 4;
          else violationDeduction += 2;
        });

        // 2. Certificate status deductions for workers of this mine
        const mineWorkers = wArr.filter(w => w.mineId === m.mineId);
        const mineCerts = cArr.filter(c => c.mineId === m.mineId || mineWorkers.some(w => w.workerId === c.workerId));
        let certDeduction = 0;
        mineCerts.forEach(c => {
          const st = calculateCertificateStatus(c.expiryDate).status;
          if (st === 'EXPIRED') certDeduction += 3;
          else if (st === 'EXPIRING SOON') certDeduction += 1;
        });

        // 3. Overdue CAPA deductions
        const todayStr = getTodayDateString();
        const overdueActionsCount = mineActions.filter(ca => 
          ca.status !== 'RESOLVED' && ca.status !== 'VERIFIED & CLOSED' && ca.dueDate && ca.dueDate < todayStr
        ).length;
        const overdueDeduction = overdueActionsCount * 5;

        // 4. Remediation bonus (recovering points when issues are resolved)
        const remediationBonus = Math.min(15, (resolvedViolations.length * 3) + (verifiedActionsCount * 2));

        // Calculate final score constrained realistically
        let calculatedScore = base - violationDeduction - certDeduction - overdueDeduction + remediationBonus;
        let newScore = Math.max(40, Math.min(98, Math.round(calculatedScore)));

        let riskLevel = 'LOW';
        if (newScore < 70) riskLevel = 'HIGH';
        else if (newScore < 80) riskLevel = 'MEDIUM';

        return {
          ...m,
          complianceScore: newScore,
          riskLevel,
          activeViolations: activeViolationsCount,
          pendingActions: pendingActionsCount,
          overdueActions: overdueActionsCount,
        };
      });
    });
  };

  // 1. Submit a New Inspection (Online or Offline IndexedDB Queue)
  const createInspection = (inspectionData, actorName) => {
    const newId = inspectionData.inspectionId || `INSP-2026-${String(inspections.length + 1).padStart(3, '0')}`;
    const newInspection = {
      ...inspectionData,
      inspectionId: newId,
      date: getTodayDateString(),
      status: 'COMPLETED',
      syncStatus: navigator.onLine ? 'SYNCED' : 'PENDING',
    };

    setInspections(prev => [newInspection, ...prev]);

    if (navigator.onLine) {
      saveInspectionToSupabase(newInspection);
    } else {
      savePendingInspection(newInspection);
    }

    // Add audit log
    addAuditLog(actorName, 'INSPECTOR', 'INSPECTION_SUBMITTED', 
      `Conducted safety inspection ${newId} in ${inspectionData.mineName} (${inspectionData.area}). Result: ${inspectionData.overallResult}`, 
      inspectionData.mineId
    );

    recalculateMineScores(violations, certificates, correctiveActions, workers);
    return newInspection;
  };

  // 2. Report a Violation (Online or Offline IndexedDB Queue)
  const reportViolation = (violationData, actorName) => {
    const newId = violationData.violationId || `VIO-2026-${String(violations.length + 1).padStart(3, '0')}`;
    
    // Find worker if linked
    const worker = workers.find(w => w.workerId === violationData.workerId);
    let certStatus = 'VALID';
    if (violationData.certificateId) {
      const cert = certificates.find(c => c.certificateId === violationData.certificateId);
      if (cert) certStatus = calculateCertificateStatus(cert.expiryDate).status;
    }

    // Auto-query Supabase database context for Recurrence (same mineId + area + category within 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const repeatedCount = violations.filter(v => 
      v.mineId === violationData.mineId && 
      v.area === violationData.area && 
      v.category === violationData.category &&
      (v.reportedDate || v.date || '') >= ninetyDaysAgo
    ).length;

    // Auto-query Supabase database context for Overdue CAPA
    const todayStr = getTodayDateString();
    const hasOverdueAction = correctiveActions.some(ca => 
      ca.mineId === violationData.mineId && 
      ca.status !== 'VERIFIED & CLOSED' && 
      ca.status !== 'RESOLVED' && 
      ca.dueDate && 
      ca.dueDate < todayStr
    );

    // Evaluate Risk with Explainable AI Engine
    const aiRisk = evaluateRisk({
      category: violationData.category,
      severity: violationData.severity,
      workerRole: worker?.role || '',
      certStatus: certStatus,
      area: violationData.area,
      repeatedCount: repeatedCount,
      hasOverdueAction: hasOverdueAction
    });

    const newViolation = {
      ...violationData,
      violationId: newId,
      date: getTodayDateString(),
      status: 'OPEN',
      riskScore: aiRisk.score,
      riskLevel: aiRisk.level,
      aiExplanation: aiRisk.summary + ' — ' + aiRisk.reasons.join(' '),
      reportedBy: actorName || 'Inspector INS-M01',
      syncStatus: navigator.onLine ? 'SYNCED' : 'PENDING',
    };

    const updatedViolations = [newViolation, ...violations];
    setViolations(updatedViolations);

    if (navigator.onLine) {
      saveViolationToSupabase(newViolation);
    } else {
      savePendingViolation(newViolation);
    }

    // Automatically generate system Alert for Mine Officer and Management
    const newAlert = {
      alertId: `ALT-${Date.now().toString().slice(-4)}`,
      type: 'VIOLATION_REPORTED',
      severity: violationData.severity,
      title: `${violationData.severity} Severity Issue: ${violationData.category}`,
      description: `${actorName || 'Inspector'} reported ${newId} in ${violationData.area} (${violationData.mineName || violationData.mineId}): ${violationData.description}`,
      relatedEntity: newId,
      mineId: violationData.mineId,
      createdDate: new Date().toISOString(),
      status: 'UNREAD',
      targetRoles: ['officer', 'management', 'authority']
    };
    setAlerts(prev => [newAlert, ...prev]);
    saveAlertToSupabase(newAlert);

    // Audit trail
    addAuditLog(actorName, 'INSPECTOR', 'REPORT_VIOLATION', 
      `Reported Violation ${newId} for ${violationData.mineId} (${violationData.area}). AI-Assisted Risk Score: ${aiRisk.score}/100 (${aiRisk.level}).`,
      violationData.mineId
    );

    // Immediate score recalculation with updated violations array
    recalculateMineScores(updatedViolations, certificates, correctiveActions, workers);

    return newViolation;
  };

  // 3. Create a Corrective Action (Mine Officer)
  const createCorrectiveAction = (actionData, actorName) => {
    const newId = `CA-2026-${String(correctiveActions.length + 1).padStart(3, '0')}`;
    const newAction = {
      ...actionData,
      actionId: newId,
      createdDate: getTodayDateString(),
      status: 'IN PROGRESS', // Moves immediately to in-progress
      completionNotes: '',
      evidence: '',
      resolvedDate: null,
    };

    const updatedActions = [newAction, ...correctiveActions];
    setCorrectiveActions(updatedActions);
    saveCorrectiveActionToSupabase(newAction);

    // Update violation status
    const updatedViolations = violations.map(v => 
      v.violationId === actionData.violationId 
        ? { ...v, status: 'ACTION IN PROGRESS' } 
        : v
    );
    setViolations(updatedViolations);
    const targetV = updatedViolations.find(v => v.violationId === actionData.violationId);
    if (targetV) saveViolationToSupabase(targetV);

    // Audit trail
    addAuditLog(actorName, 'OFFICER', 'CREATE_CORRECTIVE_ACTION', 
      `Assigned Corrective Action ${newId} for ${actionData.violationId} to ${actionData.assignedTo}. Due: ${actionData.dueDate}`,
      actionData.mineId
    );

    recalculateMineScores(updatedViolations, certificates, updatedActions, workers);
    return newAction;
  };

  // 3b. Update Corrective Action (e.g. submit remediation notes, moving to VERIFICATION REQUIRED or VERIFIED & CLOSED)
  const updateCorrectiveAction = async (actionId, updateData, actorName) => {
    let linkedViolationId = null;
    let targetMineId = 'MINE-01';

    const targetAction = correctiveActions.find(ca => ca.actionId === actionId);
    if (!targetAction) return;

    linkedViolationId = targetAction.violationId;
    targetMineId = targetAction.mineId;

    const mergedAction = {
      ...targetAction,
      ...updateData,
    };

    // 1. Persist Corrective Action update to Supabase
    try {
      const dbRow = mapCorrectiveActionToSupabaseRow(mergedAction);
      const { error: caErr } = await supabase
        .from('corrective_actions')
        .upsert(dbRow, { onConflict: 'action_id' });
      if (caErr) console.warn('Supabase corrective_actions update notice:', caErr);
    } catch (err) {
      console.warn('Exception updating corrective_action in Supabase:', err);
    }

    const updatedActions = correctiveActions.map(ca => ca.actionId === actionId ? mergedAction : ca);
    setCorrectiveActions(updatedActions);

    let updatedViolations = violations;

    // 2. Handle Status Advancement & Linked Violation Updates
    if (updateData.status === 'VERIFICATION REQUIRED' && linkedViolationId) {
      updatedViolations = violations.map(v => 
        v.violationId === linkedViolationId 
          ? { ...v, status: 'VERIFICATION REQUIRED' } 
          : v
      );
      setViolations(updatedViolations);
      const targetV = updatedViolations.find(v => v.violationId === linkedViolationId);
      if (targetV) saveViolationToSupabase(targetV);

      // Alert Inspector for Verification Sign-Off
      const verifyAlert = {
        alertId: `ALT-${Date.now().toString().slice(-4)}`,
        type: 'VERIFICATION_REQUIRED',
        severity: 'MEDIUM',
        title: `Verification Sign-Off Required for Violation ${linkedViolationId}`,
        description: `Mine Officer submitted remediation for ${linkedViolationId}: ${updateData.completionNotes || 'Remediation completed, awaiting inspector verification.'}`,
        relatedEntity: linkedViolationId,
        mineId: targetMineId,
        createdDate: new Date().toISOString(),
        status: 'UNREAD',
        targetRoles: ['inspector']
      };
      setAlerts(prev => [verifyAlert, ...prev]);
      saveAlertToSupabase(verifyAlert);
    } else if ((updateData.status === 'VERIFIED & CLOSED' || updateData.status === 'RESOLVED' || updateData.status === 'CLOSED') && linkedViolationId) {
      const todayStr = getTodayDateString();
      updatedViolations = violations.map(v => 
        v.violationId === linkedViolationId 
          ? { ...v, status: 'RESOLVED', resolvedDate: todayStr } 
          : v
      );
      setViolations(updatedViolations);
      const targetV = updatedViolations.find(v => v.violationId === linkedViolationId);
      if (targetV) saveViolationToSupabase({ ...targetV, status: 'RESOLVED', resolvedDate: todayStr });
    }

    addAuditLog(actorName, 'OFFICER', 'UPDATE_CORRECTIVE_ACTION', 
      `Updated Corrective Action ${actionId} status to ${updateData.status || 'UPDATED'}.`,
      targetMineId
    );

    recalculateMineScores(updatedViolations, certificates, updatedActions, workers);
  };

  // 3c. Verify & Resolve Violation (Inspector Verification Sign-Off)
  const verifyAndResolveViolation = async (violationId, verificationNotes, actorName) => {
    const todayStr = getTodayDateString();

    // Find violation & linked corrective action
    const targetV = violations.find(v => v.violationId === violationId);
    if (!targetV) return;

    const linkedAction = correctiveActions.find(ca => ca.violationId === violationId);

    // 1. Update Violation in Supabase
    const updatedV = {
      ...targetV,
      status: 'RESOLVED',
      resolvedDate: todayStr,
      verificationNotes: verificationNotes || 'Verified by Inspector.',
    };

    try {
      await saveViolationToSupabase(updatedV);
    } catch (err) {
      console.warn('Exception updating violation to RESOLVED in Supabase:', err);
    }

    const updatedViolations = violations.map(v => v.violationId === violationId ? updatedV : v);
    setViolations(updatedViolations);

    // 2. Update linked Corrective Action in Supabase
    let updatedActions = correctiveActions;
    if (linkedAction) {
      const updatedCA = {
        ...linkedAction,
        status: 'VERIFIED & CLOSED',
        completionNotes: verificationNotes || linkedAction.completionNotes,
        resolvedDate: todayStr,
      };
      try {
        await saveCorrectiveActionToSupabase(updatedCA);
      } catch (err) {
        console.warn('Exception updating corrective_action to VERIFIED & CLOSED in Supabase:', err);
      }
      updatedActions = correctiveActions.map(ca => ca.actionId === linkedAction.actionId ? updatedCA : ca);
      setCorrectiveActions(updatedActions);
    }

    addAuditLog(actorName, 'INSPECTOR', 'VERIFY_AND_RESOLVE_VIOLATION', 
      `Inspector verified and formally resolved violation ${violationId}. Notes: ${verificationNotes}`, 
      targetV.mineId || 'MINE-01'
    );

    recalculateMineScores(updatedViolations, certificates, updatedActions, workers);
  };

  // 4. Register / Upload Renewed Certificate (Mine Officer)
  // This updates certificate status and advances linked violation to VERIFICATION REQUIRED!
  const addOrUpdateCertificate = (certData, linkedViolationId, actorName) => {
    const isUpdate = certificates.some(c => c.certificateId === certData.certificateId);
    
    let updatedCerts;
    if (isUpdate) {
      updatedCerts = certificates.map(c => 
        c.certificateId === certData.certificateId 
          ? { ...c, ...certData } 
          : c
      );
    } else {
      updatedCerts = [{ ...certData }, ...certificates];
    }
    setCertificates(updatedCerts);
    saveCertificateToSupabase(certData);

    let updatedViolations = violations;
    let updatedActions = correctiveActions;

    // If linked to a violation, move violation & corrective action to VERIFICATION REQUIRED
    if (linkedViolationId) {
      updatedViolations = violations.map(v => 
        v.violationId === linkedViolationId 
          ? { ...v, status: 'VERIFICATION REQUIRED' } 
          : v
      );
      setViolations(updatedViolations);
      const targetV = updatedViolations.find(v => v.violationId === linkedViolationId);
      if (targetV) saveViolationToSupabase(targetV);

      updatedActions = correctiveActions.map(ca => 
        ca.violationId === linkedViolationId
          ? { 
              ...ca, 
              status: 'VERIFICATION REQUIRED', 
              completionNotes: `Renewed certificate ${certData.certificateId} registered by Mine Officer for ${certData.workerName}. Awaiting Inspector verification sign-off.`,
              evidence: certData.documentUrl || 'renewed_certificate_doc.pdf'
            }
          : ca
      );
      setCorrectiveActions(updatedActions);

      // Alert Inspector for Verification Sign-Off
      const verifyAlert = {
        alertId: `ALT-${Date.now().toString().slice(-4)}`,
        type: 'VERIFICATION_REQUIRED',
        severity: 'MEDIUM',
        title: `Verification Sign-Off Required for Violation ${linkedViolationId}`,
        description: `Mine Officer registered renewed certificate for ${certData.workerName}. Inspector sign-off required to close.`,
        relatedEntity: linkedViolationId,
        mineId: certData.mineId,
        createdDate: new Date().toISOString(),
        status: 'UNREAD',
        targetRoles: ['inspector']
      };
      setAlerts(prev => [verifyAlert, ...prev]);
      saveAlertToSupabase(verifyAlert);
    }

    addAuditLog(actorName, 'OFFICER', 'CERTIFICATE_UPLOADED', 
      `Registered renewed certificate ${certData.certificateId} for ${certData.workerName} (${certData.certificateType}). Expiry: ${certData.expiryDate}`,
      certData.mineId
    );

    recalculateMineScores(updatedViolations, updatedCerts, updatedActions, workers);
  };



  // 6. Issue Regulatory Directive Notice (Regulatory Authority)
  const issueDirective = (directiveData, actorName) => {
    const alertId = `ALT-${Date.now().toString().slice(-4)}`;
    const newAlert = {
      alertId,
      type: 'REGULATORY_DIRECTIVE',
      severity: directiveData.severity || 'CRITICAL',
      title: `Compliance Notice: ${directiveData.title}`,
      description: directiveData.description,
      relatedEntity: directiveData.mineId,
      mineId: directiveData.mineId,
      createdDate: new Date().toISOString(),
      status: 'UNREAD',
      targetRoles: ['officer', 'management']
    };

    setAlerts(prev => [newAlert, ...prev]);
    saveAlertToSupabase(newAlert);

    addAuditLog(actorName, 'AUTHORITY', 'ISSUE_DIRECTIVE', 
      `Issued Compliance Notice to ${directiveData.mineId}: "${directiveData.title}"`,
      directiveData.mineId
    );
  };

  // Audit Log Helper
  const addAuditLog = (actor, role, action, details, mineId) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newEntry = {
      auditId: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: timeStr,
      actor: actor || 'System User',
      role,
      action,
      details,
      mineId: mineId || 'MINE-01',
    };

    setAuditTrail(prev => [newEntry, ...prev]);
    saveAuditLogToSupabase(newEntry);
  };

  // Send Emergency SOS Alert via Supabase Realtime & Resilient Channels
  const sendSOSAlert = async ({ inspectorName, inspectorId, mineName, mineId }) => {
    const timestampStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newSos = {
      alertId: `SOS-${Date.now().toString().slice(-6)}`,
      inspectorName: inspectorName || 'Inspector',
      inspectorId: inspectorId || 'INS-M01',
      mineName: mineName || 'Demo Mine Alpha',
      mineId: mineId || 'MINE-01',
      timestamp: timestampStr,
      status: 'ACTIVE',
      alertType: 'SOS',
      acknowledgedBy: null,
      acknowledgedAt: null,
      acknowledgedTime: null
    };

    const updated = [newSos, ...sosAlerts.filter(a => a.alertId !== newSos.alertId)];
    setSosAlerts(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'sos_alerts', JSON.stringify(updated));
    broadcastSOSUpdate(updated);

    // Send Supabase Realtime Broadcast message to ALL connected devices worldwide
    if (sosRealtimeChannelRef.current) {
      try {
        sosRealtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'sos_trigger',
          payload: newSos
        });
        console.log('📡 [Supabase Realtime Broadcast] SOS broadcast sent to remote devices.');
      } catch (e) {
        console.warn('Supabase Realtime broadcast send error:', e);
      }
    }

    // Await database insert
    await saveSosAlertToSupabase(newSos);

    // Also add high-priority alert and audit trail
    const auditEntry = {
      auditId: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: timestampStr,
      actor: `${newSos.inspectorName} (${newSos.inspectorId})`,
      role: 'Inspector',
      action: 'EMERGENCY_SOS_SENT',
      details: `🚨 EMERGENCY SOS ALERT dispatched for ${newSos.mineName} by ${newSos.inspectorName}. Immediate Mine Officer attention required.`,
      mineId: newSos.mineId
    };

    setAuditTrail(prev => [auditEntry, ...prev]);
    saveAuditLogToSupabase(auditEntry);

    const sysAlert = {
      alertId: `ALT-${Date.now().toString().slice(-6)}`,
      mineId: newSos.mineId,
      title: `🚨 EMERGENCY SOS: ${newSos.mineName}`,
      message: `Emergency SOS triggered by ${newSos.inspectorName} (${newSos.inspectorId}) at ${newSos.mineName}. Immediate action required!`,
      severity: 'CRITICAL',
      timestamp: timestampStr,
      isRead: false,
      targetRoles: ['officer', 'management', 'authority']
    };
    setAlerts(prev => [sysAlert, ...prev]);
    saveAlertToSupabase(sysAlert);

    return newSos;
  };

  // Acknowledge Emergency SOS Alert via Supabase Realtime & Resilient Channels
  const acknowledgeSOSAlert = (alertId, acknowledgedBy) => {
    const ackTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const ackPayload = {
      alertId,
      status: 'ACKNOWLEDGED',
      acknowledgedBy: acknowledgedBy || 'Mine Officer',
      acknowledgedAt: ackTime,
      acknowledgedTime: ackTime
    };

    const updated = sosAlerts.map(item => {
      if (item.alertId === alertId) {
        return {
          ...item,
          ...ackPayload
        };
      }
      return item;
    });

    setSosAlerts(updated);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'sos_alerts', JSON.stringify(updated));
    broadcastSOSUpdate(updated);

    // Send Supabase Realtime Broadcast message to ALL connected devices worldwide
    if (sosRealtimeChannelRef.current) {
      try {
        sosRealtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'sos_acknowledge',
          payload: ackPayload
        });
        console.log('📡 [Supabase Realtime Broadcast] Acknowledgment broadcast sent to remote devices.');
      } catch (e) {
        console.warn('Supabase Realtime broadcast acknowledge error:', e);
      }
    }

    updateSosAlertInSupabase(alertId, acknowledgedBy, ackTime);

    // Add to audit trail
    const auditEntry = {
      auditId: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: ackTime,
      actor: acknowledgedBy || 'Mine Officer',
      role: 'Officer',
      action: 'EMERGENCY_SOS_ACKNOWLEDGED',
      details: `✅ EMERGENCY SOS ${alertId} acknowledged by ${acknowledgedBy || 'Mine Officer'}.`,
      mineId: 'MINE-01'
    };

    setAuditTrail(prev => [auditEntry, ...prev]);
    saveAuditLogToSupabase(auditEntry);
  };

  // Mark Alert as Read
  const markAlertRead = (alertId) => {
    setAlerts(prev => {
      const next = prev.map(a => a.alertId === alertId ? { ...a, status: 'READ', isRead: true } : a);
      const targetAlert = next.find(a => a.alertId === alertId);
      if (targetAlert) saveAlertToSupabase(targetAlert);
      return next;
    });
  };

  // Reset Demo Data to initial state
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'mines');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'workers');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'certificates');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'inspections');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'violations');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'alerts');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'correctiveActions');
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'auditTrail');
    setMines(DEMO_MINES);
    setWorkers(DEMO_WORKERS);
    setCertificates(DEMO_CERTIFICATES);
    setInspections(DEMO_INSPECTIONS);
    setViolations(DEMO_VIOLATIONS);
    setAlerts(DEMO_ALERTS);
    setCorrectiveActions(DEMO_CORRECTIVE_ACTIONS);
    setAuditTrail(DEMO_AUDIT_TRAIL);
  };

  return (
    <DataContext.Provider value={{
      mines,
      workers,
      certificates,
      inspections,
      violations,
      alerts,
      sosAlerts,
      correctiveActions,
      auditTrail,
      fileReferences,
      staffProfiles,
      getOverdueActions,
      getMTTR,
      getRecurringViolations,
      equipment: [],
      sendSOSAlert,
      acknowledgeSOSAlert,
      createInspection,
      reportViolation,
      createCorrectiveAction,
      updateCorrectiveAction,
      addOrUpdateCertificate,
      verifyAndResolveViolation,
      issueDirective,
      markAlertRead,
      uploadFileReference,
      resetDemoData,
      recalculateMineScores
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}

