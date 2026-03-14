import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createAssignment,
  getMyAssignments,
  getAssignmentsCreatedByMe,
  getAllAssignments,
  getAssignmentsByItem,
  updateAssignmentStatus,
} from '../controllers/assignment.controller';

const router = Router();

router.post('/', authenticate, requirePermission('assignments:create'), createAssignment);
router.get('/my', authenticate, requirePermission('assignments:view_own'), getMyAssignments);
router.get('/created', authenticate, requirePermission('assignments:create'), getAssignmentsCreatedByMe);
router.get('/all', authenticate, requirePermission('assignments:view_own'), getAllAssignments);
router.get('/item/:itemType/:itemId', authenticate, requirePermission('assignments:view_own'), getAssignmentsByItem);
router.patch('/:id/status', authenticate, requirePermission('assignments:review'), updateAssignmentStatus);

export default router;
