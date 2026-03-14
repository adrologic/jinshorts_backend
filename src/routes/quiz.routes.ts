import { Router } from 'express';
import {
  getAllQuizzes, createQuiz, updateQuiz, deleteQuiz, publishQuiz, getQuizResults,
  getActiveQuizzes, getQuizById, startQuiz, submitQuiz, getLeaderboard, getMyQuizHistory, getMyQuizStats,
} from '../controllers/quiz.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Admin routes
router.get('/admin/all', authenticate, requirePermission('quiz:view_all'), getAllQuizzes);
router.post('/', authenticate, requirePermission('quiz:create'), createQuiz);
router.put('/:id', authenticate, requirePermission('quiz:edit'), updateQuiz);
router.delete('/:id', authenticate, requirePermission('quiz:delete'), deleteQuiz);
router.patch('/:id/publish', authenticate, requirePermission('quiz:publish'), publishQuiz);
router.get('/:id/results', authenticate, requirePermission('quiz:view_all'), getQuizResults);

// User routes
router.get('/active', getActiveQuizzes);
router.get('/my-history', authenticate, getMyQuizHistory);
router.get('/my-stats', authenticate, getMyQuizStats);
router.get('/:id', getQuizById);
router.post('/:id/start', authenticate, startQuiz);
router.post('/:id/submit', authenticate, submitQuiz);
router.get('/:id/leaderboard', getLeaderboard);

export default router;
