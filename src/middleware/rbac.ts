import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

export type Permission =
  | 'news:create' | 'news:edit' | 'news:delete' | 'news:publish' | 'news:view_all'
  | 'ads:create' | 'ads:edit' | 'ads:delete' | 'ads:toggle' | 'ads:view_all'
  | 'ads:settings'
  | 'categories:manage'
  | 'users:manage'
  | 'notifications:send'
  | 'assignments:create' | 'assignments:review' | 'assignments:view_own'
  | 'dashboard:view'
  | 'admins:manage'
  | 'quiz:create' | 'quiz:edit' | 'quiz:delete' | 'quiz:publish' | 'quiz:view_all';

type Role = 'super_admin' | 'admin' | 'editor' | 'ad_manager' | 'news_manager'
  | 'ad_executive' | 'news_executive' | 'reporter' | 'quiz_master';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'news:create', 'news:edit', 'news:delete', 'news:publish', 'news:view_all',
    'ads:create', 'ads:edit', 'ads:delete', 'ads:toggle', 'ads:view_all', 'ads:settings',
    'categories:manage', 'users:manage', 'notifications:send',
    'assignments:create', 'assignments:review', 'assignments:view_own',
    'dashboard:view', 'admins:manage',
    'quiz:create', 'quiz:edit', 'quiz:delete', 'quiz:publish', 'quiz:view_all',
  ],
  admin: [
    'news:create', 'news:edit', 'news:delete', 'news:publish', 'news:view_all',
    'ads:create', 'ads:edit', 'ads:delete', 'ads:toggle', 'ads:view_all', 'ads:settings',
    'categories:manage', 'users:manage', 'notifications:send',
    'assignments:create', 'assignments:review', 'assignments:view_own',
    'dashboard:view',
    'quiz:create', 'quiz:edit', 'quiz:delete', 'quiz:publish', 'quiz:view_all',
  ],
  editor: [
    'news:create', 'news:edit', 'news:publish', 'news:view_all',
    'dashboard:view',
  ],
  ad_manager: [
    'ads:create', 'ads:edit', 'ads:delete', 'ads:toggle', 'ads:view_all', 'ads:settings',
    'assignments:create', 'assignments:view_own',
    'dashboard:view',
  ],
  news_manager: [
    'news:create', 'news:edit', 'news:delete', 'news:publish', 'news:view_all',
    'assignments:create', 'assignments:view_own',
    'dashboard:view',
  ],
  ad_executive: [
    'ads:view_all',
    'assignments:review', 'assignments:view_own',
    'dashboard:view',
  ],
  news_executive: [
    'news:view_all',
    'assignments:review', 'assignments:view_own',
    'dashboard:view',
  ],
  reporter: [
    'news:create',
    'dashboard:view',
  ],
  quiz_master: [
    'quiz:create', 'quiz:edit', 'quiz:delete', 'quiz:publish', 'quiz:view_all',
    'dashboard:view',
  ],
};

export function requirePermission(...permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const userRole = req.user.role as Role;
    if (!userRole) {
      res.status(403).json({ error: 'No role assigned' });
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[userRole];
    if (!userPermissions) {
      res.status(403).json({ error: 'Invalid role' });
      return;
    }

    const hasAllPermissions = permissions.every(p => userPermissions.includes(p));
    if (!hasAllPermissions) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const userRole = req.user.role as Role;
    if (!roles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient role' });
      return;
    }

    next();
  };
}

export { ROLE_PERMISSIONS };
