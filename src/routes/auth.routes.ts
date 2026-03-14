import { Router } from 'express';
import { adminLogin, register, login, refreshToken, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Admin login
router.post('/admin/login', adminLogin);

// User registration
router.post('/register', register);

// User login
router.post('/login', login);

// Refresh access token
router.post('/refresh', refreshToken);

// Get current user/admin profile (authenticated)
router.get('/me', authenticate, getMe);

export default router;
