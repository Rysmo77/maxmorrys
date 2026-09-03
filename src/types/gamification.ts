export interface GamificationProfile {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  badges: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'community' | 'achievement';
  requirement: number;
  requirementType: 'lessons' | 'days' | 'posts' | 'certificates' | 'formations';
}

export const BADGES: Badge[] = [
  { id: 'premier-pas', name: 'Premier pas', description: 'Complète ta première leçon', icon: '🎯', category: 'learning', requirement: 1, requirementType: 'lessons' },
  { id: 'studieux', name: 'Studieux', description: 'Complète 10 leçons', icon: '📚', category: 'learning', requirement: 10, requirementType: 'lessons' },
  { id: 'expert', name: 'Expert', description: 'Complète 50 leçons', icon: '🧠', category: 'learning', requirement: 50, requirementType: 'lessons' },
  { id: 'regulier', name: 'Régulier', description: 'Maintiens un streak de 7 jours', icon: '🔥', category: 'streak', requirement: 7, requirementType: 'days' },
  { id: 'machine', name: 'Machine', description: 'Maintiens un streak de 30 jours', icon: '⚡', category: 'streak', requirement: 30, requirementType: 'days' },
  { id: 'diplome', name: 'Diplômé', description: 'Obtiens ton premier certificat', icon: '🏆', category: 'achievement', requirement: 1, requirementType: 'certificates' },
  { id: 'multi-diplome', name: 'Multi-Diplômé', description: 'Obtiens 3 certificats', icon: '🎓', category: 'achievement', requirement: 3, requirementType: 'certificates' },
  { id: 'contributeur', name: 'Contributeur', description: 'Publie 10 posts dans le Club', icon: '💬', category: 'community', requirement: 10, requirementType: 'posts' },
  { id: 'ambassadeur', name: 'Ambassadeur', description: 'Parraine un nouveau membre du Club', icon: '🤝', category: 'community', requirement: 1, requirementType: 'posts' },
  { id: 'polyvalent', name: 'Polyvalent', description: 'Inscris-toi à 3 formations', icon: '🌟', category: 'achievement', requirement: 3, requirementType: 'formations' },
];

export const XP_REWARDS = {
  completeLesson: 10,
  completeModule: 50,
  completeFormation: 200,
  createNote: 5,
  dailyStreak: 5,
  firstClubPost: 15,
  clubPost: 5,
  clubComment: 2,
  submitTestimonial: 25,
} as const;

export function getLevelFromXP(xp: number): number {
  // Each level requires progressively more XP
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 2000) return 5;
  if (xp < 3500) return 6;
  if (xp < 5500) return 7;
  if (xp < 8000) return 8;
  if (xp < 12000) return 9;
  return 10;
}

export function getXPForNextLevel(level: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, Infinity];
  return thresholds[Math.min(level, thresholds.length - 1)];
}

export function getLevelTitle(level: number): string {
  const titles = [
    'Débutant', 'Apprenti', 'Étudiant', 'Praticien',
    'Confirmé', 'Expert', 'Maître', 'Virtuose',
    'Légende', 'Digitos Suprême',
  ];
  return titles[Math.min(level - 1, titles.length - 1)];
}

export interface BadgeStats {
  /** Leçons distinctes achevées, toutes formations confondues. */
  lessons: number;
  /** Série en cours, en jours. */
  streak: number;
  certificates: number;
  /** Formations auxquelles la personne est inscrite. */
  formations: number;
}

/** Ce que chaque `requirementType` va chercher dans le relevé. `posts` est traité à la source. */
const COMPTEUR: Record<string, (s: BadgeStats) => number> = {
  lessons: (s) => s.lessons,
  days: (s) => s.streak,
  certificates: (s) => s.certificates,
  formations: (s) => s.formations,
};

/**
 * Les badges dont les conditions sont remplies — partie PURE, testable sans Firestore.
 *
 * C'est elle qui porte la promesse « ajouter un badge au catalogue suffit à le rendre
 * attribuable » : elle ne connaît aucun identifiant, seulement `requirementType` et
 * `requirement`. Un badge dont le type n'a pas de compteur est simplement ignoré.
 */
export function badgesMerites(stats: BadgeStats): Badge[] {
  return BADGES.filter((badge) => {
    const compteur = COMPTEUR[badge.requirementType];
    return compteur !== undefined && compteur(stats) >= badge.requirement;
  });
}
