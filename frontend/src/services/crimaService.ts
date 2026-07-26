import type { ApiResponse } from '../types/api';
import type { QueryResponse, ChatMessage } from '../types/crima';
import api from './api';

export const sendQuery = async (
  text: string,
  context?: string,
): Promise<ApiResponse<QueryResponse>> => {
  const { data } = await api.post<ApiResponse<QueryResponse>>('/crima/query', { text, context });
  return data;
};

export const getHistory = async (): Promise<ApiResponse<ChatMessage[]>> => {
  const { data } = await api.get<ApiResponse<ChatMessage[]>>('/crima/history');
  return data;
};

export const clearHistory = async (): Promise<void> => {
  await api.delete('/crima/history');
};
