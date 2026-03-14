import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role?: string;
    isAdmin?: boolean;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface FeedQuery extends PaginationQuery {
  category?: string;
  language?: string;
}

export interface FeedItem {
  type: 'news' | 'ad';
  data: any;
}

export interface DashboardStats {
  totalArticles: number;
  totalUsers: number;
  totalBookmarks: number;
  totalAds: number;
  totalAdImpressions: number;
  totalAdClicks: number;
  articlesToday: number;
  usersToday: number;
  topCategories: { name: string; count: number }[];
  recentArticles: any[];
  adPerformance: { adTitle: string; impressions: number; clicks: number; ctr: number }[];
}
