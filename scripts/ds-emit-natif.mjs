/* ═══════════════════════════════════════════════════════════════════════════════════════
 * ÉMETTEUR DES VALEURS QUE LE KIT ÉCRIT EN DUR — cinquième cible du même CSS (AD-8).
 *
 * `ds-emit-kotlin.mjs` couvre les 225 JETONS. Mais le rendu du kit ne tient pas qu'aux
 * jetons : quinze lobes de maillage, sept voiles de verre Android, onze ombres et six
 * dégradés vivent en HEXADÉCIMAL LITTÉRAL dans `DS_Final/brand/*.css` et dans les
 * composants. Le port React Native les avait recopiés à la main — et c'est par là que la
 * dérive est entrée : les lobes relus par `mmBleu`/`mmViolet` changeaient de couleur la
 * nuit, là où le kit les écrit fixes.
 *
 * Ces valeurs sont donc EXTRAITES, jamais retapées. Chaque entrée porte son fichier et son
 * motif ; un motif qui n'apparie plus ARRÊTE la génération, parce qu'un extracteur qui rate
 * sans se plaindre est pire qu'un extracteur qui échoue.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { argb, degrade, ombre, couleur } from './ds-emit-kotlin.mjs';

const f = (n) => {
  const s = String(Math.round(n * 10000) / 10000);
  return (s.includes('.') ? s : `${s}.0`) + 'f';
};
const nb = (n) => (n < 0 ? `(${n})` : String(n));
const dp = (n) => `${nb(n)}.dp`;

/** Extrait un fragment, et ÉCHOUE si le motif n'apparie plus. */
function pecher(texte, motif, quoi, ou) {
  const m = motif.exec(texte);
  if (!m) throw new Error(
    `ds:natif — ${quoi} introuvable dans ${ou}. Le kit a bougé : reprendre le motif, `
    + 'ne jamais recopier la valeur à la main.',
  );
  return m;
}

const kOmbre = (v) => {
  const o = ombre(v);
  if (o === null) return 'null';
  return `Ombre(inset = ${o.inset}, dx = ${dp(o.dx)}, dy = ${dp(o.dy)}, `
    + `flou = ${dp(o.flou)}, etale = ${dp(o.etale)}, couleur = Color(${o.couleur}))`;
};
const kDegrade = (v) => {
  const g = degrade(v);
  return `Degrade(angleDeg = ${f(g.angle)}, arrets = listOf(`
    + g.arrets.map((a) => `${f(a.pos)} to Color(${a.couleur})`).join(', ') + '))';
};
const kArrets = (v) => {
  const g = degrade(v);
  if (g.angle !== 180) throw new Error(`ds:natif — voile attendu vertical (180deg), reçu ${g.angle}deg`);
  return 'listOf(' + g.arrets.map((a) => `${f(a.pos)} to Color(${a.couleur})`).join(', ') + ')';
};

/* ── LES QUINZE LOBES ────────────────────────────────────────────────────────────────── */
/*
 * ⛔ LES TEINTES SONT LITTÉRALES DANS LE KIT, ET ELLES NE BASCULENT PAS.
 * `.m-forme b:nth-child(1){background:#0057BC;...}` — pas de `var(--mm-bleu)`. Un lobe est
 * une PEINTURE, pas un texte : il n'a aucun plancher de contraste à tenir, c'est le voile
 * qui s'en charge. Les lire par jeton donnerait #6FB1FF la nuit, et le maillage entier
 * changerait de couleur. C'est le contournement du port RN, faux et mesurable.
 */
const TERRITOIRES_MAILLAGE = ['forme', 'informe', 'transforme', 'digitalise', 'nuit'];

function lobes(css, territoire) {
  const out = [];
  for (let i = 1; i <= 3; i++) {
    const m = pecher(
      css,
      new RegExp(`\\.m-${territoire} b:nth-child\\(${i}\\)\\{([^}]*)\\}`),
      `lobe ${i} de ${territoire}`, 'brand/mesh.css',
    );
    const corps = m[1];
    const teinte = pecher(corps, /background:(#[0-9A-Fa-f]{3,8})/, 'teinte du lobe', 'mesh.css')[1];
    /* L'opacité n'est écrite que si elle diffère du .9 de `.mesh b`. */
    const op = /opacity:([\d.]+)/.exec(corps);
    const opacite = op ? parseFloat(op[1]) : 0.9;

    /* Les quatre ancrages du CSS, transcrits littéralement. `left:auto` / `top:auto`
       neutralisent l'axe opposé : c'est ce qui fait qu'un lobe s'accroche à droite ou en bas. */
    const axe = (props) => {
      for (const [prop, type] of props) {
        const mm = new RegExp(`(?:^|;)${prop}:(-?[\\d.]+)px`).exec(corps);
        if (mm) return `${type}(${dp(parseFloat(mm[1]))})`;
      }
      throw new Error(`ds:natif — lobe ${i} de ${territoire} sans ancrage ${props[0][0]}`);
    };
    const x = axe([['left', 'Gauche'], ['right', 'Droite']]);
    const y = axe([['top', 'Haut'], ['bottom', 'Bas']]);
    out.push(`Lobe(teinte = Color(${argb(teinte)}), opacite = ${f(opacite)}, x = ${x}, y = ${y})`);
  }
  return out;
}

/* ── LES ONZE OMBRES ET LES DÉGRADÉS QUE LE KIT N'A PAS MIS EN JETON ─────────────────── */
/*
 * Chacune est une valeur de RENDU que rien ne garde aujourd'hui : elle ne vit ni dans
 * `tokens/`, ni dans `overrides/`, mais dans le corps d'un composant. Les extraire ici les
 * rend au moins uniques et vérifiables — et la liste elle-même est ce qu'il faudra faire
 * remonter au kit à la prochaine relivraison.
 */
const HORS_TABLE = [
  // ── Ombres ──
  { nom: 'ombreBoutonInforme', genre: 'ombre', fichier: 'components/actions/Button.jsx',
    motif: /informe:\{[^}]*boxShadow:'([^']+)'/ },
  { nom: 'ombreChromeRond', genre: 'ombre', fichier: 'components/actions/IconButton.jsx',
    motif: /boxShadow:'var\(--chrome-hl\),([^']+)'/ },
  { nom: 'ombreBulleMoi', genre: 'ombre', fichier: 'components/data/ChatBubble.jsx',
    motif: /borderBottomRightRadius:'7px',boxShadow:'([^']+)'/ },
  { nom: 'ombreBoutonLecture', genre: 'ombre', fichier: 'components/data/MediaCard.jsx',
    motif: /boxShadow:'(0 8px 22px[^']+)'/ },
  { nom: 'ombreCurseurInterrupteur', genre: 'ombre', fichier: 'components/forms/Switch.jsx',
    motif: /boxShadow:'(0 2px 6px[^']+)'/ },
  { nom: 'ombrePastilleLogo', genre: 'ombre', fichier: 'components/brand/LogoMark.jsx',
    motif: /boxShadow:plate\?'([^']+)'/ },
  { nom: 'ombreSubNavActif', genre: 'ombre', fichier: 'components/navigation/SubNav.jsx',
    motif: /boxShadow:on\?'var\(--glass-hl\),([^']+)'/ },
  { nom: 'liseretHero', genre: 'ombre', fichier: 'brand/surfaces.css',
    motif: /\.glass-hero\{[^}]*box-shadow:(inset 0 1px 0 rgba\([^)]*\)),/ },
  { nom: 'liseretNuit', genre: 'ombre', fichier: 'brand/surfaces.css',
    motif: /\.glass-d\{[^}]*box-shadow:(inset 0 1px 0 rgba\([^)]*\)),/ },
  { nom: 'ombreNuit', genre: 'ombre', fichier: 'brand/surfaces.css',
    motif: /\.glass-d\{[^}]*box-shadow:inset 0 1px 0 rgba\([^)]*\),([^;]*);/ },
  { nom: 'ombreCarteEncre', genre: 'ombre', fichier: 'brand/surfaces.css',
    motif: /\.ink-card\{[^}]*box-shadow:([^;]*);/ },
  { nom: 'ombreFabBleu', genre: 'ombre', fichier: 'ui_kits/native/ScreensNatifApp.js',
    motif: /boxShadow:'(0 10px 26px rgba\(0,87,188[^']*)'/ },
  { nom: 'ombreFabViolet', genre: 'ombre', fichier: 'ui_kits/native/ScreensNatifClub.js',
    motif: /boxShadow:'(0 10px 26px rgba\(108,35,221[^']*)'/ },

  // ── Dégradés ──
  { nom: 'artMedia', genre: 'degrade', fichier: 'components/data/MediaCard.jsx',
    motif: /format==='audio'\s*\n?\s*\?\s*'([^']+)'/ },
  { nom: 'artVideo', genre: 'degrade', fichier: 'components/data/MediaCard.jsx',
    motif: /:\s*'(linear-gradient\(140deg,#0057BC[^']*)'/ },
  { nom: 'degradeProgression', genre: 'degrade', fichier: 'components/data/ProgressBar.jsx',
    motif: /background:'(linear-gradient\(90deg[^']*)'/ },
  { nom: 'degradeLeconCourante', genre: 'degrade', fichier: 'components/data/LessonRow.jsx',
    motif: /background:'(linear-gradient\(135deg,rgba\(0,87,188[^']*)'/ },

  // ── Voiles littéraux ──
  /* Ces quatre-là sont des teintes de MARQUE posées sur un aplat de marque : elles ne
     basculent pas plus que les lobes. Le kit les écrit en rgba littéral. */
  { nom: 'voileCocheViolet', genre: 'couleur', fichier: 'components/data/CheckLine.jsx',
    motif: /violet:\{bg:'(rgba\([^)]*\))'/ },
  { nom: 'voileCocheOk', genre: 'couleur', fichier: 'components/data/CheckLine.jsx',
    motif: /ok:\{bg:'(rgba\([^)]*\))'/ },
  { nom: 'voilePuceFaite', genre: 'couleur', fichier: 'components/data/LessonRow.jsx',
    motif: /borderRadius:'50%',background:'(rgba\(15,123,82[^']*)'/ },
  { nom: 'voileBadgeMedia', genre: 'couleur', fichier: 'components/data/MediaCard.jsx',
    motif: /background:'(rgba\(0,0,0,\.5\))'/ },
];

/* ── LES MARQUES TIERCES ─────────────────────────────────────────────────────────────── */
/*
 * ⛔ ELLES NE SUIVENT PAS LE THÈME, ET C'EST LA RAISON INVERSE DE LA RÈGLE GÉNÉRALE.
 *
 * Partout ailleurs, une valeur figée est un défaut de mode sombre garanti. Ici, non :
 * Google impose ses quatre couleurs et Apple impose son noir. Les faire basculer serait un
 * motif de rejet en revue — sur l'écran de connexion, celui que tout le monde voit.
 *
 * Elles passent quand même par le générateur : les écrire à la main dans le Kotlin ferait
 * du fichier de marques le SEUL endroit du produit où une couleur vit hors génération, et
 * la porte qui l'interdit devrait s'ouvrir pour lui. Une porte à exception ne garde plus
 * rien. Elles sont déclarées ici, avec leur origine, et nulle part ailleurs.
 *
 * Source : identité de marque Google (« Sign in with Google » — bleu, vert, jaune, rouge).
 */
const MARQUES_TIERCES = [
  ['googleBleu', '#4285F4'],
  ['googleVert', '#34A853'],
  ['googleJaune', '#FBBC05'],
  ['googleRouge', '#EA4335'],
];

/* ── LA POLITIQUE DE FLOU D'ANDROID ─────────────────────────────────────────────────── */
/*
 * ⛔ LE TABLEAU EST À DEUX DIMENSIONS : plateforme × mode, jamais deux tables empilées.
 * Le kit lui-même s'est fait avoir sur ce point ailleurs — `brand/fallback.css:58` écrit
 * `.lowfi .dk .glass`, un combinateur DESCENDANT alors que les deux classes sont posées sur
 * le MÊME élément : le sélecteur ne s'apparie jamais, et sur un téléphone modeste réglé en
 * sombre la barre haute rendait blanc à 90 %. Les sélecteurs `.andro.dk` de `native.css`,
 * eux, sont COMPOSÉS et justes. On lit ceux-là.
 */
const VERRE_ANDRO = [
  ['glass', /\.andro \.glass\{background:(rgba\([^)]*\))\}/],
  ['glassHero', /\.andro \.glass-hero\{background:(rgba\([^)]*\))\}/],
  ['glassD', /\.andro \.glass-d\{background:(rgba\([^)]*\))\}/],
  ['truth', /\.andro \.truth\{background:(rgba\([^)]*\))\}/],
  ['dkGlass', /\.andro\.dk \.glass\{background:(rgba\([^)]*\))\}/],
  ['dkGlassHero', /\.andro\.dk \.glass-hero\{background:(rgba\([^)]*\))\}/],
  ['dkTruth', /\.andro\.dk \.truth\{background:(rgba\([^)]*\))\}/],
];

/* ── LES SIX NIVEAUX DE VERRE, LUS SUR LES CLASSES ET NON SUR LES JETONS ─────────────── */
/*
 * ⛔ LE KIT ET SES PROPRES JETONS SE CONTREDISENT EN MODE SOMBRE, ET C'EST LE KIT QUI REND.
 *
 * `tokens/dark.css` déclare `--surface-card:rgba(255,255,255,.075)`, `--surface-hero:.055`
 * et `--surface-card-flat:.055`. Mais `brand/surfaces.css` — que `GlassPanel` applique en
 * CLASSE — écrit `.dk .glass{background:rgba(255,255,255,.09)}`, `.dk .glass-hero{.08}` et
 * `.dk .glass-flat{.07}`. Ce qui s'affiche au web, c'est la classe : elle gagne.
 *
 * Trois valeurs de plus n'existent nulle part ailleurs : les liserés par niveau (.62 pour
 * le héros, .70 pour le faux verre, .60 pour l'encart de vérité) et l'ombre nuit du héros.
 * Les lire par `glassBrd` donnerait 0,55 partout — et `glassBrd` NE BASCULE PAS, alors que
 * `.dk .glass` redéclare `border-color:rgba(255,255,255,.13)`.
 *
 * On extrait donc les six recettes ENTIÈRES, dans les deux modes, en résolvant les `var()`
 * contre les deux tables de jetons.
 */
const NIVEAUX_VERRE = [
  ['chrome', '.glass', '.dk .glass'],
  ['hero', '.glass-hero', '.dk .glass-hero'],
  ['flat', '.glass-flat', '.dk .glass-flat'],
  ['night', '.glass-d', null],
  ['ink', '.ink-card', null],
  ['truth', '.truth', '.dk .truth'],
];

/** Les déclarations d'une règle, sans résolution. Le sélecteur est apparié EXACTEMENT. */
function regle(css, selecteur) {
  const echappe = selecteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|[},])\\s*${echappe}\\s*\\{([^{}]*)\\}`, 'm').exec(css);
  if (!m) return null;
  const out = {};
  for (const decl of m[1].split(';')) {
    const d = /^\s*([a-z-]+)\s*:\s*([\s\S]+?)\s*$/i.exec(decl);
    if (d) out[d[1]] = d[2].trim();
  }
  return out;
}

/** Résout les `var(--x)` d'une valeur contre une table de jetons déjà aplatie. */
function resoudreVar(valeur, table) {
  return valeur.replace(/var\(\s*--([a-z0-9-]+)\s*\)/gi, (_, nom) => {
    const clef = nom.replace(/-([a-z0-9])/g, (__, c) => c.toUpperCase());
    if (table[clef] === undefined) throw new Error(`ds:natif — var(--${nom}) sans jeton correspondant`);
    return table[clef];
  });
}

/**
 * Une recette de verre, résolue pour un mode.
 * `box-shadow` porte au plus deux entrées : un liseré intérieur et une ombre portée.
 */
function recetteVerre(css, base, dk, table, mode) {
  const brut = regle(css, base);
  if (!brut) throw new Error(`ds:natif — règle ${base} introuvable dans brand/surfaces.css`);
  const decl = { ...brut };
  if (mode === 'sombre' && dk) Object.assign(decl, regle(css, dk) || {});

  const fond = resoudreVar(decl.background, table);
  /* `.dk .glass` redéclare `border-color` sans réécrire `border` : on recompose. */
  const bordure = resoudreVar(decl['border-color'] ?? /solid\s+([\s\S]+)$/.exec(resoudreVar(decl.border, table))[1], table);

  let lumiere = 'none';
  let ombre = 'none';
  const brutOmbre = decl['box-shadow'];
  if (brutOmbre && brutOmbre !== 'none') {
    for (const part of niveaux(resoudreVar(brutOmbre, table))) {
      if (part === 'none') continue;
      if (/^inset\s/i.test(part)) lumiere = part; else ombre = part;
    }
  }
  const rayon = dimensionPx(resoudreVar(decl['border-radius'], table));
  const rembourrage = decl.padding ? dimensionPx(resoudreVar(decl.padding, table)) : 0;

  return `RecetteVerre(fond = Color(${argb(fond)}), liseret = Color(${argb(bordure)}), `
    + `lumiere = ${kOmbre(lumiere)}, ombre = ${kOmbre(ombre)}, `
    + `rayon = ${dp(rayon)}, rembourrage = ${dp(rembourrage)})`;
}

/** Découpe une liste CSS au premier niveau — les virgules DANS rgba(...) ne coupent pas. */
function niveaux(s) {
  const out = []; let prof = 0; let cour = '';
  for (const ch of s) {
    if (ch === '(') prof++;
    if (ch === ')') prof--;
    if (ch === ',' && prof === 0) { out.push(cour.trim()); cour = ''; continue; }
    cour += ch;
  }
  if (cour.trim()) out.push(cour.trim());
  return out;
}

const dimensionPx = (v) => {
  const m = /^(-?[\d.]+)px$/.exec(v.trim());
  if (!m) throw new Error(`ds:natif — longueur non reconnue : ${JSON.stringify(v)}`);
  return parseFloat(m[1]);
};

/**
 * Émet `Natif.generated.kt`.
 * `racine` est la racine du dépôt ; l'émetteur lit le kit ET les overrides du produit.
 * `L` et `D` sont les deux tables de jetons déjà aplaties, pour résoudre les `var()`.
 */
export function emettreNatif(racine, entete, L, D) {
  const kit = (p) => readFileSync(join(racine, 'DS_Final', p), 'utf8');
  const src = (p) => readFileSync(join(racine, 'src/design-system/css', p), 'utf8');

  const meshCss = src('brand/mesh.css');
  const natifCss = kit('brand/native.css');
  const voileCss = src('overrides/ad-18-voile.css');

  /* ── Les fonds de boîte ── */
  const fondClair = pecher(meshCss, /\.mesh\{[^}]*background:(#[0-9A-Fa-f]{3,8})\}/, 'fond du maillage', 'mesh.css')[1];
  const fondNuit = pecher(meshCss, /\.m-nuit\{background:(#[0-9A-Fa-f]{3,8})\}/, 'fond du maillage nuit', 'mesh.css')[1];
  const fondSombre = pecher(meshCss, /\.dk \.mesh\{background:(#[0-9A-Fa-f]{3,8})\}/, 'fond du maillage sombre', 'mesh.css')[1];

  /*
   * ⚠️ CONTRADICTION KIT / PRODUIT, TRANCHÉE EN FAVEUR DU PRODUIT.
   * `DS_Final/brand/mesh.css` pose le premier arrêt du voile à .42. `overrides/ad-18-voile.css`
   * le remonte à .60, SUR MESURE : à .42, l'encre secondaire #5A6472 tient 3,93:1 — échec ;
   * à .60 elle tient 4,51:1. `overrides/` est la source des jetons du produit, et le voile du
   * kit échoue une mesure que le produit a faite. On lit donc AD-18, pas mesh.css.
   */
  const voileClair = pecher(voileCss, /\.mesh::after\{\s*background:(linear-gradient\([\s\S]*?\));/, 'voile clair', 'ad-18-voile.css')[1];
  const voileNuit = pecher(voileCss, /\.m-nuit::after\{\s*background:(linear-gradient\([\s\S]*?\));/, 'voile nuit', 'ad-18-voile.css')[1];
  const voileSombre = pecher(voileCss, /\.dk \.mesh::after\{\s*background:(linear-gradient\([\s\S]*?\));/, 'voile sombre', 'ad-18-voile.css')[1];

  /* ── Le côté du lobe, et les hauteurs de barre ── */
  const coteLobe = parseFloat(pecher(meshCss, /\.mesh b\{[^}]*width:([\d.]+)px/, 'côté du lobe', 'mesh.css')[1]);
  const flouLobe = parseFloat(pecher(meshCss, /\.mesh b\{[^}]*filter:blur\(([\d.]+)px\)/, 'flou du lobe', 'mesh.css')[1]);
  const coteAndro = parseFloat(pecher(kit('ui_kits/native/NativeShell.js'), /os==='android'\?(\d+):(\d+)/, 'côté du lobe Android', 'NativeShell.js')[1]);
  const navIos = parseFloat(pecher(natifCss, /--navbar-ios:([\d.]+)px/, 'hauteur de barre iOS', 'native.css')[1]);
  const navAndro = parseFloat(pecher(natifCss, /--navbar-andro:([\d.]+)px/, 'hauteur de barre Android', 'native.css')[1]);

  /* ── Les lobes ── */
  const tables = TERRITOIRES_MAILLAGE.map((t) => {
    const l = lobes(meshCss, t);
    return `  val ${t}: List<Lobe> = listOf(\n${l.map((x) => `    ${x},`).join('\n')}\n  )`;
  }).join('\n');

  /* ── Le verre Android ── */
  const verre = VERRE_ANDRO.map(([nom, motif]) => {
    const v = pecher(natifCss, motif, `verre .andro ${nom}`, 'brand/native.css')[1];
    return `  val ${nom}: Color = Color(${argb(v)})`;
  }).join('\n');

  /*
   * ── Les six recettes de verre, dans les deux modes ──
   * ⚠️ `.ink-card` NE VIT PAS dans `brand/surfaces.css` : c'est un écart du produit, déclaré
   * par `overrides/ad-25-encre-plancher.css`. Ne lire que le premier fichier ferait échouer
   * l'extraction — ce qui est le comportement voulu, et c'est ainsi qu'on l'a trouvé.
   * Les commentaires sont retirés d'abord : `.ink-card` y est CITÉ trois fois.
   */
  const surfacesCss = (src('brand/surfaces.css') + '\n' + src('overrides/ad-25-encre-plancher.css'))
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const recettes = NIVEAUX_VERRE.map(([nom, base, dk]) =>
    `  val ${nom}Clair: RecetteVerre = ${recetteVerre(surfacesCss, base, dk, L, 'clair')}\n`
    + `  val ${nom}Sombre: RecetteVerre = ${recetteVerre(surfacesCss, base, dk, D, 'sombre')}`).join('\n');

  /* ── Les valeurs hors table ── */
  const hors = HORS_TABLE.map((e) => {
    const texte = readFileSync(join(racine, 'DS_Final', e.fichier), 'utf8');
    const v = pecher(texte, e.motif, e.nom, e.fichier)[1].trim();
    const rendu = e.genre === 'ombre' ? kOmbre(v)
      : e.genre === 'degrade' ? kDegrade(v)
        : `Color(${argb(v)})`;
    const type = e.genre === 'ombre' ? 'Ombre?' : e.genre === 'degrade' ? 'Degrade' : 'Color';
    return `  /** ${e.fichier} */\n  val ${e.nom}: ${type} = ${rendu}`;
  }).join('\n');

  const kotlin = `${entete}
package me.maxmorrys.rysmo.ds

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * LE MAILLAGE — cinq territoires, quinze lobes, trois voiles.
 *
 * ⛔ Les teintes sont LITTÉRALES et ne basculent pas en mode sombre. Le kit les écrit
 * ainsi (\`brand/mesh.css\`), et c'est délibéré : un lobe est une peinture, pas un texte.
 * Les relire par \`mmBleu\` / \`mmViolet\` / \`mmOrange\` / \`mmTeal\` donnerait
 * #6FB1FF / #B98CFF / #FFB24D / #3FD9C6 la nuit — le maillage changerait de couleur.
 *
 * ⛔ Le maillage \`nuit\` n'est pas « le maillage clair en sombre » : c'est un CINQUIÈME
 * territoire, déclaré en valeur.
 */
@Immutable
object Maillage {

  /** Le côté de la boîte du lobe. Le kit en pose 340 sur iOS et ${coteAndro} sur Android. */
  val coteIos: Dp = ${dp(coteLobe)}
  val coteAndro: Dp = ${dp(coteAndro)}

  /**
   * L'écart-type de la gaussienne du kit — \`filter: blur(${flouLobe}px)\`.
   *
   * ⛔ C'EST UNE LONGUEUR, PAS UN NOMBRE, et l'unité décide du rendu.
   * Émis en \`Float\` dans une première version, il se retrouvait comparé à un rayon
   * exprimé en PIXELS : sur un écran à 420 dpi, le rapport R/σ passait de 4,4 à 11,6 et
   * les lobes rendaient presque nets. Le maillage restait beau — il n'était simplement
   * plus celui du kit, et aucune porte ne pouvait le voir.
   */
  val sigmaFlou: Dp = ${dp(flouLobe)}

  val fondClair: Color = Color(${argb(fondClair)})
  val fondNuit: Color = Color(${argb(fondNuit)})
  val fondSombre: Color = Color(${argb(fondSombre)})

  /**
   * Les voiles de lisibilité, en valeurs AD-18 (0,60 / 0,78 / 0,90 en clair).
   * Le kit pose 0,42 en haut ; la mesure du produit le refuse — l'encre secondaire
   * #5A6472 y tient 3,93:1, et 4,51:1 à 0,60. Livrer 0,42 sur Android reproduirait un
   * défaut déjà corrigé au web.
   */
  val voileClair: List<Pair<Float, Color>> = ${kArrets(voileClair)}
  val voileNuit: List<Pair<Float, Color>> = ${kArrets(voileNuit)}
  val voileSombre: List<Pair<Float, Color>> = ${kArrets(voileSombre)}

${tables}
}

/**
 * LE VERRE SOUS \`.andro\` — la table plateforme × mode.
 *
 * « Sur Android, le repli EST le cas normal — décision assumée, pas une dégradation.
 * RenderEffect demande API 31+, et le marché visé est bas de gamme. »
 * (\`DS_Final/brand/native.css\`)
 *
 * ⚠️ \`.glass-flat\` N'Y FIGURE PAS : le faux verre n'a jamais eu de flou, il garde
 * \`surfaceCardFlat\` sur les deux plateformes. Il n'y a rien à compenser.
 * ⚠️ \`.andro.dk .glass-d\` n'existe pas non plus : le verre nuit reste à sa valeur claire
 * dans les deux modes — c'est déjà une surface de nuit.
 */
@Immutable
object VerreAndro {
${verre}
}

/** Une recette de surface, telle que \`brand/surfaces.css\` la déclare pour un mode. */
@Immutable
data class RecetteVerre(
  val fond: Color,
  val liseret: Color,
  /** L'ombre INTÉRIEURE — un liseré de lumière de 1 dp en haut, jamais une ombre. */
  val lumiere: Ombre?,
  val ombre: Ombre?,
  val rayon: Dp,
  /** Seul \`truth\` en porte un : 15 dp, déclaré sur la classe. */
  val rembourrage: Dp,
)

/**
 * LES SIX NIVEAUX DE VERRE, LUS SUR LES CLASSES DU KIT.
 *
 * ⛔ LE KIT ET SES PROPRES JETONS SE CONTREDISENT EN MODE SOMBRE, ET C'EST LE KIT QUI REND.
 * \`tokens/dark.css\` déclare \`--surface-card\` à 0,075 et \`--surface-hero\` à 0,055 ;
 * \`brand/surfaces.css\` — que \`GlassPanel\` applique en CLASSE — écrit
 * \`.dk .glass{background:rgba(255,255,255,.09)}\` et \`.dk .glass-hero{.08}\`. Ce qui
 * s'affiche au web, c'est la classe.
 *
 * ⛔ ET LES LISERÉS NE SONT PAS TOUS \`glassBrd\`. Le héros pose 0,62, le faux verre 0,70,
 * l'encart de vérité 0,60, la carte d'encre 0,10 — et \`glassBrd\` NE BASCULE PAS, alors que
 * \`.dk .glass\` redéclare \`border-color\` à 0,13. Les lire par le jeton donnerait 0,55
 * partout, dans les deux modes.
 */
@Immutable
object Verre {
${recettes}
}

/**
 * LES MARQUES TIERCES — la seule famille de teintes qui ne bascule JAMAIS.
 *
 * ⛔ C'est la raison INVERSE de la règle générale. Partout ailleurs, une couleur figée est
 * un défaut de mode sombre garanti ; ici, Google impose ses quatre couleurs et Apple impose
 * son asset et son noir. Les faire basculer serait un motif de rejet en revue, sur l'écran
 * de connexion.
 *
 * ⚠️ La pomme n'est PAS ici : Apple interdit un dessin refait. L'asset officiel doit être
 * déposé avant toute soumission ; d'ici là, \`AppleMark\` rend un emplacement réservé.
 */
@Immutable
object MarqueTierce {
${MARQUES_TIERCES.map(([n, v]) => `  val ${n}: Color = Color(${argb(v)})`).join('\n')}
}

/** Les hauteurs de chrome que le kit fixe par plateforme. */
@Immutable
object ChromeNatif {
  val navbarIos: Dp = ${dp(navIos)}
  val navbarAndro: Dp = ${dp(navAndro)}
}

/**
 * CE QUE LE KIT ÉCRIT DANS SES COMPOSANTS, HORS TABLE DE JETONS.
 *
 * Onze ombres, quatre dégradés et quatre voiles qui ne vivent ni dans \`tokens/\` ni dans
 * \`overrides/\`. Ils sont extraits d'ici pour rester uniques et vérifiables — et cette
 * liste EST ce qu'il faut faire remonter au kit à la prochaine relivraison.
 */
@Immutable
object HorsTable {
${hors}
}
`;

  /*
   * ⛔ LA PORTE QUI A MANQUÉ UNE FOIS. Kotlin imbrique les commentaires de bloc : une
   * séquence d'ouverture écrite dans une phrase commente tout ce qui suit, et le
   * compilateur ne le dit qu'à la dernière ligne, sous une erreur sans rapport.
   */
  let profondeur = 0;
  for (let i = 0; i < kotlin.length - 1; i++) {
    if (kotlin[i] === '/' && kotlin[i + 1] === '*') { profondeur++; i++; }
    else if (kotlin[i] === '*' && kotlin[i + 1] === '/') { profondeur--; i++; }
  }
  if (profondeur !== 0) throw new Error(
    `ds:natif — commentaires de bloc déséquilibrés (solde ${profondeur}).`,
  );

  /* Un dernier contrôle de sens : le voile d'AD-18 doit bien partir à 0,60, pas à 0,42. */
  const premier = couleur(degrade(voileClair).arrets[0] && /rgba\([^)]*\)/.exec(voileClair)[0]);
  if (Math.abs(premier.a - 0.6) > 0.001) throw new Error(
    `ds:natif — le premier arrêt du voile clair vaut ${premier.a}, pas 0.60. `
    + 'AD-18 est la valeur retenue pour le natif : vérifier que overrides/ad-18-voile.css est bien lu.',
  );

  return kotlin;
}
