import type { Module } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CHECKLIST DÉCRIT « PUBLIABLE ». ELLE NE LE DÉCIDE PLUS.
 *
 * ⚠️ RENVERSEMENT ASSUMÉ, ET RÉCENT. Le kit énonçait l'inverse sur son écran
 * `PublierFormation` — « publier n'est pas un interrupteur, c'est une liste de conditions
 * vérifiables », « la liste n'est pas un conseil : c'est la condition » — et les boutons
 * restaient inactifs tant qu'une ligne était orange. Ce verrou a été RETIRÉ sur décision
 * explicite : la console publie désormais quoi qu'il manque, et la liste informe.
 *
 * Ne pas le « rétablir » en croyant réparer un oubli. Si la question se rouvre, elle se
 * tranche avec la personne qui possède le produit, pas dans ce fichier.
 *
 * ─── CE QUI RESTE, ET QUI N'A JAMAIS ÉTÉ ICI ───────────────────────────────────────────
 *
 * `firestore.rules` n'a jamais rien exigé pour publier une formation :
 *
 *     match /formations/{formationId} {
 *       allow read: if resource.data.status == 'published' || isAdmin();
 *       allow create, update, delete: if isAdmin();
 *     }
 *
 * Un administrateur pouvait déjà écrire `status: 'published'` sur un document vide, et aucun
 * déclencheur ne réagit à l'écriture. Cette checklist n'a donc JAMAIS été une garde de
 * sécurité — seulement une garde de saisie, qu'on vient de convertir en avertissement.
 *
 * Les gardes réelles sont ailleurs et tiennent quoi qu'on publie :
 *   · `resolveCheckoutTotal` (`worker/apps/api/src/lib/checkout.ts`) refuse le devis ET le
 *     débit d'une formation non publiée, ou en « bientôt » sans précommande ;
 *   · `isFreeFormation` (`firestore.rules`) refuse l'auto-inscription à un brouillon comme
 *     à une formation à venir.
 *
 * Ce que la publication d'une fiche incomplète coûte vraiment, faute de verrou : sans
 * couverture elle part au flux Meta avec le visuel générique du site ; ouverte sans leçon,
 * elle vend un lecteur qui n'a rien à lire. C'est ce que l'avertissement du pied de modale
 * nomme, ligne par ligne.
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
 *
 * ─── IL Y A DÉSORMAIS DEUX DÉFINITIONS DE « PUBLIABLE » ────────────────────────────────
 *
 * Publier en « Coming Soon », c'est mettre en ligne une formation qui n'est PAS écrite : sa
 * fiche montre son tarif et le titre de ses modules, et rien d'autre. Lui appliquer la liste
 * d'ouverture serait absurde — elle exige des leçons pleines, c'est-à-dire exactement ce
 * qu'on n'a pas encore. La condition `lessons` disparaît donc, et `modules` s'assouplit : un
 * module sans leçon n'est plus un défaut, c'est la forme normale d'une annonce.
 *
 * Ce qui reste exigé l'est pour une raison qui tient AVANT l'ouverture : un titre et une
 * description (la fiche doit dire quoi), une couverture (elle part sur les réseaux et dans
 * les flux produit), un prix cohérent (il est affiché, et il engage). C'est une liste plus
 * courte, pas une liste molle.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * L'intention de publication. Ce n'est pas le `status` du document : les deux étapes écrivent
 * `status: 'published'`, et se distinguent par le drapeau `comingSoon`.
 */
export type PublishStage = 'live' | 'comingSoon';

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

export function buildPublishChecklist(
  form: PublishInput,
  stage: PublishStage = 'live',
): PublishChecklist {
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
      //
      // En « Coming Soon », personne n'ouvre le lecteur — le tunnel d'achat est fermé et le
      // curriculum est masqué à la lecture. Un module vide y est donc légitime : c'est le
      // sommaire annoncé d'un contenu à écrire. Seule sa PRÉSENCE reste exigée, parce que la
      // fiche promet « voilà le programme » et doit avoir quelque chose à montrer.
      id: 'modules',
      ok: stage === 'comingSoon' ? modules > 0 : modules > 0 && emptyModules === 0,
      counts,
    },
    ...(stage === 'comingSoon' ? [] : [{
      // Une leçon sans contenu ni vidéo rend une page blanche dans le lecteur.
      id: 'lessons' as const,
      ok: lessons > 0 && emptyLessons === 0,
      counts,
    }]),
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
