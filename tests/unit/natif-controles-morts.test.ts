import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUCUN CONTRÔLE NE FAIT SEMBLANT.
 *
 * ⛔ `mobile-controles-morts.test.ts` AVAIT ATTRAPÉ SIX BOUTONS PARFAITEMENT MORTS
 * dans le port React Native : l'envoi au répétiteur, l'export de données, l'oubli
 * unitaire de la mémoire, le téléchargement d'un épisode, la vitesse de lecture,
 * « Postuler ». Chacun était rendu, coloré, à sa taille tactile — et sans effet.
 * Cette porte a disparu avec le port ; voici son équivalent Compose.
 *
 * ⚠️ ELLE GARDE DEUX CHOSES DE NATURE DIFFÉRENTE, et il faut les deux.
 *
 *   1. LA STRUCTURE — le design system lui-même refuse de dessiner un contrôle
 *      sans action. C'est la garde la plus forte : elle rend le défaut impossible
 *      au lieu d'obliger chaque appelant à y penser.
 *   2. L'USAGE — aucun écran ne contourne la règle en passant une lambda VIDE,
 *      qui est une action au regard du compilateur et un néant au regard de qui
 *      appuie. C'est exactement ce que le port posait sur « Réessayer » de la
 *      panne de configuration.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const KOTLIN = 'android/app/src/main/java/me/maxmorrys/rysmo';

const lire = (p: string) => readFileSync(resolve(RACINE, p), 'utf8');

/**
 * ⚠️ RETRAIT DES COMMENTAIRES LIGNE À LIGNE. Ce dépôt cite abondamment le code dont il
 * parle — cette porte-ci décrit une lambda vide dans ses propres explications. Retirer
 * les blocs par expression régulière est pire : la méthode a déjà mangé le milieu d'une
 * chaîne ailleurs dans ce dépôt. Une ligne de commentaire Kotlin commence par `//`,
 * `/*` ou `*` une fois désindentée.
 */
const sansCommentaires = (source: string) =>
  source.split('\n')
    .filter((l) => {
      const t = l.trim();
      return !(t.startsWith('*') || t.startsWith('//') || t.startsWith('/*'));
    })
    .join('\n');

/** Tous les `.kt` écrits à la main sous `me/maxmorrys/rysmo`, générés exclus. */
function sourcesKotlin(): string[] {
  const base = join(RACINE, KOTLIN);
  const out: string[] = [];
  const marcher = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) marcher(p);
      else if (e.name.endsWith('.kt') && !e.name.endsWith('.generated.kt')) out.push(p);
    }
  };
  marcher(base);
  return out;
}

describe('le design system refuse de dessiner un contrôle sans action', () => {
  const actions = sansCommentaires(lire(`${KOTLIN}/ds/Actions.kt`));

  it('la porte regarde vraiment quelque chose', () => {
    expect(actions.length, 'Actions.kt introuvable ou vide').toBeGreaterThan(1000);
    expect([...actions.matchAll(/^fun (\w+)\(/gm)].length).toBeGreaterThanOrEqual(4);
  });

  for (const controle of ['Button', 'IconButton', 'PillButton']) {
    it(`\`${controle}\` sort tôt quand il n’a pas d’action`, () => {
      /*
       * Sans ce retour, le contrôle est rendu COMPLET — fond, libellé, glyphes —
       * simplement non cliquable, et sans la sémantique « désactivé », qui n'est posée
       * que si `desactive` est vrai. Un lecteur d'écran l'annonce comme un contrôle
       * ordinaire ; un œil le voit vivant.
       */
      const corps = new RegExp(`fun ${controle}\\(([\\s\\S]*?)\\n\\}`).exec(actions)?.[1] ?? '';
      expect(corps, `${controle} est introuvable`).not.toBe('');
      expect(
        corps,
        `${controle} dessinerait un contrôle mort si on lui passait une action nulle`,
      ).toMatch(/if \(onPress == null[^)]*\) return/);
    });
  }

  it('`desactive = true` reste rendu — c’est une intention, pas un oubli', () => {
    /* Montrer qu'un geste existe mais n'est pas disponible maintenant est légitime.
       C'est le couple « pas d'action ET pas désactivé » qui ne décrit rien. */
    const corps = /fun Button\(([\s\S]*?)\n\}/.exec(actions)?.[1] ?? '';
    expect(corps).toMatch(/onPress == null && !desactive/);
  });
});

describe('aucun écran ne contourne la règle', () => {
  const fichiers = sourcesKotlin();

  it('la porte regarde vraiment quelque chose', () => {
    expect(fichiers.length, 'aucune source Kotlin trouvée — l’extracteur est cassé').toBeGreaterThan(30);
  });

  it('aucune action vide, nommée ou positionnelle', () => {
    /*
     * ⚠️ ON NE CHERCHE PAS QUE LA FORME NOMMÉE. L'affectation est la forme évidente,
     * mais l'action se passe le plus souvent en POSITIONNEL — et c'est celle qu'emploient
     * la plupart des écrans. Une porte qui ne voyait que la première est passée au vert,
     * ailleurs dans ce dépôt, sur l'épreuve où on l'avait cassée exprès. On borne donc
     * sur ce qui PRÉCÈDE la lambda : une affectation, une virgule, une parenthèse.
     */
    const fautes: string[] = [];
    for (const f of fichiers) {
      const code = sansCommentaires(readFileSync(f, 'utf8'));
      for (const ligne of code.split('\n')) {
        if (!/[=(,]\s*\{\s*\}/.test(ligne)) continue;
        /*
         * ⚠️ UN EMPLACEMENT DE CONTENU VIDE N'EST PAS UN CONTRÔLE MORT.
         *
         * `contenu: @Composable () -> Unit = {}` est une valeur par défaut légitime :
         * elle dit « rien à dessiner ici », ce qui est une réponse. Ma première version
         * de cette porte l'accusait, et une porte qui crie sur du code juste finit par
         * ne plus être lue — c'est le mécanisme même par lequel une vraie faute passe.
         *
         * La distinction tient au type : une ACTION est `() -> Unit`, un CONTENU est
         * `@Composable () -> Unit`.
         */
        if (ligne.includes('@Composable')) continue;
        const m = /[=(,]\s*\{\s*\}/.exec(ligne)!;
        fautes.push(`${f.slice(RACINE.length + 1)} : ${ligne.trim().slice(0, 70)} (${m[0].replace(/\s+/g, ' ')})`);
      }
    }
    expect(
      fautes,
      'une lambda vide est une action pour le compilateur et un néant pour qui appuie : '
      + 'le contrôle s’affiche, le geste ne fait rien',
    ).toEqual([]);
  });
});
