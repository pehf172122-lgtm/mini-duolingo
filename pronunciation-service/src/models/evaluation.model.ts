export interface Evaluation {
  id?: number;
  userId: string;
  word: string;
  expectedText: string;
  transcribedText: string;
  score: number;
  audioPath?: string | null;
  feedback: string;
  createdAt?: string;
}

export const EvaluationTable = 'evaluations';
