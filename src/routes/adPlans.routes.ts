import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  getAllAdPlans,
  getActiveAdPlans,
  createAdPlan,
  updateAdPlan,
  deleteAdPlan,
  toggleAdPlan,
} from '../controllers/adPlans.controller';

const router = Router();

// Public — mobile fetches active plans
router.get('/active', getActiveAdPlans);

// Admin CRUD
router.get('/', authenticate, requirePermission('ads:settings'), getAllAdPlans);
router.post('/', authenticate, requirePermission('ads:settings'), createAdPlan);
router.put('/:id', authenticate, requirePermission('ads:settings'), updateAdPlan);
router.delete('/:id', authenticate, requirePermission('ads:settings'), deleteAdPlan);
router.patch('/:id/toggle', authenticate, requirePermission('ads:settings'), toggleAdPlan);

export default router;
