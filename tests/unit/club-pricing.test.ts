/**
 * Garde-fou du prix du Club des Digitos.
 *
 * Les CGV ont annoncé 10 000 FCFA/an pendant que le code en débitait 19 900 : deux valeurs
 * introduites par deux commits distincts, sans point de contact, sur un abonnement engageant
 * douze mois. Ce test existe pour que cela ne puisse plus arriver silencieusement.
 *
 * ⚠️ Le texte des CGV est volontairement resté LITTÉRAL plutôt qu'interpolé : faire dériver
 * une clause contractuelle d'une constante ferait qu'un changement de code altère un engagement
 * juridique sans que personne ne le relise. La cohérence est donc vérifiée ici, pas imposée
 * par le rendu.
 *
 * ⚠️ CE FICHIER DÉCLARAIT LES MIROIRS SERVEUR HORS DE PORTÉE. C'était vrai à l'IMPORT — les
 * projets TypeScript du dépôt ne s'importent pas entre eux — et faux tout court : rien
 * n'empêche de relire leur SOURCE, ce que `tax-sync.test.ts` fait depuis longtemps. Le dernier
 * bloc de ce fichier le fait désormais aussi, et c'est ce qui manquait le jour où le prix a
 * divergé.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import {
  CLUB_MEMBER_FORMATION_DISCOUNT,
  CLUB_PRICE_XOF,
  CLUB_REFERRAL_DISCOUNT,
  clubReferralPrice,
} from '../../src/lib/club/pricing';

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

const legal = { fr: read('src/i18n/locales/fr/legal.json'), en: read('src/i18n/locales/en/legal.json') };
const club = { fr: read('src/i18n/locales/fr/club.json'), en: read('src/i18n/locales/en/club.json') };

/**
 * Ramène tous les séparateurs de milliers à une espace simple.
 *
 * `toLocaleString('fr-FR')` produit une espace FINE INSÉCABLE (U+202F) là où le texte des CGV
 * porte une espace ordinaire (U+0020). Les deux se ressemblent à l'écran et diffèrent en
 * mémoire : sans normalisation, l'assertion échouerait sur une différence invisible.
 */
const normalize = (s: string) => s.replace(/[\u202f\u00a0\u2009\u2007]/g, ' ');

/** « 19 900 » en français, « 19,900 » en anglais — le séparateur diffère. */
const formatted = (lang: 'fr' | 'en') =>
  normalize(CLUB_PRICE_XOF.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US'));

describe('prix du Club — constante', () => {
  it('vaut 19 900 XOF', () => {
    expect(CLUB_PRICE_XOF).toBe(19900);
  });

  it('applique une remise de parrainage de 15 %', () => {
    expect(CLUB_REFERRAL_DISCOUNT).toBe(0.15);
  });

  it('donne 16 915 au filleul, avec le même arrondi que le serveur', () => {
    expect(clubReferralPrice()).toBe(Math.round(19900 * 0.85));
    expect(clubReferralPrice()).toBe(16915);
  });
});

/**
 * ── LES MIROIRS SERVEUR SONT ATTEIGNABLES, CONTRAIREMENT À CE QUI ÉTAIT ÉCRIT ──────────
 *
 * L'en-tête de ce fichier déclarait les constantes serveur hors de portée « parce que les
 * projets TypeScript ne s'importent pas entre eux ». C'est vrai à l'IMPORT, et faux tout
 * court : `tax-sync.test.ts` lit son miroir EN TEXTE depuis 2026 et compare. Rien n'empêchait
 * d'en faire autant ici — et c'est exactement l'écart qui a laissé les CGV annoncer 10 000
 * pendant que le code débitait 19 900.
 *
 * ⚠️ `functions/src/payment.ts` ne figure plus dans la liste : `functions/` a été supprimé le
 * 03/09/2026. Le Worker porte seul les montants côté serveur.
 */
describe('miroir serveur — le Worker débite ce que le client annonce', () => {
  const MIROIR = 'worker/apps/api/src/lib/bictorys.ts';

  /** Le code, commentaires retirés : ils citent des montants en toutes lettres. */
  const code = readFileSync(MIROIR, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  const constante = (nom: string): number => {
    const m = code.match(new RegExp(`const\\s+${nom}\\s*=\\s*([0-9.]+)`));
    if (!m) throw new Error(`${nom} introuvable dans ${MIROIR}`);
    return Number(m[1]);
  };

  it('porte le même prix annuel', () => {
    expect(constante('CLUB_PRICE')).toBe(CLUB_PRICE_XOF);
  });

  it('porte la même remise de parrainage', () => {
    expect(constante('REFERRAL_DISCOUNT')).toBe(CLUB_REFERRAL_DISCOUNT);
  });

  /*
   * La remise membre est ANNONCÉE côté client et DÉBITÉE côté serveur. Un écart entre les
   * deux ne serait visible que de la personne qui vient de payer — la définition même du
   * défaut que ce fichier existe pour empêcher.
   */
  it('porte la même remise membre sur les formations', () => {
    expect(constante('CLUB_MEMBER_FORMATION_DISCOUNT')).toBe(CLUB_MEMBER_FORMATION_DISCOUNT);
  });
});

describe('CGV — le contrat annonce le prix réellement débité', () => {
  for (const lang of ['fr', 'en'] as const) {
    it(`article 3.4 (${lang}) porte le montant de la constante`, () => {
      const item4 = normalize(legal[lang].cgv.art3.item4 as string);
      expect(item4).toContain(formatted(lang));
    });

    it(`article 3.4 (${lang}) ne contient plus l'ancien montant de 10 000`, () => {
      const item4 = normalize(legal[lang].cgv.art3.item4 as string);
      expect(item4).not.toMatch(/10[ ,]000/);
    });
  }
});

/** Toutes les chaînes d'un objet, à plat, avec leur chemin. */
function flatten(node: unknown, path = ''): [string, string][] {
  if (typeof node === 'string') return [[path, node]];
  if (node && typeof node === 'object') {
    return Object.entries(node as Record<string, unknown>)
      .flatMap(([k, v]) => flatten(v, path ? `${path}.${k}` : k));
  }
  return [];
}

describe("interface — le prix n'est jamais recopié", () => {
  /*
   * LE BALAYAGE REMPLACE LA LISTE DE TROIS CLÉS.
   *
   * Le test nommait `tagline`, `activateSubtitle` et `joinCta`. Deux défauts en découlaient :
   * une clé nouvelle qui recopiait un montant n'était couverte par rien, et la suppression
   * d'une clé de la liste faisait échouer le test sur `undefined` plutôt que sur un vrai
   * constat — ce qui vient d'arriver à `activateSubtitle`, retirée parce qu'elle promettait
   * un « renouvellement automatique » que `worker/apps/api/src/lib/renewal.ts` contredit.
   *
   * Le mur d'abonnement est maintenant balayé en entier : c'est l'écran où l'on clique pour
   * payer, aucune de ses chaînes n'a le droit de porter un montant en dur.
   */
  for (const lang of ['fr', 'en'] as const) {
    for (const [key, value] of flatten(club[lang].subscriptionGate)) {
      it(`subscriptionGate.${key} (${lang}) n'écrit jamais un montant`, () => {

        /*
         * LA RÈGLE EST « JAMAIS DE MONTANT EN DUR », PAS « TOUJOURS {{price}} ».
         *
         * Ce test exigeait `toContain('{{price}}')` sur les trois clés. Il a commencé à
         * échouer quand `joinCta` est devenu « Rejoindre le Club » — un libellé qui ne
         * mentionne plus de prix DU TOUT. C'est le cas le plus sûr des trois : il n'y a rien
         * à désynchroniser. L'ancienne formulation le comptait pourtant comme une violation,
         * c'est-à-dire qu'elle punissait la seule chaîne qui ne pouvait pas mentir.
         *
         * L'assertion dit maintenant ce que le commentaire d'origine disait déjà : un montant
         * en dur rendrait l'interpolation décorative. Une clé qui interpole doit interpoler
         * la vraie valeur ; une clé qui ne parle pas d'argent n'a rien à prouver.
         */
        // Un montant groupé écrit en dur : « 19 900 », « 16,915 ». Toujours interdit.
        expect(value).not.toMatch(/\d[\d  ,]{3,}/);

        /*
         * Un nombre COLLÉ À UNE DEVISE doit interpoler la vraie valeur, sinon l'interpolation
         * est décorative et les deux chiffres divergent au premier changement de prix.
         *
         * La condition portait sur « contient un chiffre », ce qui était juste tant que le
         * test ne regardait que trois clés de prix. Balayé sur tout le mur d'abonnement, ce
         * prédicat compte comme des prix « un e-mail 15 jours avant », « +3 requêtes par
         * jour » ou « 5 questions » — des nombres qui ne sont pas des montants et n'ont rien
         * à synchroniser.
         */
        const sansInterpolation = value.replace(/\{\{[^}]*\}\}/g, '');
        if (/\d[\d  ,.]*\s*(FCFA|XOF|F\b)/i.test(sansInterpolation)) {
          expect(value).toContain('{{price}}');
        }
      });
    }
  }
});

describe('aucun montant du Club en dur dans le code client', () => {
  const sources = [
    'src/pages/Formations.tsx',
    'src/pages/Blog.tsx',
    /*
     * `Videos.tsx` et `Podcasts.tsx` ont fusionné en un seul pôle média, à l'URL que le kit
     * nomme (`/podcast-et-videos`). Les deux anciens fichiers ont disparu, et ce test lisait
     * encore leurs chemins : `readFileSync` échouait, ce qui se lisait « le prix est écrit en
     * dur » alors que le fichier n'existait plus. Un test qui échoue pour la mauvaise raison
     * ne protège plus rien.
     */
    'src/pages/MediaPole.tsx',
    'src/pages/lms/tabs/club/ClubSubscriptionGate.tsx',
    'src/pages/admin/hooks/useAdminClub.ts',
    'src/lib/firestore/club.ts',
  ];

  for (const file of sources) {
    it(`${file} dérive le prix au lieu de l'écrire`, () => {
      const code = readFileSync(file, 'utf8');
      // Ni « 19900 », ni « 19 900 » : la seule source admise est lib/club/pricing.
      expect(code).not.toMatch(/19[  ]?900/);
    });
  }
});
