import { supabase } from '../supabaseClient';
import { uploadFileToR2 } from './r2StorageService';

const DB_NAME = 'mineguard_offline_db';
const DB_VERSION = 1;

let dbPromise = null;

// Initialize native IndexedDB
function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending_inspections')) {
        db.createObjectStore('pending_inspections', { keyPath: 'inspectionId' });
      }
      if (!db.objectStoreNames.contains('pending_violations')) {
        db.createObjectStore('pending_violations', { keyPath: 'violationId' });
      }
      if (!db.objectStoreNames.contains('pending_evidence')) {
        db.createObjectStore('pending_evidence', { keyPath: 'fileId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// 1. IndexedDB CRUD Operations
export async function savePendingInspection(inspection) {
  try {
    const db = await getDB();
    const tx = db.transaction('pending_inspections', 'readwrite');
    const store = tx.objectStore('pending_inspections');
    const record = {
      ...inspection,
      syncStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    await new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    console.log(' Saved offline inspection to IndexedDB:', record.inspectionId);
    notifySyncListeners();
    return record;
  } catch (err) {
    console.error('Failed to save pending inspection to IndexedDB:', err);
    throw err;
  }
}

export async function savePendingViolation(violation) {
  try {
    const db = await getDB();
    const tx = db.transaction('pending_violations', 'readwrite');
    const store = tx.objectStore('pending_violations');
    const record = {
      ...violation,
      syncStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    await new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    console.log(' Saved offline violation to IndexedDB:', record.violationId);
    notifySyncListeners();
    return record;
  } catch (err) {
    console.error('Failed to save pending violation to IndexedDB:', err);
    throw err;
  }
}

export async function savePendingEvidence({ file, relatedRecordType, relatedRecordId, uploadedBy }) {
  try {
    const db = await getDB();
    const tx = db.transaction('pending_evidence', 'readwrite');
    const store = tx.objectStore('pending_evidence');
    const fileId = `FILE-OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record = {
      fileId,
      file, // Blob or File object
      fileName: file.name || `evidence_${Date.now()}.jpg`,
      fileType: file.type || 'image/jpeg',
      fileSize: file.size || 0,
      relatedRecordType,
      relatedRecordId,
      uploadedBy,
      syncStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    await new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    console.log(' Saved offline evidence Blob to IndexedDB:', fileId);
    notifySyncListeners();
    return record;
  } catch (err) {
    console.error('Failed to save pending evidence to IndexedDB:', err);
    throw err;
  }
}

// Fetch all pending items from IndexedDB
export async function getAllPendingItems() {
  try {
    const db = await getDB();
    
    const fetchStore = (storeName) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const [inspections, violations, evidence] = await Promise.all([
      fetchStore('pending_inspections'),
      fetchStore('pending_violations'),
      fetchStore('pending_evidence'),
    ]);

    return {
      inspections,
      violations,
      evidence,
      totalPending: inspections.length + violations.length + evidence.length,
    };
  } catch (err) {
    console.error('Error fetching pending items from IndexedDB:', err);
    return { inspections: [], violations: [], evidence: [], totalPending: 0 };
  }
}

// Delete item from IndexedDB after successful sync
async function deletePendingItem(storeName, key) {
  try {
    const db = await getDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    notifySyncListeners();
  } catch (err) {
    console.error(`Failed to delete item ${key} from ${storeName}:`, err);
  }
}

// 2. Automatic Synchronization Manager
let isSyncing = false;

export async function triggerAutoSync(dataContextHelpers = {}) {
  if (!navigator.onLine) {
    console.log('Offline: Auto-sync postponed until connectivity returns.');
    return { success: false, reason: 'OFFLINE' };
  }

  if (isSyncing) {
    console.log('Sync process already running...');
    return { success: false, reason: 'ALREADY_RUNNING' };
  }

  isSyncing = true;
  notifySyncListeners();
  console.log('🔄 Starting Automatic Synchronization in Dependency Order...');

  const pending = await getAllPendingItems();
  let syncedCount = 0;
  let errorsCount = 0;

  try {
    // Step 1: Sync Inspections
    for (const insp of pending.inspections) {
      try {
        const row = {
          inspection_id: insp.inspectionId,
          mine_id: insp.mineId || null,
          mine_name: insp.mineName || null,
          area: insp.area || null,
          zone_id: insp.zoneId || null,
          date: insp.date || null,
          inspection_type: insp.inspectionType || null,
          overall_result: insp.overallResult || 'COMPLETED',
          inspector_id: insp.inspectorId || null,
          inspector_name: insp.inspectorName || null,
          checklist_results: insp.checklistResults || [],
          notes: insp.notes || null,
          latitude: insp.latitude ?? null,
          longitude: insp.longitude ?? null,
          location_timestamp: insp.locationTimestamp || null,
        };

        const { error } = await supabase
          .from('inspections')
          .upsert(row, { onConflict: 'inspection_id' });

        if (error) {
          console.error(`Error syncing inspection ${insp.inspectionId}:`, error);
          errorsCount++;
        } else {
          console.log(`✅ Synced inspection ${insp.inspectionId} to Supabase.`);
          await deletePendingItem('pending_inspections', insp.inspectionId);
          syncedCount++;
        }
      } catch (err) {
        console.error(`Exception syncing inspection ${insp.inspectionId}:`, err);
        errorsCount++;
      }
    }

    // Step 2: Sync Violations
    for (const vio of pending.violations) {
      try {
        const row = {
          violation_id: vio.violationId,
          mine_id: vio.mineId || null,
          mine_name: vio.mineName || null,
          area: vio.area || null,
          zone_id: vio.zoneId || null,
          category: vio.category || null,
          severity: vio.severity || null,
          worker_id: vio.workerId || null,
          worker_name: vio.workerName || null,
          certificate_id: vio.certificateId || null,
          description: vio.description || '',
          reported_by: vio.reportedBy || null,
          reported_date: vio.reportedDate || vio.date || null,
          status: vio.status || 'OPEN',
          evidence: vio.evidence || null,
          risk_score: vio.riskScore ?? null,
          risk_level: vio.riskLevel || null,
          ai_explanation: vio.aiExplanation || null,
          inspection_id: vio.inspectionId || null,
          resolved_date: vio.resolvedDate || null,
          verification_notes: vio.verificationNotes || null,
          latitude: vio.latitude ?? null,
          longitude: vio.longitude ?? null,
          location_timestamp: vio.locationTimestamp || null,
        };

        const { error } = await supabase
          .from('violations')
          .upsert(row, { onConflict: 'violation_id' });

        if (error) {
          console.error(`Error syncing violation ${vio.violationId}:`, error);
          errorsCount++;
        } else {
          console.log(`✅ Synced violation ${vio.violationId} to Supabase.`);
          await deletePendingItem('pending_violations', vio.violationId);
          syncedCount++;
        }
      } catch (err) {
        console.error(`Exception syncing violation ${vio.violationId}:`, err);
        errorsCount++;
      }
    }

    // Step 3: Sync Evidence Blobs to Backblaze B2 & public.file_references
    for (const ev of pending.evidence) {
      try {
        if (ev.file) {
          await uploadFileToR2({
            file: ev.file,
            relatedRecordType: ev.relatedRecordType || 'VIOLATION',
            relatedRecordId: ev.relatedRecordId || 'unlinked',
            uploadedBy: ev.uploadedBy || 'Inspector',
          });
          console.log(`✅ Synced evidence ${ev.fileId} to Backblaze B2 & Supabase file_references.`);
          await deletePendingItem('pending_evidence', ev.fileId);
          syncedCount++;
        }
      } catch (err) {
        console.error(`Exception uploading queued evidence ${ev.fileId}:`, err);
        errorsCount++;
      }
    }

  } finally {
    isSyncing = false;
    notifySyncListeners();
  }

  return { success: errorsCount === 0, syncedCount, errorsCount };
}

// 3. Online/Offline Listener Subscriptions
const listeners = new Set();

export function subscribeSyncStatus(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

async function notifySyncListeners() {
  const pending = await getAllPendingItems();
  const state = {
    isOnline: navigator.onLine,
    isSyncing,
    pendingCount: pending.totalPending,
    pendingDetails: pending,
  };
  listeners.forEach(cb => cb(state));
}

// Listen to browser network online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log(' Network connection restored! Triggering automatic synchronization...');
    notifySyncListeners();
    triggerAutoSync();
  });

  window.addEventListener('offline', () => {
    console.log(' Network connection lost! System operating in Offline Mode.');
    notifySyncListeners();
  });
}
