import { v4 as uuidv4 } from 'uuid';
import pool from '../database/connection';
import { Unit, UnitTable } from '../models/unit.model';
import { Lesson, LessonTable } from '../models/lesson.model';
import { Exercise, ExerciseTable } from '../models/exercise.model';
import * as vocabularyClient from '../clients/vocabulary.client';
import { gamificationClient } from '../utils/httpClient';
import { createError } from '../utils/error.util';
import { updateLessonProgress } from './progress.service';



// 🔥 verificar si ya respondió
async function hasUserAnswered(userId: string, exerciseId: string) {
  const [rows]: any = await pool.execute(
    `SELECT id FROM user_exercises WHERE user_id = ? AND exercise_id = ? LIMIT 1`,
    [userId, exerciseId]
  );

  return rows.length > 0;
}

export async function createUnit(data: { title: string; description?: string }) {
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO ${UnitTable} (id, title, description, created_at) VALUES (?, ?, ?, NOW())`,
    [id, data.title, data.description || null]
  );
  return { id, ...data } as Unit;
}

export async function getAllUnits(): Promise<Unit[]> {
  const [rows] = await pool.execute<any[]>(`SELECT id, title, description, created_at FROM ${UnitTable} ORDER BY created_at DESC`);
  return rows as Unit[];
}

export async function createLesson(data: { unit_id: string; title: string; content?: string }) {
  const id = uuidv4();
  // Validar que la unidad exista
  const [unit] = await pool.execute<any[]>(
  `SELECT id FROM ${UnitTable} WHERE id = ? LIMIT 1`,
  [data.unit_id]
  );

  if (!unit.length) {
  const error: any = new Error('Unit not found');
  error.status = 404;
  throw error;
  }
  await pool.execute(
    `INSERT INTO ${LessonTable} (id, unit_id, title, content, created_at) VALUES (?, ?, ?, ?, NOW())`,
    [id, data.unit_id, data.title, data.content || null]
  );
  return { id, ...data } as Lesson;
}

export async function getLessonsByUnit(unitId: string): Promise<Lesson[]> {
  const [rows] = await pool.execute<any[]>(`SELECT id, unit_id, title, content, created_at FROM ${LessonTable} WHERE unit_id = ? ORDER BY created_at DESC`, [unitId]);
  return rows as Lesson[];
}

export async function createExercise(data: { 
  lesson_id: string; 
  prompt: string; 
  correct_answer: string; 
  type: string 
}) {
  const id = uuidv4();
  // Validar que la lección exista
  const [lesson] = await pool.execute<any[]>(
  `SELECT id FROM ${LessonTable} WHERE id = ? LIMIT 1`,
  [data.lesson_id]
  );

  if (!lesson.length) {
  const error: any = new Error('Lesson not found');
  error.status = 404;
  throw error;
  }
  await pool.execute(
    `INSERT INTO ${ExerciseTable} (id, lesson_id, prompt, correct_answer, type, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
    [id, data.lesson_id, data.prompt, data.correct_answer, data.type]
  );
  return { id, ...data } as Exercise;
}


export async function validateExerciseAnswer(
  exerciseId: string,
  answer: string,
  userId: string
): Promise<any> {

  // 🔹 buscar ejercicio (ANTES de todo)
  const [rows]: any = await pool.execute(
    `SELECT correct_answer, lesson_id FROM ${ExerciseTable} WHERE id = ? LIMIT 1`,
    [exerciseId]
  );

  const row = rows[0];

  if (!row) {
    throw createError('Exercise not found', 404);
  }

  const expected = row.correct_answer;
  const lessonId = row.lesson_id;

  // 🔥 evitar doble conteo
  const alreadyAnswered = await hasUserAnswered(userId, exerciseId);

  if (alreadyAnswered) {
    return {
      correct: null,
      expected,
      message: 'Already answered'
    };
  }

  // 🔹 normalización
  const normalizedAnswer = String(answer).trim().toLowerCase();
  const normalizedExpected = String(expected).trim().toLowerCase();

  let correct = normalizedAnswer === normalizedExpected;

  // 🔥 fallback con vocabulary-service
  if (!correct) {
    try {
      const wordData = await vocabularyClient.searchWord(expected);

      if (wordData) {
        const meanings = wordData.meanings || [];

        const isValid = meanings.some((m: any) =>
          m.meaning.toLowerCase().includes(normalizedAnswer)
        );

        if (isValid) {
          correct = true;
        }
      }
    } catch (error) {
      console.error('Vocabulary error:', error);
    }
  }

  // 🔥 guardar intento (SIEMPRE)
  await pool.execute(
    `INSERT INTO user_exercises (user_id, exercise_id, is_correct)
     VALUES (?, ?, ?)`,
    [userId, exerciseId, correct]
  );

  // 🔥 actualizar progreso (SIEMPRE)
  let progress = null;

  if (lessonId) {
    progress = await updateLessonProgress(userId, lessonId, correct);
  }

  // 🎮 gamificación SOLO si es correcto
  if (correct) {
    try {
      await gamificationClient.post('/api/v1/gamification/action', {
        userId,
        actionType: 'EXERCISE_CORRECT'
      });
    } catch (error: any) {
      console.error('Gamification error:', error?.message);
    }
  }

  return {
    correct,
    expected,
    progress
  };
}

export async function completeLesson(userId: string) {
  try {
    await gamificationClient.post('/api/v1/gamification/action', {
      userId,
      actionType: 'LESSON_COMPLETED'
    });

    return { success: true };
  } catch (error) {
    console.error('Gamification error:', error);
    throw error;
  }
}

export const getExercises = async () => {
  const [rows] = await pool.query('SELECT * FROM exercises');
  return rows;
};

export const getExerciseById = async (id: string) => {
  const [rows]: any = await pool.query(
    'SELECT * FROM exercises WHERE id = ?',
    [id]
  );

  if (!rows.length) {
  throw createError('Exercise not found', 404);
  }

  return rows[0];
};

export const getExercisesByLesson = async (lessonId: string) => {
  const [rows]: any = await pool.query(
    'SELECT * FROM exercises WHERE lesson_id = ?',
    [lessonId]
  );

  return rows;
};