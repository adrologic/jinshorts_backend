import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getBookmarks, toggleBookmark, removeBookmark } from '../controllers/bookmark.controller';

const router = Router();

router.get('/', authenticate, getBookmarks);
router.post('/:articleId', authenticate, toggleBookmark);
router.delete('/:articleId', authenticate, removeBookmark);

export default router;
