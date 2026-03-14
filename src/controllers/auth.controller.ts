import { Request, Response } from 'express';
import { Admin, User } from '../database/models';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../types';

// POST /auth/admin/login
export async function adminLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const tokenPayload = {
      id: String(admin._id),
      email: admin.email,
      role: admin.role,
      isAdmin: true,
    };

    const accessToken = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.json({
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatarUrl: admin.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, phone, password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    if (!email && !phone) {
      res.status(400).json({ error: 'Email or phone is required' });
      return;
    }

    // Check if user already exists
    if (email) {
      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        res.status(409).json({ error: 'A user with this email already exists' });
        return;
      }
    }

    if (phone) {
      const existingByPhone = await User.findOne({ phone });
      if (existingByPhone) {
        res.status(409).json({ error: 'A user with this phone already exists' });
        return;
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
    });

    const tokenPayload = {
      id: String(user._id),
      email: user.email,
      phone: user.phone,
    };

    const accessToken = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, phone, password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    if (!email && !phone) {
      res.status(400).json({ error: 'Email or phone is required' });
      return;
    }

    const query = email ? { email } : { phone };
    const user = await User.findOne({ ...query, isActive: true });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const tokenPayload = {
      id: String(user._id),
      email: user.email,
      phone: user.phone,
    };

    const accessToken = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /auth/refresh
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Build a fresh token payload from the decoded claims
    const tokenPayload = {
      id: decoded.id,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role,
      isAdmin: decoded.isAdmin,
    };

    // Verify the underlying user/admin still exists and is active
    if (decoded.isAdmin) {
      const admin = await Admin.findById(decoded.id);
      if (!admin || !admin.isActive) {
        res.status(401).json({ error: 'Admin account not found or deactivated' });
        return;
      }
      tokenPayload.role = admin.role;
    } else {
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        res.status(401).json({ error: 'User account not found or deactivated' });
        return;
      }
    }

    const newAccessToken = signToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /auth/me
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (req.user.isAdmin) {
      const admin = await Admin.findById(req.user.id).select('-passwordHash');
      if (!admin) {
        res.status(404).json({ error: 'Admin not found' });
        return;
      }

      res.json({
        isAdmin: true,
        profile: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          avatarUrl: admin.avatarUrl,
          isActive: admin.isActive,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      isAdmin: false,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        preferredLanguage: user.preferredLanguage,
        preferredCategories: user.preferredCategories,
        darkMode: user.darkMode,
        notificationsEnabled: user.notificationsEnabled,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
