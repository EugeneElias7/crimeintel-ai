export interface QueryResult {
  case_id: string;
  crime_type: string;
  location: string;
  date_filed: string;
  status: string;
  confidence: number;
  summary: string;
}

export interface QueryResponse {
  response: string;
  results: QueryResult[];
  intent: string;
  confidence_avg: number;
  total_found: number;
  sources: string[];
  entities: Record<string, string[]>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  results?: QueryResult[];
  intent?: string;
  entities?: Record<string, any>;
  sources?: string[];
  timestamp: string;
}
