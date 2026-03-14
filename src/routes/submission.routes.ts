import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  submitArticle,
  submitAd,
  getMySubmittedArticles,
  getMySubmittedAds,
} from '../controllers/submission.controller';

const router = Router();

const imageFields = upload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 1 }]);

router.post('/news', authenticate, imageFields, submitArticle);
router.post('/ads', authenticate, imageFields, submitAd);
router.get('/my/news', authenticate, getMySubmittedArticles);
router.get('/my/ads', authenticate, getMySubmittedAds);

export default router;
