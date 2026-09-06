import type { DocSnapshot } from '@mm/firestore-rest';

import { HttpsError } from '@mm/shared';
import { type CallContext, requireAuth } from '../../context';
import { asText } from '../../lib/values';
import type { Reponse } from '../../vues/contrat';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * `appFormation` — LA FICHE, ET SON PROGRAMME.
 *
 * L'écran `formation.tsx` recevait un titre par la route et lisait TOUT LE RESTE dans le
 * contenu de démonstration : le sous-titre, le nombre de leçons, et les trois modules du
 * programme. En production, la démonstration est éteinte — la fiche que le catalogue ouvre
 * était donc vide, sur le chemin le plus fréquenté de l'application.
 *
 * ⚠️ ON NE SERT QUE CE QUI EST PUBLIÉ. `status == 'published'` est refait ici : le compte de
 * service ne connaît pas le filtre que `firestore.rules` applique à un visiteur, et un
 * brouillon de formation qui remonte est une promesse qu'on ne tient pas.
 *
 * ── AUCUN MONTANT NE SORT D'ICI, ET C'EST STRUCTUREL ────────────────────────────────────
 * `formations` porte un prix. Cette vue ne le lit pas. L'application ne vend rien (AD-11) —
 * son tunnel de paiement a été supprimé — et `tests/unit/mobile-store-achats.test.ts` refuse
 * qu'un écran nomme un montant. Ne pas faire descendre le champ est plus sûr que compter sur
 * les écrans pour ne pas l'afficher : ce qui n'arrive pas ne s'affiche pas par accident.
 *
 * ── LE MODULE D'OUVERTURE EST UN FAIT, PAS UNE CONVENTION ───────────────────────────────
 * Un module est « ouvert » s'il contient au moins une leçon `isFree`. On ne suppose pas que
 * c'est le premier : c'est l'administration qui décide de ce qui se regarde sans compte, et
 * un écran qui ouvrirait toujours le module 1 mentirait le jour où elle en ouvre un autre.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

interface Lecon {
  duration?: unknown;
  isFree?: unknown;
}

interface ModuleBrut {
  title?: unknown;
  lessons?: Lecon[];
}

/**
 * Minutes d'une durée écrite à la main : « 15min », « 15 min », « 1h08 », « 1 h 08 ».
 * Rend `null` sur toute forme qu'on ne sait pas lire — un total approché vaudrait moins que
 * pas de total du tout, parce qu'il se lirait comme une mesure.
 */
function enMinutes(brut: string | null): number | null {
  if (!brut) return null;
  const texte = brut.toLowerCase().replace(/\s+/g, '');
  const heures = /^(\d+)h(\d{1,2})?$/.exec(texte);
  if (heures) return Number(heures[1]) * 60 + Number(heures[2] ?? 0);
  const minutes = /^(\d+)(?:min|m)$/.exec(texte);
  if (minutes) return Number(minutes[1]);
  return null;
}

/** « 54 min », « 1 h 08 » — la forme du kit. */
function enClair(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

export async function appFormation(data: unknown, context: CallContext): Promise<Reponse<'appFormation'>> {
  requireAuth(context);
  const releveA = new Date().toISOString();

  const { slug } = (data ?? {}) as { slug?: string };
  if (!slug) throw new HttpsError('invalid-argument', 'slug est obligatoire.');

  const trouvees = await context.db.query({
    collection: 'formations',
    where: [
      { field: 'slug', op: '==', value: slug },
      { field: 'status', op: '==', value: 'published' },
    ],
    limit: 1,
  });
  const formation: DocSnapshot | undefined = trouvees[0];
  if (!formation) return { vue: null, releveA };

  const titre = asText(formation.data.title) ?? '';
  if (!titre) return { vue: null, releveA };

  const modulesBruts = Array.isArray(formation.data.modules)
    ? (formation.data.modules as ModuleBrut[])
    : [];

  let total = 0;
  const modules = modulesBruts.map((m, i) => {
    const lecons = Array.isArray(m.lessons) ? m.lessons : [];
    total += lecons.length;

    /* Le total d'un module n'existe QUE si toutes ses leçons se laissent lire. Une seule
       durée d'une forme inconnue, et le module n'annonce pas de temps — plutôt que
       d'annoncer un temps amputé de la leçon qu'on n'a pas su compter. */
    const minutes = lecons.map((l) => enMinutes(asText(l.duration) ?? null));
    const lisibles = minutes.every((v) => v !== null) && minutes.length > 0
      ? minutes.reduce((n: number, v) => n + (v ?? 0), 0)
      : null;

    return {
      titre: asText(m.title) ?? `Module ${i + 1}`,
      meta: [
        `module ${i + 1}`,
        lecons.length > 0 ? `${lecons.length} leçon${lecons.length > 1 ? 's' : ''}` : null,
        lisibles === null ? null : enClair(lisibles),
      ].filter(Boolean).join(' · '),
      ouvert: lecons.some((l) => l.isFree === true),
    };
  });

  return {
    vue: {
      titre,
      titreCourt: titre.split(/\s+(?:pour|—|:)\s+/)[0] ?? titre,
      meta: [
        asText(formation.data.category),
        modulesBruts.length > 0 ? `${modulesBruts.length} modules` : null,
        total > 0 ? `${total} leçons` : null,
        asText(formation.data.level),
      ].filter(Boolean).join(' · '),
      lecons: total,
      modules,
    },
    releveA,
  };
}
