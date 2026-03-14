import { Article, Advertisement, AdSettings } from '../database/models';
import { FeedItem } from '../types';

interface FeedOptions {
  page: number;
  limit: number;
  category?: string;
}

export async function getFeed(options: FeedOptions): Promise<{ items: FeedItem[]; total: number; page: number; totalPages: number; topBannerAd?: any }> {
  const { page, limit, category } = options;
  const skip = (page - 1) * limit;

  // Build article query
  const articleQuery: any = { isPublished: true };
  if (category) {
    articleQuery['categoryId'] = category;
  }

  // Fetch articles
  const [articles, totalArticles] = await Promise.all([
    Article.find(articleQuery)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name nameHi slug icon color')
      .populate('submittedBy', 'name avatarUrl')
      .lean(),
    Article.countDocuments(articleQuery),
  ]);

  // Fetch ad settings
  const adSettings = await AdSettings.findOne().lean();
  if (!adSettings || !adSettings.isAdsEnabled) {
    return {
      items: articles.map(a => ({ type: 'news' as const, data: a })),
      total: totalArticles,
      page,
      totalPages: Math.ceil(totalArticles / limit),
    };
  }

  // Fetch active ads by placement
  const now = new Date();
  const activeAdQuery = { status: 'active' as const, endDate: { $gte: now } };

  const [topBannerAds, inlineFeedAds] = await Promise.all([
    Advertisement.find({ ...activeAdQuery, placement: 'top_banner' })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean(),
    Advertisement.find({ ...activeAdQuery, placement: 'inline_feed' })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  // Top banner ad: on page 1 only
  let topBannerAd: any = null;
  if (page === 1 && topBannerAds.length > 0) {
    topBannerAd = topBannerAds[0];
  }

  // Merge news + inline feed ads
  const ads = inlineFeedAds;
  const { adFrequency, adStartPosition, maxAdsPerSession } = adSettings;
  const feedItems: FeedItem[] = [];
  let adIndex = 0;
  let adsInserted = 0;

  for (let i = 0; i < articles.length; i++) {
    feedItems.push({ type: 'news', data: articles[i] });

    const positionInFeed = i + 1;
    const shouldInsertAd =
      ads.length > 0 &&
      adsInserted < maxAdsPerSession &&
      positionInFeed >= adStartPosition &&
      (positionInFeed - adStartPosition) % adFrequency === 0;

    if (shouldInsertAd) {
      const ad = ads[adIndex % ads.length];
      feedItems.push({ type: 'ad', data: ad });
      adIndex++;
      adsInserted++;
    }
  }

  return {
    items: feedItems,
    total: totalArticles,
    page,
    totalPages: Math.ceil(totalArticles / limit),
    topBannerAd,
  };
}
