import type { ApiResponse } from '../types/api';
import type { Evidence } from '../types/evidence';
import api from './api';

export const listEvidence = async (caseId: string): Promise<ApiResponse<Evidence[]>> => {
  const { data } = await api.get<ApiResponse<Evidence[]>>(`/evidence/case/${caseId}`);
  return data;
};

export const getEvidence = async (evidenceId: string): Promise<ApiResponse<Evidence>> => {
  const { data } = await api.get<ApiResponse<Evidence>>(`/evidence/${evidenceId}`);
  return data;
};

export const uploadEvidence = async (
  file: File,
  caseId: string,
  description?: string,
  sensitive?: boolean,
): Promise<ApiResponse<Evidence>> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('case_id', caseId);
  if (description) formData.append('description', description);
  if (sensitive !== undefined) formData.append('sensitive', String(sensitive));

  const { data } = await api.post<ApiResponse<Evidence>>('/evidence', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteEvidence = async (evidenceId: string): Promise<void> => {
  await api.delete(`/evidence/${evidenceId}`);
};
