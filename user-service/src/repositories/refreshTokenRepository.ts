import pool from '../db/pool';
import { randomUUID } from 'crypto';
import { RowDataPacket } from 'mysql2';

export async function createRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  const tokenId = randomUUID();

  await pool.execute(
    `INSERT INTO refresh_tokens (token_id, user_id, token, expires_at)
     VALUES (?, ?, ?, ?)`,
    [tokenId, userId, token, expiresAt]
  );
}

export async function findToken(token: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1`,
    [token]
  );

  return rows[0] || null;
}

export async function revokeToken(token: string) {
  await pool.execute(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = ?`,
    [token]
  );
}

export async function revokeAllUserTokens(userId: string) {
  await pool.execute(
    `UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ?`,
    [userId]
  );
}

export async function replaceRefreshToken(oldToken: string, newToken: string, expiresAt: Date) {
  // Buscar el token antiguo para obtener user_id, revocarlo y crear el nuevo
  const stored = await findToken(oldToken);

  if (!stored) {
    throw new Error('Old refresh token not found');
  }

  await revokeToken(oldToken);
  await createRefreshToken((stored as any).user_id, newToken, expiresAt);
}