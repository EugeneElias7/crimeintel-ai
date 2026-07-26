export interface Evidence {
  evidence_id: string;
  case_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  description?: string;
  sensitive: boolean;
  uploaded_by: {
    user_id: string;
    display_name: string;
  };
  uploaded_at: string;
}
