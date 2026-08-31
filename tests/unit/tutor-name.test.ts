/**
 * LE NOM DU RÉPÉTITEUR EST UN RÉGLAGE, PAS UNE CONSTANTE.
 *
 * Le système distingue trois noms, et prévient que c'est « la distinction la plus facile à
 * casser », déjà cassée une fois :
 *
 *   « Hello ! »     le mot-symbole des PAGES WEB
 *   « Rysmo »       le nom de l'APPLICATION — constante, personne ne le renomme
 *   « Répétiteur »  le RÉPÉTITEUR IA qui vit dedans — valeur par DÉFAUT, renommable par
 *                   chaque personne, et le nom choisi remplace le mot PARTOUT
 *
 * Le défaut ne casse ni le typecheck, ni le lint, ni le rendu : un écran affiche simplement
 * un autre nom que les douze autres, pour la seule personne qui a renommé le sien. Personne
 * dans l'équipe ne le voit, puisque personne dans l'équipe n'a renommé.
 *
 * Deux défauts réels que ce test verrouille, trouvés à la réconciliation :
 *
 *   • `RysmoWidget` écrivait « Rysmo » EN DUR dans l'en-tête de conversation — pas même une
 *     clé i18n. Quelqu'un qui avait appelé le sien « Tonton » lisait « Rysmo » en haut de sa
 *     propre conversation.
 *   • La première bulle et les quatre libellés de mémoire des préférences nommaient
 *     « Rysmo » — l'APPLICATION — là où le répétiteur est visé.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const RACINE = join(__dirname, '..', '..');
const LANGS = ['fr', 'en'] as const;

function json(lang: string, fichier: string): Record<string, unknown> {
  const p = join(RACINE, 'src', 'i18n', 'locales', lang, fichier);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
}

function chemin(o: unknown, route: string): unknown {
  return route.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], o);
}

/**
 * Les clés qui parlent DU RÉPÉTITEUR, et doivent donc l'interpoler.
 *
 * Elles sont listées explicitement plutôt que devinées : une heuristique sur « toute chaîne
 * contenant Rysmo » signalerait « Abonnement Rysmo+ » et « Tokens IA — Rysmo », qui nomment
 * légitimement le produit et le palier payant.
 */
const CLES_DU_REPETITEUR: Array<[string, string]> = [
  ['rysmo.json', 'greeting'],
  ['lmsTabs.json', 'settings.rysmoMemory'],
  ['lmsTabs.json', 'settings.rysmoMemoryDesc'],
  ['lmsTabs.json', 'settings.toastMemoryOn'],
  ['lmsTabs.json', 'settings.toastMemoryOff'],
];

describe('le nom du répétiteur vient du profil', () => {
  for (const lang of LANGS) {
    for (const [fichier, route] of CLES_DU_REPETITEUR) {
      it(`${lang}/${fichier} · ${route} interpole {{tutor}}`, () => {
        const valeur = chemin(json(lang, fichier), route);
        expect(typeof valeur, `${route} absente en ${lang}`).toBe('string');
        expect(valeur as string).toContain('{{tutor}}');
      });

      it(`${lang}/${fichier} · ${route} n'écrit pas « Rysmo » à la place`, () => {
        const valeur = chemin(json(lang, fichier), route) as string;
        // « Rysmo+ » reste permis : c'est le nom du palier payant, pas celui du répétiteur.
        expect(valeur.replace(/Rysmo\+/g, '')).not.toMatch(/\bRysmo\b/);
      });
    }
  }

  /*
   * L'EN-TÊTE DE CONVERSATION. C'est là que le défaut vivait, et en dur : il n'aurait été
   * rattrapé par aucun test portant sur les fichiers de langue.
   */
  it("l'en-tête de conversation lit tutorName, et n'écrit aucun nom en dur", () => {
    const src = readFileSync(join(RACINE, 'src/components/ai/RysmoWidget.tsx'), 'utf8');
    expect(src).toContain('tutorName');
    // Aucun littéral JSX « Rysmo » : `>Rysmo<` est la forme qu'avait le défaut.
    expect(src).not.toMatch(/>\s*Rysmo\s*</);
  });

  /* Les sept emplacements que le système nomme doivent tous lire la valeur partagée. */
  it('les écrans du répétiteur lisent tous la source unique', () => {
    for (const f of [
      'src/components/layout/StudentLayout.tsx',
      'src/components/ai/RysmoWidget.tsx',
      'src/pages/lms/tabs/DashboardTab.tsx',
      'src/pages/lms/tabs/RysmoMemoryTab.tsx',
      'src/pages/lms/tabs/SettingsTab.tsx',
    ]) {
      expect(readFileSync(join(RACINE, f), 'utf8'), `${f} n'importe pas tutorName`).toContain('tutorName');
    }
  });
});
