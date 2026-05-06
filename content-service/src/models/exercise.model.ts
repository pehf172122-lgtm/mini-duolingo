export interface Exercise {
  id: string;
  lesson_id: string;
  prompt: string;
  correct_answer: string;
  vocabulary_word?: string | null;
  meaning_id?: number | null;
  created_at?: string;
}

export const ExerciseTable = 'exercises';
