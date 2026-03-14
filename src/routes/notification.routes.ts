import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { getAllNotifications, sendNotification } from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, requirePermission('notifications:send'), getAllNotifications);
router.post('/', authenticate, requirePermission('notifications:send'), sendNotification);

export default router;
