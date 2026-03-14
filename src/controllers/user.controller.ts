import { Request, Response } from 'express';
import crypto from 'crypto';
import { User, Admin } from '../database/models';
import { AuthRequest } from '../types';
import { hashPassword } from '../utils/hash';

export async function getAllUsers(_req: Request, res: Response) {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').lean();
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const updates = req.body;
    delete updates.passwordHash;
    delete updates.isActive;
    if (req.file) {
      updates.avatarUrl = `/uploads/${req.file.filename}`;
    }
    const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true }).select('-passwordHash');
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function toggleUserStatus(req: Request, res: Response) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ isActive: user.isActive });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function promoteToReporter(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { city, state, country } = req.body;

    if (!city || !state || !country) {
      res.status(400).json({ error: 'City, state, and country are required for reporter promotion' });
      return;
    }

    const user = await User.findById(id).lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.email) {
      res.status(400).json({ error: 'User must have an email address to be promoted to reporter' });
      return;
    }

    const existingAdmin = await Admin.findOne({ email: user.email }).lean();
    if (existingAdmin) {
      res.status(409).json({ error: 'This user is already a staff member' });
      return;
    }

    const tempPassword =
      crypto.randomBytes(2).toString('hex').toUpperCase() +
      String(Math.floor(1000 + Math.random() * 9000)) +
      crypto.randomBytes(2).toString('hex').toLowerCase();

    const passwordHash = await hashPassword(tempPassword);

    const newAdmin = await Admin.create({
      email: user.email,
      passwordHash,
      name: user.name || user.email.split('@')[0],
      role: 'reporter',
      location: { city, state, country },
      isActive: true,
    });

    const result = newAdmin.toObject();
    delete (result as any).passwordHash;

    res.status(201).json({ admin: result, tempPassword });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
