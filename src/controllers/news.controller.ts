import { Request, Response } from 'express';
import { Article, Category, Advertisement, AdSettings, AppSettings } from '../database/models';
import { getFeed } from '../services/feed.service';
import { AuthRequest } from '../types';
import { moderateContent, formatViolationMessage } from '../utils/contentModeration';

function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function normalizeUploadedFiles(req: AuthRequest): Express.Multer.File[] {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  if (!files) return [];
  return [...(files.images || []), ...(files.image || [])];
}

async function getLimit(key: string, fallback: number): Promise<number> {
  const setting = await AppSettings.findOne({ key }).lean();
  return setting ? parseInt(setting.value, 10) : fallback;
}

// GET /feed - Public. Returns paginated news feed with interleaved ads.
export async function getFeedHandler(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categorySlug = req.query.category as string | undefined;

    let categoryId: string | undefined;
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug }).lean();
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      categoryId = category._id.toString();
    }

    const feed = await getFeed({ page, limit, category: categoryId });
    res.json(feed);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
}

// GET /:id - Public. Returns a single article with populated category and in-article ads.
export async function getArticle(req: Request, res: Response): Promise<void> {
  try {
    const article = await Article.findById(req.params.id)
      .populate('categoryId')
      .populate('submittedBy', 'name avatarUrl')
      .lean();

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    // Fetch in-article ads if enabled
    let inArticleAds: any[] = [];
    let topBannerAd: any = null;
    let articleBannerAd: any = null;
    const adSettings = await AdSettings.findOne().lean();
    const now = new Date();

    const activeAdQuery = {
      status: 'active' as const,
      endDate: { $gte: now },
    };

    if (adSettings?.inArticleAdEnabled) {
      inArticleAds = await Advertisement.find({
        ...activeAdQuery,
        placement: 'in_article',
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
    }

    // Top banner ad
    topBannerAd = await Advertisement.findOne({
      ...activeAdQuery,
      placement: 'top_banner',
    })
      .sort({ createdAt: -1 })
      .lean();

    // Article bottom banner ad
    articleBannerAd = await Advertisement.findOne({
      ...activeAdQuery,
      placement: 'article_bottom_banner',
      ...(topBannerAd ? { _id: { $ne: topBannerAd._id } } : {}),
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ...article, inArticleAds, topBannerAd, articleBannerAd });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
}

// PATCH /:id/view - Public. Increments the view count of an article.
export async function incrementView(req: Request, res: Response): Promise<void> {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({ viewCount: article.viewCount });
  } catch (error) {
    console.error('Error incrementing view:', error);
    res.status(500).json({ error: 'Failed to increment view count' });
  }
}

// GET /search - Public. Searches articles by title and summary.
export async function searchArticles(req: Request, res: Response): Promise<void> {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escaped, 'i');
    const query = {
      isPublished: true,
      $or: [
        { title: searchRegex },
        { summary: searchRegex },
      ],
    };

    const [articles, total] = await Promise.all([
      Article.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name nameHi slug icon color')
        .lean(),
      Article.countDocuments(query),
    ]);

    res.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
}

// GET /admin/list - Admin only. Returns all articles with optional status filter.
export async function getAllArticlesAdmin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const query: any = {};

    if (status === 'pending') {
      query.isPublished = false;
    } else if (status === 'published') {
      query.isPublished = true;
    }

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .populate('categoryId', 'name nameHi slug icon color')
      .populate('submittedBy', 'name email phone')
      .lean();

    res.json(articles);
  } catch (error) {
    console.error('Error fetching articles for admin:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
}

// POST / - Admin only. Creates a new article.
export async function createArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const articleData = { ...req.body };
    delete articleData.submittedBy;

    // YouTube URL validation
    if (articleData.youtubeUrl) {
      articleData.youtubeUrl = articleData.youtubeUrl.trim();
      const ytRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/;
      if (!ytRegex.test(articleData.youtubeUrl)) {
        res.status(400).json({ error: 'Invalid YouTube URL' });
        return;
      }
    }

    // Content moderation check
    const moderation = moderateContent({
      title: articleData.title,
      titleHi: articleData.titleHi,
      summary: articleData.summary,
      summaryHi: articleData.summaryHi,
      fullContent: articleData.fullContent,
      fullContentHi: articleData.fullContentHi,
    });

    if (!moderation.isClean) {
      res.status(400).json({
        error: 'Content moderation failed',
        message: formatViolationMessage(moderation.violations),
        violations: moderation.violations,
      });
      return;
    }

    // Multi-image handling
    const uploadedFiles = normalizeUploadedFiles(req);
    const maxImages = await getLimit('maxNewsImages', 5);

    if (uploadedFiles.length > maxImages) {
      res.status(400).json({ error: `Maximum ${maxImages} images allowed` });
      return;
    }

    if (uploadedFiles.length > 0) {
      const imagePaths = uploadedFiles.map(f => `/uploads/${f.filename}`);
      articleData.images = imagePaths;
      articleData.imageUrl = imagePaths[0];
      const mime = uploadedFiles[0].mimetype;
      if (mime.startsWith('video/')) {
        articleData.mediaType = 'video';
      } else if (mime === 'image/gif') {
        articleData.mediaType = 'gif';
      } else {
        articleData.mediaType = 'image';
      }
    }

    if (req.user) {
      articleData.createdBy = req.user.id;
    }

    // Ensure publishedAt is set to now when creating a published article
    if (articleData.isPublished === true || articleData.isPublished === 'true') {
      articleData.publishedAt = new Date();
    }

    const article = await Article.create(articleData);
    res.status(201).json(article);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
}

// PUT /:id - Admin only. Updates an existing article.
export async function updateArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const updateData = { ...req.body };

    // YouTube URL validation
    if (updateData.youtubeUrl) {
      updateData.youtubeUrl = updateData.youtubeUrl.trim();
      const ytRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/;
      if (!ytRegex.test(updateData.youtubeUrl)) {
        res.status(400).json({ error: 'Invalid YouTube URL' });
        return;
      }
    }

    // Content moderation check
    const moderation = moderateContent({
      title: updateData.title,
      titleHi: updateData.titleHi,
      summary: updateData.summary,
      summaryHi: updateData.summaryHi,
      fullContent: updateData.fullContent,
      fullContentHi: updateData.fullContentHi,
    });

    if (!moderation.isClean) {
      res.status(400).json({
        error: 'Content moderation failed',
        message: formatViolationMessage(moderation.violations),
        violations: moderation.violations,
      });
      return;
    }

    // Multi-image handling
    const uploadedFiles = normalizeUploadedFiles(req);
    let existingImages: string[] = [];
    if (updateData.existingImages) {
      try {
        existingImages = JSON.parse(updateData.existingImages);
      } catch { existingImages = []; }
      delete updateData.existingImages;
    }

    const newImagePaths = uploadedFiles.map(f => `/uploads/${f.filename}`);
    const allImages = [...existingImages, ...newImagePaths];

    const maxImages = await getLimit('maxNewsImages', 5);
    if (allImages.length > maxImages) {
      res.status(400).json({ error: `Maximum ${maxImages} images allowed` });
      return;
    }

    if (allImages.length > 0) {
      updateData.images = allImages;
      updateData.imageUrl = allImages[0];
    } else if (existingImages.length === 0 && newImagePaths.length === 0) {
      // All images removed
      updateData.images = [];
      updateData.imageUrl = undefined;
    }

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
}

// DELETE /:id - Admin only. Deletes an article.
export async function deleteArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
}

// PATCH /:id/publish - Admin only. Toggles the isPublished flag.
export async function togglePublish(req: AuthRequest, res: Response): Promise<void> {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    article.isPublished = !article.isPublished;
    if (article.isPublished) {
      article.publishedAt = new Date();
    } else {
      article.publishedAt = null as any;
    }
    await article.save();

    res.json({ isPublished: article.isPublished });
  } catch (error) {
    console.error('Error toggling publish:', error);
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
}

