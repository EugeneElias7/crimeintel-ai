import type { Evidence } from '../types/evidence';
import api from './api';

// Helper to normalize response - backend returns raw array, not wrapped in ApiResponse
function normalizeEvidenceListResponse(res: any): Evidence[] {
  // Backend returns raw array directly
  if (Array.isArray(res)) return res;
  // If wrapped in ApiResponse format
  if (res && Array.isArray(res.data)) return res.data;
  // Fallback
  return [];
}

function normalizeEvidenceResponse(res: any): Evidence | null {
  if (res && !Array.isArray(res) && res.evidence_id) return res;
  if (res && res.data && res.data.evidence_id) return res.data;
  return null;
}

export const listEvidence = async (caseId: string): Promise<Evidence[]> => {
  const res = await api.get(`/evidence/case/${caseId}`);
  return normalizeEvidenceListResponse(res);
};

export const getEvidence = async (evidenceId: string): Promise<Evidence | null> => {
  const res = await api.get(`/evidence/${evidenceId}`);
  return normalizeEvidenceResponse(res);
};

export const uploadEvidence = async (
  file: File,
  caseId: string,
  description?: string,
  sensitive?: boolean,
): Promise<Evidence | null> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('case_id', caseId);
  if (description) formData.append('description', description);
  if (sensitive !== undefined) formData.append('sensitive', String(sensitive));

  const res = await api.post('/evidence/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return normalizeEvidenceResponse(res);
};

export const deleteEvidence = async (evidenceId: string): Promise<void> => {
  await api.delete(`/evidence/${evidenceId}`);
};
