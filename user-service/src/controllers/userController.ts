import { Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { RequestWithUser } from '../types';

export async function getMe(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await userService.getUserById(userId);

    res.json({
      success: true,
      message: 'User fetched',
      data: result,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const fields = req.body;

    await userService.updateUser(userId, fields);
    res.json({
      success: true,
      message: 'User updated successfully',
      data: null,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;

    await userService.removeUser(userId);
    res.json({
      success: true,
      message: 'User deleted successfully',
      data: null,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const profile = await userService.getProfile(userId);
    res.json({
      success: true,
      message: 'Profile fetched',
      data: profile,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;

    await userService.updateProfile(userId, req.body);
    res.json({
      success: true,
      message: 'Profile updated',
      data: null,
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function getStreak(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const streak = await userService.getStreak(userId);
    res.json({
      success: true,
      message: 'Streak fetched',
      data: streak,
      error: null
    });
  } catch (err) {
    next(err);
  }
}