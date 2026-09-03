import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * L'AIGUILLAGE DES CALLABLES — ET LE RELAIS QUI NE MÈNE PLUS NULLE PART.
 *
 * Le Worker `maxmorrys-api` réimplémente le protocole `onCall`. Son aiguillage tient
 * en une ligne (`apps/api/src/index.ts`) :
 *
 *     const handler = migratedNames(env).has(name) ? HANDLERS[name] : undefined;
 *     if (!handler) return proxyToFunctions(name, ...);
 *
 * Un handler ne suffit donc PAS : tant que son nom n'est pas aussi dans la variable
 * `MIGRATED`, l'appel part en relais vers `FUNCTIONS_ORIGIN`. Cette échappatoire avait
 * un sens pendant la migration — retirer un nom de la liste ramenait une callable sur
 * GCP en quinze secondes. Elle n'en a plus : **tout est sur Cloudflare, et plus aucune
 * Cloud Function n'est déployée sur `max-morrys`** (le source en déclare 47, le projet
 * n'en sert zéro).
 *
 * Ce que ça change, et c'est tout le sujet de ce fichier : le relais ne rattrape plus
 * rien, il AVALE. Un nom oublié dans `MIGRATED` ne tombe pas en erreur franche — il
 * reçoit la page HTML « 404 Page not found » de Google, là où le SDK Firebase attend
 * une réponse JSON. Côté client, ça se lit comme une panne de réseau.
 *
 * Ce n'est pas une hypothèse. `createClubCharge` a vécu exactement ça : implémenté,
 * enregistré, absent de la liste — et pendant ce temps personne ne pouvait s'abonner
 * au Club. Le correctif qui l'avait manqué nommait pourtant le défaut dans son propre
 * commentaire (« aucun abonnement Club ne pouvait être payé »).
 *
 * Les trois portes ci-dessous rendent ce silence impossible.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const API = join(RACINE, 'worker/apps/api');

const sansCommentaires = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Les noms que le Worker sait servir lui-même. */
function handlers(): string[] {
  const bloc = /HANDLERS[^=]*=\s*\{([\s\S]*?)\n\}/.exec(readFileSync(join(API, 'src/registry.ts'), 'utf8'));
  if (!bloc) throw new Error('registry.ts : bloc HANDLERS introuvable');
  return [...bloc[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*[,:]/gm)].map((m) => m[1]);
}

/** Les listes `MIGRATED` du fichier de configuration — il y en a DEUX. */
function listesMigrated(): string[][] {
  const cfg = sansCommentaires(readFileSync(join(API, 'wrangler.jsonc'), 'utf8'));
  return [...cfg.matchAll(/"MIGRATED"\s*:\s*"([^"]*)"/g)]
    .map((m) => m[1].split(',').map((n) => n.trim()).filter(Boolean));
}

/** Les callables que le frontend appelle réellement. */
function appeleesParLeFront(): string[] {
  const noms = new Set<string>();
  const parcourir = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (/\.(ts|tsx)$/.test(e)) {
        for (const m of readFileSync(p, 'utf8').matchAll(/functions,\s*'([A-Za-z0-9_]+)'/g)) {
          noms.add(m[1]);
        }
      }
    }
  };
  parcourir(join(RACINE, 'src'));
  // `connectFunctionsEmulator(functions, 'localhost', 5001)` a la même forme sans être
  // une callable. C'est la seule exception, et elle est nommée plutôt que filtrée large.
  noms.delete('localhost');
  return [...noms];
}

/**
 * `bictorysWebhook` est servi AVANT le registre (`index.ts:67`) : c'est un webhook de
 * banque, pas une callable, et il n'a donc pas d'entrée dans `HANDLERS`. Sa présence
 * dans `MIGRATED` est ce qui l'active — elle est voulue.
 */
const SERVIS_HORS_REGISTRE = ['bictorysWebhook'];

/**
 * DEUX BOUTONS D'ADMINISTRATION SONT MORTS, et ce test le dit au lieu de le taire.
 *
 * `importSpotifyEpisodesManual` et `syncMediaStatsManual` n'existent que dans
 * `functions/src/` — donc nulle part, puisque plus rien n'est déployé sur GCP. Le
 * Worker n'a pas de handler pour eux. Les boutons correspondants de l'admin (import
 * d'épisodes Spotify, synchronisation des statistiques média) partent dans le relais
 * mort et échouent.
 *
 * Ils sont listés ici pour que la porte passe au vert SANS que le défaut disparaisse
 * de la vue : c'est une dette nommée, pas un cas ignoré. Les retirer de cette liste
 * est le geste qui accompagne leur portage vers le Worker.
 */
const DETTE_NON_PORTEE = ['importSpotifyEpisodesManual', 'syncMediaStatsManual'];

describe("aiguillage des callables du Worker api", () => {
  it('tout handler implémenté est aussi déclaré dans MIGRATED', () => {
    // La porte qui manquait le jour où le paiement du Club est tombé.
    const declares = new Set(listesMigrated().flat());
    const orphelins = handlers().filter((h) => !declares.has(h));
    expect(orphelins, 'implémentés mais relayés vers le vide').toEqual([]);
  });

  it('les deux listes MIGRATED sont identiques', () => {
    // Le fichier en porte une pour la production et une pour l'environnement nommé.
    // N'en corriger qu'une laisse le défaut en embuscade dans l'autre.
    const [production, nomme] = listesMigrated();
    expect(nomme).toBeDefined();
    expect([...production].sort()).toEqual([...nomme].sort());
  });

  it('aucun nom déclaré ne pointe dans le vide', () => {
    const connus = new Set([...handlers(), ...SERVIS_HORS_REGISTRE]);
    const fantomes = listesMigrated().flat().filter((n) => !connus.has(n));
    expect([...new Set(fantomes)], 'déclarés sans implémentation').toEqual([]);
  });

  it('toute callable appelée par le frontend est servie par le Worker', () => {
    const servis = new Set([...handlers(), ...SERVIS_HORS_REGISTRE, ...DETTE_NON_PORTEE]);
    const perdues = appeleesParLeFront().filter((n) => !servis.has(n));
    expect(perdues, 'appelées par le front, servies par personne').toEqual([]);
  });

  it('la dette nommée reste exacte — ni oubliée, ni périmée', () => {
    // Si un de ces deux noms gagne un handler, il doit sortir de la liste : une dette
    // qu'on a remboursée sans le dire redevient un cas ignoré.
    const implementes = new Set(handlers());
    const remboursees = DETTE_NON_PORTEE.filter((n) => implementes.has(n));
    expect(remboursees, 'portées au Worker mais toujours listées comme dette').toEqual([]);

    const front = new Set(appeleesParLeFront());
    const inutiles = DETTE_NON_PORTEE.filter((n) => !front.has(n));
    expect(inutiles, 'listées comme dette alors que plus personne ne les appelle').toEqual([]);
  });
});
