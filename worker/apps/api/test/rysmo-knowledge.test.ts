import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CLUB_PRICE, RYSMO_PACKS, RYSMO_SUBSCRIPTIONS } from '../src/lib/bictorys';
import {
  ACOMPTE_PACK,
  CLUB_LIVES_PAR_MOIS,
  connaissancesPlateforme,
  PACKS_COMMERCES_HT,
  PLATFORM_KNOWLEDGE,
  PLATFORM_KNOWLEDGE_APP,
  TVA_AGENCE,
} from '../src/lib/rysmo-knowledge';

/**
 * La base de connaissance de Rysmo a promis une « garantie 7 jours » et du coaching qui
 * n'existent pas (CGV art. 6 : aucun retour d'argent une fois l'accès activé). Un chatbot qui
 * promet ce qu'on ne vend pas fabrique des litiges : ce fichier en garde la porte.
 */

const RACINE = resolve(__dirname, '../../../..');
const lire = (chemin: string) => readFileSync(resolve(RACINE, chemin), 'utf8');

const INTERDITS: [string, RegExp][] = [
  ['garantie', /garanti/i],
  ['remboursement', /rembours/i],
  ['14 jours', /14\s*jours/i],
  ['coaching', /coaching/i],
  ['consulting', /consulting/i],
  ['sans risque', /sans\s+risque/i],
  ['/agence', /\/agence/i],
  ['presence-digitale', /presence-digitale/i],
];

const BASES = { site: PLATFORM_KNOWLEDGE, application: PLATFORM_KNOWLEDGE_APP };
const SOURCE = lire('worker/apps/api/src/lib/rysmo-knowledge.ts');

describe('la base de connaissance de Rysmo', () => {
  for (const [canal, base] of Object.entries(BASES)) {
    for (const [mot, motif] of INTERDITS) {
      it(`${canal} : ne contient pas « ${mot} »`, () => {
        expect(base).not.toMatch(motif);
      });
    }
  }

  it('le fichier source non plus, commentaires compris', () => {
    // L'en-tête décrit la règle sans citer les mots : qui recopie un ancien libellé le voit ici.
    for (const [, motif] of INTERDITS) expect(SOURCE).not.toMatch(motif);
  });

  it('chaque canal reçoit sa base', () => {
    expect(connaissancesPlateforme('web')).toBe(PLATFORM_KNOWLEDGE);
    expect(connaissancesPlateforme('app')).toBe(PLATFORM_KNOWLEDGE_APP);
  });

  it("l'application ne reçoit aucun prix ni mot d'achat", () => {
    expect(PLATFORM_KNOWLEDGE_APP).not.toMatch(/FCFA|\d\s?000|\bHT\b|achat|acheter|payer|paiement|abonnement|offre|gratuit/i);
  });

  it('dit que les formations ne sont pas ouvertes, et parle des trois moyens de paiement', () => {
    expect(PLATFORM_KNOWLEDGE).toMatch(/formations ne sont pas encore ouvertes/);
    expect(PLATFORM_KNOWLEDGE).toMatch(/Wave, Orange Money ou carte/);
    expect(PLATFORM_KNOWLEDGE).toMatch(/Jamais de prélèvement automatique/);
  });

  it('annonce les prix que le Worker débite', () => {
    const fcfa = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
    expect(PLATFORM_KNOWLEDGE).toContain(`${fcfa(CLUB_PRICE)} par an`);
    for (const p of Object.values(RYSMO_PACKS)) expect(PLATFORM_KNOWLEDGE).toContain(fcfa(p.price));
    for (const s of Object.values(RYSMO_SUBSCRIPTIONS)) expect(PLATFORM_KNOWLEDGE).toContain(`${fcfa(s.price)} par mois`);
    for (const p of Object.values(PACKS_COMMERCES_HT)) expect(PLATFORM_KNOWLEDGE).toContain(`${fcfa(p.prixHT)} HT`);
    expect(PLATFORM_KNOWLEDGE).toContain('2 questions offertes par jour (5 pour un membre du Club)');
  });
});

describe('les miroirs recopiés hors du Worker', () => {
  it('packs Commerces et TPE = `PACKS` de src/lib/presence/offer.ts (prix facturé, promo comprise)', () => {
    const offer = lire('src/lib/presence/offer.ts');
    for (const [cle, { prixHT }] of Object.entries(PACKS_COMMERCES_HT)) {
      const ligne = offer.match(new RegExp(`\\{ key: '${cle}',[^}]*\\}`));
      expect(ligne, `pack ${cle} introuvable`).not.toBeNull();
      const promo = ligne![0].match(/promoPrice: ([\d_]+)/);
      const prix = ligne![0].match(/[{ ]price: ([\d_]+)/);
      const facture = Number((promo ?? prix)![1].replace(/_/g, ''));
      expect(prixHT).toBe(facture);
    }
    expect(offer).toMatch(new RegExp(`DEPOSIT_RATE = ${ACOMPTE_PACK}\\b`));
  });

  it('TVA = `TVA_TAUX_NORMAL` de src/lib/tax/senegal.ts', () => {
    expect(lire('src/lib/tax/senegal.ts')).toMatch(new RegExp(`TVA_TAUX_NORMAL = ${TVA_AGENCE}\\b`));
  });

  it('sessions en direct = `LIVE_SESSIONS_PER_MONTH` de src/lib/club/pricing.ts', () => {
    expect(lire('src/lib/club/pricing.ts')).toMatch(
      new RegExp(`LIVE_SESSIONS_PER_MONTH = ${CLUB_LIVES_PAR_MOIS}\\b`),
    );
  });
});
