import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', authenticate, requirePermission('dashboard:view'), getDashboardStats);

export default router;
