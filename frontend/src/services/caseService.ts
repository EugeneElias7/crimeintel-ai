import type { PaginatedResponse, ApiResponse, PaginationParams } from '../types/api';
import type { Case, CaseDetail, CaseCreate, CaseFilters } from '../types/case';
import api from './api';

export const listCases = async (
  params: PaginationParams & CaseFilters = {},
): Promise<PaginatedResponse<Case>> => {
  const { data } = await api.get<PaginatedResponse<Case>>('/cases', { params });
  return data;
};

export const searchCases = async (
  q: string,
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<Case>> => {
  const { data } = await api.get<PaginatedResponse<Case>>('/cases/search', {
    params: { q, page, limit },
  });
  return data;
};

export const getCase = async (caseId: string): Promise<ApiResponse<CaseDetail>> => {
  const { data } = await api.get<ApiResponse<CaseDetail>>(`/cases/${caseId}`);
  return data;
};

export const createCase = async (caseData: CaseCreate): Promise<ApiResponse<CaseDetail>> => {
  const { data } = await api.post<ApiResponse<CaseDetail>>('/cases', caseData);
  return data;
};

export const updateCase = async (
  caseId: string,
  caseData: Partial<CaseCreate>,
): Promise<ApiResponse<CaseDetail>> => {
  const { data } = await api.put<ApiResponse<CaseDetail>>(`/cases/${caseId}`, caseData);
  return data;
};

export const getTimeline = async (
  caseId: string,
): Promise<ApiResponse<import('../types/case').TimelineEvent[]>> => {
  const { data } = await api.get(`/cases/${caseId}/timeline`);
  return data;
};

export const getRelatedCases = async (caseId: string): Promise<ApiResponse<Case[]>> => {
  const { data } = await api.get<ApiResponse<Case[]>>(`/cases/${caseId}/related`);
  return data;
};
