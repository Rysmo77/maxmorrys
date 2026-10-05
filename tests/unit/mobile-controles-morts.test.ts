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

  it("un composant à choix sans `onChange` ne pilote rien, et personne ne le voit", () => {
    /*
     * DEUX SÉLECTEURS ONT VÉCU DES MOIS SANS PILOTER QUOI QUE CE SOIT, sous les yeux de
     * cette porte : la langue et l'apparence du profil, puis le filtre du catalogue.
     *
     * La porte précédente cherche un `onPress`. Un composant à CHOIX n'en a pas : il se
     * pilote par `onChange`, et sans lui `ds/ChipRow` et `ds/Segmented` rendent des onglets
     * qui s'affichent, se surlignent au premier, et n'obéissent à rien.
     *
     * C'est plus trompeur qu'un bouton mort : un bouton éteint se voit à son opacité, un
     * onglet inerte a exactement l'allure d'un onglet vivant.
     */
    const A_CHOIX = ['ChipRow', 'Segmented'] as const;
    const fautes: string[] = [];

    for (const f of fichiers(APP)) {
      const code = readFileSync(f, 'utf8');
      for (const nom of A_CHOIX) {
        for (const balise of balises(code, nom)) {
          if (/\bonChange\b/.test(balise)) continue;
          if (/\bdisabled\b/.test(balise)) continue;
          fautes.push(`${relative(RACINE, f)} · <${nom}> sans onChange`);
        }
      }
    }

    expect(fautes, 'composants à choix qui ne pilotent rien').toEqual([]);
  });

  it("une fabrique de contrôles ne rend pas un bouton vivant sans gestionnaire", () => {
    /*
     * LE TROU LE PLUS FIN DE CE FICHIER, ET IL A LAISSÉ PASSER DEUX BOUTONS.
     *
     * `plein-ecran.tsx` construisait ses commandes par une fabrique locale :
     *
     *     const rond = (taille, label, contenu, onPress?) => (
     *       <Pressable accessibilityLabel={label} onPress={onPress} … />
     *     );
     *
     * La balise contient littéralement `onPress={onPress}` : le motif `AGIT` correspond,
     * la porte est verte. Mais deux appels passaient TROIS arguments — « Reculer de 15
     * secondes » et « Avancer de 15 secondes » recevaient `undefined`, gardaient leur rôle
     * d'accessibilité, leur pleine opacité et leur animation de pression.
     *
     * Un test statique ne suit pas la valeur d'un paramètre optionnel. Il peut en revanche
     * refuser la FORME : une fabrique qui rend un contrôle doit dériver son état éteint de
     * l'absence de gestionnaire, plutôt que de compter sur ses appelants.
     */
    const fautes: string[] = [];

    for (const f of fichiers(APP)) {
      const code = readFileSync(f, 'utf8');
      /* Une fabrique = une constante fléchée dont un paramètre s'appelle `onPress?`.
         ⚠️ Ne PAS borner la liste de paramètres par `[^)]*` : une signature réaliste
         contient elle-même des parenthèses (`onPress?: () => void`), et le motif s'arrête
         à la première. C'est ce qui a rendu la première version de cette porte inoffensive
         sur le cas même qu'elle devait attraper. */
      for (const m of code.matchAll(/const\s+(\w+)\s*=\s*\([^;]{0,300}?onPress\?:/g)) {
        const nom = m[1];
        /* ⚠️ N'examiner QUE LE CORPS, après la flèche. Dans la signature, `onPress?:` est
           le marqueur d'un paramètre optionnel — et il satisfaisait le motif de dérivation
           ci-dessous, ce qui rendait cette porte verte sur le défaut exact qu'elle vise.
           Une porte qui se laisse convaincre par la déclaration du problème ne garde rien. */
        const fleche = code.indexOf('=>', (m.index ?? 0) + m[0].length);
        if (fleche < 0) continue;
        const corps = code.slice(fleche, fleche + 1400);
        if (!/<Pressable/.test(corps)) continue;
        /* Il faut que l'absence de gestionnaire décide de quelque chose : un `disabled`
           dérivé, ou une opacité conditionnée. Sinon la fabrique fabrique des mensonges. */
        const derive = /onPress\s*===\s*undefined|!\s*onPress|onPress\s*\?/.test(corps);
        if (!derive) fautes.push(`${relative(RACINE, f)} · fabrique \`${nom}\``);
      }
    }

    expect(
      fautes,
      'fabriques qui rendent un contrôle sans dériver son état éteint de `onPress`',
    ).toEqual([]);
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

  it("aucune API d'une seule plateforme n'est appelée sans son équivalent", () => {
    /*
     * ⚠️ CE DÉFAUT A ÉTÉ COMMIS EN CORRIGEANT LES CONTRÔLES MORTS, ce qui dit assez bien
     * comme il est facile à faire. `Alert.prompt` N'EXISTE QUE SUR iOS : appelé en
     * `Alert.prompt?.(…)`, il ne lève rien sur Android — il ne fait simplement RIEN.
     *
     * C'est le contrôle mort remis en place, mais sur une seule plateforme : donc
     * invisible à qui relit sur l'autre, et invisible au typecheck, qui connaît la
     * signature et la juge correcte. `ds/platform.ts` existe précisément pour que les
     * divergences soient DÉCLARÉES ; une API à moitié disponible ne l'est pas.
     *
     * `ActionSheetIOS` tombe sous la même règle, et `PermissionsAndroid` du côté opposé.
     */
    const interdits = [/\bAlert\.prompt\b/, /\bActionSheetIOS\b/, /\bPermissionsAndroid\b/];
    const fautes: string[] = [];
    for (const f of fichiers(APP)) {
      const code = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      for (const motif of interdits) {
        if (motif.test(code)) fautes.push(`${relative(RACINE, f)} · ${motif.source}`);
      }
    }
    expect(fautes, 'API disponibles sur une seule plateforme').toEqual([]);
  });

  it('le test voit bien quelque chose', () => {
    // Sans ce garde, un `fichiers()` cassé rendrait les deux portes vertes à vide.
    const total = fichiers(APP).length;
    expect(total).toBeGreaterThan(30);
  });
});
