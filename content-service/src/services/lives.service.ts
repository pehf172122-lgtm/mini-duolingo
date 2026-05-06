import pool from '../database/connection';

const MAX_LIVES = 3;
const RECOVER_MINUTES = 15;

export async function getLives(userId: string, lessonId: string) {
  const [rows]: any = await pool.execute(
    `SELECT lives, last_lost_at FROM lesson_lives WHERE user_id = ? AND lesson_id = ?`,
    [userId, lessonId]
  );

  if (!rows.length) {
    await pool.execute(
      `INSERT INTO lesson_lives (user_id, lesson_id, lives, last_lost_at)
       VALUES (?, ?, ?, NULL)`,
      [userId, lessonId, MAX_LIVES]
    );
    return { lives: MAX_LIVES };
  }

  const record = rows[0];
  let lives = record.lives;
  const lastLost = record.last_lost_at ? new Date(record.last_lost_at) : null;

  if (lastLost) {
    const minutes = Math.floor((Date.now() - lastLost.getTime()) / 60000);
    if (minutes >= RECOVER_MINUTES && lives < MAX_LIVES) {
      const recovered = Math.min(MAX_LIVES, lives + Math.floor(minutes / RECOVER_MINUTES));
      lives = recovered;
      await pool.execute(
        `UPDATE lesson_lives SET lives = ?, last_lost_at = ? WHERE user_id = ? AND lesson_id = ?`,
        [lives, lastLost, userId, lessonId]
      );
    }
  }

  return { lives };
}

export async function loseLife(userId: string, lessonId: string) {
  const { lives } = await getLives(userId, lessonId);
  const newLives = Math.max(0, lives - 1);

  await pool.execute(
    `UPDATE lesson_lives
     SET lives = ?, last_lost_at = NOW()
     WHERE user_id = ? AND lesson_id = ?`,
    [newLives, userId, lessonId]
  );

  return { lives: newLives };
}

export async function resetLives(userId: string, lessonId: string) {
  await pool.execute(
    `UPDATE lesson_lives
     SET lives = ?, last_lost_at = NULL
     WHERE user_id = ? AND lesson_id = ?`,
    [MAX_LIVES, userId, lessonId]
  );

  return { lives: MAX_LIVES };
}

export async function getLivesStatus(userId: string, lessonId: string) {
  const [rows]: any = await pool.execute(
    `SELECT lives, last_lost_at FROM lesson_lives WHERE user_id = ? AND lesson_id = ?`,
    [userId, lessonId]
  );

  if (!rows.length) {
    return { lives: 3, nextLifeInSeconds: 0 };
  }

  const record = rows[0];
  if (!record.last_lost_at || record.lives >= 3) {
    return { lives: record.lives, nextLifeInSeconds: 0 };
  }

  const lastLost = new Date(record.last_lost_at).getTime();
  const recoverMs = 15 * 60 * 1000;
  const nextLifeInMs = Math.max(0, recoverMs - (Date.now() - lastLost));

  return {
    lives: record.lives,
    nextLifeInSeconds: Math.floor(nextLifeInMs / 1000)
  };
}