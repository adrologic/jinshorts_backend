import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  getAllAdmins,
  createAdmin,
  updateAdminRole,
  toggleAdminStatus,
} from '../controllers/admin.controller';

const router = Router();

router.get('/', authenticate, requirePermission('admins:manage'), getAllAdmins);
router.post('/', authenticate, requirePermission('admins:manage'), createAdmin);
router.patch('/:id/role', authenticate, requirePermission('admins:manage'), updateAdminRole);
router.patch('/:id/toggle', authenticate, requirePermission('admins:manage'), toggleAdminStatus);

export default router;
