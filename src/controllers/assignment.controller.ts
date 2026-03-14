import { Response } from 'express';
import { Assignment, Article, Advertisement, Admin } from '../database/models';
import { AuthRequest } from '../types';

export async function createAssignment(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { itemType, itemId, assignedTo, notes, dueDate } = req.body;

    if (!itemType || !itemId || !assignedTo) {
      res.status(400).json({ error: 'itemType, itemId, and assignedTo are required' });
      return;
    }

    // Verify item exists
    if (itemType === 'article') {
      const article = await Article.findById(itemId);
      if (!article) { res.status(404).json({ error: 'Article not found' }); return; }
    } else if (itemType === 'advertisement') {
      const ad = await Advertisement.findById(itemId);
      if (!ad) { res.status(404).json({ error: 'Advertisement not found' }); return; }
    } else {
      res.status(400).json({ error: 'itemType must be "article" or "advertisement"' });
      return;
    }

    // Verify assignee exists and is an appropriate executive
    const assignee = await Admin.findById(assignedTo);
    if (!assignee || !assignee.isActive) {
      res.status(404).json({ error: 'Assignee not found or inactive' });
      return;
    }

    const assignment = await Assignment.create({
      itemType,
      itemId,
      assignedBy: req.user!.id,
      assignedTo,
      notes: notes || '',
      dueDate: dueDate || undefined,
    });

    const populated = await Assignment.findById(assignment._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMyAssignments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const query: any = { assignedTo: req.user!.id };
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .lean();

    // Populate item details
    for (const a of assignments) {
      if (a.itemType === 'article') {
        (a as any).item = await Article.findById(a.itemId).select('title imageUrl isPublished').lean();
      } else {
        (a as any).item = await Advertisement.findById(a.itemId).select('title advertiserName isActive').lean();
      }
    }

    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAssignmentsCreatedByMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const query: any = { assignedBy: req.user!.id };
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .lean();

    for (const a of assignments) {
      if (a.itemType === 'article') {
        (a as any).item = await Article.findById(a.itemId).select('title imageUrl isPublished').lean();
      } else {
        (a as any).item = await Advertisement.findById(a.itemId).select('title advertiserName isActive').lean();
      }
    }

    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAllAssignments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { itemType } = req.query;
    const query: any = {};
    if (itemType) query.itemType = itemType;

    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .lean();

    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAssignmentsByItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { itemType, itemId } = req.params;

    const assignments = await Assignment.find({ itemType, itemId })
      .sort({ createdAt: -1 })
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .lean();

    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAssignmentStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status, reviewNotes } = req.body;
    const validStatuses = ['pending', 'in_review', 'approved', 'rejected', 'changes_requested'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Only the assigned executive or admins can update
    const isAssignee = assignment.assignedTo.toString() === req.user!.id;
    const isAdmin = req.user!.role === 'super_admin' || req.user!.role === 'admin';
    if (!isAssignee && !isAdmin) {
      res.status(403).json({ error: 'Only the assigned person can update this assignment' });
      return;
    }

    assignment.status = status;
    if (reviewNotes) assignment.reviewNotes = reviewNotes;
    await assignment.save();

    // Auto-publish article or auto-activate ad on approval
    if (status === 'approved') {
      if (assignment.itemType === 'article') {
        await Article.findByIdAndUpdate(assignment.itemId, { isPublished: true });
      } else if (assignment.itemType === 'advertisement') {
        await Advertisement.findByIdAndUpdate(assignment.itemId, { status: 'active' });
      }
    }

    const populated = await Assignment.findById(assignment._id)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    res.json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
