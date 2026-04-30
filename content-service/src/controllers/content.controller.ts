import { Request, Response, NextFunction } from 'express';
import * as contentService from '../services/content.service';
import { createExerciseSchema } from '../validators/exercise.validator';
import { updateLessonProgress } from '../services/progress.service';
import pool from '../database/connection';

export async function createUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required', data: null, error: 'Validation' });
    const unit = await contentService.createUnit({ title, description });
    res.status(201).json({ success: true, message: 'Unit created', data: unit, error: null });
  } catch (err) { next(err); }
}

export async function getUnits(_req: Request, res: Response, next: NextFunction) {
  try {
    const units = await contentService.getAllUnits();
    res.json({ success: true, message: 'OK', data: units, error: null });
  } catch (err) { next(err); }
}

export async function createLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const { unit_id, title, content } = req.body;
    if (!unit_id || !title) return res.status(400).json({ success: false, message: 'unit_id and title required', data: null, error: 'Validation' });
    const lesson = await contentService.createLesson({ unit_id, title, content });
    res.status(201).json({ success: true, message: 'Lesson created', data: lesson, error: null });
  } catch (err) { next(err); }
}

export async function getLessonsByUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.params;
    const lessons = await contentService.getLessonsByUnit(unitId);
    res.json({ success: true, message: 'OK', data: lessons, error: null });
  } catch (err) { next(err); }
}

export const createExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createExerciseSchema.parse(req.body);

    const data = await contentService.createExercise(parsed);

    res.status(201).json({
      success: true,
      message: 'Exercise created',
      data,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

export async function validateExercise(req: Request, res: Response, next: NextFunction) {
  try {
    const { exerciseId } = req.params;
    const { answer } = req.body;
    if (typeof answer === 'undefined') return res.status(400).json({ success: false, message: 'answer is required', data: null, error: 'Validation' });
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null,
        error: 'Missing user'
      });
    }

    const result = await contentService.validateExerciseAnswer(
      exerciseId,
      answer,
      userId
    );
    res.json({ success: true, message: 'OK', data: result, error: null });
  } catch (err) { next(err); }
}

export async function completeLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null,
        error: 'Missing user'
      });
    }

    const result = await contentService.completeLesson(userId);

    res.json({
      success: true,
      message: 'Lesson completed',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export const getExercises = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await contentService.getExercises();

    res.json({
      success: true,
      message: 'Exercises retrieved',
      data,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

export const getExerciseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await contentService.getExerciseById(req.params.id);

    res.json({
      success: true,
      message: 'Exercise retrieved',
      data,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

export const getExercisesByLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await contentService.getExercisesByLesson(req.params.lessonId);

    res.json({
      success: true,
      message: 'Exercises by lesson',
      data,
      error: null
    });
  } catch (err) {
    next(err);
  }
};

export async function getUserProgress(req: any, res: any) {
  const userId = req.user?.userId;

  const [rows]: any = await pool.execute(
    `SELECT * FROM lesson_progress WHERE user_id = ?`,
    [userId]
  );

  res.json({
    success: true,
    data: rows
  });
}