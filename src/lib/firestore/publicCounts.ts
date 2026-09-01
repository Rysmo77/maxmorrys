import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../../config/db';

/**
 * LES SEULS CHIFFRES QUE LA PAGE D'ACCUEIL A LE DROIT D'AFFICHER.  (AD-5, règle 6)
 *
 * Ce module existe parce que l'accueil et l'écran de connexion affichaient quatre nombres
 * ÉCRITS EN DUR — +340 % de croissance de trafic, 50+ étudiants formés, 94 % de taux de
 * réussite, 10+ cours créés — pendant que la base de production comptait 5 comptes, 0
 * formation publiée, 0 certificat émis et 0 franc encaissé.
 *
 * Trois d'entre eux sont dans la liste des INTERDITS ABSOLUS du design system : nombre
 * d'élèves, taux de réussite, et tout ce qui ressemble à de la preuve sociale. Le quatrième
 * n'avait aucune source. Aucun n'était vrai.
 *
 * Ce qui les remplace n'est pas « rien » : c'est ce qui est réellement démontrable. Au relevé
 * du 30 août 2026, la ligne éditoriale est le SEUL actif qui fonctionne — et c'est
 * précisément le haut de l'entonnoir. Il n'y a donc rien à cacher : il y a un chiffre vrai
 * à mettre à la place de quatre faux.
 *
 * `getCountFromServer` compte côté serveur : il ne télécharge pas les documents, donc il
 * coûte une lecture au lieu de quarante-six. Sur un marché où le forfait est compté, la
 * différence n'est pas théorique.
 */
export interface PublicCounts {
  /** Articles réellement publiés — pas les brouillons. */
  publishedArticles: number;
  publishedPodcasts: number;
  publishedVideos: number;
  /** Formations visibles par un visiteur. Au 30/08/2026 : zéro, et ça s'affiche. */
  publishedFormations: number;
  /** L'instant du relevé. Tout nombre affiché porte sa date (règle 6). */
  asOf: Date;
}

async function countPublished(name: string): Promise<number> {
  const snap = await getCountFromServer(query(collection(db, name), where('published', '==', true)));
  return snap.data().count;
}

/**
 * Un échec de comptage rend `null`, jamais zéro.
 *
 * La distinction porte du sens ici et nulle part ailleurs : « 0 formation publiée » est une
 * information vraie et volontairement affichée ; « je n'ai pas pu compter » en est une autre.
 * Les confondre afficherait un zéro faux — exactement le défaut que ce module corrige.
 */
export async function getPublicCounts(): Promise<PublicCounts | null> {
  try {
    const [publishedArticles, publishedPodcasts, publishedVideos, publishedFormations] = await Promise.all([
      countPublished('blog'),
      countPublished('podcasts'),
      countPublished('videos'),
      countPublished('formations'),
    ]);
    return { publishedArticles, publishedPodcasts, publishedVideos, publishedFormations, asOf: new Date() };
  } catch (error: unknown) {
    console.error('getPublicCounts', error);
    return null;
  }
}
