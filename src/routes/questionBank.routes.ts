import { Router } from 'express';
import {
  getAllQuestions, createQuestion, updateQuestion, deleteQuestion, bulkUploadQuestions,
} from '../controllers/questionBank.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.get('/', authenticate, requirePermission('quiz:view_all'), getAllQuestions);
router.post('/', authenticate, requirePermission('quiz:create'), createQuestion);
router.put('/:id', authenticate, requirePermission('quiz:edit'), updateQuestion);
router.delete('/:id', authenticate, requirePermission('quiz:delete'), deleteQuestion);
router.post('/bulk-upload', authenticate, requirePermission('quiz:create'), bulkUploadQuestions);

export default router;
