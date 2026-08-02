export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'admin' | 'support';
  createdAt: string;
  preferences: UserPreferences;
  // Extended profile
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  bio?: string;
  onboardingCompleted?: boolean;
  // Réseaux sociaux (source de vérité, synchronisés vers le profil Club)
  city?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  // Parrainage
  referralCode?: string;
  referredByCode?: string;
  referralRewarded?: boolean;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  refereeName?: string;
  status: 'converted';
  createdAt: string;
}

export interface ClubMemberProfile {
  id: string; // = userId
  userId: string;
  displayName: string;
  photoURL?: string;
  headline?: string;
  skills: string[];
  city?: string;
  available: boolean;
  linkedin?: string;
  website?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  visible: boolean;
  updatedAt: string;
}

export interface ClubOpportunity {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  title: string;
  description: string;
  type: 'mission' | 'emploi' | 'partenariat' | 'autre';
  budget?: string;
  contact: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  lastMessage: string;
  lastMessageAt: string;
}

export interface DmMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface DmReport {
  id: string;
  convId: string;
  messageId: string;
  text: string;
  reporterId: string;
  reportedUserId: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  newsletter: boolean;
  aiMemoryConsent?: boolean;
}

export interface RysmoProfile {
  summary: string;
  topics: string[];
  level: string;
  weakSpots: string[];
  updatedAt: string;
}

export interface ContentEngagement {
  id?: string;
  type: 'article' | 'podcast' | 'video';
  slug: string;
  title: string;
  category: string;
  scrollPctMax: number;
  dwellSec: number;
  mediaSec: number;
  visits: number;
  lastAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  /** Slug anglais (URLs /en…). Optionnel : fallback sur `slug` si absent. */
  slug_en?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  featured: boolean;
  status: 'draft' | 'published' | 'scheduled';
  views?: number;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
}

export interface Formation {
  id: string;
  title: string;
  slug: string;
  /** Slug anglais (URLs /en…). Optionnel : fallback sur `slug` si absent. */
  slug_en?: string;
  description: string;
  longDescription: string;
  coverImage: string;
  level: 'debutant' | 'intermediaire' | 'avance';
  price: number;
  promoPrice?: number;
  duration: string;
  modules: Module[];
  category: string;
  tags: string[];
  students: number;
  rating: number;
  status: 'draft' | 'published';
  featured: boolean;
  certificateEnabled: boolean;
  publishedAt?: string;
  updatedAt?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'resource' | 'mission';
  duration: string;
  content: string;
  videoUrl?: string;
  resources?: Resource[];
  order: number;
  isFree: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'template' | 'link' | 'file';
  url: string;
  size?: string;
}

export interface Podcast {
  id: string;
  title: string;
  slug: string;
  /** Slug anglais (URLs /en…). Optionnel : fallback sur `slug` si absent. */
  slug_en?: string;
  description: string;
  audioUrl: string;
  coverImage: string;
  duration: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  status: 'published' | 'draft';
  transcript?: string;
  popularity?: number;
  spotifyEpisodeId?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  /** Slug anglais (URLs /en…). Optionnel : fallback sur `slug` si absent. */
  slug_en?: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  status: 'published' | 'draft';
  views: number;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface Appointment {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  subject: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar: string;
  rating: number;
  /** @deprecated remplacé par mediaUrl + mediaType */
  videoUrl?: string;
  mediaType?: 'text' | 'audio' | 'video';
  mediaUrl?: string;
  targetType?: 'platform' | 'mentor' | 'formation' | 'podcast' | 'video';
  targetId?: string;
  targetLabel?: string;
  featured: boolean;
  userId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  source: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  formationId: string;
  enrolledAt: string;
  progress: number;
  completedLessons: string[];
  certificateIssued: boolean;
  certificateUrl?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  sentAt: string;
  status: 'new' | 'read' | 'replied';
  userId?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  active: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  formationId: string;
  formationSlug?: string;
  formationTitle?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  couponId?: string;
  couponCode?: string;
  userEmail?: string;
  userName?: string;
  transactionRef?: string;
  chargeId?: string;
  opToken?: string;
  metaEventId?: string;
}

export interface SiteStats {
  totalStudents: number;
  totalCourses: number;
  completionRate: number;
  trafficGrowth: string;
  revenue: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'promo' | 'update';
  active: boolean;
  startDate: string;
  endDate: string;
  link?: string;
}

export interface Certificate {
  id: string;
  userId: string;
  formationId: string;
  formationTitle: string;
  issuedAt: string;
  certificateCode: string;
}

// ── Club des Digitos ──────────────────────────────────────────────────────────

export interface ClubDigitosSubscription {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  amount: number;
}

export type ClubPostCategory =
  | 'general'
  | 'question'
  | 'ressource'
  | 'temoignage'
  | 'opportunite'
  | 'discussion';

export interface ClubDigitosPost {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: string;
  likes: string[];
  reposts: string[];
  commentsCount: number;
  type: 'post' | 'discussion';
  category: ClubPostCategory;
  title?: string;
  mood?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video';
  poll?: { options: string[] };
  pollVotes?: Record<string, number>;
  isAdmin?: boolean;
  sharedFrom?: string;
}

export interface ClubDigitosComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface ClubDigitosChallenge {
  id: string;
  title: string;
  description: string;
  reward?: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt?: string;
}

export interface ClubDigitosEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  type: 'online' | 'physical';
  link?: string;
  imageUrl?: string;
  status: 'upcoming' | 'past';
  createdAt: string;
}

export interface ClubDigitosSession {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  link?: string;
  imageUrl?: string;
  status: 'upcoming' | 'past';
  duration?: string;
  createdAt: string;
}

export interface ClubDigitosInfo {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  type: 'article' | 'resource' | 'announcement';
  link?: string;
  likes: string[];
}

export interface ClubEventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  registeredAt: string;
}

export interface ClubSessionRegistration {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  registeredAt: string;
}

// ── Rysmo (AI tutor) — monétisation ──────────────────────────────────────

export type RysmoPlan = 'lite' | 'pro';
export type RysmoPack = 'discovery' | 'regular' | 'intensive';

export interface RysmoSubscription {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  plan: RysmoPlan;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startedAt: string;
  expiresAt: string;
  amount: number;
  chargeId?: string;
}

export interface RysmoPackPurchase {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  pack: RysmoPack;
  requestsTotal: number;
  purchasedAt: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  chargeId?: string;
}

export interface RysmoQuotaSnapshot {
  dailyLimit: number;
  dayCount: number;
  dayRemaining: number;
  packBalance: number;
  plan: RysmoPlan | null;
  hasActiveSubscription: boolean;
  hasClubBonus: boolean;
}

// ── Notifications ──────────────────────────────────────────────────────────

export type NotificationType = 'enrollment' | 'certificate' | 'content' | 'club' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
