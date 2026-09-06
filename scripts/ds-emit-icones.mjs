/* ═══════════════════════════════════════════════════════════════════════════════════════
 * ÉMETTEUR DES 109 GLYPHES — même raisonnement qu'AD-8, appliqué aux TRACÉS.
 *
 * `src/design-system/icons.ts` est écrit à la main et ne dépend de rien : ni React, ni DOM.
 * C'est ce qui permet au web et au natif de lire LES MÊMES tracés. Le port React Native en
 * recevait une copie générée ; elle a disparu avec `mobile/`, et le marqueur laissé dans
 * `ds-tokens.mjs` disait : « elles reviendront en ImageVector (Compose), générées d'ici
 * même ». C'est ce fichier.
 *
 * ⛔ CE QUI EST CONVERTI ICI, ET POURQUOI PAS À L'EXÉCUTION.
 * Le kit décrit ses glyphes en trois familles : tracés (`p`), cercles (`c`) et rectangles
 * arrondis (`r`). `PathParser` de Compose ne lit que des chaînes SVG. Les cercles et les
 * rectangles sont donc traduits en tracés ICI, par un calcul déterministe — plutôt qu'en
 * ajoutant à l'application un constructeur de formes qu'il faudrait tenir juste à deux
 * endroits. À l'arrivée, un glyphe est UNE liste de chaînes, et rien d'autre.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** 4 décimales : au-delà, on écrit du bruit de virgule flottante dans un fichier suivi. */
const n = (x) => String(Math.round(x * 10000) / 10000);

/**
 * Un cercle en deux arcs d'un demi-tour. Une seule commande `a` de 360° serait
 * DÉGÉNÉRÉE — départ et arrivée confondus : la spécification SVG demande alors d'ignorer
 * l'arc, et le glyphe disparaîtrait sans erreur.
 */
function cercle([cx, cy, r]) {
  return `M${n(cx - r)},${n(cy)}a${n(r)},${n(r)} 0 1,0 ${n(2 * r)},0`
    + `a${n(r)},${n(r)} 0 1,0 ${n(-2 * r)},0`;
}

/** Un rectangle à coins arrondis. `rx` est borné à la moitié du côté, comme en SVG. */
function rectangle([x, y, w, h, rxBrut]) {
  const rx = Math.max(0, Math.min(rxBrut || 0, w / 2, h / 2));
  if (rx === 0) return `M${n(x)},${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;
  const a = `A${n(rx)},${n(rx)} 0 0 1 `;
  return `M${n(x + rx)},${n(y)}`
    + `H${n(x + w - rx)}${a}${n(x + w)},${n(y + rx)}`
    + `V${n(y + h - rx)}${a}${n(x + w - rx)},${n(y + h)}`
    + `H${n(x + rx)}${a}${n(x)},${n(y + h - rx)}`
    + `V${n(y + rx)}${a}${n(x + rx)},${n(y)}Z`;
}

const f = (x) => {
  const s = String(Math.round(x * 10000) / 10000);
  return (s.includes('.') ? s : `${s}.0`) + 'f';
};

/** Kotlin ne connaît pas l'échappement `\/` ; on ne quote que ce qui doit l'être. */
const chaine = (s) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`;

/**
 * Émet `Icones.generated.kt` depuis `src/design-system/icons.ts`.
 *
 * Les entrées sont réparties en fonctions privées : un `mapOf` de 109 paires dans un seul
 * initialiseur de propriété finit dans `<clinit>`, et la JVM refuse une méthode de plus de
 * 64 Ko. Le découpage est mécanique, pas esthétique.
 */
export function emettreIcones(racine, entete) {
  const ts = readFileSync(join(racine, 'src/design-system/icons.ts'), 'utf8');
  const m = /export const MM_ICONS: Record<string, Glyph> = (\{[\s\S]*?\});/.exec(ts);
  if (!m) throw new Error(
    'ds:icones — la table MM_ICONS est introuvable dans src/design-system/icons.ts. '
    + 'Un extracteur qui rate sans se plaindre est pire qu\'un extracteur qui échoue.',
  );
  const glyphes = JSON.parse(m[1]);
  const noms = Object.keys(glyphes);
  if (noms.length < 100) throw new Error(`ds:icones — ${noms.length} glyphes seulement, attendu 109 ou plus.`);

  const entrees = noms.map((nom) => {
    const g = glyphes[nom];
    /* L'ordre du kit : rectangles, puis cercles, puis tracés (`components/brand/Icon.jsx`).
       Il compte : un tracé posé après un cercle se dessine par-dessus. */
    const traits = [
      ...(g.r || []).map(rectangle),
      ...(g.c || []).map(cercle),
      ...(g.p || []),
    ];
    const args = [`traits = listOf(${traits.map(chaine).join(', ')})`];
    if (g.solid && g.fill) args.push(`plein = ${chaine(g.fill)}`);
    if (g.w !== undefined) args.push(`epaisseur = ${f(g.w)}`);
    return `    ${chaine(nom)} to Glyphe(${args.join(', ')}),`;
  });

  const PAQUET = 20;
  const paquets = [];
  for (let i = 0; i < entrees.length; i += PAQUET) paquets.push(entrees.slice(i, i + PAQUET));
  const fonctions = paquets.map((p, i) =>
    `private fun paquet${i}(): Map<String, Glyphe> = mapOf(\n${p.join('\n')}\n)`).join('\n\n');
  const assemblage = paquets.map((_, i) => `paquet${i}()`).join(' + ');

  const pleins = noms.filter((x) => glyphes[x].solid);
  const epaisseurs = [...new Set(noms.map((x) => glyphes[x].w).filter((x) => x !== undefined))].sort((a, b) => a - b);

  const kotlin = `${entete}
package me.maxmorrys.rysmo.ds

import androidx.compose.runtime.Immutable

/**
 * Un glyphe, en données pures : des tracés SVG sur une boîte de 24 × 24.
 *
 * \`traits\` se rend au TRAIT (bouts et jointures ronds) ; \`plein\` se rend au
 * REMPLISSAGE. ${pleins.length === 1 ? 'Un seul glyphe a' : `${pleins.length} glyphes seulement ont`} un remplissage — ${pleins.map((x) => `\`${x}\``).join(' et ')} —
 * et c'est la seule différence de rendu du jeu.
 *
 * ⚠️ La spécification en annonçait DEUX (\`play\` et \`star\`). La donnée dit un : \`star\`
 * porte bien un tracé fermé, mais pas de drapeau \`solid\`, donc le kit le rend AU TRAIT.
 * La donnée gagne — c'est elle que le web dessine.
 *
 * \`epaisseur\` n'est écrite que quand le glyphe s'écarte du 2,2 par défaut du kit.
 * Les épaisseurs employées : ${epaisseurs.join(', ')}.
 */
@Immutable
data class Glyphe(
  val traits: List<String>,
  val plein: String? = null,
  val epaisseur: Float? = null,
)

${fonctions}

/**
 * Les ${noms.length} glyphes du système, indexés par leur nom.
 *
 * ⛔ Le kit n'en déclare que 36 dans \`components/brand/Icon.d.ts\` ; les ${noms.length - 36} autres
 * viennent du site et de la console. Ils sont tous émis parce que la source est unique :
 * trier ici demanderait de savoir, glyphe par glyphe, quel écran l'appelle — et ce tri
 * périmerait au premier écran ajouté.
 */
val GLYPHES: Map<String, Glyphe> = ${assemblage}
`;

  let profondeur = 0;
  for (let i = 0; i < kotlin.length - 1; i++) {
    if (kotlin[i] === '/' && kotlin[i + 1] === '*') { profondeur++; i++; }
    else if (kotlin[i] === '*' && kotlin[i + 1] === '/') { profondeur--; i++; }
  }
  if (profondeur !== 0) throw new Error(`ds:icones — commentaires de bloc déséquilibrés (solde ${profondeur}).`);

  return { kotlin, compte: noms.length };
}
