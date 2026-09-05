import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES TEXTES DE FICHE, ET LES DEUX FAÇONS DONT ILS SE FONT REFUSER.
 *
 * 1 · PAR LA MACHINE, AU TÉLÉVERSEMENT. Un titre de 31 caractères est rejeté par
 *     l'API du magasin — après le build, après la file d'attente, un vendredi soir.
 *     Ces limites se comptent en CARACTÈRES, pas en octets : « Rysmo — apprendre
 *     le digital » fait 28 caractères et 30 octets, et compter les octets ferait
 *     refuser un titre valide (ou passer un titre trop long).
 *
 * 2 · PAR LA REVUE, DES SEMAINES PLUS TARD. Une fiche qui promet ce que le binaire
 *     ne fait pas est un rejet 2.3.1. L'application ne vend RIEN — son tunnel de
 *     paiement a été supprimé — donc aucun texte ne doit promettre un achat.
 *     C'est la même règle que `mobile-store-achats.test.ts` applique au code ;
 *     elle vaut aussi pour ce qu'on écrit à côté.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const RACINE = resolve(__dirname, '../..');
const STORE = resolve(RACINE, 'mobile/store');
const lire = (p: string) => readFileSync(resolve(STORE, p), 'utf8');

/** Play compte les caractères, et les emoji comptent double par leurs paires. */
const taille = (s: string) => [...s].length;

const PLAY = [
  { fichier: 'title.txt', max: 30 },
  { fichier: 'short_description.txt', max: 80 },
  { fichier: 'full_description.txt', max: 4000 },
] as const;

const LOCALES_PLAY = ['fr-FR', 'en-US'] as const;
const LOCALES_APPLE = ['fr-FR', 'en-US'] as const;

/** Extrait les sections `## Titre (N max…)` d'une fiche Apple. */
function sections(md: string): Array<{ nom: string; max: number | null; valeur: string }> {
  const out: Array<{ nom: string; max: number | null; valeur: string }> = [];
  for (const m of md.matchAll(/^## (.+?)\n([\s\S]*?)(?=\n## |\s*$)/gm)) {
    const entete = m[1];
    const chiffre = /(\d+)\s*max/.exec(entete);
    out.push({
      nom: entete.replace(/\s*\(.*\)\s*$/, '').trim(),
      max: chiffre ? Number(chiffre[1]) : null,
      valeur: m[2].trim(),
    });
  }
  return out;
}

describe('les fiches de magasin tiennent dans leurs limites', () => {
  it('les six fichiers Play existent, dans les deux langues', () => {
    for (const loc of LOCALES_PLAY) {
      for (const { fichier } of PLAY) {
        expect(existsSync(resolve(STORE, `play/${loc}/${fichier}`)), `play/${loc}/${fichier}`).toBe(true);
      }
    }
  });

  it('aucun champ Play ne dépasse — compté en caractères, pas en octets', () => {
    const trop: string[] = [];
    for (const loc of LOCALES_PLAY) {
      for (const { fichier, max } of PLAY) {
        const n = taille(lire(`play/${loc}/${fichier}`).trim());
        if (n > max) trop.push(`play/${loc}/${fichier} : ${n}/${max}`);
      }
    }
    expect(trop).toEqual([]);
  });

  it('aucun champ Apple ne dépasse', () => {
    const trop: string[] = [];
    for (const loc of LOCALES_APPLE) {
      for (const s of sections(lire(`apple/${loc}.md`))) {
        if (s.max !== null && taille(s.valeur) > s.max) {
          trop.push(`apple/${loc}.md · ${s.nom} : ${taille(s.valeur)}/${s.max}`);
        }
      }
    }
    expect(trop).toEqual([]);
  });

  it('les mots-clés Apple n’ont pas d’espace après les virgules', () => {
    /* Un espace après une virgule est COMPTÉ dans les 100 caractères, et ne sert à rien :
       c'est du budget de mots-clés dépensé en blancs. */
    for (const loc of LOCALES_APPLE) {
      const mc = sections(lire(`apple/${loc}.md`)).find((s) => /mots-clés|keywords/i.test(s.nom));
      expect(mc, `mots-clés absents de apple/${loc}.md`).toBeDefined();
      expect(mc?.valeur.includes(', '), `apple/${loc}.md : espace après une virgule`).toBe(false);
    }
  });

  it('aucune fiche ne promet un achat, ni ne nomme un magasin', () => {
    /*
     * Même règle que pour le code. L'application ne vend rien : une fiche qui annonce un
     * achat décrit un binaire qui n'existe pas, et la revue confronte les deux.
     * Et nommer le magasin dans sa propre fiche attire l'œil sur la règle qu'on applique.
     */
    const INTERDITS = [
      /\bachet(?:er|e|ez)\b/i, /\bacheter\b/i, /\bs['’]abonner\b/i, /\bsouscri(?:re|s|vez)\b/i,
      /\bpay(?:er|e|ez)\b/i, /\bWave\b/, /\bOrange Money\b/i,
      /\bApp Store\b/i, /\bGoogle Play\b/i, /\bPlay Store\b/i,
      /\bbuy\b/i, /\bsubscribe\b/i, /\bpurchase\b/i,
    ];
    const fautes: string[] = [];
    const fichiers = [
      ...LOCALES_PLAY.flatMap((l) => PLAY.map((p) => `play/${l}/${p.fichier}`)),
      ...LOCALES_APPLE.map((l) => `apple/${l}.md`),
    ];
    for (const f of fichiers) {
      const texte = lire(f);
      for (const motif of INTERDITS) {
        if (motif.test(texte)) fautes.push(`${f} · ${motif}`);
      }
    }
    expect(fautes).toEqual([]);
  });

  it('les URL citées existent dans le routage du site', () => {
    /* La porte anti-renommage, la même que pour l'écran légal : le jour où
       `/legal/confidentialite` devient autre chose, la fiche pointe un 404 — et personne ne
       relit une fiche de magasin déjà publiée. */
    const app = readFileSync(resolve(RACINE, 'src/App.tsx'), 'utf8');
    for (const loc of LOCALES_APPLE) {
      const md = lire(`apple/${loc}.md`);
      for (const m of md.matchAll(/https:\/\/maxmorrys\.me\/(?:en\/)?([a-z0-9/-]+)/g)) {
        const chemin = m[1];
        expect(app.includes(chemin), `apple/${loc}.md cite /${chemin}, absent de src/App.tsx`).toBe(true);
      }
    }
  });
});
