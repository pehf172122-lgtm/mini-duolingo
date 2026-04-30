import { Router } from 'express';
import * as controller from '../controllers/content.controller';

const router = Router();

// Units
router.post('/units', controller.createUnit);
router.get('/units', controller.getUnits);

// Lessons
router.post('/lessons', controller.createLesson);
router.get('/units/:unitId/lessons', controller.getLessonsByUnit);
router.get('/lessons/:lessonId/exercises', controller.getExercisesByLesson);
router.get('/progress', controller.getUserProgress);

// Exercises
router.post('/exercises', controller.createExercise);
router.post('/exercises/:exerciseId/validate', controller.validateExercise);
router.post('/lessons/complete', controller.completeLesson);
router.get('/exercises', controller.getExercises);
router.get('/exercises/:id', controller.getExerciseById);

export default router;
