import { Response } from 'express';
import { Article, Advertisement, AdPlan, AppSettings } from '../database/models';
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

// POST /submissions/news
export async function submitArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, titleHi, summary, summaryHi, fullContent, fullContentHi, categoryId, authorName, sourceName, sourceUrl, youtubeUrl, tags, latitude, longitude } = req.body;

    if (!title || !summary || !categoryId) {
      res.status(400).json({ error: 'Title, summary, and category are required' });
      return;
    }

    // Word count validation
    const titleMaxWords = await getLimit('newsTitleMaxWords', 50);
    const contentMaxWords = await getLimit('newsContentMaxWords', 5000);

    if (wordCount(title) > titleMaxWords) {
      res.status(400).json({ error: `Title exceeds ${titleMaxWords} word limit` });
      return;
    }
    if (fullContent && wordCount(fullContent) > contentMaxWords) {
      res.status(400).json({ error: `Content exceeds ${contentMaxWords} word limit` });
      return;
    }

    // Content moderation check
    const moderation = moderateContent({
      title, titleHi, summary, summaryHi, fullContent, fullContentHi,
    });

    if (!moderation.isClean) {
      res.status(400).json({
        error: 'Content moderation failed',
        message: formatViolationMessage(moderation.violations),
        violations: moderation.violations,
      });
      return;
    }

    const articleData: any = {
      title,
      titleHi,
      summary,
      summaryHi,
      fullContent,
      fullContentHi,
      categoryId,
      authorName,
      sourceName,
      sourceUrl,
      youtubeUrl: youtubeUrl?.trim() || undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
      isPublished: false,
      submittedBy: req.user!.id,
    };

    // Store location if provided
    if (latitude && longitude) {
      articleData.location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
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
      // Set mediaType from first file
      const mime = uploadedFiles[0].mimetype;
      if (mime.startsWith('video/')) {
        articleData.mediaType = 'video';
      } else if (mime === 'image/gif') {
        articleData.mediaType = 'gif';
      } else {
        articleData.mediaType = 'image';
      }
    }

    const article = await Article.create(articleData);
    res.status(201).json(article);
  } catch (error) {
    console.error('Submit article error:', error);
    res.status(500).json({ error: 'Failed to submit article' });
  }
}

// POST /submissions/ads
export async function submitAd(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, advertiserName, description, clickUrl, adType, placement,
            planId, selectedPlacement, duration, totalPrice } = req.body;

    if (!title || !advertiserName) {
      res.status(400).json({ error: 'Title and advertiser name are required' });
      return;
    }

    // Word count validation
    const titleMaxWords = await getLimit('adTitleMaxWords', 30);
    const descMaxWords = await getLimit('adDescriptionMaxWords', 500);

    if (wordCount(title) > titleMaxWords) {
      res.status(400).json({ error: `Title exceeds ${titleMaxWords} word limit` });
      return;
    }
    if (description && wordCount(description) > descMaxWords) {
      res.status(400).json({ error: `Description exceeds ${descMaxWords} word limit` });
      return;
    }

    const adData: any = {
      title,
      advertiserName,
      description,
      adType: adType || 'native',
      placement: placement ? (Array.isArray(placement) ? placement : [placement]) : [],
      clickUrl,
      status: 'draft',
      submittedBy: req.user!.id,
    };

    // Plan-related fields
    if (planId) {
      const plan = await AdPlan.findById(planId).lean();
      if (plan) {
        adData.planId = planId;
        const dur = parseInt(duration, 10) || 0;
        const price = parseFloat(totalPrice) || 0;

        // Validate price matches plan
        if (dur > 0 && Math.abs(plan.pricePerDay * dur - price) > 0.01) {
          res.status(400).json({ error: 'Price calculation mismatch' });
          return;
        }

        adData.duration = dur;
        adData.totalPrice = price;
      }
    }

    if (selectedPlacement) {
      adData.selectedPlacement = selectedPlacement;
      adData.placement = [selectedPlacement];
      // Derive adType from placement
      const placementToAdType: Record<string, string> = {
        top_banner: 'banner',
        inline_feed: 'card',
        in_article: 'native',
      };
      adData.adType = placementToAdType[selectedPlacement] || 'native';
    }

    // Multi-image handling
    const uploadedFiles = normalizeUploadedFiles(req);
    const maxImages = await getLimit('maxAdImages', 5);

    if (uploadedFiles.length > maxImages) {
      res.status(400).json({ error: `Maximum ${maxImages} images allowed` });
      return;
    }

    if (uploadedFiles.length > 0) {
      const imagePaths = uploadedFiles.map(f => `/uploads/${f.filename}`);
      adData.images = imagePaths;
      adData.imageUrl = imagePaths[0];
    }

    const ad = await Advertisement.create(adData);

    res.status(201).json({ ad });
  } catch (error) {
    console.error('Submit ad error:', error);
    res.status(500).json({ error: 'Failed to submit ad' });
  }
}

// GET /submissions/my/news
export async function getMySubmittedArticles(req: AuthRequest, res: Response): Promise<void> {
  try {
    const articles = await Article.find({ submittedBy: req.user!.id })
      .sort({ createdAt: -1 })
      .populate('categoryId', 'name nameHi slug icon color')
      .lean();

    res.json(articles);
  } catch (error) {
    console.error('Get my articles error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

// GET /submissions/my/ads
export async function getMySubmittedAds(req: AuthRequest, res: Response): Promise<void> {
  try {
    const ads = await Advertisement.find({ submittedBy: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(ads);
  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}
