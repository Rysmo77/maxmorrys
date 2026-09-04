import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUCUN CONTRÔLE NE FAIT SEMBLANT — la porte qui manquait le plus.
 *
 * Le port a livré au moins six contrôles qui avaient TOUT d'un bouton — rôle
 * d'accessibilité, libellé, glyphe, chevron, animation de pression, état désactivé —
 * et aucun gestionnaire. Ils ne se voient pas en relisant : le composant est correct,
 * les types sont justes, et rien ne manque à l'œil.
 *
 * Ceux qui ont été trouvés, et ce que chacun coûtait :
 *
 *   · le bouton d'ENVOI du répétiteur — l'argument même du virage natif. On tapait sa
 *     question, on touchait envoyer, rien ne partait ;
 *   · « Exporter mes données », sur l'écran des données, juste au-dessus de la
 *     suppression de compte : on repartait en croyant que l'export n'existait pas ;
 *   · « Tout effacer » la mémoire du répétiteur — action DESTRUCTIVE dont l'alerte
 *     s'ouvrait, se fermait, et n'effaçait rien. Celui qui la touche croit avoir
 *     effacé ;
 *   · « Signaler ce profil » — même forme, même silence ;
 *   · quatre `IconButton` de barre haute (partager, télécharger, chercher ×2).
 *
 * ── CE QUE CE TEST REGARDE ────────────────────────────────────────────────────
 * Un contrôle est suspect quand il ANNONCE une action et n'en porte aucune. On ne
 * vérifie donc pas tous les composants — beaucoup sont décoratifs à juste titre —
 * mais ceux qui portent un `accessibilityLabel` ou un `label`, c'est-à-dire ceux qui
 * se présentent comme actionnables à quelqu'un qui ne voit pas l'écran.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const APP = join(RACINE, 'mobile/app');

function fichiers(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...fichiers(p));
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/**
 * Découpe un fichier en balises JSX de composant, avec leur contenu de props.
 *
 * On s'arrête au premier `>` de fermeture de BALISE, pas au premier `>` rencontré :
 * une prop peut contenir une flèche (`() =>`), et couper dessus tronquerait la balise
 * juste avant son `onPress` — le test passerait alors pour la mauvaise raison.
 */
function balises(code: string, nom: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${nom}(\\s)`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    let i = m.index;
    let profondeur = 0;
    for (; i < code.length; i++) {
      const c = code[i];
      if (c === '{') profondeur++;
      else if (c === '}') profondeur--;
      else if (c === '>' && profondeur === 0) break;
    }
    out.push(code.slice(m.index, i));
  }
  return out;
}

/** Un contrôle qui s'annonce : il a un libellé destiné à être lu ou entendu. */
const ANNONCE = /\b(accessibilityLabel|label)=/;
/** Une action, sous n'importe quelle forme. */
const AGIT = /\b(onPress|onChange|onChangeText|onValueChange|href|onLongPress)=/;

const CONTROLES = ['Button', 'IconButton', 'LessonRow', 'Pressable', 'Fab', 'PayOption'];

describe('aucun contrôle natif ne fait semblant', () => {
  it('tout contrôle qui annonce une action en porte une', () => {
    const fautes: string[] = [];

    for (const f of fichiers(APP)) {
      const code = readFileSync(f, 'utf8');
      for (const nom of CONTROLES) {
        for (const balise of balises(code, nom)) {
          if (!ANNONCE.test(balise)) continue;
          if (AGIT.test(balise)) continue;
          /* `disabled` sans action est un choix VALIDE : un contrôle éteint exprès, qui
             dit pourquoi. C'est le cas des trois interrupteurs de notification, dont le
             canal d'envoi n'existe pas. */
          if (/\bdisabled\b/.test(balise)) continue;
          fautes.push(`${relative(RACINE, f)} · <${nom}> « ${
            (/(?:accessibilityLabel|label)=["{]([^"}\n]{0,40})/.exec(balise)?.[1] ?? '?').trim()
          } »`);
        }
      }
    }

    expect(fautes, 'contrôles qui annoncent une action sans en porter').toEqual([]);
  });

  it('aucune action destructive ne se referme sans rien faire', () => {
    /*
     * Le cas le plus coûteux, et le plus discret : une `Alert` dont le bouton
     * `destructive` n'a pas d'`onPress`. Elle s'ouvre, on confirme, elle se ferme — et
     * la personne repart en croyant avoir supprimé. Deux existaient : l'effacement de
     * la mémoire du répétiteur, et le signalement d'un profil.
     */
    const fautes: string[] = [];
    for (const f of fichiers(APP)) {
      const code = readFileSync(f, 'utf8');
      for (const m of code.matchAll(/\{[^{}]*style:\s*'destructive'[^{}]*\}/g)) {
        if (!/onPress/.test(m[0])) fautes.push(`${relative(RACINE, f)} · ${m[0].slice(0, 60)}`);
      }
    }
    expect(fautes, 'confirmations destructives sans action').toEqual([]);
  });

  it('le test voit bien quelque chose', () => {
    // Sans ce garde, un `fichiers()` cassé rendrait les deux portes vertes à vide.
    const total = fichiers(APP).length;
    expect(total).toBeGreaterThan(30);
  });
});
