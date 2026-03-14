import { Request, Response } from 'express';
import { Notification } from '../database/models';
import { AuthRequest } from '../types';
import { sendPushToAll } from '../utils/firebase';

export async function getAllNotifications(_req: Request, res: Response) {
  try {
    const notifications = await Notification.find()
      .sort({ sentAt: -1 })
      .populate('articleId', 'title')
      .lean();
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function sendNotification(req: AuthRequest, res: Response) {
  try {
    const notification = await Notification.create({
      ...req.body,
      createdBy: req.user!.id,
      sentAt: new Date(),
    });

    // Send push notification to all users via FCM
    const pushData: Record<string, string> = { type: 'notification' };
    if (req.body.articleId) {
      pushData.articleId = req.body.articleId.toString();
      pushData.type = 'article';
    }

    sendPushToAll({
      title: req.body.title,
      body: req.body.body || req.body.message || '',
      data: pushData,
      channelId: 'default',
    }).catch(() => {});

    res.status(201).json(notification);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
