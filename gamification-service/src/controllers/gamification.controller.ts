import { Request, Response, NextFunction } from 'express';
import gamificationService from '../services/gamification.service';
import AppError from '../utils/AppError';

export async function addXp(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, points } = req.body;
    if (typeof userId !== 'string' || typeof points !== 'number') return next(new AppError('Invalid body', 400));
    const result = await gamificationService.addXp(userId, points);
    return res.status(201).json({ success: true, message: 'XP added', data: result });
  } catch (err) {
    return next(err);
  }
}

export async function getXp(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = String(req.params.userId || '');
    if (!userId) return next(new AppError('Invalid userId', 400));
    const result = await gamificationService.getXp(userId);
    return res.json({ success: true, message: 'Total XP', data: result });
  } catch (err) {
    return next(err);
  }
}

export async function updateStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;
    if (typeof userId !== 'string') return next(new AppError('Invalid body', 400));
    const result = await gamificationService.updateStreak(userId);
    return res.json({ success: true, message: 'Streak updated', data: result });
  } catch (err) {
    return next(err);
  }
}

export async function getStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = String(req.params.userId || '');
    if (!userId) return next(new AppError('Invalid userId', 400));
    const result = await gamificationService.getStreak(userId);
    return res.json({ success: true, message: 'Current streak', data: result });
  } catch (err) {
    return next(err);
  }
}

export async function unlockAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, achievementType } = req.body;
    if (typeof userId !== 'string' || !achievementType) return next(new AppError('Invalid body', 400));
    const result = await gamificationService.unlockAchievement(userId, achievementType);
    return res.status(201).json({ success: true, message: 'Achievement unlocked', data: result });
  } catch (err) {
    return next(err);
  }
}

export async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = String(req.params.userId || '');
    if (!userId) return next(new AppError('Invalid userId', 400));
    const result = await gamificationService.getAchievements(userId);
    return res.json({ success: true, message: 'Achievements', data: result });
  } catch (err) {
    return next(err);
  }
}

export async function processAction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    const { actionType } = req.body;

    if (typeof userId !== 'string' || typeof actionType !== 'string') {
      return next(new AppError('Invalid body', 400));
    }

    const result = await gamificationService.processUserAction(userId, actionType);

    return res.json({
      success: true,
      message: 'Action processed',
      data: result
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  addXp,
  getXp,
  updateStreak,
  getStreak,
  unlockAchievement,
  getAchievements,
  processAction
};
