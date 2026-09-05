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

/**
 * Les callables que l'application NATIVE appelle.
 *
 * ⚠️ « PAR SA PORTE UNIQUE » ÉTAIT UNE HYPOTHÈSE, PAS UN FAIT. Cette fonction ne lisait que
 * `mobile/donnees/`, sans récursion — au motif que tout appel passe par la porte des
 * données. Or `mobile/app/suppression.tsx` appelle `appeler('deleteUserAccount', …)` en
 * direct, depuis l'écran. Le nom est bien dans `MIGRATED`, donc rien ne casse aujourd'hui ;
 * mais la garde censée attraper le nom oublié ne regardait pas cet appel-là, ni aucun futur
 * appel direct. Une garde qui ne couvre pas tout le territoire garde une carte, pas le
 * terrain.
 *
 * Les deux dossiers sont désormais parcourus, en profondeur.
 */
function appeleesParLeNatif(): string[] {
  const noms = new Set<string>();
  const parcourir = (dir: string) => {
    for (const e of readdirSync(dir)) {
      const chemin = join(dir, e);
      if (statSync(chemin).isDirectory()) {
        parcourir(chemin);
        continue;
      }
      if (!/\.tsx?$/.test(e)) continue;
      const code = readFileSync(chemin, 'utf8');
      for (const m of code.matchAll(/(?:appeler|useVue)<[^>]*>?\(\s*'([A-Za-z0-9_]+)'/g)) {
        noms.add(m[1]);
      }
      for (const m of code.matchAll(/(?:appeler|useVue)\(\s*'([A-Za-z0-9_]+)'/g)) {
        noms.add(m[1]);
      }
    }
  };
  parcourir(join(RACINE, 'mobile/donnees'));
  parcourir(join(RACINE, 'mobile/app'));
  return [...noms];
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
 * LA DETTE EST REMBOURSÉE — et cette liste vide est ce qui le prouve.
 *
 * `importSpotifyEpisodesManual` et `syncMediaStatsManual` ont vécu ici : ils n'existaient
 * que dans `functions/src/`, donc nulle part, et les boutons d'import Spotify et de
 * synchronisation des statistiques partaient dans le relais mort. Ils sont maintenant
 * servis par le Worker (`lib/media-sync.ts`), avec leurs deux crons quotidiens.
 *
 * La liste reste, vide, plutôt que d'être supprimée : elle est le point d'entrée nommé
 * pour la prochaine callable qu'on saurait cassée sans pouvoir la porter tout de suite.
 * Y inscrire un nom est un aveu daté, pas une exemption silencieuse.
 */
const DETTE_NON_PORTEE: string[] = [];

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

  it("toute callable appelée par l'application native est servie par le Worker", () => {
    /*
     * LE MÊME DÉFAUT, MAIS PIRE SUR UN TÉLÉPHONE. Un nom absent de `MIGRATED` part au relais
     * mort et reçoit la page HTML 404 de Google. Sur le web, la console montre le corps ; sur
     * un téléphone, il n'y a pas de console — ça se présente comme une panne de réseau, et
     * quelqu'un ira vérifier son forfait avant de soupçonner une liste de configuration.
     */
    const servis = new Set([...handlers(), ...SERVIS_HORS_REGISTRE]);
    const perdues = appeleesParLeNatif().filter((n) => !servis.has(n));
    expect(perdues, 'appelées par le natif, servies par personne').toEqual([]);
  });

  it('toute callable appelée par le frontend est servie par le Worker', () => {
    const servis = new Set([...handlers(), ...SERVIS_HORS_REGISTRE, ...DETTE_NON_PORTEE]);
    const perdues = appeleesParLeFront().filter((n) => !servis.has(n));
    expect(perdues, 'appelées par le front, servies par personne').toEqual([]);
  });

  it('tout cron déclaré a une branche qui le traite', () => {
    /*
     * Le même silence, un cran plus loin. Workers n'appelle qu'un `scheduled` pour tous
     * les crons : c'est `event.cron` qui dit lequel a sonné. Une expression ajoutée à
     * `triggers.crons` sans branche correspondante ne lève rien — elle ne fait RIEN,
     * chaque nuit, sans que personne ne s'en aperçoive. Exactement la forme du défaut
     * qui a coûté le paiement du Club, transposée à l'horloge.
     */
    const cfg = sansCommentaires(readFileSync(join(API, 'wrangler.jsonc'), 'utf8'));
    const crons = [...(/"crons"\s*:\s*\[([^\]]*)\]/.exec(cfg)?.[1] ?? '')
      .matchAll(/'([^']*)'|"([^"]*)"/g)]
      .map((m) => m[1] ?? m[2])
      .filter(Boolean);
    expect(crons.length, 'aucun cron déclaré — la lecture de la config a échoué').toBeGreaterThan(0);

    const index = readFileSync(join(API, 'src/index.ts'), 'utf8');
    const sansBranche = crons.filter((cron) => !index.includes(`'${cron}'`));
    expect(sansBranche, 'déclarés mais jamais traités').toEqual([]);
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
