import type { Firestore } from '@mm/firestore-rest';
import { asText, toNumber } from './values';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE CLASSEMENT DU CLUB — porté depuis `functions/src/leaderboard.ts`.
 *
 * ⚠️ L'ÉCRAN ÉTAIT VIVANT, LA DONNÉE MORTE. `ClubLeaderboard` est monté dans l'onglet Club et
 * lit l'agrégat `leaderboard/global`. Cet agrégat n'était écrit que par un `onSchedule` de
 * Cloud Functions : depuis le plan Spark, il ne se reconstruit plus. Les membres voyaient donc
 * soit un classement figé à août 2026, soit un état vide permanent — dans les deux cas sans
 * que rien n'explique pourquoi.
 *
 * ⚠️ POURQUOI UN AGRÉGAT PLUTÔT QU'UNE LECTURE DIRECTE. Les règles interdisent à un membre de
 * lire la gamification d'un autre, et c'est très bien ainsi. Le compte de service dénormalise
 * donc le haut du classement dans un document unique, lisible par les connectés, en n'y
 * recopiant que ce qui doit être public : nom d'affichage, avatar, XP, niveau, rang. Les
 * documents individuels restent privés.
 *
 * ⚠️ RECONSTRUCTION COMPLÈTE, PAS INCRÉMENTALE. Le classement est court (20 entrées) et le
 * cron quotidien : recalculer tout coûte 21 lectures et supprime toute dérive possible entre
 * l'agrégat et la source. Une mise à jour incrémentale coûterait plus cher en complexité
 * qu'elle ne rapporterait.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const TOP_N = 20;

export interface EntreeClassement {
  userId: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  rank: number;
}

/** Repli de nom : jamais l'adresse complète, seulement ce qui précède l'arobase. */
function nomAffichable(profil: Record<string, unknown> | undefined, langue: 'fr' | 'en' = 'fr'): string {
  const nom = asText(profil?.displayName);
  if (nom) return nom;
  const email = asText(profil?.email);
  if (email) return email.split('@')[0];
  return langue === 'en' ? 'Member' : 'Membre';
}

export async function rebuildLeaderboard(db: Firestore): Promise<number> {
  const meilleurs = await db.query({
    collection: 'gamification',
    orderBy: [{ field: 'xp', direction: 'desc' }],
    limit: TOP_N,
  });

  const entries: EntreeClassement[] = [];
  let rang = 1;
  for (const doc of meilleurs) {
    const profil = await db.get(`users/${doc.id}`);
    entries.push({
      userId: doc.id,
      displayName: nomAffichable(profil?.data),
      photoURL: asText(profil?.data.photoURL) ?? '',
      xp: toNumber(doc.data.xp),
      level: Math.max(1, toNumber(doc.data.level)),
      rank: rang,
    });
    rang += 1;
  }

  /*
    Le compte de membres actifs vit dans le MÊME document public, parce que
    `club_subscriptions` n'est lisible que par l'administration. Il n'alimente aucune surface
    publique : c'est une information interne au Club, et les interdits du système sur les
    chiffres de preuve sociale continuent de s'appliquer partout ailleurs.
  */
  let activeMembers = entries.length;
  try {
    activeMembers = await db.count({
      collection: 'club_subscriptions',
      where: [{ field: 'status', op: '==', value: 'active' }],
    });
  } catch {
    // Compte indisponible : on garde le repli plutôt que d'écrire un zéro trompeur.
  }

  await db.set('leaderboard/global', {
    entries,
    activeMembers,
    updatedAt: new Date().toISOString(),
  });

  return entries.length;
}
