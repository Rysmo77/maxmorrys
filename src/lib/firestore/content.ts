import { where, orderBy, limit, startAfter } from 'firebase/firestore';
import { getCollection, createDoc, setDocById, deleteDocById, updateDocById } from './helpers';
import type { Podcast, Video, Appointment, FAQ, Testimonial } from '../../types';

// ── Podcasts ──────────────────────────────────────────────────────────────────

export async function getAllPodcasts(): Promise<Podcast[]> {
  return getCollection<Podcast>('podcasts', orderBy('publishedAt', 'desc'));
}

export async function getPublishedPodcasts(): Promise<Podcast[]> {
  return getCollection<Podcast>(
    'podcasts',
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
  );
}

export async function getPublishedPodcastsPaginated(
  pageSize = 12,
  lastPublishedAt?: string,
): Promise<{ podcasts: Podcast[]; hasMore: boolean }> {
  const constraints = [
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    ...(lastPublishedAt ? [startAfter(lastPublishedAt)] : []),
    limit(pageSize + 1),
  ];
  const data = await getCollection<Podcast>('podcasts', ...constraints);
  const hasMore = data.length > pageSize;
  return { podcasts: data.slice(0, pageSize), hasMore };
}

export async function getPodcastBySlug(slug: string, lang: 'fr' | 'en' = 'fr'): Promise<Podcast | null> {
  if (lang === 'en') {
    // `status` doit figurer dans la requête : les règles n'autorisent la lecture
    // anonyme que des documents publiés, et un filtre absent fait échouer le `list`
    // entier en PERMISSION_DENIED — pas seulement les brouillons.
    const byEn = await getCollection<Podcast>('podcasts', where('slug_en', '==', slug), where('status', '==', 'published'), limit(1));
    if (byEn[0]) return byEn[0];
  }
  const results = await getCollection<Podcast>('podcasts', where('slug', '==', slug), where('status', '==', 'published'));
  return results[0] ?? null;
}

export async function savePodcast(data: Omit<Podcast, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('podcasts', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('podcasts', rest as Parameters<typeof createDoc>[1]);
}

export async function deletePodcast(id: string): Promise<void> {
  return deleteDocById('podcasts', id);
}

// ── Videos ───────────────────────────────────────────────────────────────────

export async function getAllVideos(): Promise<Video[]> {
  return getCollection<Video>('videos', orderBy('publishedAt', 'desc'));
}

export async function getPublishedVideos(): Promise<Video[]> {
  return getCollection<Video>(
    'videos',
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
  );
}

export async function getPublishedVideosPaginated(
  pageSize = 12,
  lastPublishedAt?: string,
): Promise<{ videos: Video[]; hasMore: boolean }> {
  const constraints = [
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    ...(lastPublishedAt ? [startAfter(lastPublishedAt)] : []),
    limit(pageSize + 1),
  ];
  const data = await getCollection<Video>('videos', ...constraints);
  const hasMore = data.length > pageSize;
  return { videos: data.slice(0, pageSize), hasMore };
}

export async function getVideoBySlug(slug: string, lang: 'fr' | 'en' = 'fr'): Promise<Video | null> {
  if (lang === 'en') {
    // `status` doit figurer dans la requête : les règles n'autorisent la lecture
    // anonyme que des documents publiés, et un filtre absent fait échouer le `list`
    // entier en PERMISSION_DENIED — pas seulement les brouillons.
    const byEn = await getCollection<Video>('videos', where('slug_en', '==', slug), where('status', '==', 'published'), limit(1));
    if (byEn[0]) return byEn[0];
  }
  const results = await getCollection<Video>('videos', where('slug', '==', slug), where('status', '==', 'published'));
  return results[0] ?? null;
}

export async function saveVideo(data: Omit<Video, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('videos', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('videos', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteVideo(id: string): Promise<void> {
  return deleteDocById('videos', id);
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

export async function getAllFAQ(): Promise<FAQ[]> {
  return getCollection<FAQ>('faq', orderBy('order', 'asc'));
}

export async function saveFAQItem(data: Omit<FAQ, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('faq', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('faq', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteFAQItem(id: string): Promise<void> {
  return deleteDocById('faq', id);
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function getAllAppointments(): Promise<Appointment[]> {
  return getCollection<Appointment>('appointments', orderBy('date', 'desc'));
}

export async function saveAppointment(data: Omit<Appointment, 'id' | 'status' | 'createdAt'>): Promise<string> {
  return createDoc('appointments', {
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  } as Parameters<typeof createDoc>[1]);
}

export async function updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
  return updateDocById('appointments', id, { status });
}

// ── Testimonials ──────────────────────────────────────────────────────────────

export async function getAllTestimonials(): Promise<Testimonial[]> {
  return getCollection<Testimonial>('testimonials', orderBy('featured', 'desc'));
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  return getCollection<Testimonial>('testimonials', where('featured', '==', true));
}

export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  return getCollection<Testimonial>('testimonials', where('status', '==', 'approved'));
}

export async function saveTestimonial(data: Omit<Testimonial, 'id'> & { id?: string }): Promise<string> {
  const { id, ...rest } = data;
  if (id) {
    await setDocById('testimonials', id, rest as Parameters<typeof setDocById>[2]);
    return id;
  }
  return createDoc('testimonials', rest as Parameters<typeof createDoc>[1]);
}

export async function deleteTestimonial(id: string): Promise<void> {
  return deleteDocById('testimonials', id);
}

export async function getMyTestimonials(userId: string): Promise<Testimonial[]> {
  const results = await getCollection<Testimonial>('testimonials', where('userId', '==', userId));
  return results.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function submitTestimonial(data: {
  userId: string;
  name: string;
  avatar: string;
  role: string;
  content: string;
  rating: number;
  mediaType?: 'text' | 'audio' | 'video';
  mediaUrl?: string;
  targetType?: 'platform' | 'mentor' | 'formation' | 'podcast' | 'video';
  targetId?: string;
  targetLabel?: string;
}): Promise<string> {
  const { mediaUrl, targetId, ...rest } = data;
  return createDoc('testimonials', {
    ...rest,
    mediaType: data.mediaType ?? 'text',
    ...(mediaUrl ? { mediaUrl } : {}),
    targetType: data.targetType ?? 'platform',
    ...(targetId ? { targetId } : {}),
    company: '',
    featured: false,
    status: 'pending',
    createdAt: new Date().toISOString(),
  } as Parameters<typeof createDoc>[1]);
}

export async function deleteMyTestimonial(id: string): Promise<void> {
  return deleteDocById('testimonials', id);
}
