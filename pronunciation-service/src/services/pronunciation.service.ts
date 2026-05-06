import pool from '../db/pool';
import { Evaluation, EvaluationTable } from '../models/evaluation.model';
import { ResultSetHeader } from 'mysql2';
import AppError from '../utils/AppError';

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "");
}

function levenshtein(a: string, b: string): number {
  const aa = a || '';
  const bb = b || '';
  const al = aa.length;
  const bl = bb.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[al][bl];
}

function analyzeDifferences(expected: string, transcribed: string): string {
  const e = expected.toLowerCase();
  const t = transcribed.toLowerCase();

  const errors: string[] = [];

  const maxLength = Math.max(e.length, t.length);

  for (let i = 0; i < maxLength; i++) {
    const charE = e[i];
    const charT = t[i];

    if (charE === charT) continue;

    if (charE && !charT) {
      errors.push(`faltó "${charE}"`);
    } else if (!charE && charT) {
      errors.push(`agregaste "${charT}"`);
    } else {
      errors.push(`"${charE}" → "${charT}"`);
    }
  }

  if (errors.length === 0) return '';

  // 🔥 solo mostrar los primeros 2 errores (para no saturar)
  const summary = errors.slice(0, 2).join(', ');

  return `Errores: ${summary}`;
}

// FUTURE: transcribedText vendrá de un servicio de Speech-to-Text (audio → texto)

function computeScore(expected: string, transcribed: string): number {
  const e = normalizeText(expected);
  const t = normalizeText(transcribed);
  if (!e && !t) return 100;
  if (!e) return 0;
  const dist = levenshtein(e, t);
  const maxLen = Math.max(e.length, t.length);
  const similarity = maxLen === 0 ? 1 : Math.max(0, 1 - dist / maxLen);
  const score = Math.round(similarity * 100);
  return Math.max(0, Math.min(100, score));
}

function generateDetailedFeedback(expected: string, transcribed: string, score: number): string {
  if (expected === transcribed) {
    return 'Perfecto, pronunciación correcta';
  }

  const detail = analyzeDifferences(expected, transcribed);

  if (score >= 90) {
    return `${detail}. Casi perfecto`;
  }

  if (score >= 70) {
    return `${detail}. Vas bien, pero mejora`;
  }

  if (score >= 50) {
    return `${detail}. Pronunciación aceptable`;
  }

  return `${detail}. Necesitas practicar más`;
}

export async function evaluatePronunciation(input: {
  userId: string;
  word: string;
  expectedText: string;
  transcribedText: string;
  audioPath?: string;
}): Promise<Evaluation> {
  try {
    const { userId, word, expectedText, transcribedText, audioPath } = input;
    const score = computeScore(expectedText, transcribedText);
    const feedback = generateDetailedFeedback(expectedText, transcribedText, score);

    const [res] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ${EvaluationTable} (userId, word, expectedText, transcribedText, score, feedback, audioPath, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, word, expectedText, transcribedText, score, feedback, audioPath || null]
    );

    const insertId = res.insertId as number;

    return {
      id: insertId,
      userId,
      word,
      expectedText,
      transcribedText,
      score,
      feedback,
      audioPath: audioPath || null,
      createdAt: new Date().toISOString()
    } as Evaluation;
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('evaluatePronunciation error', err);
    throw err instanceof AppError ? err : new AppError('Error evaluating pronunciation', 500);
  }
}

export default {
  evaluatePronunciation
};
