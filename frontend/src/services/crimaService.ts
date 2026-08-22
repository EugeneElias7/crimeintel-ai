import type { ApiResponse } from '../types/api';
import type { QueryResponse, ChatMessage } from '../types/crima';
import api from './api';

export const sendQuery = async (
  text: string,
  context?: string,
): Promise<QueryResponse> => {
  const { data } = await api.post<QueryResponse>('/crima/query', { text, context });
  return data;
};

export const getHistory = async (): Promise<ChatMessage[]> => {
  const { data } = await api.get<{ messages: ChatMessage[] }>('/crima/history');
  return data.messages;
};

export const clearHistory = async (): Promise<void> => {
  await api.delete('/crima/history');
};
