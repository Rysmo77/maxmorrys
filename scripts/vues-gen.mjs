#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════════════════
 * `vues:gen` / `vues:check` — UNE SOURCE, DEUX CONSOMMATEURS GÉNÉRÉS, UNE PORTE.
 *
 * ⭐ LA DÉPENDANCE EST INVERSÉE, ET C'EST TOUT LE SUJET.
 *
 * Le plan initial disait « un contrat PRODUIT DEPUIS le serveur ». Ça ne peut pas marcher
 * ici, et il y a deux preuves :
 *
 *   1 · IL N'Y A RIEN À LIRE. Les 17 handlers `app*` étaient typés `Promise<unknown>` et
 *       construisent leur littéral en ligne, avec des ternaires, des `filter(Boolean)
 *       .join(' · ')` et des IIFE. Un générateur devrait INTERPRÉTER du code, pas le lire.
 *
 *   2 · UNE PORTE FONDÉE SUR UN MOTIF TEXTUEL A DÉJÀ MENTI DANS CE DÉPÔT EXACT. La première
 *       version de `worker-vues-natives.test.ts` cherchait `abonnementActif(` — motif que la
 *       DÉCLARATION de la fonction satisfait elle-même. Le test passait au vert sur un
 *       fichier dont le contrôle avait été retiré ; vérifié en le retirant pour de bon.
 *       Cette porte-là gardait le contenu payant.
 *
 * Donc : le contrat est écrit à la main, et le SERVEUR en est le premier consommateur. Les
 * 17 handlers annoncent `Promise<Reponse<'appMoi'>>`, et c'est le compilateur TypeScript —
 * pas une expression régulière — qui les tient.
 *
 * DEUX PORTES, UNE COMMANDE :
 *   · la RÉGÉNÉRATION : on relance les émetteurs dans un dossier temporaire et on diffère
 *     avec le commité. Une retouche à la main du Kotlin ou du TypeScript rougit. C'est le
 *     motif exact de `og:cards --check`, et l'histoire du dépôt dit que c'est la forme de
 *     porte qui mord : celle qui compare deux artefacts, jamais celle qui affirme.
 *   · les ROUTES : l'ensemble des callables du contrat doit ÉGALER l'ensemble des clés
 *     `app*` de `HANDLERS`, et chacune doit figurer dans LES DEUX listes `MIGRATED`. Elle
 *     referme l'angle mort que `worker-routage-callables.test.ts` déclare ouvert.
 *
 * ⚠️ `npm run vues:check --routes` NE PASSE PAS LE DRAPEAU. npm avale les options placées
 * après le nom du script (il faut `npm run vues:check -- --routes`). Les deux portes
 * tournent donc TOUJOURS ensemble : une porte qu'il faut penser à invoquer est une porte
 * qui ne tourne pas.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { emettreTs } from './vues-emit-ts.mjs';
import { emettreKotlin } from './vues-emit-kotlin.mjs';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTRAT = 'worker/apps/api/src/vues/vues.contrat.json';
const CIBLES = {
  ts: 'worker/apps/api/src/vues/contrat.ts',
  /* ⚠️ `src/main/java`, PAS `src/main/kotlin`. Le jeu de sources Gradle du projet est
     `java/` (le socle du lot 1 y met déjà `ds/`), et ouvrir un second répertoire de sources
     demanderait de toucher `app/build.gradle.kts` pour rien. */
  kotlin: 'android/app/src/main/java/me/maxmorrys/rysmo/donnees/Vues.kt',
};

const SCALAIRES = new Set(['texte', 'entier', 'decimal', 'booleen', 'horodatage']);
const SENS_DU_VIDE = new Set(['jamais', 'sansAcces', 'sansDonnee']);
const SESSIONS = new Set(['obligatoire', 'obligatoire+club', 'obligatoire+role', 'anonyme']);
/* Les neuf codes que `worker/apps/api/src` lève RÉELLEMENT, comptés sur `new HttpsError('…')`.
   Les huit autres de `HttpsErrorCode` ne sont jamais levés ; les nommer dans le contrat
   ferait croire à un cas que le client devrait traiter. */
const CODES = new Set([
  'invalid-argument', 'not-found', 'internal', 'failed-precondition', 'permission-denied',
  'resource-exhausted', 'already-exists', 'unavailable', 'unauthenticated',
]);

const enPascal = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[^A-Za-z0-9]+/).filter(Boolean)
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join('');

/* ═══════════════════════════════════════════════════════════════════════════════════════
 * LA VALIDATION — un générateur qui rate sans se plaindre est pire qu'un générateur qui
 * échoue. C'est la règle de `ds-emit-kotlin.mjs`, reprise telle quelle.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */
function valider(contrat) {
  const formes = { ...contrat.formes, ...(contrat.formesEntree ?? {}) };
  const unions = new Map();

  const enregistrer = (t, nomPropose, ou) => {
    if (typeof t === 'string') {
      if (!SCALAIRES.has(t)) throw new Error(`${ou} : jeton de type inconnu « ${t} ».`);
      return;
    }
    if (typeof t !== 'object' || t === null) throw new Error(`${ou} : type illisible.`);
    if (t.liste !== undefined) { enregistrer(t.liste, `${nomPropose}Element`, `${ou}.liste`); return; }
    if (t.objet !== undefined) {
      if (!formes[t.objet]) throw new Error(`${ou} : forme « ${t.objet} » introuvable.`);
      return;
    }
    if (t.union !== undefined) {
      if (!Array.isArray(t.union) || t.union.length < 2) throw new Error(`${ou} : union vide ou à une seule valeur.`);
      const clef = JSON.stringify(t.union);
      /* ⛔ DÉDUPLICATION PAR L'ENSEMBLE DE VALEURS. `Seance.collection` et
         `reserverSession.collection` portent le MÊME ensemble fermé — c'est le jeton qui fait
         l'aller-retour. Deux énumérations jumelles dériveraient séparément, et rien ne le
         verrait : la première déclarée nomme, les suivantes réutilisent. */
      if (!unions.has(clef)) unions.set(clef, nomPropose);
      return;
    }
    throw new Error(`${ou} : forme de type non gérée — ${JSON.stringify(t)}.`);
  };

  for (const [nom, def] of Object.entries(formes)) {
    if (!def.champs || Object.keys(def.champs).length === 0) {
      throw new Error(`formes.${nom} : une forme sans champ ne se génère pas (Kotlin refuse une data class vide).`);
    }
    for (const [champ, d] of Object.entries(def.champs)) {
      if (typeof d.nul !== 'boolean') throw new Error(`formes.${nom}.${champ} : « nul » est obligatoire, sans valeur par défaut.`);
      enregistrer(d.type, `${nom}${enPascal(champ)}`, `formes.${nom}.${champ}`);
    }
  }

  const validerEntree = (entree, prefixe, ou) => {
    for (const [param, d] of Object.entries(entree ?? {})) {
      if (typeof d.obligatoire !== 'boolean') throw new Error(`${ou}.${param} : « obligatoire » est obligatoire.`);
      /* Un paramètre CONSTANT n'a pas besoin d'énumération : le client n'a pas à choisir. */
      if (d.constante !== undefined) continue;
      enregistrer(d.type, `${prefixe}${enPascal(param)}`, `${ou}.${param}`);
    }
  };

  const nomsDeVue = Object.keys(contrat.vues);
  for (const [nom, v] of Object.entries(contrat.vues)) {
    if (!SENS_DU_VIDE.has(v.vueNulle)) throw new Error(`vues.${nom} : « vueNulle » doit valoir jamais | sansAcces | sansDonnee.`);
    if (!SESSIONS.has(v.session)) throw new Error(`vues.${nom} : « session » hors vocabulaire.`);
    if (!Array.isArray(v.erreurs)) throw new Error(`vues.${nom} : « erreurs » manquant.`);
    for (const e of v.erreurs) if (!CODES.has(e)) throw new Error(`vues.${nom} : le serveur ne lève jamais « ${e} ».`);
    if (typeof v.source !== 'string' || !v.source.includes(':')) throw new Error(`vues.${nom} : « source » doit pointer un fichier et une ligne.`);
    if (nom.includes('.') && !v.discriminant) throw new Error(`vues.${nom} : un nom discriminé exige « discriminant ».`);
    enregistrer(v.forme, enPascal(nom), `vues.${nom}.forme`);
    validerEntree(v.entree, enPascal(nom.split('.')[0]), `vues.${nom}.entree`);
  }

  for (const [nom, e] of Object.entries(contrat.ecritures)) {
    if (!SESSIONS.has(e.session)) throw new Error(`ecritures.${nom} : « session » hors vocabulaire.`);
    for (const c of e.erreurs ?? []) if (!CODES.has(c)) throw new Error(`ecritures.${nom} : le serveur ne lève jamais « ${c} ».`);
    if (!Array.isArray(e.perime)) throw new Error(`ecritures.${nom} : « perime » est obligatoire — une liste vide est une déclaration, son absence est un oubli.`);
    for (const v of e.perime) {
      if (!nomsDeVue.includes(v)) throw new Error(`ecritures.${nom} : périme « ${v} », qui n'est pas une vue du contrat.`);
    }
    enregistrer(e.sortie, enPascal(nom), `ecritures.${nom}.sortie`);
    validerEntree(e.entree, enPascal(nom), `ecritures.${nom}.entree`);
  }

  return unions;
}

/* ═══════════════════════════════════════════════════════════════════════════════════════
 * LES ROUTES — la porte qui referme l'angle mort du relais mort.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */
const sansCommentaires = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function handlersDuWorker() {
  const src = readFileSync(join(RACINE, 'worker/apps/api/src/registry.ts'), 'utf8');
  const bloc = /HANDLERS[^=]*=\s*\{([\s\S]*?)\n\}/.exec(src);
  if (!bloc) throw new Error('registry.ts : bloc HANDLERS introuvable.');
  return [...bloc[1].matchAll(/^\s*([A-Za-z0-9_]+)\s*[,:]/gm)].map((m) => m[1]);
}

function listesMigrated() {
  const cfg = sansCommentaires(readFileSync(join(RACINE, 'worker/apps/api/wrangler.jsonc'), 'utf8'));
  return [...cfg.matchAll(/"MIGRATED"\s*:\s*"([^"]*)"/g)]
    .map((m) => m[1].split(',').map((n) => n.trim()).filter(Boolean));
}

function verifierLesRoutes(contrat) {
  const ecarts = [];
  const handlers = handlersDuWorker();
  const listes = listesMigrated();
  if (listes.length < 2) ecarts.push('wrangler.jsonc : les deux listes MIGRATED n’ont pas été retrouvées.');

  const callablesDuContrat = [...new Set(Object.keys(contrat.vues).map((n) => n.split('.')[0]))].sort();
  const vuesDuWorker = handlers.filter((h) => /^app[A-Z]/.test(h)).sort();

  const enTrop = callablesDuContrat.filter((n) => !vuesDuWorker.includes(n));
  const manquantes = vuesDuWorker.filter((n) => !callablesDuContrat.includes(n));
  if (enTrop.length) ecarts.push(`Vues du contrat sans handler app* : ${enTrop.join(', ')}.`);
  if (manquantes.length) ecarts.push(`Handlers app* absents du contrat : ${manquantes.join(', ')}.`);

  const ecrituresSansHandler = Object.keys(contrat.ecritures).filter((n) => !handlers.includes(n));
  if (ecrituresSansHandler.length) ecarts.push(`Écritures du contrat sans handler : ${ecrituresSansHandler.join(', ')}.`);

  /*
   * ⛔ LA LISTE `MIGRATED` EST CE QUI MET UNE CALLABLE EN SERVICE. Un nom implémenté mais
   * absent de la liste n'échoue pas franchement : il part au RELAIS MORT et reçoit la page
   * HTML « 404 Page not found » de Google, ce qui se présente comme une panne de réseau.
   * C'est exactement ce qui est arrivé à `createClubCharge` — personne ne pouvait s'abonner
   * au Club. Il y a DEUX listes (production, environnement nommé) : n'en vérifier qu'une
   * laisse le défaut en embuscade dans l'autre.
   */
  const toutes = [...callablesDuContrat, ...Object.keys(contrat.ecritures)];
  listes.forEach((liste, i) => {
    const absentes = toutes.filter((n) => !liste.includes(n));
    if (absentes.length) ecarts.push(`MIGRATED n°${i + 1} : ${absentes.join(', ')} — relayées vers le vide.`);
  });

  return ecarts;
}

/* ═══════════════════════════════════════════════════════════════════════════════════════
 * L'EXÉCUTION
 * ═══════════════════════════════════════════════════════════════════════════════════════ */
const ENTETE_TS = `/*
 * ⛔ FICHIER GÉNÉRÉ PAR \`npm run vues:gen\` — NE PAS ÉDITER.
 *
 * La source est \`${CONTRAT}\`, seul artefact de cette couche
 * écrit à la main. Toute retouche ici est effacée à la prochaine génération, et
 * \`npm run vues:check\` la refuse avant.
 */`;

const ENTETE_KT = `/*
 * ⛔ FICHIER GÉNÉRÉ PAR \`npm run vues:gen\` — NE PAS ÉDITER.
 *
 * La source est \`${CONTRAT}\`, seul artefact de cette couche
 * écrit à la main. Kotlin et Swift ne sont écrits ni l'un ni l'autre à la main : c'est ce qui
 * rend leur dérive IMPOSSIBLE, et pas seulement improbable.
 */`;

function produire() {
  const contrat = JSON.parse(readFileSync(join(RACINE, CONTRAT), 'utf8'));
  contrat.__unions = valider(contrat);
  return {
    contrat,
    fichiers: {
      [CIBLES.ts]: `${emettreTs(contrat, ENTETE_TS).trimEnd()}\n`,
      [CIBLES.kotlin]: `${emettreKotlin(contrat, ENTETE_KT).trimEnd()}\n`,
    },
  };
}

function main() {
  const verifier = process.argv.includes('--check');
  const { contrat, fichiers } = produire();

  const ecarts = verifierLesRoutes(contrat);

  if (!verifier) {
    for (const [chemin, contenu] of Object.entries(fichiers)) {
      mkdirSync(dirname(join(RACINE, chemin)), { recursive: true });
      writeFileSync(join(RACINE, chemin), contenu);
      console.log(`vues:gen — ${chemin}`);
    }
    if (ecarts.length) {
      console.error(`\nvues:gen — LES ROUTES NE FERMENT PAS :\n${ecarts.map((e) => `  · ${e}`).join('\n')}`);
      process.exit(1);
    }
    console.log(`vues:gen — ${Object.keys(contrat.formes).length} formes, ${Object.keys(contrat.vues).length} vues, `
      + `${Object.keys(contrat.ecritures).length} écritures, ${contrat.__unions.size} ensembles fermés.`);
    return;
  }

  /* La régénération se fait DANS UN DOSSIER TEMPORAIRE puis se compare : on ne réécrit
     jamais l'arbre de travail pendant une vérification, sinon la porte « répare » ce
     qu'elle est censée refuser et la CI passe au vert sur un dépôt sale. */
  const temporaire = mkdtempSync(join(tmpdir(), 'vues-check-'));
  const divergents = [];
  for (const [chemin, attendu] of Object.entries(fichiers)) {
    writeFileSync(join(temporaire, chemin.replace(/[/\\]/g, '_')), attendu);
    let present;
    try {
      present = readFileSync(join(RACINE, chemin), 'utf8');
    } catch {
      divergents.push(`${chemin} — absent : il n’a jamais été généré.`);
      continue;
    }
    if (present !== attendu) divergents.push(`${chemin} — diffère du contrat.`);
  }

  if (divergents.length || ecarts.length) {
    if (divergents.length) {
      console.error('vues:check — LE CODE GÉNÉRÉ NE CORRESPOND PLUS AU CONTRAT :');
      for (const d of divergents) console.error(`  · ${d}`);
      console.error('\n  Un de ces fichiers a été édité à la main, ou le contrat a changé sans');
      console.error('  régénération. `npm run vues:gen` rétablit les deux.');
    }
    if (ecarts.length) {
      console.error(`${divergents.length ? '\n' : ''}vues:check — LES ROUTES NE FERMENT PAS :`);
      for (const e of ecarts) console.error(`  · ${e}`);
    }
    process.exit(1);
  }

  console.log(`vues:check — contrat, TypeScript et Kotlin d’accord ; `
    + `${[...new Set(Object.keys(contrat.vues).map((n) => n.split('.')[0]))].length} vues et `
    + `${Object.keys(contrat.ecritures).length} écritures servies et déclarées dans les deux listes MIGRATED.`);
}

main();
