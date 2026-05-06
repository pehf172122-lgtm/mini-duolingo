import { z } from 'zod';

export const createExerciseSchema = z.object({
  lesson_id: z.string().uuid(),
  prompt: z.string().min(1),
  correct_answer: z.string().min(1),
  type: z.enum(['translation', 'listening', 'multiple_choice', 'PRONUNCIATION']),
  vocabulary_word: z.string().min(1).optional(),
  meaning_id: z.number().int().optional()
});