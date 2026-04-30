import pool from '../database/connection';
import * as contentService from './content.service';

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  isCorrect: boolean
) {
  // 🔹 total de ejercicios de la lección
  const exercises = await contentService.getExercisesByLesson(lessonId);
  const totalExercises = exercises.length;

  // 🔹 buscar progreso existente
  const [rows]: any = await pool.execute(
    `SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?`,
    [userId, lessonId]
  );

  let progress = rows[0];

  if (!progress) {
    // 🆕 crear progreso inicial
    await pool.execute(
      `INSERT INTO lesson_progress (user_id, lesson_id, exercises_completed, correct_answers, total_exercises)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        lessonId,
        1,
        isCorrect ? 1 : 0,
        totalExercises
      ]
    );
  } else {
    // 🔄 actualizar progreso
    await pool.execute(
      `UPDATE lesson_progress 
       SET exercises_completed = exercises_completed + 1,
           correct_answers = correct_answers + ?,
           total_exercises = ?
       WHERE user_id = ? AND lesson_id = ?`,
      [
        isCorrect ? 1 : 0,
        totalExercises,
        userId,
        lessonId
      ]
    );
  }

  // 🔥 recalcular progreso
  const [updatedRows]: any = await pool.execute(
    `SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?`,
    [userId, lessonId]
  );

  const updated = updatedRows[0];

  const progressPercent =
    (updated.exercises_completed / updated.total_exercises) * 100;

  // 🏁 completar lección automáticamente
  if (progressPercent >= 100 && !updated.completed) {
    await pool.execute(
      `UPDATE lesson_progress SET completed = TRUE WHERE user_id = ? AND lesson_id = ?`,
      [userId, lessonId]
    );

    return {
      completed: true,
      progress: 100
    };
  }

  return {
    completed: false,
    progress: Math.round(progressPercent)
  };
}