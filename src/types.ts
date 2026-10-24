export type Track = 'academic' | 'easa';

export type ResourceType = 'pdf_summary' | 'lecture_slides' | 'past_paper' | 'lab_manual';

export interface Resource {
  id: string;
  title: string;
  description: string;
  track: Track;
  track_ref: string;
  subject: string;
  type: ResourceType;
  file_url: string;
  pages: number;
  is_pro: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  module_code: string;
  module_name: string;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: 'a' | 'b' | 'c';
  explanation: string;
  is_pro: boolean;
  created_at: string;
}

export interface NoteSubmission {
  id: string;
  student_name: string;
  track: Track;
  track_ref: string;
  subject: string;
  title: string;
  content: string;
  created_at: string;
  file_url?: string | null;
  file_path?: string | null;
}

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

export interface Formula {
  id: string;
  name: string;
  equation: string;
  category: 'Aerodynamics' | 'Thermodynamics' | 'Electrical';
  description: string;
}

export interface Acronym {
  id: string;
  acronym: string;
  expansion: string;
  category: string;
  description: string;
}
