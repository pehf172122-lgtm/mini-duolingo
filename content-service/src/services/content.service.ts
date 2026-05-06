import { v4 as uuidv4 } from 'uuid';
import pool from '../database/connection';
import { Unit, UnitTable } from '../models/unit.model';
import { Lesson, LessonTable } from '../models/lesson.model';
import { Exercise, ExerciseTable } from '../models/exercise.model';
import * as vocabularyClient from '../clients/vocabulary.client';
import { gamificationClient } from '../utils/httpClient';
import { createError } from '../utils/error.util';
import { updateLessonProgress } from './progress.service';
import { evaluatePronunciation } from '../utils/pronunciationClient';
import { getLives, loseLife, resetLives } from './lives.service';


// 🔥 verificar si ya respondió (aunque sea una vez)
async function getUserExerciseStatus(userId: string, exerciseId: string) {
  const [rows]: any = await pool.execute(
    `SELECT id, is_correct FROM user_exercises WHERE user_id = ? AND exercise_id = ? LIMIT 1`,
    [userId, exerciseId]
  );

  return rows[0] || null;
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
  const [orderRows] = await pool.execute<any[]>(
    `SELECT COALESCE(MAX(order_index), -1) + 1 AS nextOrder
     FROM ${LessonTable}
     WHERE unit_id = ?`,
    [data.unit_id]
  );
  const orderIndex = orderRows[0]?.nextOrder ?? 0;
  await pool.execute(
    `INSERT INTO ${LessonTable} (id, unit_id, title, content, order_index, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [id, data.unit_id, data.title, data.content || null, orderIndex]
  );
  return { id, ...data } as Lesson;
}

export async function getLessonsByUnit(unitId: string): Promise<Lesson[]> {
  const [rows] = await pool.execute<any[]>(`SELECT id, unit_id, title, content, created_at FROM ${LessonTable} WHERE unit_id = ? ORDER BY created_at DESC`, [unitId]);
  return rows as Lesson[];
}

export async function getLessonsByUnitWithLock(userId: string, unitId: string) {
  const [lessons] = await pool.execute<any[]>(
    `SELECT id, unit_id, title, content, created_at, order_index
     FROM ${LessonTable}
     WHERE unit_id = ?
     ORDER BY order_index ASC`,
    [unitId]
  );

  const [progressRows] = await pool.execute<any[]>(
    `SELECT lesson_id, completed FROM lesson_progress WHERE user_id = ?`,
    [userId]
  );

  const progressMap = new Map(progressRows.map(p => [p.lesson_id, p.completed]));

  return lessons.map((lesson, idx) => {
    if (idx === 0) {
      return { ...lesson, locked: false };
    }

    const prevLesson = lessons[idx - 1];
    const prevCompleted = progressMap.get(prevLesson.id) === 1 || progressMap.get(prevLesson.id) === true;

    return {
      ...lesson,
      locked: !prevCompleted
    };
  });
}

export async function isLessonLocked(userId: string, lessonId: string) {
  // 1) Obtener la lección actual y su unit_id y order_index
  const [lessonRows] = await pool.execute<any[]>(
    `SELECT id, unit_id, order_index FROM lessons WHERE id = ? LIMIT 1`,
    [lessonId]
  );

  if (!lessonRows.length) {
    throw createError('Lesson not found', 404);
  }

  const lesson = lessonRows[0];

  // 2) Si es la primera lección (order_index = 0) => no está locked
  if (lesson.order_index === 0) return false;

  // 3) Buscar la lección anterior dentro de la misma unit
  const [prevRows] = await pool.execute<any[]>(
    `SELECT id FROM lessons
     WHERE unit_id = ? AND order_index = ?
     LIMIT 1`,
    [lesson.unit_id, lesson.order_index - 1]
  );

  if (!prevRows.length) return false; // fallback

  const prevLessonId = prevRows[0].id;

  // 4) Verificar si el usuario completó la lección anterior
  const [progressRows] = await pool.execute<any[]>(
    `SELECT completed FROM lesson_progress
     WHERE user_id = ? AND lesson_id = ?
     LIMIT 1`,
    [userId, prevLessonId]
  );

  const completed = progressRows.length ? progressRows[0].completed : false;

  return !completed;
}

export async function createExercise(data: { 
  lesson_id: string; 
  prompt: string; 
  correct_answer: string; 
  type: string;
  vocabulary_word?: string | null;
  meaning_id?: number | null;
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
  const [orderRows] = await pool.execute<any[]>(
    `SELECT COALESCE(MAX(order_index), -1) + 1 AS nextOrder
     FROM ${ExerciseTable}
     WHERE lesson_id = ?`,
    [data.lesson_id]
  );
  const orderIndex = orderRows[0]?.nextOrder ?? 0;
  await pool.execute(
  `INSERT INTO ${ExerciseTable}
   (id, lesson_id, prompt, correct_answer, type, order_index, vocabulary_word, meaning_id, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [
    id,
    data.lesson_id,
    data.prompt,
    data.correct_answer,
    data.type,
    orderIndex,
    data.vocabulary_word || null,
    data.meaning_id || null
  ]
);
  return { id, ...data } as Exercise;
}


export async function validateExerciseAnswer(
  exerciseId: string,
  answer: string,
  userId: string,
  token?: string
): Promise<any> {
  const [rows]: any = await pool.execute(
    `SELECT correct_answer, lesson_id, type, vocabulary_word, meaning_id
     FROM ${ExerciseTable}
     WHERE id = ? LIMIT 1`,
    [exerciseId]
  );

  if (!rows.length) {
    throw createError('Exercise not found', 404);
  }

  const row = rows[0];
  const expected = row.correct_answer;
  const lessonId = row.lesson_id;
  const type = row.type;
  const vocabularyWord = row.vocabulary_word;
  const meaningId = row.meaning_id;

  const existingAttempt = await getUserExerciseStatus(userId, exerciseId);
  const isRepeat = Boolean(existingAttempt);

  let correct = false;
  let score = 0;
  let feedback: string | null = null;
  let vocabInfo: any = null;

  if (type === 'PRONUNCIATION') {
    if (!token) {
      throw createError('Missing token for pronunciation', 401);
    }

    const pronunciationResult = await evaluatePronunciation(token, {
      word: expected,
      expectedText: expected,
      transcribedText: answer
    });

    score = pronunciationResult.data.score ?? 0;
    feedback = pronunciationResult.data.feedback ?? '';
    correct = score >= 70;
  } else {
    const normalizedAnswer = String(answer).trim().toLowerCase();
    const normalizedExpected = String(expected).trim().toLowerCase();
    const vocabWord = vocabularyWord || expected;

    try {
      const wordData = await vocabularyClient.searchWord(vocabWord);
      const meanings = wordData?.meanings || [];

      let selectedMeaning = null;

      if (meaningId) {
        selectedMeaning = meanings.find((m: any) => m.id === meaningId);
      } else {
        selectedMeaning = meanings.find((m: any) =>
          m.meaning.toLowerCase().includes(normalizedAnswer)
        );
      }

      if (selectedMeaning) {
        correct = true;
      } else {
        correct = normalizedAnswer === normalizedExpected;
      }

      const meaningsForResponse = meaningId
        ? (selectedMeaning ? [selectedMeaning] : [])
        : meanings;

      vocabInfo = {
        ipa: wordData?.ipa || null,
        meanings: meaningsForResponse,
        selectedMeaning: selectedMeaning || null
      };
    } catch (error) {
      console.error('Vocabulary error:', error);
      correct = normalizedAnswer === normalizedExpected;
    }
  }

  // ✅ Registrar intento (siempre)
  await pool.execute(
    `INSERT INTO exercise_attempts (user_id, exercise_id, is_correct)
     VALUES (?, ?, ?)`,
    [userId, exerciseId, correct ? 1 : 0]
  );

  if (!correct && !isRepeat) {
    const { lives } = await loseLife(userId, lessonId);

    if (lives === 0) {
      await pool.execute(
        `DELETE FROM lesson_progress WHERE user_id = ? AND lesson_id = ?`,
        [userId, lessonId]
      );
      await pool.execute(
        `DELETE FROM user_exercises WHERE user_id = ? AND exercise_id IN (
          SELECT id FROM exercises WHERE lesson_id = ?
        )`,
        [userId, lessonId]
      );

      return {
        correct: false,
        expected,
        score,
        feedback,
        progress: { completed: false, progress: 0 },
        lives: 0,
        message: 'Out of lives. Lesson progress reset.',
        vocabInfo
      };
    }
  }

  if (correct && !isRepeat) {
    await pool.execute(
      `INSERT INTO user_exercises (user_id, exercise_id, is_correct)
       VALUES (?, ?, ?)`,
      [userId, exerciseId, 1]
    );
  }

  let progress = null;
  if (lessonId && !isRepeat) {
    progress = await updateLessonProgress(userId, lessonId, correct);
  }

  if (correct && !isRepeat) {
    try {
      await gamificationClient.post('/api/v1/gamification/action', {
        userId,
        actionType: type === 'PRONUNCIATION'
          ? 'PRONUNCIATION_CORRECT'
          : 'EXERCISE_CORRECT'
      });
    } catch (error: any) {
      console.error('Gamification error:', error?.message);
    }
  }

  const { lives } = await getLives(userId, lessonId);

  return {
    correct,
    expected,
    score,
    feedback,
    progress,
    lives,
    vocabInfo,
    repeat: isRepeat
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

export async function getLessonsWithProgress(userId: string, unitId: string) {
  const conn = pool;

  // 🔹 1. Obtener lecciones ORDENADAS
  const [lessons] = await conn.query<any[]>(
    `SELECT * FROM lessons WHERE unit_id = ? ORDER BY order_index ASC`,
    [unitId]
  );

  // 🔹 2. Progreso del usuario
  const [progressRows] = await conn.query<any[]>(
    `SELECT * FROM lesson_progress WHERE user_id = ?`,
    [userId]
  );

  const progressMap = new Map(
    progressRows.map(p => [p.lesson_id, p])
  );

  const result = [];

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const progress = progressMap.get(lesson.id);

    const isCompleted = progress?.completed || false;

    // 🔓 lógica unlock
    let unlocked = false;

    if (i === 0) {
      unlocked = true;
    } else {
      const prevLesson = lessons[i - 1];
      const prevProgress = progressMap.get(prevLesson.id);
      unlocked = prevProgress?.completed || false;
    }

    // 🎯 status final
    let status: 'locked' | 'unlocked' | 'completed';

    if (isCompleted) {
      status = 'completed';
    } else if (unlocked) {
      status = 'unlocked';
    } else {
      status = 'locked';
    }

    result.push({
      lessonId: lesson.id,
      title: lesson.title,
      status,
      progress: progress
        ? Math.round((progress.exercises_completed / progress.total_exercises) * 100)
        : 0,
      position: i // 🔥 clave para UI tipo mapa
    });
  }

  return result;
}

export async function getUnitsWithProgress(userId: string) {
  const conn = pool;

  const [units] = await conn.query<any[]>(
    `SELECT * FROM units ORDER BY created_at ASC`
  );

  const result = [];

  for (const unit of units) {
    const lessons = await getLessonsWithProgress(userId, unit.id);

    result.push({
      unitId: unit.id,
      title: unit.title,
      lessons
    });
  }

  return {
    units: result
  };
}

export default {
  getLessonsWithProgress,
  getUnitsWithProgress, // 👈 ESTE
};