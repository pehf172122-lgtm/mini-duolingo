import * as userRepo from '../repositories/userRepository';
import * as profileRepo from '../repositories/profileRepository';
import * as streakRepo from '../repositories/streakRepository';
import * as refreshRepo from '../repositories/refreshTokenRepository';

import { hashPassword, comparePassword } from '../utils/hash';
import { signJwt, signRefreshToken, verifyJwt } from '../utils/jwt';

export async function register(username: string, email: string, password: string) {
  username = username.trim();
  email = email.trim().toLowerCase();

  const existingByEmail = await userRepo.findByEmail(email);
  if (existingByEmail) throw { status: 400, message: 'Email already in use' };

  const existingByUsername = await userRepo.findByUsername(username);
  if (existingByUsername) throw { status: 400, message: 'Username already in use' };

  const password_hash = await hashPassword(password);

  const userId = await userRepo.createUser({
    username,
    email,
    password_hash
  });

  await profileRepo.upsertProfile(userId, {
    display_name: username
  });

  await streakRepo.initStreak(userId);

  return { userId };
}

export async function login(emailOrUsername: string, password: string) {
  const dummyHash = '$2b$10$1234567890123456789012u1yqvZ1tcHTTX3e8DqRLVQjaxAg/P6';

  const normalized = emailOrUsername.trim().toLowerCase();

  let user =
    (await userRepo.findByEmail(normalized)) ||
    (await userRepo.findByUsername(emailOrUsername));

  if (!user) {
    await comparePassword(password, dummyHash);
    throw { status: 401, message: 'Invalid credentials' };
  }

  const ok = await comparePassword(password, user.password_hash);

  if (!ok) {
    throw { status: 401, message: 'Invalid credentials' };
  }

  const accessToken = signJwt({
    userId: user.user_id,
    email: user.email
  });

  const refreshToken = signRefreshToken({
    userId: user.user_id
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await refreshRepo.createRefreshToken(user.user_id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken
  };
}

export async function refresh(refreshToken: string) {
  const stored = await refreshRepo.findToken(refreshToken);

  if (!stored) {
    throw { status: 401, message: 'Invalid refresh token' };
  }

  if (stored.is_revoked) {
    throw { status: 401, message: 'Token revoked' };
  }

  if (new Date(stored.expires_at) < new Date()) {
    throw { status: 401, message: 'Token expired' };
  }

  const decoded = verifyJwt(refreshToken);

  const user = await userRepo.findById(decoded.userId);

  if (!user) {
    throw { status: 401, message: 'User not found' };
  }

  if (user.is_active === 0) {
    throw { status: 403, message: 'User disabled' };
  }

  // generate new tokens (rotation)
  const newAccessToken = signJwt({
    userId: user.user_id,
    email: user.email
  });

  const newRefreshToken = signRefreshToken({ userId: user.user_id });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    // revoke old token and store new one
    await refreshRepo.revokeToken(refreshToken);
    await refreshRepo.createRefreshToken(user.user_id, newRefreshToken, expiresAt);
  } catch (e) {
    // if DB update fails, do not leak details
    throw { status: 500, message: 'Failed to rotate refresh token' };
  }

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  const stored = await refreshRepo.findToken(refreshToken);

  if (!stored) {
    throw { status: 401, message: 'Invalid token' };
  }

  if (stored.is_revoked) {
    return; // ya está invalidado, no pasa nada
  }

  await refreshRepo.revokeToken(refreshToken);
}

export async function logoutAll(userId: string) {
  await refreshRepo.revokeAllUserTokens(userId);
}

export async function resetPassword(email: string, newPassword: string) {
  const normalized = email.trim().toLowerCase();

  const user = await userRepo.findByEmail(normalized);
  if (!user) throw { status: 404, message: 'User not found' };

  const password_hash = await hashPassword(newPassword);

  await userRepo.updatePassword(user.user_id, password_hash);

  return { userId: user.user_id };
}