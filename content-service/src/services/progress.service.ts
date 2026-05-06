import pool from '../database/connection';
import * as contentService from './content.service';

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  isCorrect: boolean
) {
  // total de ejercicios de la leccion
  const exercises = await contentService.getExercisesByLesson(lessonId);
  const totalExercises = exercises.length;

  // buscar progreso existente
  const [rows]: any = await pool.execute(
    `SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?`,
    [userId, lessonId]
  );

  let progress = rows[0];

  if (!progress) {
    // crear progreso inicial (sin sumar si es incorrecto)
    await pool.execute(
      `INSERT INTO lesson_progress (user_id, lesson_id, exercises_completed, correct_answers, total_exercises)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        lessonId,
        isCorrect ? 1 : 0,
        isCorrect ? 1 : 0,
        totalExercises
      ]
    );
  } else if (isCorrect) {
    // solo sumar si es correcto
    await pool.execute(
      `UPDATE lesson_progress 
       SET exercises_completed = exercises_completed + 1,
           correct_answers = correct_answers + 1,
           total_exercises = ?
       WHERE user_id = ? AND lesson_id = ?`,
      [
        totalExercises,
        userId,
        lessonId
      ]
    );
  } else {
    // si es incorrecto, solo actualizar total_exercises
    await pool.execute(
      `UPDATE lesson_progress 
       SET total_exercises = ?
       WHERE user_id = ? AND lesson_id = ?`,
      [
        totalExercises,
        userId,
        lessonId
      ]
    );
  }

  // recalcular progreso
  const [updatedRows]: any = await pool.execute(
    `SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?`,
    [userId, lessonId]
  );

  const updated = updatedRows[0];

  const progressPercent =
    updated.total_exercises === 0 ? 0 :
    (updated.exercises_completed / updated.total_exercises) * 100;

  // completar leccion solo si se resolvieron todos correctamente
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