/**
 * PUBLIER UNE FORMATION QUI N'EST PAS ÉCRITE.
 *
 * « Coming Soon » ouvre une seconde porte de publication : la fiche part en ligne avec son
 * tarif et le titre de ses modules, sans une seule leçon. Il fallait donc deux checklists,
 * et chacune doit tomber juste dans les deux sens : accepter ce qu'elle doit accepter,
 * signaler ce qu'elle doit encore signaler.
 *
 * ⚠️ Ces listes N'INTERDISENT PLUS RIEN. Les boutons de publication ont été libérés sur
 * décision explicite : la console publie quoi qu'il manque, et la checklist ne fait que
 * NOMMER ce qui manque, sous les boutons et dans le panneau latéral. Ce que ce fichier
 * protège n'est donc plus un verrou, c'est l'exactitude d'un avertissement — et un
 * avertissement faux se remarque moins qu'un verrou faux, ce qui le rend plus utile à tester.
 *
 * Ce fichier couvre aussi les prédicats de mise en vente, parce qu'ils décident de choses
 * qu'on ne voit pas en relisant le code : ce que le blog met en avant, ce que l'accueil
 * annonce, et si la boutique est ouverte. Une erreur là-dedans pousse un produit qu'on ne
 * peut pas acheter, sans rien casser de visible.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildPublishChecklist, type PublishInput } from '../../src/pages/admin/formations/publishChecklist';
import {
  estOuverte, estAVenir, estPrecommandable, accepteAchat,
  formationMiseEnAvant, ouverture, preuveSociale, SEUIL_PREUVE_SOCIALE,
} from '../../src/types/formationRelease';
import type { Formation, Module } from '../../src/types';

// ── La checklist ─────────────────────────────────────────────────────────────────────────

const moduleAvecLecon = (): Module => ({
  id: 'm1', title: 'Module 1', order: 0,
  lessons: [{ id: 'l1', title: 'Leçon 1', type: 'text', duration: '5 min', content: 'Du texte.', order: 0, isFree: true }],
});
const moduleVide = (): Module => ({ id: 'm2', title: 'Module 2', order: 1, lessons: [] });

const FICHE: PublishInput = {
  title: 'SEO pour les commerces',
  description: 'Une description courte.',
  price: '95000',
  promoPrice: '',
  coverImage: 'https://media.maxmorrys.me/x.jpg',
  modules: [moduleAvecLecon()],
};

describe('checklist — la porte « Coming Soon »', () => {
  it("accepte une fiche dont AUCUN module n'a de leçon — c'est tout l'objet", () => {
    const c = buildPublishChecklist({ ...FICHE, modules: [moduleVide()] }, 'comingSoon');
    expect(c.ready).toBe(true);
  });

  it('exige quand même au moins un module : la fiche promet un programme', () => {
    const c = buildPublishChecklist({ ...FICHE, modules: [] }, 'comingSoon');
    expect(c.ready).toBe(false);
    expect(c.items.find((i) => i.id === 'modules')?.ok).toBe(false);
  });

  it('ne pose plus la condition `lessons` du tout, elle ne veut rien dire ici', () => {
    const c = buildPublishChecklist({ ...FICHE, modules: [moduleVide()] }, 'comingSoon');
    expect(c.items.map((i) => i.id)).not.toContain('lessons');
    expect(c.total).toBe(4);
  });

  it('reste exigeante sur ce qui est déjà PUBLIC : couverture, titre, prix cohérent', () => {
    expect(buildPublishChecklist({ ...FICHE, coverImage: '  ' }, 'comingSoon').ready).toBe(false);
    expect(buildPublishChecklist({ ...FICHE, title: '' }, 'comingSoon').ready).toBe(false);
    // Un promo supérieur au prix n'est pas une promotion — et il est affiché dès maintenant.
    expect(buildPublishChecklist({ ...FICHE, promoPrice: '99000' }, 'comingSoon').ready).toBe(false);
  });
});

describe('checklist — la porte d’ouverture reste inchangée', () => {
  it('accepte une fiche complète', () => {
    const c = buildPublishChecklist(FICHE, 'live');
    expect(c.ready).toBe(true);
    expect(c.total).toBe(5);
  });

  it('refuse toujours un module vide, qui donnerait un lecteur sans rien à lire', () => {
    expect(buildPublishChecklist({ ...FICHE, modules: [moduleAvecLecon(), moduleVide()] }, 'live').ready).toBe(false);
  });

  it("refuse une fiche sans aucune leçon — celle que « Coming Soon » accepte", () => {
    expect(buildPublishChecklist({ ...FICHE, modules: [moduleVide()] }, 'live').ready).toBe(false);
  });

  it('l’étape par défaut est l’ouverture : aucun appel existant ne s’assouplit', () => {
    expect(buildPublishChecklist({ ...FICHE, modules: [moduleVide()] }).ready).toBe(false);
  });
});

// ── Les prédicats de mise en vente ───────────────────────────────────────────────────────

const f = (over: Partial<Formation>): Formation => ({
  id: 'f', title: 'T', slug: 't', description: '', longDescription: '', coverImage: '',
  level: 'debutant', price: 1000, duration: '', modules: [], category: '', tags: [],
  students: 0, rating: 0, status: 'published', featured: false, certificateEnabled: true,
  ...over,
});

describe('prédicats de mise en vente', () => {
  it('« publiée » ne veut plus dire « ouverte »', () => {
    expect(estOuverte(f({}))).toBe(true);
    expect(estOuverte(f({ comingSoon: true }))).toBe(false);
    expect(estAVenir(f({ comingSoon: true }))).toBe(true);
    expect(estAVenir(f({ status: 'draft', comingSoon: true }))).toBe(false);
  });

  it("l'absence du drapeau vaut « ouverte » — tout le catalogue existant", () => {
    expect(estOuverte(f({ comingSoon: undefined }))).toBe(true);
  });

  it('la précommande est par formation, jamais globale', () => {
    expect(estPrecommandable(f({ comingSoon: true }))).toBe(false);
    expect(estPrecommandable(f({ comingSoon: true, preorderEnabled: true }))).toBe(true);
    // Une formation ouverte n'est pas « précommandable » : elle s'achète, tout simplement.
    expect(estPrecommandable(f({ preorderEnabled: true }))).toBe(false);
  });

  it('le tunnel accepte une formation ouverte ou une précommande ouverte', () => {
    expect(accepteAchat(f({}))).toBe(true);
    expect(accepteAchat(f({ comingSoon: true }))).toBe(false);
    expect(accepteAchat(f({ comingSoon: true, preorderEnabled: true }))).toBe(true);
    expect(accepteAchat(f({ status: 'draft' }))).toBe(false);
  });
});

describe('mise en avant — une surface qui montre UNE formation', () => {
  it('préfère une formation ouverte à une formation à venir, même mise en avant', () => {
    const aVenir = f({ id: 'a', comingSoon: true, featured: true });
    const ouverte = f({ id: 'b' });
    expect(formationMiseEnAvant([aVenir, ouverte])?.id).toBe('b');
  });

  it('respecte `featured` entre formations ouvertes', () => {
    expect(formationMiseEnAvant([f({ id: 'a' }), f({ id: 'b', featured: true })])?.id).toBe('b');
  });

  it("retombe sur une formation à venir s'il n'y a rien d'ouvert — mieux que rien", () => {
    expect(formationMiseEnAvant([f({ id: 'a', comingSoon: true })])?.id).toBe('a');
  });

  it('rend `null` sur un catalogue vide', () => {
    expect(formationMiseEnAvant([])).toBeNull();
  });
});

describe('ce qu’on a le droit de dire de la date', () => {
  it('la date ferme prime sur la période libre', () => {
    expect(ouverture(f({ launchAt: '2026-10-01', launchLabel: 'Rentrée' }))).toEqual({ kind: 'date', value: '2026-10-01' });
  });

  it('la période libre sert de repli', () => {
    expect(ouverture(f({ launchLabel: 'Rentrée 2026' }))).toEqual({ kind: 'label', value: 'Rentrée 2026' });
  });

  it("l'absence de date est un état valide, pas un trou à combler", () => {
    expect(ouverture(f({}))).toBeNull();
    expect(ouverture(f({ launchAt: '   ', launchLabel: '  ' }))).toBeNull();
  });
});

describe('preuve sociale — un petit nombre dessert', () => {
  it('ne rend rien en dessous du seuil, y compris zéro', () => {
    expect(preuveSociale(f({}))).toBeNull();
    expect(preuveSociale(f({ waitlistCount: 0 }))).toBeNull();
    expect(preuveSociale(f({ waitlistCount: SEUIL_PREUVE_SOCIALE - 1 }))).toBeNull();
  });

  it('rend le compte à partir du seuil', () => {
    expect(preuveSociale(f({ waitlistCount: SEUIL_PREUVE_SOCIALE }))).toBe(SEUIL_PREUVE_SOCIALE);
    expect(preuveSociale(f({ waitlistCount: 240 }))).toBe(240);
  });
});

// ── Les libellés de conditions, qu'aucun grep ne trouve ──────────────────────────────────

/**
 * ⚠️ CES CLÉS SONT CONSTRUITES, DONC INVISIBLES POUR `i18n-keys.test.ts`.
 *
 * La console écrit `t(\`formations.console.${racine}.${id}.title\`)` : ni le test de clés, qui
 * balaie le texte des `.tsx`, ni le typecheck, ni le lint ne peuvent la voir. Une clé manquante
 * s'afficherait telle quelle dans l'écran d'administration — « formations.console.
 * checkComingSoon.cover.title » à la place d'un libellé — sans que rien n'échoue.
 *
 * La porte « bientôt » a son PROPRE jeu de textes parce que `modules` n'y exige pas la même
 * chose : « au moins un module » et non « aucun module vide ». Réutiliser les libellés
 * d'ouverture affichait l'exigence que cette porte lève précisément.
 */
describe('les libellés des deux portes existent dans les deux langues', () => {
  const LANGS = ['fr', 'en'] as const;
  const RACINES = ['check', 'checkComingSoon'] as const;
  const FACES = ['title', 'ok', 'ko'] as const;

  /** Les conditions réellement produites par chaque porte, jamais une liste écrite à la main. */
  const idsDe = (stage: 'live' | 'comingSoon') =>
    buildPublishChecklist(FICHE, stage).items.map((i) => i.id);

  it('chaque condition de chaque porte a son titre et ses deux états', () => {
    const manquantes: string[] = [];
    for (const lang of LANGS) {
      const admin = JSON.parse(
        readFileSync(`src/i18n/locales/${lang}/admin.json`, 'utf8'),
      ) as Record<string, never>;
      const console_ = (admin as Record<string, Record<string, Record<string, unknown>>>)
        .formations.console;
      for (const racine of RACINES) {
        const ids = idsDe(racine === 'check' ? 'live' : 'comingSoon');
        const bloc = console_[racine] as Record<string, Record<string, unknown>> | undefined;
        if (!bloc) { manquantes.push(`${lang}/${racine}`); continue; }
        for (const id of ids) {
          for (const face of FACES) {
            if (typeof bloc[id]?.[face] !== 'string') manquantes.push(`${lang}/${racine}.${id}.${face}`);
          }
        }
      }
    }
    expect(manquantes).toEqual([]);
  });

  it('la porte « bientôt » ne réclame PAS un module rempli, et son texte le dit', () => {
    const fr = JSON.parse(readFileSync('src/i18n/locales/fr/admin.json', 'utf8')) as
      Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>;
    const annonce = fr.formations.console.checkComingSoon.modules.title;
    const ouverture = fr.formations.console.check.modules.title;
    // Le même libellé des deux côtés est exactement le défaut que ce bloc empêche.
    expect(annonce).not.toBe(ouverture);
  });
});
