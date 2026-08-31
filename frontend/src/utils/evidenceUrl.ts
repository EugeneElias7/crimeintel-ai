import type { Evidence } from '../types/evidence';

export function getEvidenceUrl(evidence: Evidence): string {
  if (evidence.file_url) return evidence.file_url;
  if (evidence.url) return evidence.url;
  if (evidence.storage_path) return evidence.storage_path;

  const evidenceId = encodeURIComponent(evidence.evidence_id);
  return `/api/v1/evidence/${evidenceId}/file`;
}
