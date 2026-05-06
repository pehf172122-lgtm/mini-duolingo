import pool from '../db/pool';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { randomUUID } from 'crypto';

export type NewUser = { username: string; email: string; password_hash: string };

export async function createUser(user: NewUser) {
  const userId = randomUUID();

  await pool.execute(
    `INSERT INTO users (user_id, username, email, password_hash, is_active, created_at)
     VALUES (?, ?, ?, ?, 1, NOW())`,
    [userId, user.username, user.email, user.password_hash]
  );

  return userId;
}

export async function findByEmail(email: string) {
  const [rows] = await pool.execute<RowDataPacket[] & any[]>(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function findByUsername(username: string) {
  const [rows] = await pool.execute<RowDataPacket[] & any[]>(
    `SELECT * FROM users WHERE username = ? LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

export async function findById(userId: string) {
  const [rows] = await pool.execute<RowDataPacket[] & any[]>(
    `SELECT * FROM users WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function updateUser(userId: string, fields: Partial<{username:string;email:string;is_active:number}>){
  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  const values = Object.values(fields);
  if (!sets) return;
  await pool.execute<ResultSetHeader>(
    `UPDATE users SET ${sets} WHERE user_id = ?`,
    [...values, userId]
  );
}

export async function deleteUser(userId: string){
  await pool.execute<ResultSetHeader>(`DELETE FROM users WHERE user_id = ?`, [userId]);
}

export async function updatePassword(userId: string, password_hash: string) {
  await pool.execute<ResultSetHeader>(
    `UPDATE users SET password_hash = ? WHERE user_id = ?`,
    [password_hash, userId]
  );
}