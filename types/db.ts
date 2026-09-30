import type { ImprovementSuggestion } from '@/schemas/ai-response.schema';
import type { WorkExperienceEntry, EducationEntry, ProjectEntry } from '@/schemas/candidate-profile.schema';
import type { TailoredResume } from '@/schemas/tailored-resume.schema';

export interface Profile {
  id: string;
  full_name: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
  skills: string[];
  years_experience: number | null;
  summary: string | null;
  work_experience: WorkExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
  projects: ProjectEntry[];
  // Unused going forward (see docs/specs/0001-multiple-resumes-add-switch/index.md)
  // -- a resume now lives in its own `resumes` row, reached via
  // active_resume_id. Left in place, never dropped, for existing accounts'
  // already-saved data.
  resume_text: string | null;
  resume_filename: string | null;
  resume_page_count: number | null;
  resume_char_count: number | null;
  active_resume_id: string | null;
  updated_at: string;
}

// One named resume. See docs/specs/0001-multiple-resumes-add-switch/index.md.
export interface Resume {
  id: string;
  user_id: string;
  name: string;
  resume_text: string;
  resume_filename: string;
  resume_page_count: number;
  resume_char_count: number;
  created_at: string;
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
  tailored_resume: TailoredResume | null;
  resume_id: string | null;
  created_at: string;
}
