import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { upload } from '../middleware/upload';
import {
  getAllAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  toggleAd,
  recordImpression,
  recordClick,
  getAdSettings,
  updateAdSettings,
  getPublicAdSettings,
} from '../controllers/ads.controller';

const router = Router();

// Public route for mobile to get ad display settings (no sensitive data)
router.get('/display-settings', getPublicAdSettings);

// Settings routes MUST come before /:id routes
router.get('/settings', authenticate, requirePermission('ads:settings'), getAdSettings);
router.put('/settings', authenticate, requirePermission('ads:settings'), updateAdSettings);

// CRUD routes
router.get('/', authenticate, requirePermission('ads:view_all'), getAllAds);
router.get('/:id', authenticate, requirePermission('ads:view_all'), getAd);
const imageFields = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 1 }]);
router.post('/', authenticate, requirePermission('ads:create'), imageFields, createAd);
router.put('/:id', authenticate, requirePermission('ads:edit'), imageFields, updateAd);
router.delete('/:id', authenticate, requirePermission('ads:delete'), deleteAd);

// Toggle active status
router.patch('/:id/toggle', authenticate, requirePermission('ads:toggle'), toggleAd);

// Public routes (no auth required)
router.post('/:id/impression', recordImpression);
router.post('/:id/click', recordClick);

export default router;
