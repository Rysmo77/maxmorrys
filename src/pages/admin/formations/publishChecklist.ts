import type { Module } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CHECKLIST *EST* LA DÉFINITION DE « PUBLIABLE ».
 *
 * C'est la décision que le kit énonce sur son écran `PublierFormation` : publier n'est pas un
 * interrupteur, c'est une liste de conditions vérifiables, et le bouton reste inactif tant
 * qu'une ligne est orange. « La liste n'est pas un conseil : c'est la condition. »
 *
 * ─── OÙ CETTE GARDE VIT, ET OÙ ELLE NE VIT PAS ─────────────────────────────────────────
 *
 * `firestore.rules` n'exige RIEN pour publier une formation :
 *
 *     match /formations/{formationId} {
 *       allow read: if resource.data.status == 'published' || isAdmin();
 *       allow create, update, delete: if isAdmin();
 *     }
 *
 * Un administrateur peut écrire `status: 'published'` sur un document vide. Aucune Cloud
 * Function ne réagit à l'écriture non plus — `notifications.ts` ne se déclenche que sur
 * `enrollments/` et `certificates/`. Cette checklist est donc une garde DE SAISIE, pas une
 * garde de sécurité : elle empêche la faute d'inattention, pas l'acte délibéré. Le dire est
 * la moitié du travail — un garde-fou dont on croit à tort qu'il tient côté serveur est pire
 * que pas de garde-fou du tout.
 *
 * ─── CE QUE LE DESSIN DU KIT DEMANDE ET QUE LE PRODUIT N'A PAS ─────────────────────────
 *
 * Le kit liste cinq conditions. Trois n'ont aucun répondant dans ce dépôt et ne sont donc PAS
 * recopiées ici — les inventer aurait produit une checklist qui coche des cases imaginaires :
 *
 *   • « Prix serveur aligné sur les CGV — 95 000 F dans les trois miroirs ». Il n'y a pas
 *     trois miroirs. `functions/src/payment.ts` relit le document Firestore pour le prix
 *     débité : la source est unique, il n'y a rien à aligner.
 *   • « Fiche traduite en anglais — générée puis mise en cache au pré-rendu ». La traduction
 *     est produite par le pré-rendu côté serveur ; la console ne peut pas savoir si une page
 *     a été rendue. Et `slug_en` est rempli automatiquement à l'enregistrement par
 *     `generateSlugEn()` : une condition qui se satisfait toute seule n'est pas une condition.
 *   • « Poids de la fiche — 1,4 Mo pour un budget de 900 Ko ». Aucun budget de poids n'est
 *     mesuré nulle part dans le produit. La ligne est un vœu, pas un contrôle.
 *
 * Une seule condition du kit survit telle quelle : « Modules et leçons complets ».
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

export type PublishConditionId = 'identity' | 'modules' | 'lessons' | 'price' | 'cover';

export interface PublishCondition {
  id: PublishConditionId;
  ok: boolean;
  /** Chiffres à injecter dans le libellé de la ligne. Toujours comptés, jamais estimés. */
  counts: { modules: number; lessons: number; emptyModules: number; emptyLessons: number };
}

export interface PublishChecklist {
  items: PublishCondition[];
  done: number;
  total: number;
  ready: boolean;
  /** Pourcentage de conditions remplies, pour la barre du kit. */
  percent: number;
  /** Le moment du calcul — la barre est une affirmation chiffrée, elle porte sa date. */
  asOf: Date;
}

/** Une leçon vide : ni texte, ni vidéo. Le lecteur ouvrirait une page blanche. */
function isEmptyLesson(l: { type: string; content: string; videoUrl?: string }): boolean {
  if (l.type === 'video') return !l.videoUrl?.trim() && !l.content.trim();
  return !l.content.trim();
}

export interface PublishInput {
  title: string;
  description: string;
  price: string;
  promoPrice: string;
  coverImage: string;
  modules: Module[];
}

export function buildPublishChecklist(form: PublishInput): PublishChecklist {
  const modules = form.modules.length;
  const lessons = form.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const emptyModules = form.modules.filter((m) => m.lessons.length === 0).length;
  const emptyLessons = form.modules.reduce(
    (acc, m) => acc + m.lessons.filter(isEmptyLesson).length,
    0,
  );
  const counts = { modules, lessons, emptyModules, emptyLessons };

  const price = Number(form.price) || 0;
  const promo = form.promoPrice.trim() === '' ? null : Number(form.promoPrice) || 0;

  const items: PublishCondition[] = [
    {
      // `handleSave` refuse déjà d'enregistrer sans les deux : la condition est réelle et dure.
      id: 'identity',
      ok: Boolean(form.title.trim() && form.description.trim()),
      counts,
    },
    {
      // `CoursePlayer` ouvre `modules[0].lessons[0]` : sans module, ou avec un module vide,
      // l'apprenant achète un lecteur qui n'a rien à lire.
      id: 'modules',
      ok: modules > 0 && emptyModules === 0,
      counts,
    },
    {
      // Une leçon sans contenu ni vidéo rend une page blanche dans le lecteur.
      id: 'lessons',
      ok: lessons > 0 && emptyLessons === 0,
      counts,
    },
    {
      // Un prix promo supérieur ou égal au prix n'est pas une promotion : `functions/src/
      // catalog.ts` le publie tel quel en `sale_price` dans le flux Meta, et `payment.ts`
      // débite `promoPrice ?? price`. Un promo à 0 rendrait la formation gratuite sans le dire.
      id: 'price',
      ok: promo === null ? true : promo > 0 && promo < price,
      counts,
    },
    {
      // Sans couverture, `catalog.ts` et `prerender.ts` retombent sur l'image par défaut du
      // site : la formation part au catalogue Meta et sur les réseaux avec un visuel générique.
      id: 'cover',
      ok: Boolean(form.coverImage.trim()),
      counts,
    },
  ];

  const done = items.filter((i) => i.ok).length;
  return {
    items,
    done,
    total: items.length,
    ready: done === items.length,
    percent: Math.round((done / items.length) * 100),
    asOf: new Date(),
  };
}
