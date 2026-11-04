/**
 * Utility for downloading multiple RTO documents bundled into a single ZIP file
 * for offline record keeping, regulatory audits, and physical file submissions.
 */

import { fetchJson } from './apiClient.ts';
 
export interface BundleZipOptions {
  docIds: number[];
  entityType?: 'client' | 'vehicle' | 'tractor' | 'showroom' | 'case' | 'general';
  entityId?: string;
  entityName?: string;
  performedBy?: string;
}

export async function downloadDocumentsAsZip(options: BundleZipOptions): Promise<{
  count: number;
  fileName: string;
  manifest: string;
}> {
  if (!options.docIds || options.docIds.length === 0) {
    throw new Error('Please select at least one document to bundle.');
  }

  const data = await fetchJson<any>('/api/documents/bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  // Convert base64 to binary Blob and trigger browser download
  const byteCharacters = atob(data.zipBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/zip' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = data.fileName || `Karnataka_RTO_Docs_${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    count: data.count,
    fileName: data.fileName,
    manifest: data.manifest,
  };
}

/**
 * Export audit log records as a standardized CSV file for compliance & regulatory inspections
 */
export function exportAuditLogsAsCsv(logs: any[], filename = 'Karnataka_RTO_Audit_Trail'): void {
  if (!logs || logs.length === 0) {
    throw new Error('No audit log entries to export.');
  }

  const headers = ['Log ID', 'Timestamp (ISO)', 'Action', 'Entity Type', 'Entity ID', 'Details', 'Actor (User)', 'IP Address'];
  const rows = logs.map((log) => [
    log.id,
    `"${log.timestamp}"`,
    `"${log.action}"`,
    `"${log.entityType}"`,
    `"${log.entityId}"`,
    `"${(log.details || '').replace(/"/g, '""')}"`,
    `"${log.userId || 'system'}"`,
    `"${log.ipAddress || '127.0.0.1'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
