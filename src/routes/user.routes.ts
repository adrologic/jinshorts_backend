import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { upload } from '../middleware/upload';
import { getAllUsers, getUser, updateProfile, toggleUserStatus, promoteToReporter } from '../controllers/user.controller';

const router = Router();

router.get('/', authenticate, requirePermission('users:manage'), getAllUsers);
router.put('/profile', authenticate, upload.single('avatar'), updateProfile);
router.get('/:id', authenticate, requirePermission('users:manage'), getUser);
router.patch('/:id/toggle', authenticate, requirePermission('users:manage'), toggleUserStatus);
router.post('/:id/promote-reporter', authenticate, requirePermission('users:manage'), promoteToReporter);

export default router;
