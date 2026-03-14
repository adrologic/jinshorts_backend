import { Response } from 'express';
import { Bookmark, Article } from '../database/models';
import { AuthRequest } from '../types';

export async function getBookmarks(req: AuthRequest, res: Response) {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user!.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'articleId',
        populate: { path: 'categoryId', select: 'name nameHi slug icon color' },
      })
      .lean();
    res.json({ bookmarks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function toggleBookmark(req: AuthRequest, res: Response) {
  try {
    const { articleId } = req.params;
    const userId = req.user!.id;

    const existing = await Bookmark.findOne({ userId, articleId });
    if (existing) {
      await existing.deleteOne();
      await Article.findByIdAndUpdate(articleId, { $inc: { bookmarkCount: -1 } });
      res.json({ bookmarked: false });
    } else {
      await Bookmark.create({ userId, articleId });
      await Article.findByIdAndUpdate(articleId, { $inc: { bookmarkCount: 1 } });
      res.json({ bookmarked: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function removeBookmark(req: AuthRequest, res: Response) {
  try {
    const { articleId } = req.params;
    const result = await Bookmark.findOneAndDelete({ userId: req.user!.id, articleId });
    if (result) {
      await Article.findByIdAndUpdate(articleId, { $inc: { bookmarkCount: -1 } });
    }
    res.json({ message: 'Bookmark removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
