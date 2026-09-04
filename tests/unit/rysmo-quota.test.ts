/**
 * Garde-fou du quota annoncé avant paiement.
 *
 * La page publique du Club vend « 5 questions par jour au lieu de 2 » à quelqu'un qui n'a pas
 * encore de compte, donc à partir de constantes client — le quota réel exige une session. Si
 * le serveur change et que la page ne suit pas, l'écart n'est visible que par la personne qui
 * vient de payer.
 *
 * Ce test lit les miroirs serveur comme du texte : les projets TypeScript du dépôt ne peuvent
 * pas s'importer entre eux, mais rien n'empêche de relire leur source. C'est ce que
 * `club-pricing.test.ts` déclarait hors de portée, et qui ne l'est qu'à l'import.
 *
 * ── CE QUI N'ÉTAIT PAS COUVERT, ET QUI L'EST DEPUIS ────────────────────────────────────
 *
 * Ce fichier ne tenait QUE le quota gratuit et le bonus du Club. Tout le reste de la grille
 * — les plafonds des plans payants, leurs prix, ceux des packs, et le LIBELLÉ qui atterrit
 * sur la facture — n'était tenu par rien. On pouvait donc abaisser le plafond de Pro côté
 * serveur, et l'écran de vente aurait continué d'en annoncer cent : exactement le défaut que
 * l'en-tête ci-dessus décrit, sur les seuls nombres que quelqu'un paie.
 *
 * Le libellé mérite sa propre mention. `RYSMO_SUBSCRIPTIONS[plan].label` devient
 * `formationTitle` sur la transaction, que `transaction-mail.ts` imprime en désignation de la
 * FACTURE. Un plafond changé sans lui n'est pas une incohérence d'affichage : c'est une
 * mention fausse sur une pièce comptable, chez le client, dans sa comptabilité.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import { RYSMO_BASE_DAILY, RYSMO_CLUB_BONUS, RYSMO_CLUB_DAILY } from '../../src/lib/rysmo/quota';

/**
 * Le code, commentaires retirés.
 *
 * ⚠️ CE NETTOYAGE N'EST PAS COSMÉTIQUE. Les commentaires de ces fichiers CITENT des plafonds
 * et des prix en toutes lettres — « un plan qui en promet 100 », « à partir de 500 XOF ». Les
 * lire comme du code ferait passer des tests sur des phrases. Même parade que `tax-sync`.
 */
function code(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

/** Extrait `const NOM = <entier>` d'un fichier TypeScript, `export` ou non. */
function constant(path: string, name: string): number {
  const source = readFileSync(path, 'utf8');
  const match = source.match(new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*(\\d+)`));
  if (!match) throw new Error(`${name} introuvable dans ${path}`);
  return Number(match[1]);
}

/** Le corps d'un littéral nommé — objet `{…}` ou tableau `[…]`, quelle que soit sa mise en forme. */
function litteral(path: string, name: string, ouvrant: '{' | '['): string {
  const fermant = ouvrant === '{' ? '\\}' : '\\]';
  const bloc = code(path).match(
    new RegExp(`${name}[^=]*=\\s*\\${ouvrant}([\\s\\S]*?)\\n${fermant};`),
  );
  if (!bloc) throw new Error(`littéral ${name} introuvable dans ${path}`);
  return bloc[1];
}

/** `{ cle: <entier> }` → `{ cle: entier }`. */
function objetEntiers(path: string, name: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [, cle, valeur] of litteral(path, name, '{').matchAll(/(\w+):\s*(\d+)/g)) {
    out[cle] = Number(valeur);
  }
  if (Object.keys(out).length === 0) throw new Error(`aucune entrée lue dans ${name} (${path})`);
  return out;
}

/** `{ cle: { champ: <entier>, … } }` → `{ cle: entier }`. */
function objetImbrique(path: string, name: string, champ: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [, cle, corps] of litteral(path, name, '{').matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
    const valeur = corps.match(new RegExp(`${champ}:\\s*(\\d+)`));
    if (valeur) out[cle] = Number(valeur[1]);
  }
  if (Object.keys(out).length === 0) throw new Error(`aucun ${champ} lu dans ${name} (${path})`);
  return out;
}

/** `[{ id: '<cle>', champ: <entier>, … }]` → `{ cle: entier }`. */
function tableauParId(path: string, name: string, champ: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [, corps] of litteral(path, name, '[').matchAll(/\{([^}]*)\}/g)) {
    const id = corps.match(/id:\s*'([^']+)'/);
    const valeur = corps.match(new RegExp(`${champ}:\\s*(\\d+)`));
    if (id && valeur) out[id[1]] = Number(valeur[1]);
  }
  if (Object.keys(out).length === 0) throw new Error(`aucun ${champ} lu dans ${name} (${path})`);
  return out;
}

/** Le premier entier de chaque `label`, par clé. C'est le nombre imprimé sur la facture. */
function entiersDesLibelles(path: string, name: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [, cle, corps] of litteral(path, name, '{').matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
    const nombre = corps.match(/label:\s*'[^']*?(\d+)/);
    if (nombre) out[cle] = Number(nombre[1]);
  }
  if (Object.keys(out).length === 0) throw new Error(`aucun libellé chiffré lu dans ${name}`);
  return out;
}

/*
 * `functions/src/rysmo.ts` était le second miroir serveur. `functions/` a été supprimé le
 * 03/09/2026 : aucune Cloud Function n'était plus déployée. Le Worker porte désormais seul
 * les constantes serveur, et c'est lui qu'il faut tenir aligné sur le client.
 */
const MIRRORS = [
  'worker/apps/api/src/lib/rysmo-quota.ts',
];

const QUOTA_SERVEUR = 'worker/apps/api/src/lib/rysmo-quota.ts';
const TARIF_SERVEUR = 'worker/apps/api/src/lib/bictorys.ts';
const BOUTIQUE = 'src/pages/lms/tabs/RysmoStoreTab.tsx';

describe('quota du répétiteur — constantes client', () => {
  it('annonce 2 questions par jour hors abonnement', () => {
    expect(RYSMO_BASE_DAILY).toBe(2);
  });

  it('annonce 5 par jour pour un membre du Club, bonus compris', () => {
    expect(RYSMO_CLUB_DAILY).toBe(RYSMO_BASE_DAILY + RYSMO_CLUB_BONUS);
    expect(RYSMO_CLUB_DAILY).toBe(5);
  });
});

describe.each(MIRRORS)('miroir serveur — %s', (path) => {
  it('porte le même quota de base que le client', () => {
    expect(constant(path, 'BASE_DAILY_QUOTA')).toBe(RYSMO_BASE_DAILY);
  });

  it('porte le même bonus de Club que le client', () => {
    expect(constant(path, 'CLUB_BONUS_QUOTA')).toBe(RYSMO_CLUB_BONUS);
  });
});

describe('la grille payante — l’écran de vente et le serveur disent la même chose', () => {
  it('annonce les plafonds que le serveur applique', () => {
    expect(tableauParId(BOUTIQUE, 'PLANS', 'perDay')).toEqual(
      objetEntiers(QUOTA_SERVEUR, 'SUBSCRIPTION_QUOTAS'),
    );
  });

  it('annonce les prix que le serveur débite, pour les abonnements', () => {
    expect(tableauParId(BOUTIQUE, 'PLANS', 'price')).toEqual(
      objetImbrique(TARIF_SERVEUR, 'RYSMO_SUBSCRIPTIONS', 'price'),
    );
  });

  it('annonce les prix que le serveur débite, pour les packs', () => {
    expect(tableauParId(BOUTIQUE, 'PACKS', 'price')).toEqual(
      objetImbrique(TARIF_SERVEUR, 'RYSMO_PACKS', 'price'),
    );
  });

  it('annonce le nombre de requêtes que le serveur crédite', () => {
    expect(tableauParId(BOUTIQUE, 'PACKS', 'requests')).toEqual(
      objetImbrique(TARIF_SERVEUR, 'RYSMO_PACKS', 'requests'),
    );
  });

  /*
   * ⚠️ LA PORTE QUI ATTRAPE UNE FACTURE QUI MENT. Ce libellé devient `formationTitle` sur la
   * transaction, puis la DÉSIGNATION de la facture. « Rysmo+ Pro — 100 requêtes/jour » sur une
   * facture, quand le serveur en sert 60, est une mention fausse dans une pièce que le client
   * produit à son propre comptable.
   */
  it('le libellé facturé porte le plafond réellement servi', () => {
    expect(entiersDesLibelles(TARIF_SERVEUR, 'RYSMO_SUBSCRIPTIONS')).toEqual(
      objetEntiers(QUOTA_SERVEUR, 'SUBSCRIPTION_QUOTAS'),
    );
  });

  it('le libellé des packs porte le nombre de requêtes réellement crédité', () => {
    expect(entiersDesLibelles(TARIF_SERVEUR, 'RYSMO_PACKS')).toEqual(
      objetImbrique(TARIF_SERVEUR, 'RYSMO_PACKS', 'requests'),
    );
  });
});

describe('la table gelée des quotas hérités', () => {
  /*
   * Elle DÉCRIT ce qui a été vendu ; elle ne se dérive pas du tarif du jour. Si quelqu'un
   * remplaçait un jour son contenu par celui de `SUBSCRIPTION_QUOTAS`, le grand-père
   * disparaîtrait sans qu'aucun autre test ne tombe.
   */
  it('porte les valeurs vendues jusqu’ici', () => {
    expect(objetEntiers(QUOTA_SERVEUR, 'QUOTAS_HERITES')).toEqual({ lite: 20, pro: 100 });
  });
});

describe('aucun plafond n’est écrit en dur dans une chaîne traduite', () => {
  /*
   * `rysmoStore.plans.*.feature1` annonçait « 100 requêtes/jour » dans les deux langues, et
   * n'était lue par AUCUN composant : l'écran rend `<Num value={plan.perDay}>` depuis la
   * donnée. Trois chaînes mortes qui énoncent un tarif sont trois pièges pour qui les
   * recâblera un jour — elles ont été supprimées, et ce test empêche qu'elles reviennent.
   */
  it.each(['fr', 'en'])('%s/lmsTabs.json ne chiffre aucun quota', (langue) => {
    const source = readFileSync(`src/i18n/locales/${langue}/lmsTabs.json`, 'utf8');
    expect(source).not.toMatch(/\d+\s*(requêtes\/jour|requests\/day)/);
  });
});
