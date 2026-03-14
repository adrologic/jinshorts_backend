import { Response } from 'express';
import { Admin } from '../database/models';
import { AuthRequest } from '../types';
import { hashPassword } from '../utils/hash';

export async function getAllAdmins(req: AuthRequest, res: Response): Promise<void> {
  try {
    const admins = await Admin.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();
    res.json(admins);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, name, role, location } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'email, password, name, and role are required' });
      return;
    }

    const validRoles = ['admin', 'editor', 'ad_manager', 'news_manager', 'ad_executive', 'news_executive', 'reporter', 'quiz_master'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Only super_admin can create admin-level accounts
    if (role === 'admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ error: 'Only super_admin can create admin accounts' });
      return;
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const createData: any = { email, passwordHash, name, role };
    if (location) {
      createData.location = location;
    }
    const admin = await Admin.create(createData);

    const result = admin.toObject();
    delete (result as any).passwordHash;
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAdminRole(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { role, location } = req.body;
    const targetId = req.params.id;

    const validRoles = ['admin', 'editor', 'ad_manager', 'news_manager', 'ad_executive', 'news_executive', 'reporter', 'quiz_master'];
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const target = await Admin.findById(targetId);
    if (!target) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    // Cannot change super_admin role
    if (target.role === 'super_admin') {
      res.status(403).json({ error: 'Cannot modify super_admin role' });
      return;
    }

    target.role = role;
    if (location !== undefined) {
      target.location = location;
    }
    await target.save();

    const result = target.toObject();
    delete (result as any).passwordHash;
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function toggleAdminStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const target = await Admin.findById(req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    // Cannot deactivate super_admin
    if (target.role === 'super_admin') {
      res.status(403).json({ error: 'Cannot deactivate super_admin' });
      return;
    }

    // Cannot deactivate yourself
    if (target._id.toString() === req.user!.id) {
      res.status(400).json({ error: 'Cannot deactivate yourself' });
      return;
    }

    target.isActive = !target.isActive;
    await target.save();

    const result = target.toObject();
    delete (result as any).passwordHash;
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
