import { supabase } from '../supabaseClient';

/**
 * Uploads a file to Backblaze B2 via secure serverless presigned URL 
 * and records file metadata in Supabase PostgreSQL file_references table.
 * 
 * @param {Object} options
 * @param {File|Blob} options.file - File object to upload
 * @param {string} options.relatedRecordType - 'INSPECTION', 'VIOLATION', 'WORKER_CERTIFICATE', 'CORRECTIVE_ACTION'
 * @param {string} options.relatedRecordId - ID of the entity (e.g. VIO-2026-001, CERT-2024-0012)
 * @param {string} options.uploadedBy - Name/ID of the user uploading
 * @returns {Promise<Object>} The inserted file metadata record
 */
export async function uploadFileToR2({ file, relatedRecordType, relatedRecordId, uploadedBy = 'System User' }) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const timestamp = Date.now();
  const sanitizedFileName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : `file_${timestamp}.bin`;
  const folder = (relatedRecordType || 'GENERAL').toLowerCase();
  const r2ObjectKey = `${folder}/${relatedRecordId || 'unlinked'}/${timestamp}_${sanitizedFileName}`;
  const fileId = `FILE-${timestamp}-${Math.floor(Math.random() * 1000)}`;

  let fileUrl = `https://b2.mineguard.internal/${r2ObjectKey}`;

  try {
    // 1. Request presigned upload URL from Supabase Edge Function
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('r2-presigned-url', {
      body: {
        action: 'upload',
        objectKey: r2ObjectKey,
        contentType: file.type || 'application/octet-stream',
      },
    });

    if (edgeError) {
      console.error('Supabase Edge Function r2-presigned-url error:', edgeError);
    } else if (edgeData?.uploadUrl) {
      // 2. Direct upload file to Backblaze B2 using presigned PUT URL
      const b2Response = await fetch(edgeData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!b2Response.ok) {
        console.error('Backblaze B2 direct upload failed:', b2Response.status, b2Response.statusText);
      } else {
        console.log('✅ File successfully uploaded to Backblaze B2 bucket!');
        fileUrl = edgeData.downloadUrl || edgeData.fileUrl || fileUrl;
      }
    }
  } catch (err) {
    console.error('Backblaze B2 upload error:', err);
  }

  // 3. Record file metadata in Supabase file_references table (Single Source of Truth)
  const fileRecord = {
    file_id: fileId,
    file_name: file.name || sanitizedFileName,
    file_type: file.type || 'application/octet-stream',
    file_size: file.size || 0,
    r2_object_key: r2ObjectKey,
    file_url: fileUrl,
    uploaded_by: uploadedBy,
    uploaded_at: new Date().toISOString(),
    related_record_type: relatedRecordType,
    related_record_id: relatedRecordId,
  };

  try {
    const { data, error } = await supabase
      .from('file_references')
      .insert(fileRecord)
      .select();

    if (error) {
      console.error('Supabase file_references insert error:', error);
    } else if (data && data.length > 0) {
      return mapSupabaseToFileReference(data[0]);
    }
  } catch (err) {
    console.error('Failed to save file reference to Supabase:', err);
  }

  // Fallback return object for immediate client state
  return {
    fileId: fileRecord.file_id,
    fileName: fileRecord.file_name,
    fileType: fileRecord.file_type,
    fileSize: fileRecord.file_size,
    r2ObjectKey: fileRecord.r2_object_key,
    fileUrl: fileRecord.file_url,
    uploadedBy: fileRecord.uploaded_by,
    uploadedAt: fileRecord.uploaded_at,
    relatedRecordType: fileRecord.related_record_type,
    relatedRecordId: fileRecord.related_record_id,
  };
}

/**
 * Fetches a short-lived presigned download URL for a private Backblaze B2 object
 * @param {string} r2ObjectKey 
 * @returns {Promise<string|null>} Presigned download URL
 */
export async function getPresignedDownloadUrl(r2ObjectKey) {
  if (!r2ObjectKey) return null;
  try {
    const { data, error } = await supabase.functions.invoke('r2-presigned-url', {
      body: {
        action: 'download',
        objectKey: r2ObjectKey,
      },
    });

    if (error) {
      console.error('Error fetching presigned download URL from Edge Function:', error);
      return null;
    }
    return data?.downloadUrl || null;
  } catch (err) {
    console.error('Failed to get presigned download URL:', err);
    return null;
  }
}

/**
 * Maps Supabase DB row to client FileReference model
 */
export function mapSupabaseToFileReference(row) {
  if (!row) return null;
  return {
    fileId: row.file_id || row.fileId || row.id,
    fileName: row.file_name || row.fileName || '',
    fileType: row.file_type || row.fileType || '',
    fileSize: row.file_size ?? row.fileSize ?? 0,
    r2ObjectKey: row.r2_object_key || row.r2ObjectKey || '',
    fileUrl: row.file_url || row.fileUrl || '',
    uploadedBy: row.uploaded_by || row.uploadedBy || '',
    uploadedAt: row.uploaded_at || row.uploadedAt || '',
    relatedRecordType: row.related_record_type || row.relatedRecordType || '',
    relatedRecordId: row.related_record_id || row.relatedRecordId || '',
  };
}

/**
 * Fetches file references for a specific entity record
 */
export async function getFileReferencesByRecord(relatedRecordType, relatedRecordId) {
  try {
    const { data, error } = await supabase
      .from('file_references')
      .select('*')
      .eq('related_record_type', relatedRecordType)
      .eq('related_record_id', relatedRecordId);

    if (error) {
      console.error('Error fetching file_references:', error);
      return [];
    }
    return (data || []).map(mapSupabaseToFileReference);
  } catch (err) {
    console.error('Failed to fetch file references:', err);
    return [];
  }
}

