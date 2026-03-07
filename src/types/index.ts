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
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
  newsletter: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: number;
  featured: boolean;
  status: 'draft' | 'published' | 'scheduled';
}

export interface Formation {
  id: string;
  title: string;
  slug: string;
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
  description: string;
  audioUrl: string;
  coverImage: string;
  duration: string;
  publishedAt: string;
  category: string;
  status: 'published' | 'draft';
  transcript?: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  category: string;
  status: 'published' | 'draft';
  views: number;
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
  videoUrl?: string;
  featured: boolean;
  userId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
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
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  couponId?: string;
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
