import { Request, Response } from 'express';
import { AppSettings } from '../database/models';

const CONTENT_LIMIT_DEFAULTS: Record<string, number> = {
  maxNewsImages: 5,
  maxAdImages: 5,
  newsTitleMaxWords: 50,
  newsContentMaxWords: 5000,
  adTitleMaxWords: 30,
  adDescriptionMaxWords: 500,
};

export async function getContentLimits(_req: Request, res: Response) {
  try {
    const keys = Object.keys(CONTENT_LIMIT_DEFAULTS);
    const settings = await AppSettings.find({ key: { $in: keys } }).lean();
    const result: Record<string, number> = {};
    keys.forEach(k => {
      const found = settings.find(s => s.key === k);
      result[k] = found ? parseInt(found.value, 10) : CONTENT_LIMIT_DEFAULTS[k];
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getSettings(_req: Request, res: Response) {
  try {
    const settings = await AppSettings.find().lean();
    const result: Record<string, string> = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const updates = req.body; // { key: value, key: value, ... }
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        AppSettings.findOneAndUpdate(
          { key },
          { key, value: String(value) },
          { upsert: true, new: true }
        )
      )
    );
    res.json({ message: 'Settings updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
