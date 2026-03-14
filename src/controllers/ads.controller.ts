import { Request, Response } from 'express';
import { Advertisement, AdSettings, AppSettings } from '../database/models';
import { AuthRequest } from '../types';

// Simple in-memory deduplication for impression/click tracking
// Key: `${type}:${adId}:${ip}`, Value: timestamp of last recorded event
const recentEvents = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000; // 1 minute

// Periodically clean up stale entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - DEDUP_WINDOW_MS;
  for (const [key, ts] of recentEvents) {
    if (ts < cutoff) recentEvents.delete(key);
  }
}, 5 * 60_000);

function isDuplicate(type: string, adId: string, ip: string): boolean {
  const key = `${type}:${adId}:${ip}`;
  const last = recentEvents.get(key);
  const now = Date.now();
  if (last && now - last < DEDUP_WINDOW_MS) {
    return true;
  }
  recentEvents.set(key, now);
  return false;
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

export async function getAllAds(req: Request, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const ads = await Advertisement.find(query)
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'name email phone')
      .lean();
    res.json(ads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAd(req: Request, res: Response) {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) { res.status(404).json({ error: 'Ad not found' }); return; }
    res.json(ad);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createAd(req: AuthRequest, res: Response) {
  try {
    const data = { ...req.body };
    delete data.submittedBy;

    // Validate startDate/endDate
    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
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
      data.images = imagePaths;
      data.imageUrl = imagePaths[0];
    }

    data.createdBy = req.user!.id;

    const ad = await Advertisement.create(data);
    res.status(201).json(ad);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAd(req: AuthRequest, res: Response) {
  try {
    const data = { ...req.body };

    // Validate startDate/endDate
    if (data.startDate && data.endDate && new Date(data.endDate) <= new Date(data.startDate)) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
    }

    // Multi-image handling
    const uploadedFiles = normalizeUploadedFiles(req);
    let existingImages: string[] = [];
    if (data.existingImages) {
      try {
        existingImages = JSON.parse(data.existingImages);
      } catch { existingImages = []; }
      delete data.existingImages;
    }

    const newImagePaths = uploadedFiles.map(f => `/uploads/${f.filename}`);
    const allImages = [...existingImages, ...newImagePaths];

    const maxImages = await getLimit('maxAdImages', 5);
    if (allImages.length > maxImages) {
      res.status(400).json({ error: `Maximum ${maxImages} images allowed` });
      return;
    }

    if (allImages.length > 0) {
      data.images = allImages;
      data.imageUrl = allImages[0];
    } else if (existingImages.length === 0 && newImagePaths.length === 0) {
      data.images = [];
      data.imageUrl = undefined;
    }

    const ad = await Advertisement.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!ad) { res.status(404).json({ error: 'Ad not found' }); return; }
    res.json(ad);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteAd(req: Request, res: Response) {
  try {
    const ad = await Advertisement.findByIdAndDelete(req.params.id);
    if (!ad) { res.status(404).json({ error: 'Ad not found' }); return; }
    res.json({ message: 'Ad deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function toggleAd(req: Request, res: Response) {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) { res.status(404).json({ error: 'Ad not found' }); return; }
    // Toggle between active and expired
    ad.status = ad.status === 'active' ? 'expired' : 'active';
    await ad.save();
    res.json(ad);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function recordImpression(req: Request, res: Response) {
  try {
    const ip = String(req.ip || req.socket?.remoteAddress || 'unknown');
    const adId = String(req.params.id);
    if (isDuplicate('impression', adId, ip)) {
      res.json({ message: 'Impression already recorded' });
      return;
    }
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { $inc: { impressionCount: 1 } },
      { new: true }
    );
    if (!ad) { res.status(404).json({ error: 'Ad not found' }); return; }
    res.json({ message: 'Impression recorded' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function recordClick(req: Request, res: Response) {
  try {
    const ip = String(req.ip || req.socket?.remoteAddress || 'unknown');
    const adId = String(req.params.id);
    if (isDuplicate('click', adId, ip)) {
      res.json({ message: 'Click already recorded' });
      return;
    }
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );
    if (!ad) { res.status(404).json({ error: 'Ad not found' }); return; }
    res.json({ message: 'Click recorded' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAdSettings(_req: Request, res: Response) {
  try {
    let settings = await AdSettings.findOne();
    if (!settings) {
      settings = await AdSettings.create({});
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAdSettings(req: Request, res: Response) {
  try {
    let settings = await AdSettings.findOne();
    if (!settings) {
      settings = await AdSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPublicAdSettings(_req: Request, res: Response) {
  try {
    let settings = await AdSettings.findOne();
    if (!settings) {
      settings = await AdSettings.create({});
    }
    res.json({
      isAdsEnabled: settings.isAdsEnabled,
      googleAdRatio: settings.googleAdRatio,
      inArticleAdEnabled: settings.inArticleAdEnabled,
      inArticleAdPosition: settings.inArticleAdPosition,
      inArticleAdFrequency: settings.inArticleAdFrequency,
      googleAdmobBannerId: settings.googleAdmobBannerId,
      googleAdmobNativeId: settings.googleAdmobNativeId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
