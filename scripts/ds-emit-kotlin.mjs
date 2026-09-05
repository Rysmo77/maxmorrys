/* ═══════════════════════════════════════════════════════════════════════════════════════
 * ÉMETTEUR KOTLIN / COMPOSE — quatrième cible du même CSS (AD-8).
 *
 * ⛔ CE QUE CET ÉMETTEUR REFUSE DE FAIRE, ET POURQUOI.
 *
 * Le port React Native ne parsait NI les 10 `linear-gradient(...)` NI les 21 valeurs
 * composites : il les contournait en relisant les teintes par leur jeton d'origine. Le
 * contournement est mesurablement faux — `arc`, `arcForme`, `arcInforme`,
 * `arcTransforme`, `arcDigitalise` et `arcAgence` DIVERGENT en mode sombre, et lire
 * leurs teintes source rendait la version claire dans les deux modes.
 *
 * Ici, chaque valeur est PARSÉE. Une valeur que l'émetteur ne sait pas classer arrête la
 * génération. C'est la règle du dépôt : « un extracteur qui rate sans se plaindre est pire
 * qu'un extracteur qui échoue. »
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

/** `#abc` / `#rrggbb` / `#rrggbbaa` -> {r,g,b,a} en 0-255 et 0-1. */
function hex(v) {
  let h = v.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) throw new Error(`couleur hex illisible : ${v}`);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  };
}

/** Toute écriture de couleur du DS -> {r,g,b,a}. Lève si la forme est inconnue. */
export function couleur(v) {
  const s = v.trim();
  if (s.startsWith('#')) return hex(s);
  let m = /^rgba?\(([^)]*)\)$/i.exec(s);
  if (m) {
    const p = m[1].split(',').map((x) => x.trim());
    if (p.length < 3) throw new Error(`rgb() incomplet : ${v}`);
    return { r: +p[0], g: +p[1], b: +p[2], a: p[3] === undefined ? 1 : parseFloat(p[3]) };
  }
  /* `color-mix(in srgb, A p%, B)` : A à p %, B au reste. Deux jetons de menu s'en servent,
     et sans ce cas ils tomberaient dans la branche d'erreur — donc la génération entière. */
  m = /^color-mix\(\s*in\s+srgb\s*,\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))\s+([\d.]+)%\s*,\s*(#[0-9a-f]{3,8}|rgba?\([^)]*\))\s*\)$/i.exec(s);
  if (m) {
    const A = couleur(m[1]), B = couleur(m[3]), p = parseFloat(m[2]) / 100;
    const mix = (x, y) => Math.round(x * p + y * (1 - p));
    return { r: mix(A.r, B.r), g: mix(A.g, B.g), b: mix(A.b, B.b), a: A.a * p + B.a * (1 - p) };
  }
  throw new Error(`ds:tokens/kotlin — couleur non reconnue : ${JSON.stringify(v)}`);
}

/** Compose veut de l'ARGB ; le CSS écrit du RGBA. L'ordre s'inverse, silencieusement si on l'oublie. */
export function argb(v) {
  const c = couleur(v);
  const n = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0').toUpperCase();
  return `0x${n(c.a * 255)}${n(c.r)}${n(c.g)}${n(c.b)}`;
}

/** Découpe une liste CSS au premier niveau : les virgules DANS rgba(...) ne coupent pas. */
function niveaux(s) {
  const out = []; let prof = 0, cour = '';
  for (const ch of s) {
    if (ch === '(') prof++;
    if (ch === ')') prof--;
    if (ch === ',' && prof === 0) { out.push(cour.trim()); cour = ''; continue; }
    cour += ch;
  }
  if (cour.trim()) out.push(cour.trim());
  return out;
}

/**
 * `linear-gradient(<angle>deg, <couleur> [<pos>%], …)` -> angle + arrêts.
 *
 * ⚠️ L'angle CSS est mesuré depuis le HAUT, dans le sens horaire (0deg = vers le haut).
 * Compose veut deux points. La conversion est faite côté Kotlin par `DegradeLineaire`,
 * pas ici : elle dépend de la taille du composant, inconnue à la génération.
 */
export function degrade(v) {
  const m = /^linear-gradient\(\s*([\s\S]*)\)$/i.exec(v.trim());
  if (!m) throw new Error(`ds:tokens/kotlin — dégradé non reconnu : ${v}`);
  const parts = niveaux(m[1]);
  const tete = parts[0];
  let angle = 180; // défaut CSS : de haut en bas
  let debut = 0;
  const ma = /^(-?[\d.]+)deg$/i.exec(tete);
  if (ma) { angle = parseFloat(ma[1]); debut = 1; }
  else if (/^to\s+/i.test(tete)) {
    const dirs = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 };
    const d = dirs[tete.toLowerCase().replace(/\s+/g, ' ')];
    if (d === undefined) throw new Error(`ds:tokens/kotlin — direction de dégradé non gérée : ${tete}`);
    angle = d; debut = 1;
  }
  const arrets = parts.slice(debut).map((p, i, tab) => {
    const mp = /^([\s\S]+?)(?:\s+([\d.]+)%)?$/.exec(p.trim());
    const pos = mp[2] !== undefined ? parseFloat(mp[2]) / 100 : (tab.length === 1 ? 0 : i / (tab.length - 1));
    return { pos, couleur: argb(mp[1].trim()) };
  });
  if (arrets.length < 2) throw new Error(`ds:tokens/kotlin — dégradé à moins de deux arrêts : ${v}`);
  return { angle, arrets };
}

/** `[inset] dx dy flou [étalement] <couleur>` ou `none`. */
export function ombre(v) {
  const s = v.trim();
  if (s === 'none' || s === '0') return null;
  const inset = /^inset\s+/i.test(s);
  const reste = s.replace(/^inset\s+/i, '');
  /* La couleur est en QUEUE et contient des virgules : on la découpe par la gauche, sur les
     longueurs, plutôt que par la droite sur une virgule qui n'est pas un séparateur. */
  const m = /^(-?[\d.]+(?:px)?)\s+(-?[\d.]+(?:px)?)\s+(-?[\d.]+(?:px)?)(?:\s+(-?[\d.]+(?:px)?))?\s+([\s\S]+)$/.exec(reste);
  if (!m) throw new Error(`ds:tokens/kotlin — ombre non reconnue : ${JSON.stringify(v)}`);
  const n = (x) => (x === undefined ? 0 : parseFloat(x));
  return { inset, dx: n(m[1]), dy: n(m[2]), flou: n(m[3]), etale: n(m[4]), couleur: argb(m[5]) };
}

/** `1.5px solid rgba(...)`. */
export function bordure(v) {
  const m = /^([\d.]+)px\s+solid\s+([\s\S]+)$/.exec(v.trim());
  if (!m) throw new Error(`ds:tokens/kotlin — bordure non reconnue : ${JSON.stringify(v)}`);
  return { epaisseur: parseFloat(m[1]), couleur: argb(m[2]) };
}

/** `12px` -> 12 ; `1.5rem` -> 24 (racine à 16). Le `%` et le `ch` ne sont PAS des longueurs. */
export function dimension(v) {
  const s = v.trim();
  let m = /^(-?[\d.]+)px$/.exec(s); if (m) return parseFloat(m[1]);
  m = /^(-?[\d.]+)r?em$/.exec(s);   if (m) return parseFloat(m[1]) * 16;
  m = /^(-?[\d.]+)$/.exec(s);       if (m && parseFloat(m[1]) === 0) return 0;
  throw new Error(`ds:tokens/kotlin — dimension non reconnue : ${JSON.stringify(v)}`);
}

/** Classe une valeur. L'ordre des tests compte : `0 0 0 3px rgba(...)` n'est pas un nombre. */
export function classe(v) {
  const s = v.trim();
  if (/^(#|rgba?\(|hsla?\(|color-mix\()/i.test(s)) return 'couleur';
  if (/gradient\(/i.test(s)) return 'degrade';
  if (/^[\d.]+px\s+solid\s/i.test(s)) return 'bordure';
  if (/^(inset\s+)?-?[\d.]+(px)?\s+-?[\d.]+(px)?\s/i.test(s)) return 'ombre';
  if (/^none$/i.test(s)) return 'ombre';
  if (/^-?[\d.]+(px|r?em)$/i.test(s)) return 'dimension';
  if (/^[\d.]+m?s$/i.test(s)) return 'duree';
  if (/^-?[\d.]+$/.test(s)) return 'nombre';
  if (/^(cubic-bezier\(|ease|linear$|steps\()/i.test(s)) return 'courbe';
  if (/^[\d.]+ch$/i.test(s)) return 'mesure';
  /* `170%` : la saturation du verre. Compose n'a pas de `backdrop-filter` ; la valeur est
     tout de même émise, parce qu'elle décrit une intention que le rendu devra approcher. */
  if (/^[\d.]+%$/.test(s)) return 'pourcentage';
  if (/^['"]|,\s*(sans-serif|serif|monospace)$/i.test(s)) return 'police';
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════════════════
 * LA SÉRIALISATION KOTLIN
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

/** Les catégories qui dépendent du mode. Les autres sont communes — et c'est VÉRIFIÉ. */
const MODALES = new Set(['couleur', 'degrade', 'ombre', 'bordure']);

const f = (n) => {
  const s = String(Math.round(n * 10000) / 10000);
  return (s.includes('.') ? s : `${s}.0`) + 'f';
};

/** Une valeur négative en Kotlin doit être parenthésée avant `.dp` : `(-14).dp`. */
const nb = (n) => (n < 0 ? `(${n})` : String(n));

function valeurKotlin(cat, brut, nom) {
  switch (cat) {
    case 'couleur':
      return `Color(${argb(brut)})`;
    case 'degrade': {
      const g = degrade(brut);
      const arrets = g.arrets.map((a) => `${f(a.pos)} to Color(${a.couleur})`).join(', ');
      return `Degrade(angleDeg = ${f(g.angle)}, arrets = listOf(${arrets}))`;
    }
    case 'ombre': {
      const o = ombre(brut);
      if (o === null) return 'null';
      return `Ombre(inset = ${o.inset}, dx = ${nb(o.dx)}.dp, dy = ${nb(o.dy)}.dp, `
        + `flou = ${nb(o.flou)}.dp, etale = ${nb(o.etale)}.dp, couleur = Color(${o.couleur}))`;
    }
    case 'bordure': {
      const b = bordure(brut);
      return `Bordure(epaisseur = ${nb(b.epaisseur)}.dp, couleur = Color(${b.couleur}))`;
    }
    case 'dimension': {
      /* ⛔ TROIS UNITÉS DERRIÈRE UN SEUL MOT. `15px` de corps de texte n'est PAS `15px` de
         marge : la première suit le réglage de taille de police du système (sp), la seconde
         non (dp). Les confondre rend une application qui ignore l'accessibilité — et le
         défaut est invisible tant qu'on ne change pas le réglage. */
      if (/em$/.test(brut)) return `${f(parseFloat(brut))}.em`;      // approche : lsDsp…
      if (/^fs/.test(nom)) return `${nb(dimension(brut))}.sp`;       // corps : fsBody…
      return `${nb(dimension(brut))}.dp`;                            // longueur : sp16, rXl…
    }
    case 'nombre':
      if (/^weight/.test(nom)) return `FontWeight(${parseInt(brut, 10)})`;
      return f(parseFloat(brut));
    case 'duree':
      return `${Math.round(parseFloat(brut))}`;                      // millisecondes
    case 'courbe': {
      const m = /^cubic-bezier\(([^)]*)\)$/i.exec(brut.trim());
      if (!m) throw new Error(`ds:tokens/kotlin — courbe non gérée : ${brut}`);
      const p = m[1].split(',').map((x) => f(parseFloat(x)));
      return `CubicBezierEasing(${p.join(', ')})`;
    }
    case 'mesure':
      return `${parseInt(brut, 10)}`;                                 // largeur en caractères
    case 'pourcentage':
      return f(parseFloat(brut) / 100);
    case 'police':
      /*
       * On ne garde que la première famille : les replis CSS n'ont pas d'équivalent sur
       * Android, où le repli est décidé par le système.
       *
       * ⛔ CE N'EST PAS UN NOM DE RESSOURCE, et le confondre mène droit dans un mur.
       * `aapt2` n'accepte dans `res/font/` que des noms en [a-z0-9_] : « Schibsted
       * Grotesk » ne pourra JAMAIS être un identifiant de ressource. La chaîne émise ici
       * est le nom de la famille tel que le DESIGN la nomme ; la correspondance vers les
       * neuf fichiers déposés est explicite, écrite à la main dans `Polices.kt`, et gardée
       * dans les deux sens par un test.
       */
      return JSON.stringify(brut.split(',')[0].replace(/['"]/g, '').trim());
    default:
      throw new Error(`ds:tokens/kotlin — catégorie sans sérialiseur : ${cat} (${nom})`);
  }
}

const TYPE = {
  couleur: 'Color', degrade: 'Degrade', ombre: 'Ombre?', bordure: 'Bordure',
  nombre: 'Float', duree: 'Int', courbe: 'Easing', mesure: 'Int',
  pourcentage: 'Float', police: 'String',
};
const typeDimension = (nom, brut) =>
  (/em$/.test(brut) ? 'TextUnit' : /^fs/.test(nom) ? 'TextUnit' : 'Dp');

/**
 * Émet le fichier Kotlin des jetons depuis les deux tables résolues.
 * Rend `{ kotlin, xmlClair, xmlSombre }`.
 */
export function emettreKotlin(L, D, entete) {
  const noms = Object.keys(L).sort();

  const modaux = [], communs = [];
  for (const nom of noms) {
    const cat = classe(L[nom]);
    if (cat === null) throw new Error(`ds:tokens/kotlin — valeur non classée : ${nom} = ${JSON.stringify(L[nom])}`);
    if (MODALES.has(cat)) {
      /* ⚠️ Quatre jetons changent de FORME entre les modes — `line` passe de `#E2E7EC` à
         `rgba(255,255,255,.1)`. Les deux restent des couleurs, donc le type tient ; mais
         une catégorie qui changerait vraiment (couleur -> dégradé) casserait le type de la
         palette sans que rien ne le dise. On l'interdit ici. */
      const catD = classe(D[nom]);
      if (catD !== cat) throw new Error(
        `ds:tokens/kotlin — ${nom} change de catégorie entre les modes : ${cat} -> ${catD}. `
        + 'La palette ne peut pas porter deux types pour un même jeton.',
      );
      modaux.push([nom, cat]);
    } else {
      if (L[nom] !== D[nom]) throw new Error(
        `ds:tokens/kotlin — ${nom} (${cat}) diverge entre les modes : ${L[nom]} / ${D[nom]}. `
        + 'Seules les couleurs, dégradés, ombres et bordures vivent dans la palette ; '
        + 'une métrique qui dépend du mode doit y être déplacée explicitement.',
      );
      communs.push([nom, cat]);
    }
  }

  const champs = modaux.map(([n, c]) => `  val ${n}: ${TYPE[c]},`).join('\n');
  const inst = (tab, titre) =>
    `val ${titre} = Palette(\n`
    + modaux.map(([n, c]) => `  ${n} = ${valeurKotlin(c, tab[n], n)},`).join('\n')
    + '\n)';

  const groupes = {
    'Longueurs — marges, rayons, cibles tactiles': (n, c) => c === 'dimension' && typeDimension(n, L[n]) === 'Dp',
    'Typographie — corps, approches, interlignes, graisses': (n, c) =>
      (c === 'dimension' && typeDimension(n, L[n]) === 'TextUnit') || /^(lh|weight)/.test(n) || c === 'police' || c === 'mesure',
    'Mouvement — durées et courbes': (n, c) => c === 'duree' || c === 'courbe',
    'Verre — opacités, flou, saturation': (n) => /^glass/.test(n),
    'Le reste': () => true,
  };
  const restants = new Set(communs.map(([n]) => n));
  let corps = '';
  for (const [titre, filtre] of Object.entries(groupes)) {
    const dedans = communs.filter(([n, c]) => restants.has(n) && filtre(n, c));
    if (!dedans.length) continue;
    dedans.forEach(([n]) => restants.delete(n));
    corps += `\n  /* ── ${titre} ── */\n`
      + dedans.map(([n, c]) => {
        const t = c === 'dimension' ? typeDimension(n, L[n]) : (/^weight/.test(n) ? 'FontWeight' : TYPE[c]);
        return `  val ${n}: ${t} = ${valeurKotlin(c, L[n], n)}`;
      }).join('\n') + '\n';
  }

  const kotlin = `${entete}
package me.maxmorrys.rysmo.ds

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * Les ${modaux.length} jetons qui DÉPENDENT DU MODE.
 *
 * ⛔ Le mode sombre n'est pas un filtre appliqué au mode clair : le DS redéclare ses
 * teintes en valeur, et ${noms.filter((n) => L[n] !== D[n]).length} jetons sur ${noms.length} y changent. Dériver le sombre du clair
 * rendrait faux, entre autres, les six dégradés d'arc — dont \`arc\`, qui part de
 * ${degrade(L.arc).arrets[0].couleur.replace('0xFF', '#')} en clair et de ${degrade(D.arc).arrets[0].couleur.replace('0xFF', '#')} en sombre.
 */
@Immutable
data class Palette(
${champs}
)

${inst(L, 'PALETTE_CLAIRE')}

${inst(D, 'PALETTE_SOMBRE')}

/**
 * Les ${communs.length} jetons COMMUNS aux deux modes.
 *
 * Que cette séparation soit juste n'est pas une hypothèse : le générateur échoue si un
 * jeton listé ici prend deux valeurs, et si un jeton de la palette change de catégorie.
 */
@Immutable
object Metrique {
${corps}}
`;

  /* Les couleurs pures partent aussi en ressources XML : le thème de fenêtre est peint par
     le système AVANT que Compose n'existe. Sans elles, l'application ouvre sur un rectangle
     blanc puis bascule, et le saut se voit à chaque lancement. */
  const xml = (tab) =>
    '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<!-- GÉNÉRÉ PAR `npm run ds:tokens` — NE PAS ÉDITER. -->\n<resources>\n'
    + modaux.filter(([, c]) => c === 'couleur')
        .map(([n]) => `  <color name="ds_${n.replace(/([A-Z0-9])/g, '_$1').toLowerCase()}">#${argb(tab[n]).slice(2)}</color>`)
        .join('\n')
    + '\n</resources>\n';

  /*
   * ⛔ L'ICÔNE DU LANCEUR NE SUIT PAS LE THÈME, et les jetons de territoire, eux, le suivent.
   *
   * `mmBleu` vaut #0057BC en clair et #6FB1FF en sombre — c'est voulu, et juste, pour du
   * texte et des surfaces. Mais un mot-symbole qui change de couleur selon le réglage du
   * téléphone n'est plus une marque : l'utilisateur cherche son icône par sa couleur, et
   * Android peut servir les ressources `values-night/` à l'écran d'accueil.
   *
   * Ces quatre teintes sont donc émises FIGÉES, depuis la seule table claire, et sans
   * miroir nocturne. C'est la même intention que les jetons `*Fixed` du DS. Elles restent
   * générées : écrire #0057BC à la main dans le vectoriel serait la première valeur à
   * dériver le jour où la marque bougerait.
   */
  const TERRITOIRES = ['mmBleu', 'mmOrange', 'mmViolet', 'mmTeal', 'paperFixed'];
  const manquants = TERRITOIRES.filter((n) => L[n] === undefined);
  if (manquants.length) throw new Error(`ds:tokens/kotlin — teintes de marque absentes : ${manquants.join(', ')}`);
  const xmlMarque = '<?xml version="1.0" encoding="utf-8"?>\n'
    + '<!-- GÉNÉRÉ PAR `npm run ds:tokens` — NE PAS ÉDITER.\n'
    + '     Les teintes de la MARQUE, figées : elles ne basculent pas en mode sombre,\n'
    + '     contrairement aux jetons `ds_mm_*` dont elles sont tirées. Aucun miroir\n'
    + '     dans values-night/, et c'
    + "'est la raison d'être de ce fichier. -->\n"
    + '<resources>\n'
    + TERRITOIRES.map((n) => `  <color name="marque_${n.replace(/([A-Z0-9])/g, '_$1').toLowerCase()}">#${argb(L[n]).slice(2)}</color>`).join('\n')
    + '\n</resources>\n';

  /*
   * ⛔ LA PORTE QUI A MANQUÉ UNE FOIS. Kotlin imbrique les commentaires de bloc ; un `/*`
   * écrit dans une phrase — un chemin en glob, par exemple — ouvre un niveau de plus, et
   * le fichier entier bascule en commentaire. Le compilateur ne le dit qu'à la dernière
   * ligne, sous une erreur qui ne désigne pas la cause. On compte donc ici, avant d'écrire.
   */
  let profondeur = 0;
  for (let i = 0; i < kotlin.length - 1; i++) {
    if (kotlin[i] === '/' && kotlin[i + 1] === '*') { profondeur++; i++; }
    else if (kotlin[i] === '*' && kotlin[i + 1] === '/') { profondeur--; i++; }
  }
  if (profondeur !== 0) throw new Error(
    `ds:tokens/kotlin — commentaires de bloc déséquilibrés (solde ${profondeur}). `
    + 'Kotlin les imbrique : une séquence d\'ouverture écrite dans une phrase '
    + 'commente tout ce qui suit.',
  );

  return { kotlin, xmlClair: xml(L), xmlSombre: xml(D), xmlMarque };
}
