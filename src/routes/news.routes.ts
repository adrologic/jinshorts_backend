import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { upload } from '../middleware/upload';
import {
  getFeedHandler,
  getArticle,
  incrementView,
  searchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  togglePublish,
  getAllArticlesAdmin,
} from '../controllers/news.controller';
import { getBlockedWordsList, moderateContent } from '../utils/contentModeration';

const router = Router();

// Public routes - static paths MUST come before /:id to avoid being caught by the param route
router.get('/feed', getFeedHandler);
router.get('/search', searchArticles);

// Content moderation - public endpoints for client-side validation
router.get('/moderation/blocked-words', (_req: Request, res: Response) => {
  res.json(getBlockedWordsList());
});

router.post('/moderation/check', (req: Request, res: Response) => {
  const result = moderateContent(req.body);
  res.json(result);
});

// Admin list route - MUST come before /:id
router.get('/admin/list', authenticate, requirePermission('news:view_all'), getAllArticlesAdmin);

// Public routes - parameterized
router.get('/:id', getArticle);
router.patch('/:id/view', incrementView);

// Admin routes - require authentication and specific permissions
const imageFields = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 1 }]);
router.post('/', authenticate, requirePermission('news:create'), imageFields, createArticle);
router.put('/:id', authenticate, requirePermission('news:edit'), imageFields, updateArticle);
router.delete('/:id', authenticate, requirePermission('news:delete'), deleteArticle);
router.patch('/:id/publish', authenticate, requirePermission('news:publish'), togglePublish);

export default router;
