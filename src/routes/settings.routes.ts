import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { getSettings, updateSettings, getContentLimits } from '../controllers/settings.controller';

const router = Router();

// Public endpoint for content limits (mobile + admin forms)
router.get('/content-limits', getContentLimits);

router.get('/', authenticate, adminOnly, getSettings);
router.put('/', authenticate, adminOnly, updateSettings);

export default router;
