import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

import { socialLinks } from '../../src/lib/brand';

/**
 * LES PROFILS DÉCLARÉS AUX MOTEURS DOIVENT ÊTRE CEUX QUI EXISTENT.
 *
 * `sameAs`, dans le JSON-LD, dit à un moteur : « ces comptes sont la même entité que ce
 * site ». C'est ce qui rattache la chaîne YouTube, le compte X et la page LinkedIn à la
 * marque — et c'est l'un des signaux dont dépend le panneau de connaissances.
 *
 * CE QUI ÉTAIT SERVI JUSQU'AU 03/09/2026. Le pré-rendu déclarait deux adresses écrites à la
 * main, différentes de celles de `lib/brand` : `linkedin.com/in/maxmorrys` et
 * `youtube.com/@maxmorrys`. La seconde répond **404** — la vraie chaîne est `@maxmorrys-me`.
 * Déclarer une adresse morte dans `sameAs` n'est pas une coquille sans effet : c'est une
 * affirmation fausse sur l'identité de la marque, faite à l'endroit précis où l'on demande
 * au moteur de l'établir.
 *
 * Trois copies existent, parce que ni le Worker ni les Cloud Functions ne peuvent importer le
 * code de l'application. Ce test est ce qui les tient ensemble — comme
 * `segments-sync.test.ts` le fait pour la table des segments, et pour la même raison : la
 * dérive ne casse rien de visible, elle ment seulement aux robots.
 */

/** Extrait les URL d'une constante `SOCIAL_URLS = [ … ]` d'une des deux copies. */
function readCopy(path: string): string[] {
  const source = readFileSync(path, 'utf8');
  const match = source.match(/const SOCIAL_URLS = \[([\s\S]*?)\];/);
  if (!match) throw new Error(`Aucune constante SOCIAL_URLS dans ${path}`);
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/*
 * `functions/src/prerender.ts` était la troisième copie. `functions/` a été supprimé le
 * 03/09/2026 — plus rien n'y était déployé depuis le passage au plan Spark. Il reste deux
 * copies : `lib/brand` côté frontend, qui fait référence, et le Worker.
 */
const COPIES = {
  Worker: 'worker/apps/site/src/constants.ts',
};

describe('les profils sociaux ne dérivent pas entre les deux copies', () => {
  const reference = socialLinks.map((s) => s.url);

  it.each(Object.entries(COPIES))('%s porte exactement la liste de lib/brand', (_nom, path) => {
    expect(readCopy(path)).toEqual(reference);
  });

  it('aucune copie ne déclare la chaîne YouTube qui répond 404', () => {
    // Le défaut exact qui a motivé ce test. Vérifié le 03/09/2026 :
    // `youtube.com/@maxmorrys` → 404, `youtube.com/@maxmorrys-me` → 200.
    for (const path of Object.values(COPIES)) {
      for (const url of readCopy(path)) {
        expect(url, `${path} déclare une chaîne inexistante`).not.toMatch(
          /youtube\.com\/@maxmorrys$/,
        );
      }
    }
  });

  it('toutes les adresses sont absolues et en https', () => {
    // Une URL relative dans `sameAs` est ignorée sans avertissement.
    for (const url of reference) expect(url).toMatch(/^https:\/\//);
  });

  it('le compte X déclaré correspond au handle des Twitter Cards', () => {
    // `twitter:site` et `sameAs` désignaient deux comptes différents : `@maxmorrys` d'un côté,
    // `x.com/max_morrys` de l'autre.
    const x = reference.find((url) => url.includes('x.com/'));
    expect(x).toBe('https://x.com/max_morrys');

    const worker = readFileSync('worker/apps/site/src/constants.ts', 'utf8');
    expect(worker).toContain("export const TWITTER_HANDLE = '@max_morrys';");
  });
});
