import type { PaginatedResponse, PaginationParams } from '../types/api';
import type { Case, CaseDetail, CaseCreate, CaseFilters } from '../types/case';
import api from './api';

const mapCase = (c: any): Case => ({
  case_id: c.case_id,
  case_number: c.fir_number || c.case_id,
  title: c.description || '',
  crime_type: c.crime_type,
  status: c.status,
  priority: c.priority || 'medium',
  district: c.district,
  location: c.location,
  date_filed: c.date_filed,
  date_updated: c.updated_at || c.created_at || c.date_filed,
  assigned_officer: c.officer ? {
    user_id: c.officer.user_id,
    display_name: c.officer.display_name,
  } : null,
  victim_count: c.witness_count || 0,
  suspect_count: c.suspect_count || 0,
});

export const listCases = async (
  params: PaginationParams & CaseFilters = {},
): Promise<PaginatedResponse<Case>> => {
  const { data } = await api.get<PaginatedResponse<any>>('/cases', { params });
  return {
    ...data,
    data: data.data.map(mapCase),
  };
};

export const searchCases = async (
  q: string,
  page?: number,
  limit?: number,
): Promise<PaginatedResponse<Case>> => {
  const { data } = await api.get<PaginatedResponse<any>>('/cases/search', {
    params: { q, page, limit },
  });
  return {
    ...data,
    data: data.data.map(mapCase),
  };
};

const mapCaseDetail = (c: any): CaseDetail => ({
  case_id: c.case_id,
  case_number: c.fir_number || c.case_id,
  title: c.description || '',
  description: c.description,
  crime_type: c.crime_type,
  status: c.status,
  priority: c.priority || 'medium',
  district: c.district,
  location: c.location,
  date_filed: c.date_filed,
  date_updated: c.updated_at || c.created_at || c.date_filed,
  date_closed: c.date_closed,
  assigned_officer: c.officer ? {
    user_id: c.officer.user_id,
    display_name: c.officer.display_name,
  } : null,
  filing_officer: c.officer ? {
    user_id: c.officer.user_id,
    display_name: c.officer.display_name,
  } : { user_id: '', display_name: 'Unknown' },
  victim_count: c.witness_count || 0,
  suspect_count: c.suspect_count || 0,
  witnesses: (c.witnesses || []).map((w: any) => ({
    witness_id: w.witness_id,
    name: w.name,
    statement: w.statement_summary,
    credibility: w.credibility_score?.toString(),
    contact: w.contact,
  })),
  timeline: (c.timeline_events || []).map((t: any) => ({
    event_id: t.event_id,
    event_type: t.event_type,
    title: t.event_type,
    description: t.description,
    date: t.event_date,
    created_by: t.officer?.display_name || t.officer_id || 'Unknown',
  })),
});

export const getCase = async (caseId: string): Promise<CaseDetail | null> => {
  const { data } = await api.get<any>(`/cases/${caseId}`);
  return data ? mapCaseDetail(data) : null;
};

export const createCase = async (caseData: CaseCreate): Promise<CaseDetail> => {
  const { data } = await api.post<any>('/cases', caseData);
  return data;
};

export const updateCase = async (
  caseId: string,
  caseData: Partial<CaseCreate>,
): Promise<CaseDetail> => {
  const { data } = await api.put<any>(`/cases/${caseId}`, caseData);
  return data;
};

export const getTimeline = async (
  caseId: string,
): Promise<import('../types/case').TimelineEvent[]> => {
  const { data } = await api.get(`/cases/${caseId}/timeline`);
  return data;
};

export const getRelatedCases = async (caseId: string): Promise<Case[]> => {
  const { data } = await api.get(`/cases/${caseId}/related`);
  return data;
};
