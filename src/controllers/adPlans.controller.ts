import { Request, Response } from 'express';
import { AdPlan } from '../database/models';
import { AuthRequest } from '../types';

export async function getAllAdPlans(_req: Request, res: Response): Promise<void> {
  try {
    const plans = await AdPlan.find().sort({ createdAt: -1 }).lean();
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getActiveAdPlans(_req: Request, res: Response): Promise<void> {
  try {
    const plans = await AdPlan.find({ isActive: true })
      .sort({ placement: 1, pricePerDay: 1 })
      .lean();
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createAdPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, placement, pricePerDay, description } = req.body;

    if (!name || !placement || pricePerDay == null) {
      res.status(400).json({ error: 'name, placement, and pricePerDay are required' });
      return;
    }

    const plan = await AdPlan.create({
      name,
      placement,
      pricePerDay,
      description: description || undefined,
      createdBy: req.user!.id,
    });

    res.status(201).json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAdPlan(req: Request, res: Response): Promise<void> {
  try {
    const plan = await AdPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) { res.status(404).json({ error: 'Plan not found' }); return; }
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteAdPlan(req: Request, res: Response): Promise<void> {
  try {
    const plan = await AdPlan.findByIdAndDelete(req.params.id);
    if (!plan) { res.status(404).json({ error: 'Plan not found' }); return; }
    res.json({ message: 'Plan deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function toggleAdPlan(req: Request, res: Response): Promise<void> {
  try {
    const plan = await AdPlan.findById(req.params.id);
    if (!plan) { res.status(404).json({ error: 'Plan not found' }); return; }
    plan.isActive = !plan.isActive;
    await plan.save();
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
