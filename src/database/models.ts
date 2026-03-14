import mongoose, { Schema, Document } from 'mongoose';

// Admin Schema
export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'ad_manager' | 'news_manager' | 'ad_executive' | 'news_executive' | 'reporter' | 'quiz_master';

export interface IAdminLocation {
  city?: string;
  state?: string;
  country?: string;
}

export interface IAdmin extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  avatarUrl?: string;
  location?: IAdminLocation;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'editor', 'ad_manager', 'news_manager', 'ad_executive', 'news_executive', 'reporter', 'quiz_master'], default: 'admin' },
  avatarUrl: String,
  location: {
    city: String,
    state: String,
    country: String,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// User Schema (mobile app users)
export interface IUser extends Document {
  phone?: string;
  email?: string;
  name?: string;
  passwordHash?: string;
  avatarUrl?: string;
  preferredLanguage: string;
  preferredCategories: string[];
  darkMode: boolean;
  notificationsEnabled: boolean;
  deviceToken?: string;
  quizPoints: number;
  quizStreak: number;
  lastQuizDate?: Date;
  quizzesCompleted: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  name: String,
  passwordHash: String,
  avatarUrl: String,
  preferredLanguage: { type: String, default: 'hi' },
  preferredCategories: { type: [String], default: [] },
  darkMode: { type: Boolean, default: true },
  notificationsEnabled: { type: Boolean, default: true },
  deviceToken: String,
  quizPoints: { type: Number, default: 0 },
  quizStreak: { type: Number, default: 0 },
  lastQuizDate: Date,
  quizzesCompleted: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Category Schema
export interface ICategory extends Document {
  name: string;
  nameHi?: string;
  nameGu?: string;
  slug: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  nameHi: String,
  nameGu: String,
  slug: { type: String, required: true, unique: true },
  icon: String,
  color: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Article Schema
export interface IArticle extends Document {
  title: string;
  titleHi?: string;
  summary: string;
  summaryHi?: string;
  fullContent?: string;
  fullContentHi?: string;
  imageUrl?: string;
  images?: string[];
  mediaType?: 'image' | 'video' | 'gif';
  categoryId: mongoose.Types.ObjectId;
  authorName?: string;
  sourceName?: string;
  sourceUrl?: string;
  youtubeUrl?: string;
  isPublished: boolean;
  tags: string[];
  viewCount: number;
  bookmarkCount: number;
  shareCount: number;
  publishedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  location?: { latitude: number; longitude: number };
  submittedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>({
  title: { type: String, required: true },
  titleHi: String,
  summary: { type: String, required: true },
  summaryHi: String,
  fullContent: String,
  fullContentHi: String,
  imageUrl: String,
  images: { type: [String], default: [] },
  mediaType: { type: String, enum: ['image', 'video', 'gif'], default: 'image' },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  authorName: String,
  sourceName: String,
  sourceUrl: String,
  youtubeUrl: String,
  isPublished: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
  viewCount: { type: Number, default: 0 },
  bookmarkCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  location: {
    latitude: Number,
    longitude: Number,
  },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

articleSchema.index({ categoryId: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ isPublished: 1, publishedAt: -1 });

// Advertisement Schema
export interface IAdvertisement extends Document {
  title: string;
  advertiserName: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  clickUrl?: string;
  adType: 'banner' | 'card' | 'fullscreen' | 'native';
  placement: AdPlacement[];
  status: 'draft' | 'active' | 'expired';
  startDate?: Date;
  endDate?: Date;
  impressionCount: number;
  clickCount: number;
  targetCategories: string[];
  createdBy: mongoose.Types.ObjectId;
  submittedBy?: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  selectedPlacement?: 'top_banner' | 'inline_feed' | 'in_article';
  duration?: number;
  totalPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const advertisementSchema = new Schema<IAdvertisement>({
  title: { type: String, required: true },
  advertiserName: { type: String, required: true },
  description: String,
  imageUrl: String,
  images: { type: [String], default: [] },
  clickUrl: String,
  adType: { type: String, enum: ['banner', 'card', 'fullscreen', 'native'], default: 'native' },
  placement: {
    type: [String],
    enum: ['top_banner', 'inline_feed', 'in_article', 'article_bottom_banner'],
    default: [],
  },
  status: { type: String, enum: ['draft', 'active', 'expired'], default: 'draft' },
  startDate: Date,
  endDate: Date,
  impressionCount: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  targetCategories: { type: [String], default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  planId: { type: Schema.Types.ObjectId, ref: 'AdPlan' },
  selectedPlacement: { type: String, enum: ['top_banner', 'inline_feed', 'in_article'] },
  duration: Number,
  totalPrice: Number,
}, { timestamps: true });

advertisementSchema.index({ status: 1, endDate: 1, placement: 1 });

// Ad Settings Schema
export interface IAdSettings extends Document {
  adFrequency: number;
  maxAdsPerSession: number;
  adStartPosition: number;
  fullscreenAdFrequency: number;
  isAdsEnabled: boolean;
  googleAdRatio: number;
  inArticleAdEnabled: boolean;
  inArticleAdPosition: number;
  inArticleAdFrequency: number;
  googleAdmobBannerId?: string;
  googleAdmobInterstitialId?: string;
  googleAdmobNativeId?: string;
  updatedAt: Date;
}

const adSettingsSchema = new Schema<IAdSettings>({
  adFrequency: { type: Number, default: 5 },
  maxAdsPerSession: { type: Number, default: 10 },
  adStartPosition: { type: Number, default: 3 },
  fullscreenAdFrequency: { type: Number, default: 15 },
  isAdsEnabled: { type: Boolean, default: true },
  googleAdRatio: { type: Number, default: 30, min: 0, max: 100 },
  inArticleAdEnabled: { type: Boolean, default: false },
  inArticleAdPosition: { type: Number, default: 3 },
  inArticleAdFrequency: { type: Number, default: 5 },
  googleAdmobBannerId: String,
  googleAdmobInterstitialId: String,
  googleAdmobNativeId: String,
}, { timestamps: true });

// Ad Plan Schema (pricing plans for ad placements)
export type AdPlanPlacement = 'top_banner' | 'inline_feed' | 'in_article';

export interface IAdPlan extends Document {
  name: string;
  placement: AdPlanPlacement;
  pricePerDay: number;
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const adPlanSchema = new Schema<IAdPlan>({
  name: { type: String, required: true },
  placement: { type: String, enum: ['top_banner', 'inline_feed', 'in_article'], required: true },
  pricePerDay: { type: Number, required: true, min: 0 },
  description: String,
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

adPlanSchema.index({ placement: 1, isActive: 1 });

// Bookmark Schema
export interface IBookmark extends Document {
  userId: mongoose.Types.ObjectId;
  articleId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
}, { timestamps: true });

bookmarkSchema.index({ userId: 1, articleId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1 });

// Read History Schema
export interface IReadHistory extends Document {
  userId: mongoose.Types.ObjectId;
  articleId: mongoose.Types.ObjectId;
  readDurationSeconds: number;
  readFullArticle: boolean;
  createdAt: Date;
}

const readHistorySchema = new Schema<IReadHistory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
  readDurationSeconds: { type: Number, default: 0 },
  readFullArticle: { type: Boolean, default: false },
}, { timestamps: true });

readHistorySchema.index({ userId: 1 });

// Notification Schema
export interface INotification extends Document {
  title: string;
  body: string;
  articleId?: mongoose.Types.ObjectId;
  type: 'news' | 'event' | 'general';
  sentTo: string;
  sentAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const notificationSchema = new Schema<INotification>({
  title: { type: String, required: true },
  body: { type: String, required: true },
  articleId: { type: Schema.Types.ObjectId, ref: 'Article' },
  type: { type: String, enum: ['news', 'event', 'general'], default: 'news' },
  sentTo: { type: String, default: 'all' },
  sentAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

// App Settings Schema
export interface IAppSettings extends Document {
  key: string;
  value: string;
  updatedAt: Date;
}

const appSettingsSchema = new Schema<IAppSettings>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
}, { timestamps: true });

// Assignment Schema
export interface IAssignment extends Document {
  itemType: 'article' | 'advertisement';
  itemId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';
  notes: string;
  reviewNotes?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>({
  itemType: { type: String, enum: ['article', 'advertisement'], required: true },
  itemId: { type: Schema.Types.ObjectId, required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected', 'changes_requested'],
    default: 'pending',
  },
  notes: { type: String, default: '' },
  reviewNotes: String,
  dueDate: Date,
}, { timestamps: true });

assignmentSchema.index({ assignedTo: 1, status: 1 });
assignmentSchema.index({ itemType: 1, itemId: 1 });
assignmentSchema.index({ assignedBy: 1 });

// Ad Placement and Format types
export type AdPlacement = 'top_banner' | 'inline_feed' | 'in_article' | 'article_bottom_banner';

// Question Bank Schema (centralized question pool)
export interface IQuestionBankOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuestionBank extends Document {
  questionText: string;
  options: IQuestionBankOption[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  explanation?: string;
  language: string;
  timeLimit: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionBankSchema = new Schema<IQuestionBank>({
  questionText: { type: String, required: true },
  options: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  }],
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  marks: { type: Number, default: 10 },
  explanation: String,
  language: { type: String, default: 'en' },
  timeLimit: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

questionBankSchema.index({ category: 1, difficulty: 1, isActive: 1 });

// Quiz Schema
export interface IQuiz extends Document {
  title: string;
  description?: string;
  language: string;
  createdBy: mongoose.Types.ObjectId;
  status: 'draft' | 'scheduled' | 'live' | 'completed';
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration: number; // seconds
  perQuestionTime: number; // seconds per question (0 = no per-question limit)
  questionCount: number;
  questionCategories: string[];
  questionDifficulty: string[];
  totalParticipants: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  description: String,
  language: { type: String, default: 'en' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  status: { type: String, enum: ['draft', 'scheduled', 'live', 'completed'], default: 'draft' },
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: { type: Number, default: 120 }, // 2 minutes
  perQuestionTime: { type: Number, default: 30 },
  questionCount: { type: Number, default: 10 },
  questionCategories: { type: [String], default: [] },
  questionDifficulty: { type: [String], default: [] },
  totalParticipants: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

quizSchema.index({ status: 1 });

// Quiz Participation Schema
export interface IQuizAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeTakenMs: number;
  answeredAt: Date;
}

export interface IQuizParticipation extends Document {
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  questionOrder: mongoose.Types.ObjectId[];
  answers: IQuizAnswer[];
  score: number;
  bonusPoints: number;
  totalQuestions: number;
  correctAnswers: number;
  startedAt: Date;
  completedAt?: Date;
  timeTaken?: number; // seconds
  rank?: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizParticipationSchema = new Schema<IQuizParticipation>({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  questionOrder: [{ type: Schema.Types.ObjectId, ref: 'QuestionBank' }],
  answers: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'QuestionBank', required: true },
    selectedOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, default: false },
    timeTakenMs: { type: Number, default: 0 },
    answeredAt: { type: Date, default: Date.now },
  }],
  score: { type: Number, default: 0 },
  bonusPoints: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  startedAt: { type: Date, required: true },
  completedAt: Date,
  timeTaken: Number,
  rank: Number,
}, { timestamps: true });

quizParticipationSchema.index({ quizId: 1, userId: 1 }, { unique: true });
quizParticipationSchema.index({ quizId: 1, score: -1, timeTaken: 1 });

// Export Models
export const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
export const User = mongoose.model<IUser>('User', userSchema);
export const Category = mongoose.model<ICategory>('Category', categorySchema);
export const Article = mongoose.model<IArticle>('Article', articleSchema);
export const Advertisement = mongoose.model<IAdvertisement>('Advertisement', advertisementSchema);
export const AdSettings = mongoose.model<IAdSettings>('AdSettings', adSettingsSchema);
export const AdPlan = mongoose.model<IAdPlan>('AdPlan', adPlanSchema);
export const Bookmark = mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
export const ReadHistory = mongoose.model<IReadHistory>('ReadHistory', readHistorySchema);
export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export const AppSettings = mongoose.model<IAppSettings>('AppSettings', appSettingsSchema);
export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
export const QuestionBank = mongoose.model<IQuestionBank>('QuestionBank', questionBankSchema);
export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema);
export const QuizParticipation = mongoose.model<IQuizParticipation>('QuizParticipation', quizParticipationSchema);
