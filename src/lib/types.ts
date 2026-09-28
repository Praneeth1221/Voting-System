// ============================================================
// Supabase Types
// ============================================================

export type Mood = 'very_happy' | 'happy' | 'normal' | 'sad';

export interface MoodOption {
  mood: Mood;
  emoji: string;
  label: string;
  percentage: string;
  color: string;
  bgColor: string;
  hoverColor: string;
}

export interface MealStatus {
  is_open: boolean;
  current_date: string;
  current_time: string;
  day: string;
  meal: string | null;
  meal_start: string | null;
  meal_end: string | null;
  meal_record_id: string | null;
  server_time: string;
  override_active: boolean;
}

export interface MealRecord {
  id: string;
  date: string;
  day: string;
  meal: string;
  scheduled_start: string;
  scheduled_end: string;
  very_happy_count: number;
  happy_count: number;
  normal_count: number;
  sad_count: number;
  last_vote_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealVote {
  id: string;
  meal_record_id: string;
  mood: Mood;
  voted_at: string;
  created_at: string;
}

export interface VoteResult {
  success: boolean;
  vote_id?: string;
  meal?: string;
  mood?: string;
  voted_at?: string;
  error?: string;
}

export interface ExcelRow {
  Date: string;
  Day: string;
  'Main meal': string;
  Time: string;
  'Very Happy imoji': number;
  'happy imoji': number;
  'Normal imoji': number;
  'sad imoji': number;
}
