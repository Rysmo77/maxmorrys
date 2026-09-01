#!/usr/bin/env node
/**
 * Les six règles de revue du design system, rendues EXÉCUTABLES.
 *
 *   « Aucune de ces six règles ne se voit sur une capture d'écran. Le flou de trop, le repli
 *     qui ignore le thème, la durée réintroduite localement, le chiffre inventé : tous rendent
 *     correctement sur la machine de qui les écrit. Ils ne se manifestent que sur l'appareil,
 *     le thème, le réglage d'accessibilité ou le fuseau de quelqu'un d'autre. »
 *                                         — REGLES-DE-REVUE.md, mot de la fin
 *
 * C'est exactement pourquoi elles ne peuvent pas rester une habitude de revue. Ce script
 * tourne dans la CI, au même rang que typecheck et lint.
 *
 *   node scripts/ds-check.mjs            # tout, sortie 1 au premier manquement
 *   node scripts/ds-check.mjs --summary  # le compte par règle, sortie 0 — pour piloter une migration
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUMMARY = process.argv.includes('--summary');
const findings = [];
const add = (rule, ad, file, line, detail) => findings.push({ rule, ad, file, line, detail });

const SKIP = new Set(['node_modules', 'dist', '.git', 'Max-Morrys_DS_Platform', '_bmad-output', '_bmad', 'coverage', '.firebase']);
function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}
const rel = (p) => relative(root, p);

/**
 * Les lignes BRUTES, commentaires compris.
 *
 * `lines()` neutralise les commentaires pour ne pas se faire piéger par la documentation
 * d'une règle. Mais l'échappatoire `// ok-ds` EST un commentaire : la chercher dans le texte
 * neutralisé revient à la chercher après l'avoir effacée, et elle ne pouvait donc jamais
 * fonctionner. Les trois exceptions assumées du système étaient inécrivables.
 *
 * Elle s'écrit dans LES DEUX formes de commentaire, et pas par confort : entre deux balises
 * JSX, `//` n'est pas un commentaire — c'est du texte qui s'afficherait à l'écran. Un logo
 * de marque tierce, qui est précisément le cas d'usage de l'échappatoire, ne pouvait donc
 * pas la porter sur la ligne du `<path fill="#…">` qu'elle doit couvrir.
 */
const rawLines = (p) => readFileSync(p, 'utf8').split('\n');

/** `// ok-ds` en ligne, ou `{/* ok-ds *​/}` en JSX — même échappatoire, deux syntaxes. */
const OK_DS = /(?:\/\/|\/\*)\s*ok-ds\b/;

/**
 * Lit un fichier en NEUTRALISANT ses commentaires, sans déplacer une seule ligne.
 *
 * Une analyse ligne à ligne se fait piéger par un commentaire de bloc dont les lignes de
 * suite ne portent aucun marqueur — et le design system en écrit de longs, alignés, qui
 * citent précisément les règles qu'on vérifie. Sans ça, la documentation d'une règle la
 * fait échouer.
 */
const lines = (p) => {
  const src = readFileSync(p, 'utf8');
  const out = [];
  let block = false;
  for (let l of src.split('\n')) {
    let kept = '';
    for (let i = 0; i < l.length; i++) {
      if (block) {
        if (l.startsWith('*/', i)) { block = false; i++; }
        continue;
      }
      if (l.startsWith('/*', i)) { block = true; i++; continue; }
      if (l.startsWith('//', i)) break;
      kept += l[i];
    }
    out.push(kept);
  }
  return out;
};

const CSS = walk(join(root, 'src'), ['.css']);
const TSX = walk(join(root, 'src'), ['.tsx', '.ts']).filter((p) => !p.endsWith('.generated.ts'));
const MOBILE = existsSync(join(root, 'mobile')) ? walk(join(root, 'mobile'), ['.tsx', '.ts']) : [];

/* ── AD-1 · les copies sont littérales ─────────────────────────────────────── */
{
  const DS = join(root, 'Max-Morrys_DS_Platform/design_handoff_maxmorrys/css');
  // Voir l'en-tête de ds-sync.mjs : c'est le seul sous-arbre qui publie les 17 feuilles.
  if (!existsSync(DS)) add('1 · copie littérale', 'AD-1', relative(root, DS), 0, 'kit de design absent du dépôt — AD-1 n\'est plus prouvable');
  else
  for (const d of ['tokens', 'brand']) {
    for (const src of walk(join(DS, d), ['.css'])) {
      const r = relative(DS, src);
      const dst = join(root, 'src/design-system/css', r);
      if (!existsSync(dst)) { add('1 · copie littérale', 'AD-1', r, 0, 'absent de src/design-system/css — lancer npm run ds:sync'); continue; }
      // On retire la bannière ajoutée par ds:sync avant de comparer.
      const got = readFileSync(dst, 'utf8').replace(/^\/\* ─+\n(?:.*\n)*?   ─+ \*\/\n/, '');
      if (got !== readFileSync(src, 'utf8')) add('1 · copie littérale', 'AD-1', rel(dst), 0, 'diverge du design system — un écart voulu vit dans overrides/, pas ici');
    }
  }
}

/* ── AD-8 · les jetons générés sont à jour ─────────────────────────────────── */
{
  const out = join(root, 'src/design-system/tokens.generated.ts');
  if (!existsSync(out)) add('8 · jetons générés', 'AD-8', 'src/design-system/tokens.generated.ts', 0, 'absent — lancer npm run ds:tokens');
  else {
    const before = readFileSync(out, 'utf8');
    execFileSync(process.execPath, [join(root, 'scripts/ds-tokens.mjs')], { stdio: 'pipe' });
    if (readFileSync(out, 'utf8') !== before) add('8 · jetons générés', 'AD-8', 'src/design-system/tokens.generated.ts', 0, 'désynchronisé de sa source CSS — lancer npm run ds:tokens et committer');
  }
}

/* ── Règle 1 / AD-4 · le flou n'a droit qu'au chrome en position fixe ──────── */
{
  const ALLOWED = 'src/design-system/css/brand/surfaces.css';
  for (const f of [...CSS, ...TSX, ...MOBILE]) {
    if (rel(f) === ALLOWED) continue;
    lines(f).forEach((l, i) => {
      // `backdrop-filter: none` RETIRE un flou : c'est ce que font les trois replis.
      // La règle interdit d'en AJOUTER un, pas d'en enlever.
      if (/backdrop-?[fF]ilter/.test(l)
          && !/backdrop-?[fF]ilter\s*:\s*none/.test(l)   // un repli RETIRE un flou
          && !/@supports/.test(l))                       // une requête de fonctionnalité l'INTERROGE
        add('1 · flou', 'AD-4', rel(f), i + 1, 'backdrop-filter hors de brand/surfaces.css — le faux verre (.glass-flat) est gratuit à faire défiler');
    });
  }
  /*
   * L'UTILITAIRE TAILWIND `backdrop-blur-*` ÉTAIT INVISIBLE À CE CONTRÔLE.
   *
   * Il cherchait la propriété CSS `backdrop-filter`. Mais une classe `backdrop-blur-sm` la
   * produit tout autant, et 23 occurrences vivaient dans le dépôt sans jamais être comptées.
   * Une règle qui ne regarde qu'une des deux façons d'écrire la même chose ne fait pas
   * respecter la règle : elle fait respecter une orthographe.
   *
   * La condition reste la même — le flou n'a droit qu'à ce qui NE DÉFILE PAS. Un voile de
   * recul en `fixed inset-0` la remplit, et le tableau des transitions du système le
   * prescrit même : « ouvrir une feuille : l'écran derrière, visible et flou ». C'est donc
   * l'absence de `fixed|sticky` qui est le défaut, pas le flou.
   */
  for (const f of [...TSX, ...MOBILE]) {
    lines(f).forEach((l, i) => {
      if (/\bbackdrop-blur(-[a-z0-9]+)?\b/.test(l) && !/\b(fixed|sticky)\b/.test(l))
        add('1 · flou', 'AD-4', rel(f), i + 1,
          "utilitaire `backdrop-blur` sur un élément qui n'est ni fixed ni sticky — le flou n'a droit qu'à ce qui ne défile pas");
    });
  }

  // `.glass` porte le seul flou du système : il doit être fixe ou collant partout où il sert.
  for (const f of [...TSX, ...MOBILE]) {
    lines(f).forEach((l, i) => {
      if (/className=[^>]*\bglass\b(?!-)/.test(l) && !/\b(fixed|sticky)\b/.test(l))
        add('1 · flou', 'AD-4', rel(f), i + 1, '.glass sans fixed|sticky sur la même ligne — vérifier que l\'élément ne défile pas, sinon .glass-flat');
    });
  }
}

/* ── Règle 3 / AD-16 · transform et opacity seulement ──────────────────────── */
{
  /*
   * Exceptions déjà écrites et fermées. `mm-radio` en fait partie DEPUIS AD-21, et pour une
   * raison différente des trois autres : la ligne fautive n'est pas à nous, elle vient de
   * `brand/states.css`, qui est une COPIE LITTÉRALE (AD-1) et ne peut donc pas être corrigée
   * sur place. Elle est neutralisée par `overrides/ad-21-radio-epaisseur.css`, importé en
   * dernier, qui remplace la transition de `border-width` par une transition de couleur.
   *
   * L'exemption ne rouvre rien : l'override porte sur `.mm-radio` sans condition, donc toute
   * autre transition d'épaisseur écrite sur cette classe, où que ce soit, est écrasée elle
   * aussi. C'est le sélecteur qui ferme la porte, pas la liste.
   */
  const EXEMPT = /barfill|prog-fill|mm-skip|mm-radio/;

  /* En CSS, la propriété animée s'écrit littéralement : on la cherche telle quelle. */
  const BAD_CSS = /(transition|animation)[^;{]*\b(width|height|top|left|right|bottom|margin|padding|inset)\b/;
  for (const f of CSS) {
    lines(f).forEach((l, i) => {
      if (BAD_CSS.test(l) && !EXEMPT.test(l))
        add('3 · mouvement', 'AD-16', rel(f), i + 1, 'transition/animation sur une propriété de mise en page — transform et opacity seulement');
    });
  }

  /*
   * EN TSX, LA MÊME RECHERCHE NE VEUT RIEN DIRE — et elle criait au loup trois fois.
   *
   * `transition-colors ... text-left` contient le mot « left ». `transition-transform ...
   * width={400} height={300}` contient « width » et « height », qui sont ici des ATTRIBUTS
   * HTML d'une image, pas des propriétés animées. Les trois constats de cette règle étaient
   * des faux positifs, et un vérificateur bruyant finit ignoré — ce qui coûte plus cher que
   * de ne pas l'avoir écrit.
   *
   * Ce qui se cherche réellement dans une classe utilitaire :
   *   • `transition-all`, qui anime TOUT, y compris la mise en page ;
   *   • une valeur arbitraire qui nomme explicitement une propriété de mise en page.
   */
  const BAD_TW = /\btransition-(?:all\b|\[[^\]]*\b(?:width|height|top|left|right|bottom|margin|padding|inset)\b)/;
  for (const f of [...TSX, ...MOBILE]) {
    lines(f).forEach((l, i) => {
      if (BAD_TW.test(l) && !EXEMPT.test(l))
        add('3 · mouvement', 'AD-16', rel(f), i + 1, '`transition-all` anime aussi la mise en page — nommer transform et/ou opacity');
    });
  }
}

/* ── Règle 4 / AD-7 · les replis, une seule fois, globalement ──────────────── */
{
  const ONLY = 'src/design-system/css/brand/fallback.css';
  const PAT = /prefers-reduced-motion|prefers-reduced-transparency|@supports\s+not\s+\(\s*\(?\s*backdrop-filter/;
  /*
   * LA RÈGLE VISE LES DÉCLARATIONS CSS, PAS LES LECTURES JS.
   *
   * `window.matchMedia('(prefers-reduced-motion: reduce)')` ne redéclare rien : il DEMANDE le
   * réglage pour s'y conformer. Et ne pas le demander serait le vrai défaut — un déclencheur
   * de scène qui ignore la préférence laisse la page invisible pour qui l'a cochée, puisque
   * `.play` n'arrive jamais.
   *
   * Le contrôle ne regarde donc que les fichiers CSS. Ce qu'il empêche reste entier : une
   * seconde déclaration en CSS gagne par ordre de chargement et rétablit silencieusement ce
   * que la personne a refusé. Une lecture en JavaScript ne peut pas faire ça.
   */
  for (const f of CSS) {
    if (rel(f) === ONLY) continue;
    lines(f).forEach((l, i) => {
      // Un commentaire qui EXPLIQUE où vit le repli n'est pas un second repli. surfaces.css
      // en porte un, précisément pour dire que le bloc a été déplacé dans fallback.css.
      if (PAT.test(l))
        add('4 · replis', 'AD-7', rel(f), i + 1, 'repli déclaré hors de brand/fallback.css — une seconde déclaration gagne par ordre de chargement et rétablit ce que la personne a refusé');
    });
  }
  // Chaque repli doit connaître le thème : son pendant .dk doit exister dans le même fichier.
  if (existsSync(join(root, ONLY))) {
    const src = readFileSync(join(root, ONLY), 'utf8');
    for (const p of ['prefers-reduced-transparency', '@supports not', '.lowfi'])
      if (src.includes(p) && !new RegExp(`${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,900}?\\.dk`).test(src))
        add('5 · repli et thème', 'AD-7', ONLY, 0, `le repli « ${p} » n'a pas de pendant .dk — carton blanc en mode sombre sur l'appareil le plus courant du marché visé`);
  }
}

/* ── Règle 6 / AD-5 · un nombre en monospace vient de la base ──────────────── */
{
  for (const f of [...TSX, ...MOBILE]) {
    if (/design-system\/react\/data\/Num\./.test(rel(f))) continue;
    lines(f).forEach((l, i) => {
      // `.mm-eyebrow` est la recette de SOURCIL du système : monospace parce que c'est un
      // libellé en capitales, pas parce que c'est un chiffre. Un nombre placé dans un
      // sourcil reste soumis à la règle et passe par <Num>, qui apporte `.mm-num`.
      /*
       * La monospace n'est un défaut QUE SI ELLE PORTE UN NOMBRE.
       *
       * La règle 6 parle de nombres : « un nombre en monospace vient de la base ou d'une
       * source citée ». Elle ne dit rien du CODE ni des URL, qui se rendent légitimement en
       * monospace parce que l'espacement fixe y porte du sens — un éditeur de contenu, une
       * table de redirections, un identifiant technique.
       *
       * Sans ce filtre, la règle signalait dix-huit endroits dont l'immense majorité était
       * du code. Une règle qui se trompe quatre fois sur cinq n'est plus lue.
       */
      /*
       * On teste le CONTENU RENDU, pas la ligne entière.
       *
       * `className="mm-num text-[96px]"` contient un chiffre — celui d'une taille de police.
       * Le lire comme une donnée faisait signaler un filigrane « 404 » comme un nombre non
       * sourcé. Les attributs de présentation sont donc retirés avant le test : ce qui reste
       * est ce que la personne lit à l'écran.
       */
      const rendered = l
        .replace(/className=(?:"[^"]*"|\{[^}]*\})/g, '')
        .replace(/style=\{\{[^}]*\}\}/g, '');
      // `[^}]*` et non `\w*` : une expression rendue est presque toujours un chemin pointé
      // (`{stats.total}`, `{data.memberCount}`), et `\w` ne franchit pas le point.
      const NUMBERISH = /\d|\.length|toFixed|toLocaleString|\{[^}]*(?:count|total|nombre|price|prix|amount|montant|score|xp|quota)/i;
      if (/(mm-num|--f-mono|font-mono|fMono)/.test(l) && !/mm-eyebrow/.test(l) && NUMBERISH.test(rendered))
        add('6 · nombre sourcé', 'AD-5', rel(f), i + 1, 'monospace sur ce qui ressemble à un nombre, hors du composant <Num> — un nombre sans source ne s\'affiche pas');
    });
  }
}

/* ── AD-18 · l'encre tertiaire ne porte pas de texte ───────────────────────── */
{
  for (const f of [...CSS, ...TSX, ...MOBILE]) {
    if (rel(f).startsWith('src/design-system/css/tokens')) continue;
    if (rel(f) === 'src/design-system/css/overrides/ad-06-etats.css') continue;
    lines(f).forEach((l, i) => {
      if (/\bcolor\s*:\s*var\(--(ink-3|text-faint)\)/.test(l) && !/:disabled|\[disabled\]|aria-disabled/.test(l))
        add('18 · encre tertiaire', 'AD-18', rel(f), i + 1, '--ink-3 porte du texte — 2,61:1 sur blanc pur, aucun voile ne le sauve ; il reste aux filets et à l\'état désactivé');
    });
  }
}

/* ── AD-2 · aucune couleur en dur dans un composant ────────────────────────── */
{
  const HEX = /#[0-9a-fA-F]{3,8}\b/;
  const OK = /(^|\/)(tokens\.generated|vite-env|.*\.test)\./;
  for (const f of [...TSX, ...MOBILE]) {
    if (OK.test(rel(f))) continue;
    const raw = rawLines(f);
    lines(f).forEach((l, i) => {
      // L'échappatoire se lit sur la ligne BRUTE — voir rawLines().
      if (HEX.test(l) && !/(currentColor|url\()/.test(l) && !OK_DS.test(raw[i] ?? ''))
        add('2 · couleur en dur', 'AD-2', rel(f), i + 1, `code hexadécimal dans un fichier de composant — passer par un jeton`);
    });
  }
}

/* ── AD-3 · aucune prop de thème ───────────────────────────────────────────── */
{
  for (const f of [...TSX, ...MOBILE]) {
    lines(f).forEach((l, i) => {
      if (/\b(dark|night)\s*[?:]?\s*:\s*boolean|<[A-Z]\w*[^>]*\s(dark|night)(\s|=\{true\}|>)/.test(l))
        add('3 · prop de thème', 'AD-3', rel(f), i + 1, 'prop de thème — le thème est une portée CSS (.dk), jamais une prop : sinon le composant retombe silencieusement sur sa valeur claire');
    });
  }
}

/* ── Garde-fou · l'échelle numérique de Tailwind n'est pas détournée ────────
   Ce contrôle existe parce que le défaut a été COMMIS, pas anticipé.

   Écrire `spacing: { 4: 'var(--sp-4)' }` dans la config paraît juste : c'est le jeton du
   kit, sous sa clé. Mais Tailwind compte en rem — `p-4` vaut 1rem, soit 16 px — et le kit
   compte en pixels : `--sp-4` vaut 4. La clé est la même, la valeur est divisée par quatre,
   sur les 3 498 classes d'espacement du dépôt.

   Aucune porte ne le voit. Le typecheck passe, la build passe, les six règles passent : la
   classe existe, elle a une valeur, elle est simplement fausse. Seul l'œil l'attrape, sur un
   écran déjà rendu — donc trop tard, et seulement si quelqu'un connaissait l'écran d'avant.

   Les valeurs du kit servent dans les primitives, en style calculé, qui lisent var(--sp-N)
   directement. L'espace de noms utilitaire compte en rem, et les deux n'ont pas à se
   partager une clé. */
{
  // Commentaires NEUTRALISÉS : la documentation de ce défaut contient l'exemple fautif en
  // toutes lettres, et le lire brut fait échouer le contrôle sur sa propre explication.
  // C'est la deuxième fois que ce piège se referme dans ce fichier ; d'où lines(), toujours.
  const cfg = lines(join(root, 'tailwind.config.js')).join('\n');
  const spacing = cfg.match(/spacing:\s*\{([\s\S]*?)\n      \}/);
  const numericKey = /(^|[{,\s])(\d+)\s*:/;
  if (spacing && numericKey.test(spacing[1]))
    add("échelle détournée", 'AD-1', 'tailwind.config.js', 0,
      "`spacing` porte une clé NUMÉRIQUE : elle écrase l'échelle rem de Tailwind par des pixels du kit, et divise par ~4 tous les p-/m-/gap- du dépôt sans qu'aucune porte ne le voie");
  if (/spacing:\s*Object\.fromEntries/.test(cfg))
    add("échelle détournée", 'AD-1', 'tailwind.config.js', 0,
      "`spacing` est construit par calcul : impossible de vérifier qu'aucune clé numérique n'écrase l'échelle rem. L'écrire en toutes lettres.");
}

/* ── Garde-fou · une classe qui ne génère AUCUN CSS ─────────────────────────
   Deuxième contrôle né d'un défaut commis, pas anticipé. Une migration de palette a laissé
   580 classes inertes dans 116 fichiers, et rien ne s'en est plaint : elles ne sont pas
   invalides, elles ne produisent simplement aucune règle. Le typecheck passe, la build passe,
   les six règles passent — et à l'écran un bandeau d'erreur n'a pas de fond, une barre haute
   est transparente, un texte hérite de la couleur de son parent.

   DEUX FORMES, deux causes distinctes :

   • `bg-forme/20` — le modificateur `/NN` exige que la couleur soit déclarée avec le marqueur
     `<alpha-value>`. Une couleur qui vaut `var(--mm-bleu)` ne l'a pas : Tailwind ne peut pas y
     injecter d'alpha, et n'émet rien. C'est pourquoi `bg-black/50` marche — couleur par défaut
     de Tailwind, déclarée avec le marqueur — et pas les nôtres. Écrire `color-mix()`.

   • `text-ink-2-2`, `text-informe-txt-txt` — un jeton dont le suffixe a été appliqué deux fois.
     Cause d'origine : un ordre d'alternance dans une expression régulière, `ink` testé avant
     `ink-2`. Dans une alternance, le plus long d'abord. */
{
  const TOKEN_COLORS = 'forme|informe|transforme|digitalise|corail|ink|paper|line|night|ok|warn|stop|surface';
  for (const f of [...TSX, ...MOBILE]) {
    lines(f).forEach((l, i) => {
      const opacity = l.match(new RegExp(`\\b(?:bg|text|border|ring|fill|divide)-(?:${TOKEN_COLORS})(?:-\\w+)?\\/\\d{1,3}\\b`));
      if (opacity)
        add('classe inerte', 'AD-2', rel(f), i + 1,
          `« ${opacity[0]} » ne génère AUCUN CSS : le modificateur /NN exige <alpha-value>, qu'une couleur en var() n'a pas. Écrire color-mix(in srgb, var(--x) N%, transparent)`);

      const arbitrary = l.match(/\[color:var\(--[a-z0-9-]+\)\]\/\d{1,3}/);
      if (arbitrary)
        add('classe inerte', 'AD-2', rel(f), i + 1,
          `« ${arbitrary[0]} » ne génère AUCUN CSS : même raison, sur une valeur arbitraire`);

      // Ancrée sur un PRÉFIXE UTILITAIRE : sans lui, la regex reconnaissait « 3-3 » dans les
      // coordonnées d'un tracé SVG du jeu d'icônes. Un motif trop large ne trouve pas plus de
      // défauts, il trouve juste plus de bruit — et un vérificateur bruyant finit ignoré.
      // Deux formes du même artefact : le suffixe collé à un nom de jeton (`text-ink-2-2`)
      // ET collé après le crochet fermant d'une valeur arbitraire
      // (`text-[color-mix(…var(--ink-2)…)]-2`). La seconde a survécu à la première
      // réparation, faute d'être cherchée.
      const doubled =
        l.match(/\b(?:bg|text|border|ring|fill|divide|stroke|outline|from|via|to)-[a-z-]+(?:-2-2|-3-3|-txt-txt)\b/)
        ?? l.match(/\b(?:bg|text|border|ring|fill|divide|stroke|outline|from|via|to)-\[[^\]]*\]-\d\b/);
      if (doubled)
        add('classe inerte', 'AD-2', rel(f), i + 1,
          `« ${doubled[0] }» : suffixe de jeton appliqué deux fois — la classe n'existe pas`);
    });
  }
}

/* ── Garde-fou · la palette PAR DÉFAUT de Tailwind n'est pas la palette du système ──
   Troisième contrôle né d'un défaut commis. `bg-gradient-to-r from-amber-500 to-orange-500`
   vivait dans le répétiteur, et AUCUNE porte ne le voyait : ce n'est pas un hexadécimal (AD-2
   ne cherche que `#…`), ce n'est pas une classe inerte (elle génère du CSS parfaitement
   valide), et le typecheck n'a rien à en dire.

   C'est pourtant la faute que le système redoute le plus : une couleur qui n'est dans aucun
   jeton ne bascule pas sous `.dk`, n'a pas de variante nuit, et n'a jamais été mesurée en
   contraste. `tailwind.config.js` avait déjà annulé `neutral` et `teal` pour cette raison
   exacte — mais seulement ces deux-là, parce qu'ils entraient en collision de NOM avec le
   système. Les vingt autres familles par défaut, elles, sont restées disponibles en silence.

   Le raisonnement est celui déjà écrit plus haut pour `backdrop-blur` : une règle qui ne
   regarde qu'une des deux façons d'écrire la même chose ne fait pas respecter la règle, elle
   fait respecter une orthographe. `#F59E0B` et `amber-500` sont la même couleur. */
{
  const FAMILLES = 'slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
  const PREFIXES = 'bg|text|border|ring|fill|stroke|divide|outline|from|via|to|placeholder|caret|accent|decoration|shadow';
  const HORS = new RegExp(`\\b(?:${PREFIXES})-(?:${FAMILLES})-\\d{2,3}\\b`);
  for (const f of [...TSX, ...MOBILE]) {
    const raw = rawLines(f);
    lines(f).forEach((l, i) => {
      const m = l.match(HORS);
      // L'échappatoire se lit sur la ligne BRUTE — voir rawLines(). Elle sert aux marques
      // tierces, qui ne se recolorent jamais (logo Google, sigles Wave et Orange Money).
      if (m && !OK_DS.test(raw[i] ?? ''))
        add('2 · hors palette', 'AD-2', rel(f), i + 1,
          `« ${m[0]} » vient de la palette par défaut de Tailwind : aucun jeton, aucune variante nuit, aucun contraste mesuré — passer par une teinte de territoire ou un jeton d'état`);
    });
  }
}

/* ── Rapport ───────────────────────────────────────────────────────────────── */
const byRule = new Map();
for (const f of findings) byRule.set(f.rule, (byRule.get(f.rule) ?? 0) + 1);

if (!findings.length) {
  console.log('ds:check — les six règles tiennent. 0 constat.');
  process.exit(0);
}

console.log(`\nds:check — ${findings.length} constat(s)\n`);
for (const [rule, n] of [...byRule].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)}  règle ${rule}`);

/*
 * Le détail est GROUPÉ PAR RÈGLE, avec un quota par règle.
 *
 * La version précédente affichait les 40 premiers constats dans l'ordre où ils tombaient :
 * une règle qui en produisait trois cents enterrait toutes les autres, et un garde-fou
 * ajouté en fin de fichier n'apparaissait jamais — ce qui est une façon coûteuse de n'avoir
 * pas de garde-fou du tout.
 */
if (!SUMMARY) {
  const PER_RULE = 6;
  const grouped = new Map();
  for (const f of findings) {
    if (!grouped.has(f.rule)) grouped.set(f.rule, []);
    grouped.get(f.rule).push(f);
  }
  for (const [rule, list] of [...grouped].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  ── règle ${rule} — ${list.length} constat(s)`);
    for (const f of list.slice(0, PER_RULE)) console.log(`     ${f.file}:${f.line}  [${f.ad}] ${f.detail}`);
    if (list.length > PER_RULE) console.log(`     … et ${list.length - PER_RULE} autre(s) sur cette règle`);
  }
  console.log('');
  process.exit(1);
}
console.log('\n(--summary : sortie 0 pour piloter une migration en cours)\n');
