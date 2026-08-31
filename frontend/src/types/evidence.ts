export interface Evidence {
  evidence_id: string;
  case_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  file_path?: string;
  storage_path?: string;
  url?: string;
  filename?: string;
  mime_type?: string;
  content_type?: string;
  description?: string;
  sensitive: boolean;
  uploaded_by: {
    user_id: string;
    display_name: string;
  };
  uploaded_at: string;
}
