import { QueryClient } from '@tanstack/react-query';

/**
 * Client TanStack Query partagé.
 *
 * Objectif : réduire les lectures Firestore en mettant en cache/dédoublonnant les
 * requêtes. Les défauts sont volontairement « économes » pour un site de contenu :
 * on ne refetch pas au moindre focus de fenêtre, et les données restent « fresh »
 * assez longtemps pour qu'une navigation aller-retour ne relise pas Firestore.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min : pas de relecture Firestore avant expiration
      gcTime: 30 * 60 * 1000, // 30 min en cache mémoire après la dernière utilisation
      refetchOnWindowFocus: false, // évite les relectures à chaque retour d'onglet
      retry: 1,
    },
  },
});

/** Clés de cache centralisées pour éviter les collisions et faciliter l'invalidation. */
export const queryKeys = {
  blogPosts: ['blog', 'published'] as const,
  publishedFormations: ['formations', 'published'] as const,
  publishedVideos: ['videos', 'published'] as const,
  publishedPodcasts: ['podcasts', 'published'] as const,
  // Clé distincte : la page d'accueil ne demande que 5 articles, là où la page
  // blog en demande 50. Même clé = une des deux vues serait tronquée.
  homeRecentPosts: ['blog', 'recent', 5] as const,
  featuredTestimonials: ['testimonials', 'featured'] as const,
  allUsers: ['users', 'all'] as const,
  allFormations: ['formations', 'all'] as const,
  studentData: (userId: string) => ['student', userId] as const,
};
