export interface Case {
  case_id: string;
  case_number: string;
  title: string;
  crime_type: string;
  status: string;
  priority: string;
  district: string;
  location: string;
  date_filed: string;
  date_updated: string;
  assigned_officer: {
    user_id: string;
    display_name: string;
  } | null;
  victim_count: number;
  suspect_count: number;
}

export interface Suspect {
  suspect_id: string;
  name: string;
  age?: number;
  gender?: string;
  status: string;
  charges?: string[];
  arrest_date?: string;
  photo_url?: string;
}

export interface Witness {
  witness_id: string;
  name: string;
  statement?: string;
  credibility?: string;
  contact?: string;
}

export interface TimelineEvent {
  event_id: string;
  event_type: string;
  title: string;
  description?: string;
  date: string;
  created_by: string;
}

export interface CaseDetail {
  case_id: string;
  case_number: string;
  title: string;
  description?: string;
  crime_type: string;
  status: string;
  priority: string;
  district: string;
  location: string;
  date_filed: string;
  date_updated: string;
  date_closed?: string;
  assigned_officer: {
    user_id: string;
    display_name: string;
  } | null;
  filing_officer: {
    user_id: string;
    display_name: string;
  };
  victim_count: number;
  suspect_count: number;
  witnesses: Witness[];
  timeline: TimelineEvent[];
}

export interface CaseCreate {
  title: string;
  description?: string;
  crime_type: string;
  district: string;
  location: string;
  priority?: string;
  assigned_officer_id?: string;
}

export interface CaseFilters {
  crime_type?: string;
  status?: string;
  district?: string;
  date_from?: string;
  date_to?: string;
  officer_id?: string;
}
