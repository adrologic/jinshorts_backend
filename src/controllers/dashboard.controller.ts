import { Request, Response } from 'express';
import { Article, User, Bookmark, Advertisement, Category } from '../database/models';

export async function getDashboardStats(_req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalArticles,
      totalUsers,
      totalBookmarks,
      totalAds,
      articlesToday,
      usersToday,
      ads,
      categoryStats,
      recentArticles,
    ] = await Promise.all([
      Article.countDocuments(),
      User.countDocuments(),
      Bookmark.countDocuments(),
      Advertisement.countDocuments(),
      Article.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      Advertisement.find().lean(),
      Article.aggregate([
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $project: { name: '$category.name', count: 1 } },
      ]),
      Article.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('categoryId', 'name slug')
        .lean(),
    ]);

    const totalAdImpressions = ads.reduce((sum, ad) => sum + ad.impressionCount, 0);
    const totalAdClicks = ads.reduce((sum, ad) => sum + ad.clickCount, 0);

    const adPerformance = ads
      .filter(ad => ad.impressionCount > 0)
      .map(ad => ({
        adTitle: ad.title,
        impressions: ad.impressionCount,
        clicks: ad.clickCount,
        ctr: ad.impressionCount > 0 ? Math.round((ad.clickCount / ad.impressionCount) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    res.json({
      totalArticles,
      totalUsers,
      totalBookmarks,
      totalAds,
      totalAdImpressions,
      totalAdClicks,
      articlesToday,
      usersToday,
      topCategories: categoryStats,
      recentArticles,
      adPerformance,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
