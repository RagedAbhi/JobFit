import type { ImprovementSuggestion } from '@/schemas/ai-response.schema';

export interface Profile {
  id: string;
  full_name: string | null;
  resume_text: string | null;
  resume_filename: string | null;
  resume_page_count: number | null;
  resume_char_count: number | null;
  updated_at: string;
}

export interface JobAnalysisRow {
  id: string;
  user_id: string;
  job_title: string;
  job_description_text: string;
  match_score: number;
  summary: string;
  matching_skills: string[];
  missing_skills: string[];
  optional_missing_skills: string[];
  improvement_suggestions: ImprovementSuggestion[];
  created_at: string;
}
