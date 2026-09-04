import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

import {
  agencyLeadConfig,
  isGrowthRequest,
  PROJECT_TYPES,
  routingTagFor,
  TRAINING_PROJECT_TYPE,
} from '../../src/lib/agency/engagement';

/**
 * La demande de formation d'équipe écrit dans `engagement_leads`, la même collection que
 * `/agence`. Deux décisions la séparent de sa voisine, et aucune n'est visible à la lecture
 * d'un composant : le type n'est pas proposé par l'autre formulaire, et la demande n'est
 * jamais routée vers Cléa. Ce fichier les fige.
 */

describe('le type « training » est accepté, jamais proposé', () => {
  /*
   * ⚠️ L'ASYMÉTRIE EST LE SUJET. `PROJECT_TYPES` est la liste que `/agence` PROPOSE ; le type
   * `EngagementProjectType` est ce que la collection ACCEPTE. Les fusionner ferait apparaître
   * « Formation d'équipe » dans le menu d'une page qui vend des plateformes.
   */
  it('n’apparaît pas dans la liste déroulante de /agence', () => {
    expect(PROJECT_TYPES).not.toContain(TRAINING_PROJECT_TYPE);
    expect(agencyLeadConfig.projectTypes).not.toContain(TRAINING_PROJECT_TYPE);
  });

  it('vaut bien la clé attendue par la console et par l’i18n', () => {
    expect(TRAINING_PROJECT_TYPE).toBe('training');
  });

  /*
   * `AdminMissions` rend `t('form.projectTypes.<key>')` — une clé CONSTRUITE, que
   * `i18n-keys.test.ts` ne sait pas suivre. Sans ces deux entrées, la console afficherait la
   * chaîne brute sur chaque demande B2B, et personne ne le verrait avant de l'ouvrir.
   */
  it.each(['fr', 'en'])('a son libellé de console en %s', (langue) => {
    const agency = JSON.parse(readFileSync(`src/i18n/locales/${langue}/agency.json`, 'utf8'));
    expect(agency.form.projectTypes[TRAINING_PROJECT_TYPE]).toBeTruthy();
  });
});

describe('une demande de formation ne part jamais chez Cléa', () => {
  /*
   * ⚠️ LE PIÈGE QUE CE TEST FERME. `GROWTH_KEYWORDS` contient « acquisition », et la recherche
   * se fait en SOUS-CHAÎNE. « Structurer l'acquisition de compétences » — la phrase la plus
   * naturelle du monde sur ce formulaire — suffirait à router la demande vers la practice
   * GROW. Le hook de formation n'appelle donc pas `routingTagFor` du tout ; ce test dit
   * pourquoi il ne faut pas « harmoniser » les deux formulaires plus tard.
   */
  it('la phrase la plus naturelle du formulaire déclencherait le routage growth', () => {
    expect(isGrowthRequest('other', "on veut structurer l'acquisition de compétences")).toBe(true);
  });

  it('et c’est pour ça que le type training ne passe pas par le routage', () => {
    // Le type lui-même n'est pas growth…
    expect(isGrowthRequest(TRAINING_PROJECT_TYPE, 'former vingt personnes au SEO')).toBe(false);
    // …mais la description suffirait à le faire basculer, d'où l'appel qu'on ne fait pas.
    expect(routingTagFor(TRAINING_PROJECT_TYPE, "acquisition de compétences")).not.toBeNull();
  });
});

describe('les bornes du formulaire sont celles des règles', () => {
  /*
   * Lues dans `firestore.rules` en texte, comme `tax-sync` lit son miroir. Une borne du hook
   * qui s'écarterait de la règle ne produirait pas un message d'erreur mais un refus de
   * permission opaque, APRÈS l'envoi.
   */
  const regles = readFileSync('firestore.rules', 'utf8');
  const bloc = regles.slice(regles.indexOf('match /engagement_leads/'));
  const borne = (champ: string, comparateur: '>=' | '<=') => {
    const m = bloc.match(
      new RegExp(`request\\.resource\\.data\\.${champ}\\.size\\(\\)\\s*${comparateur}\\s*(\\d+)`),
    );
    if (!m) throw new Error(`borne ${champ} ${comparateur} introuvable`);
    return Number(m[1]);
  };

  it('la description a le même plancher des deux côtés', () => {
    expect(agencyLeadConfig.minDescriptionLength).toBe(borne('description', '>='));
  });

  it('le plafond de description est bien celui que le champ arrête', () => {
    expect(borne('description', '<=')).toBe(4000);
  });

  it('le nom et l’organisation ont le même plancher que la règle', () => {
    expect(borne('name', '>=')).toBe(2);
    expect(borne('company', '>=')).toBe(2);
  });

  /*
   * ⚠️ LE PLAFOND DE CLÉS EST ATTEINT. La demande de formation en écrit onze sur treize.
   * Ajouter deux champs de plus ferait échouer 100 % des envois, en silence — le plafond
   * existe pour empêcher le bourrage de document par un robot.
   */
  it('le plafond de clés laisse exactement deux places', () => {
    const m = bloc.match(/keys\(\)\.size\(\)\s*<=\s*(\d+)/);
    expect(m).not.toBeNull();
    const plafond = Number(m![1]);
    // name, company, email, projectType, budget, timeline, description, status, locale,
    // createdAt, via.
    const ecrites = 11;
    expect(plafond - ecrites).toBe(2);
  });
});
