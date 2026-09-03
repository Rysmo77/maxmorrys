import { describe, expect, it } from 'vitest';

import {
  EMETTEUR,
  allocateInvoiceNumber,
  buildInvoice,
  formatDateFacture,
  formatMontant,
  formatNumeroFacture,
} from '../src/lib/invoice';

/**
 * La facture est un document légal produit sans relecture humaine, à chaque paiement. Les
 * trois choses qui doivent tenir : le montant s'écrit comme le système le prescrit, le numéro
 * ne se réattribue jamais, et aucune mention n'est affirmée sans source.
 */

/**
 * L'insécable est écrite en ÉCHAPPEMENT, jamais en caractère littéral.
 *
 * Ces assertions ont d'abord échoué sur « expected '95,000 FCFA' to be '95,000 FCFA' » — deux
 * chaînes visuellement identiques, séparées par un U+00A0 contre un U+0020. Un test qui dépend
 * d'un caractère invisible n'est pas relisible : on ne voit ni l'erreur, ni sa correction.
 */
const NB = '\u00A0';

describe('formatMontant — la règle de séparateur du système', () => {
  it('écrit le millier avec une espace insécable en français', () => {
    expect(formatMontant(95000, 'XOF', 'fr')).toBe(`95${NB}000${NB}FCFA`);
    expect(formatMontant(19900, 'XOF', 'fr')).toBe(`19${NB}900${NB}FCFA`);
    expect(formatMontant(250000, 'XOF', 'fr')).toBe(`250${NB}000${NB}FCFA`);
  });

  it('écrit le millier avec une virgule en anglais', () => {
    expect(formatMontant(95000, 'XOF', 'en')).toBe(`95,000${NB}FCFA`);
    expect(formatMontant(1658, 'XOF', 'en')).toBe(`1,658${NB}FCFA`);
  });

  // L'espace doit être INSÉCABLE : un montant coupé en fin de ligne se lit comme deux.
  it("n'utilise jamais l'espace ordinaire comme séparateur", () => {
    expect(formatMontant(95000, 'XOF', 'fr')).not.toContain('95 000');
  });

  it('rend XOF en FCFA, et laisse les autres devises telles quelles', () => {
    expect(formatMontant(1000, 'XOF', 'fr')).toContain('FCFA');
    expect(formatMontant(1000, 'EUR', 'fr')).toContain('EUR');
  });

  it('tient les petits montants sans séparateur parasite', () => {
    expect(formatMontant(500, 'XOF', 'fr')).toBe(`500${NB}FCFA`);
    expect(formatMontant(0, 'XOF', 'fr')).toBe(`0${NB}FCFA`);
  });
});

describe('formatNumeroFacture — séquence par exercice', () => {
  it('préfixe l’émetteur, l’exercice, puis un rang sur six chiffres', () => {
    expect(formatNumeroFacture(2026, 1)).toBe('MO-2026-000001');
    expect(formatNumeroFacture(2026, 42)).toBe('MO-2026-000042');
    expect(formatNumeroFacture(2027, 1)).toBe('MO-2027-000001');
  });
});

describe('formatDateFacture', () => {
  it('écrit le mois en toutes lettres, dans la langue du destinataire', () => {
    expect(formatDateFacture('2026-08-31T10:00:00.000Z', 'fr')).toBe('31 août 2026');
    expect(formatDateFacture('2026-08-31T10:00:00.000Z', 'en')).toBe('August 31, 2026');
  });

  it('rend la chaîne telle quelle si elle n’est pas une date', () => {
    expect(formatDateFacture('pas-une-date', 'fr')).toBe('pas-une-date');
  });
});

describe('buildInvoice', () => {
  const txn = {
    amount: 95000,
    currency: 'XOF',
    designation: 'SEO local pour ton commerce',
    userEmail: 'aissatou@exemple.sn',
    userName: 'Aïssatou Thiam',
    chargeId: 'chg_abc123',
    paidAt: '2026-08-31T10:00:00.000Z',
  };

  it('porte le numéro dans le sujet et dans le corps', () => {
    const f = buildInvoice(txn, 'MO-2026-000007', 'fr');
    expect(f.subject).toContain('MO-2026-000007');
    expect(f.html).toContain('MO-2026-000007');
    expect(f.text).toContain('MO-2026-000007');
  });

  it('porte l’identité légale complète de l’émetteur', () => {
    const f = buildInvoice(txn, 'MO-2026-000007', 'fr');
    for (const champ of [EMETTEUR.raisonSociale, EMETTEUR.rccm, EMETTEUR.ninea, EMETTEUR.siege]) {
      expect(f.html).toContain(champ);
      expect(f.text).toContain(champ);
    }
  });

  it('rend toujours une version texte non vide', () => {
    const f = buildInvoice(txn, 'MO-2026-000007', 'fr');
    expect(f.text.trim().length).toBeGreaterThan(80);
  });

  /*
   * RÈGLE 6. Une ligne sans valeur ne s'affiche pas — elle n'affiche pas un tiret. Sur une
   * facture, une ligne absente est une question qu'on peut poser ; « Référence : — » est une
   * réponse fausse.
   */
  it('omet les lignes sans valeur au lieu d’afficher un tiret', () => {
    const f = buildInvoice({ amount: 19900, currency: 'XOF' }, 'MO-2026-000008', 'fr');
    // Les intitulés des lignes absentes ne sont pas rendus du tout.
    expect(f.html).not.toContain('Référence de paiement');
    expect(f.html).not.toContain('Client');
    // Et aucune cellule ne porte un tiret pour seule valeur. L'assertion vise la CELLULE,
    // pas le document : le tiret cadratin est légitime dans l'adresse du siège, qui vient
    // des mentions légales — « Lot 384 — Dakar, Sénégal ».
    expect(f.html).not.toMatch(/>\s*[—–-]\s*</);
    expect(f.text).toContain(`19${NB}900${NB}FCFA`);
  });

  /*
   * ── CE QUE LA FACTURE A LE DROIT D'AFFIRMER, RÉGIME PAR RÉGIME ──
   *
   * Ce test disait « n'affirme rien sur la TVA tant que la mention n'est pas fournie », et
   * sa raison était juste : le régime de MY ONOMA SARL n'était pas déductible du dépôt.
   *
   * Il l'est depuis le 03/09/2026 — la société est assujettie, l'enseignement est exonéré.
   * La règle change donc de forme sans changer de fond : on n'affirme toujours QUE ce qui a
   * été tranché, et on ne cite toujours AUCUN article. C'est la citation inventée qui avait
   * fait écrire « article 293 B », qui est du code français, sur une facture sénégalaise.
   */
  it('énonce l’exonération sur une prestation d’enseignement, sans citer d’article', () => {
    const f = buildInvoice(txn, 'MO-2026-000007', 'fr');
    expect(f.html).toContain('Exonéré de TVA');
    expect(f.text).toContain('Exonéré de TVA');
    // Aucun numéro d'article, d'aucun code, dans aucune des deux versions.
    expect(f.html).not.toMatch(/article\s*\d|293/i);
    expect(f.text).not.toMatch(/article\s*\d|293/i);
  });

  it('se tait complètement quand le régime n’est pas tranché', () => {
    const f = buildInvoice({ ...txn, famille: 'rysmo' }, 'MO-2026-000009', 'fr');
    expect(f.html).not.toMatch(/TVA|VAT|exonér/i);
    expect(f.text).not.toMatch(/TVA|VAT|exonér/i);
  });

  it('ventile la taxe sur une prestation d’agence, et le total reste le montant débité', () => {
    const f = buildInvoice(
      { amount: 295_000, currency: 'XOF', famille: 'agence' },
      'MO-2026-000010',
      'fr',
    );
    expect(f.text).toContain('TVA 18 %');
    expect(f.text).toContain(`250${NB}000${NB}FCFA`); // base hors taxes
    expect(f.text).toContain(`45${NB}000${NB}FCFA`); // taxe
    expect(f.text).toContain(`295${NB}000${NB}FCFA`); // total réglé = ce qui a été débité
  });

  it('laisse la mention fournie l’emporter sur la phrase par défaut', () => {
    const f = buildInvoice(txn, 'MO-2026-000011', 'fr', 'Régime XYZ selon avis du comptable.');
    expect(f.text).toContain('Régime XYZ selon avis du comptable.');
    expect(f.text).not.toContain('prestation d’enseignement');
  });

  it('porte la mention fiscale quand elle est fournie', () => {
    const f = buildInvoice(txn, 'MO-2026-000007', 'fr', 'TVA non applicable.');
    expect(f.html).toContain('TVA non applicable.');
    expect(f.text).toContain('TVA non applicable.');
  });

  it('bascule en anglais, séparateur compris', () => {
    const f = buildInvoice(txn, 'MO-2026-000007', 'en');
    expect(f.subject).toContain('Your invoice');
    expect(f.text).toContain(`95,000${NB}FCFA`);
    expect(f.text).toContain('August 31, 2026');
  });

  it('échappe le HTML des champs venant de la base', () => {
    const f = buildInvoice({ ...txn, userName: '<script>alert(1)</script>' }, 'MO-2026-000009', 'fr');
    expect(f.html).not.toContain('<script>');
    expect(f.html).toContain('&lt;script&gt;');
  });
});

/** Faux client Firestore : mémorise l'état et rejoue les écritures d'une transaction. */
function fakeDb(initial: Record<string, Record<string, unknown>> = {}) {
  const store: Record<string, Record<string, unknown>> = { ...initial };
  return {
    store,
    async runTransaction<T>(fn: (tx: {
      get: (path: string) => Promise<{ data: Record<string, unknown> } | null>;
      set: (path: string, data: Record<string, unknown>, options?: { merge?: boolean }) => void;
      update: (path: string, data: Record<string, unknown>) => void;
    }) => Promise<T>): Promise<T> {
      const writes: Array<() => void> = [];
      const tx = {
        get: async (path: string) => (store[path] ? { data: store[path] } : null),
        set: (path: string, data: Record<string, unknown>, options?: { merge?: boolean }) => {
          writes.push(() => {
            store[path] = options?.merge ? { ...store[path], ...data } : data;
          });
        },
        update: (path: string, data: Record<string, unknown>) => {
          writes.push(() => {
            store[path] = { ...store[path], ...data };
          });
        },
      };
      const out = await fn(tx);
      writes.forEach((w) => w());
      return out;
    },
  };
}

describe('allocateInvoiceNumber', () => {
  it('part à 1 quand l’exercice n’a pas encore de compteur', async () => {
    const db = fakeDb({ 'transactions/t1': { amount: 95000 } });
    expect(await allocateInvoiceNumber(db, 'transactions/t1', 2026)).toBe('MO-2026-000001');
    expect(db.store['_counters/invoices_2026'].next).toBe(2);
  });

  it('incrémente d’une transaction à l’autre', async () => {
    const db = fakeDb({ 'transactions/t1': {}, 'transactions/t2': {} });
    expect(await allocateInvoiceNumber(db, 'transactions/t1', 2026)).toBe('MO-2026-000001');
    expect(await allocateInvoiceNumber(db, 'transactions/t2', 2026)).toBe('MO-2026-000002');
  });

  /*
   * LE TEST QUI COMPTE. Bictorys relivre un webhook déjà traité. Sans relecture préalable,
   * une relivraison consommerait un rang et enverrait une SECONDE facture, sous un autre
   * numéro, pour le même paiement — deux pièces comptables pour une seule vente.
   */
  it('relit le numéro déjà attribué au lieu d’en tirer un nouveau', async () => {
    const db = fakeDb({ 'transactions/t1': {} });
    const premier = await allocateInvoiceNumber(db, 'transactions/t1', 2026);
    const second = await allocateInvoiceNumber(db, 'transactions/t1', 2026);
    expect(second).toBe(premier);
    // Le compteur n'a pas bougé : aucun rang consommé pour rien.
    expect(db.store['_counters/invoices_2026'].next).toBe(2);
  });

  it('écrit le numéro sur la transaction elle-même', async () => {
    const db = fakeDb({ 'transactions/t1': {} });
    const numero = await allocateInvoiceNumber(db, 'transactions/t1', 2026);
    expect(db.store['transactions/t1'].invoiceNumber).toBe(numero);
  });

  it('repart à 1 au changement d’exercice', async () => {
    const db = fakeDb({ 'transactions/a': {}, 'transactions/b': {} });
    await allocateInvoiceNumber(db, 'transactions/a', 2026);
    expect(await allocateInvoiceNumber(db, 'transactions/b', 2027)).toBe('MO-2027-000001');
  });
});
