import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '../controllers/category.controller';

const router = Router();

router.get('/', getAllCategories);
router.post('/', authenticate, requirePermission('categories:manage'), createCategory);
router.put('/:id', authenticate, requirePermission('categories:manage'), updateCategory);
router.delete('/:id', authenticate, requirePermission('categories:manage'), deleteCategory);
router.patch('/reorder', authenticate, requirePermission('categories:manage'), reorderCategories);

export default router;
