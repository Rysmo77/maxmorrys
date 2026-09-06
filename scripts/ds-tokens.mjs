#!/usr/bin/env node
/**
 * src/design-system/css/tokens/*.css  ->  src/design-system/tokens.generated.ts   (AD-8)
 *
 * Une seule source de jetons pour trois plateformes. React Native n'a ni CSS, ni
 * backdrop-filter, ni filter: blur — et la tentation, à ce moment-là, est de retaper les
 * valeurs dans un objet JS. C'est ainsi qu'une palette dérive : pas d'un coup, mais d'une
 * valeur à la fois, sans que rien ne le signale.
 *
 * Le fichier émis est GÉNÉRÉ, jamais édité. `npm run ds:check` échoue s'il est désynchronisé.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emettreKotlin } from './ds-emit-kotlin.mjs';
import { emettreNatif } from './ds-emit-natif.mjs';
import { emettreIcones } from './ds-emit-icones.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = join(root, 'src/design-system/css/tokens');
/*
 * LES ÉCARTS DÉLIBÉRÉS FONT PARTIE DU SYSTÈME DE JETONS.
 *
 * Ce script ne lisait que `tokens/`. Conséquence, trouvée en portant le natif : les jetons
 * déclarés dans `overrides/` n'atteignaient pas le fichier généré, et l'application native
 * aurait embarqué les valeurs d'AVANT chaque correction — dont le vert d'état à 3,66:1 sur
 * fond nuit, corrigé au web par AD-19 et resté faux sur natif.
 *
 * C'est exactement la dérive qu'AD-8 existe pour empêcher : pas une palette qui change d'un
 * coup, mais une valeur à la fois, dans la plateforme que personne ne regarde pendant qu'on
 * corrige l'autre.
 *
 * Les overrides sont lus APRÈS, dans l'ordre de la cascade : c'est celui de `styles.css`.
 */
const OVERRIDES = join(root, 'src/design-system/css/overrides');
const OUT = join(root, 'src/design-system/tokens.generated.ts');

/**
 * ── LA CIBLE NATIVE, RETIRÉE LE 05/09/2026 ────────────────────────────────────────────
 *
 * Ce script écrivait aussi `mobile/ds/tokens.generated.ts`, parce que le dossier React Native
 * était AUTONOME (AD-9) et ne pouvait pas lire un fichier au-dessus de lui — Metro ne résout
 * rien hors de la racine du projet, là où TypeScript, lui, suivait le chemin sans broncher.
 * C'est ce qui avait rendu l'application impossible à bundler pendant que sa porte de
 * vérification restait verte.
 *
 * `mobile/` a été supprimé : l'application est réécrite en Kotlin/Compose et en
 * Swift/SwiftUI. La leçon, elle, ne change pas — et c'est ce qui rend la suite facile :
 * AD-8 dit que les jetons sont GÉNÉRÉS depuis le CSS, donc on les génère à chaque endroit qui
 * les consomme, quel que soit son langage. La source de vérité reste le CSS.
 *
 * ✅ LA CIBLE KOTLIN EST BRANCHÉE (`ds-emit-kotlin.mjs`). Elle ne contourne rien : les 10
 * `linear-gradient(...)`, les 19 ombres, les 2 bordures et les 4 écritures de couleur sont
 * PARSÉES, et une valeur que l'émetteur ne sait pas classer arrête la génération.
 *
 * ⚠️ Ce n'était pas un détail. Le port React Native contournait les dégradés en relisant
 * leurs teintes par leur jeton d'origine ; or `arc` part de #0057BC en clair et de #6FB1FF
 * en sombre. Le contournement rendait donc la version claire dans les deux modes — un défaut
 * que ni le typecheck ni la relecture ne pouvaient voir.
 *
 * ⚠️ RESTE LA CIBLE SWIFT (lot iOS), à écrire sur le même modèle.
 */

/**
 * Extrait les déclarations `--nom: valeur` d'un bloc de sélecteur donné.
 *
 * Le bloc se ferme sur la PREMIÈRE accolade fermante, pas sur une accolade en début de ligne.
 * La version précédente exigeait `\n}` : elle ratait silencieusement tout bloc écrit sur une
 * seule ligne — `:root{ --mm-corail-t:#C22A3C; }` — et le jeton n'atteignait jamais le natif.
 * Un extracteur qui rate sans se plaindre est pire qu'un extracteur qui échoue.
 */
function extract(css, selector) {
  const out = {};
  const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^{}]*)\\}`, 'g');
  let block;
  while ((block = re.exec(css))) {
    const body = block[1].replace(/\/\*[\s\S]*?\*\//g, '');
    for (const decl of body.split(';')) {
      const m = decl.match(/^\s*(--[a-z0-9-]+)\s*:\s*([\s\S]+?)\s*$/i);
      if (m) out[m[1]] = m[2].replace(/\s+/g, ' ').trim();
    }
  }
  return out;
}

const light = {};
const dark = {};
const read = (dir) => {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.css')).sort()) {
    const css = readFileSync(join(dir, f), 'utf8');
    // `:root,.dk` déclare une valeur FIXE, identique dans les deux modes : elle entre dans
    // les deux cartes. C'est la forme que prennent les trois exceptions assumées du système.
    const both = extract(css, ':root,.dk');
    Object.assign(light, extract(css, ':root'), both);
    Object.assign(dark, extract(css, '.dk'), both);
  }
};
read(TOKENS);
read(OVERRIDES);

/** camelCase depuis `--mm-bleu-n` -> `mmBleuN`. Le natif n'a pas de tirets dans ses clés. */
const key = (k) => k.replace(/^--/, '').replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

/**
 * Le natif ne sait pas résoudre `var(--x)` : il n'y a pas de cascade. On aplatit donc les
 * alias sémantiques jusqu'à leur valeur littérale. Une référence qui ne se résout pas est
 * une erreur dure, pas un silence — c'est précisément le genre de trou qui ne se voit qu'à
 * l'écran, sur l'appareil de quelqu'un d'autre.
 */
function flatten(map, name, seen = new Set()) {
  const raw = map[name];
  if (raw === undefined) return undefined;
  if (seen.has(name)) throw new Error(`ds:tokens — cycle de var() sur ${name}`);
  seen.add(name);
  return raw.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]*))?\)/gi, (_, ref, fallback) => {
    const v = flatten(map, ref, new Set(seen));
    if (v === undefined) {
      if (fallback !== undefined) return fallback.trim();
      throw new Error(`ds:tokens — ${name} référence ${ref}, qui n'existe pas`);
    }
    return v;
  });
}

function resolve(map) {
  const out = {};
  for (const k of Object.keys(map).sort()) out[key(k)] = flatten(map, k);
  return out;
}

const L = resolve(light);
// Le mode sombre n'est pas un filtre : c'est un jeu de jetons DISTINCTS, déclarés en valeur.
// On le résout donc dans une carte où .dk écrase :root, exactement comme la cascade le ferait.
const D = resolve({ ...light, ...dark });

const lit = (o) =>
  '{\n' + Object.entries(o).map(([k, v]) => `  ${k}: ${JSON.stringify(v)},`).join('\n') + '\n}';

const CONTENU = `/**
 * GÉNÉRÉ PAR \`npm run ds:tokens\` — NE PAS ÉDITER.
 * Source : src/design-system/css/tokens/*.css (elles-mêmes copies littérales du DS, AD-1).
 *
 * Les valeurs sont APLATIES : tout var() est résolu jusqu'à sa valeur littérale, parce que
 * React Native n'a pas de cascade. \`dark\` n'est pas un filtre appliqué à \`light\` — le mode
 * sombre du DS redéclare ses teintes en valeur, et c'est ce jeu-là qui est capturé ici.
 */

export const tokens = {
  light: ${lit(L)} as const,
  dark: ${lit(D)} as const,
} as const;

export type TokenName = keyof typeof tokens.light;
export type Scheme = keyof typeof tokens;

/** Le seul accesseur. Un composant natif ne lit jamais \`tokens.light\` en dur. */
export function token(name: TokenName, scheme: Scheme = 'light'): string {
  return tokens[scheme][name] ?? tokens.light[name];
}

/** Les quatre territoires, et seulement les quatre. L'agence est hors territoire. */
export const TERRITORIES = ['forme', 'informe', 'transforme', 'digitalise'] as const;
export type Territory = (typeof TERRITORIES)[number];
`;

writeFileSync(OUT, CONTENU);

/* ── CIBLE KOTLIN / COMPOSE ─────────────────────────────────────────────────────────── */
/*
 * ⛔ AUCUN `slash-étoile` DANS CET EN-TÊTE, ET CE N'EST PAS UNE COQUETTERIE.
 *
 * Kotlin IMBRIQUE les commentaires de bloc, là où Java et C ne le font pas. Écrire le
 * chemin des sources en glob — « css/tokens/ » suivi d'une étoile — ouvrait donc deux
 * commentaires imbriqués que la fermeture finale ne refermait qu'à moitié, et TOUT le
 * fichier de 546 lignes devenait un commentaire. Le compilateur ne signalait qu'« Unclosed
 * comment » à la dernière ligne, et cinq erreurs de référence sans rapport apparent.
 *
 * ⚠️ Et le piège se referme sur qui l'explique : la première version de CE commentaire-ci
 * citait la séquence de fermeture entre accents graves. En JavaScript, elle ne se cite pas :
 * elle a fermé le commentaire au milieu de la phrase, et la suite est devenue du code.
 */
const ENTETE_KT = `/*
 * GÉNÉRÉ PAR \`npm run ds:tokens\` — NE PAS ÉDITER.
 * Source : les feuilles de src/design-system/css/tokens et css/overrides (AD-8).
 *
 * Modifier ce fichier à la main le fait diverger du CSS sans que rien ne le signale, et
 * \`npm run ds:check\` échouera à la prochaine exécution.
 */`;
const KT_DIR = join(root, 'android/app/src/main/java/me/maxmorrys/rysmo/ds');
const RES = join(root, 'android/app/src/main/res');
const { kotlin, xmlClair, xmlSombre, xmlMarque } = emettreKotlin(L, D, ENTETE_KT);
for (const d of [KT_DIR, join(RES, 'values'), join(RES, 'values-night')]) mkdirSync(d, { recursive: true });
writeFileSync(join(KT_DIR, 'Jetons.generated.kt'), kotlin);
writeFileSync(join(RES, 'values/couleurs.generated.xml'), xmlClair);
writeFileSync(join(RES, 'values-night/couleurs.generated.xml'), xmlSombre);
writeFileSync(join(RES, 'values/marque.generated.xml'), xmlMarque);

/*
 * ── LES TRACÉS D'ICÔNES SUIVENT LE MÊME CHEMIN ────────────────────────────────────────
 *
 * `src/design-system/icons.ts` est écrit à la main et ne dépend de rien — ni React, ni DOM,
 * ni React Native. C'est ce qui permet au web et au natif de lire LES MÊMES tracés, et
 * d'éviter la dérive glyphe par glyphe que ce fichier explique en tête.
 *
 * Mais `mobile/ds/Icon.tsx` l'atteignait par `../../src/design-system/icons`, hors de la
 * racine du projet natif : même panne que pour les jetons, Metro ne résout pas. On le
 * TRADUIT donc, au lieu de le pointer — la traduction est générée, jamais éditée, et la
 * source reste unique. Traduire une source unique n'est pas dupliquer : c'est ce que fait
 * déjà `ds:sync` pour le CSS du kit.
 */
/* ✅ LA CIBLE KOTLIN DES ICÔNES EST BRANCHÉE (`ds-emit-icones.mjs`). Les cercles et les
   rectangles du kit y sont traduits en tracés SVG par un calcul déterministe, parce que
   `PathParser` de Compose ne lit que des chaînes. Reste la cible SwiftUI, sur le même
   modèle. */
const { kotlin: icones, compte } = emettreIcones(root, ENTETE_KT);
writeFileSync(join(KT_DIR, 'Icones.generated.kt'), icones);

/*
 * ── CINQUIÈME CIBLE : CE QUE LE KIT ÉCRIT EN DUR ──────────────────────────────────────
 *
 * Les jetons ne suffisent pas à rendre le kit. Quinze lobes de maillage, sept voiles de
 * verre Android, treize ombres et quatre dégradés vivent en hexadécimal LITTÉRAL dans
 * `DS_Final/brand/*` et dans les composants — délibérément pour les lobes (une peinture n'a
 * pas de plancher de contraste à tenir), par omission pour les ombres.
 *
 * Le port React Native les recopiait à la main, et c'est par là que la dérive est entrée.
 * `ds-emit-natif.mjs` les EXTRAIT : un motif qui n'apparie plus arrête la génération.
 */
const natif = emettreNatif(root, ENTETE_KT, L, D);
writeFileSync(join(KT_DIR, 'Natif.generated.kt'), natif);

const divergents = Object.keys(L).filter((k) => L[k] !== D[k]).length;
console.log(
  `ds:tokens — ${Object.keys(L).length} jetons, dont ${divergents} qui changent en mode sombre\n`
  + '  -> src/design-system/tokens.generated.ts\n'
  + '  -> android/.../ds/Jetons.generated.kt + res/values{,-night}/couleurs.generated.xml\n'
  + `  -> android/.../ds/Icones.generated.kt (${compte} glyphes)\n`
  + '  -> android/.../ds/Natif.generated.kt (maillage, verre .andro, valeurs hors table)',
);
