import { describe, expect, it } from 'vitest';

import { catalogueSansPrix, lireCanal, reglesDeRecommandation, retirerLesPrix } from '../src/lib/rysmo-canal';

/**
 * L'application ne vend rien. Ce fichier tient les deux filets qui empêchent le
 * répétiteur d'y citer un prix : le prompt et le catalogue n'en portent pas, et ce qui
 * passerait quand même est retiré de la réponse.
 */
const VENTE = /FCFA|achat|acheter|payer|paiement|payant/i;

describe('le canal app du répétiteur', () => {
  it('lit `app` et retombe sur le site pour tout le reste', () => {
    expect(lireCanal('app')).toBe('app');
    expect(lireCanal(undefined)).toBe('web');
    expect(lireCanal('APP')).toBe('web');
  });

  it("le prompt de l'application ne recommande aucun achat", () => {
    const regles = reglesDeRecommandation('app').join('\n');
    // Les interdits citent les mots ; aucune ligne ne les PRESCRIT.
    const prescriptions = regles.split('\n').filter((l) => !/jamais|n'emploie|ne cite/i.test(l));
    for (const l of prescriptions) expect(l).not.toMatch(VENTE);
  });

  it('le prompt du site est inchangé', () => {
    expect(reglesDeRecommandation('web').join('\n')).toContain("pour l'achat");
  });

  it('le catalogue perd ses prix et ses mentions payant/gratuit', () => {
    const catalogue = [
      'FORMATIONS (cours payants/gratuits — à recommander pour aller plus loin) :',
      '- "SEO local" — Marketing · Débutant · 25000 FCFA → /formations/seo-local',
      '- "Bases" — Marketing · Débutant · gratuit → /formations/bases',
      'ARTICLES DU BLOG (gratuits — à recommander en priorité avant un cours payant) :',
      'PODCASTS (gratuits, audio) :',
      'VIDÉOS (gratuites) :',
    ].join('\n');
    const nettoye = catalogueSansPrix(catalogue);
    expect(nettoye).not.toMatch(/FCFA|payant|gratuit/i);
    expect(nettoye).toContain('- "SEO local" — Marketing · Débutant → /formations/seo-local');
    expect(nettoye).toContain('PODCASTS :');
  });

  it('un montant qui échappe au prompt est retiré de la réponse', () => {
    expect(retirerLesPrix('La formation [SEO](/formations/seo) (25 000 FCFA) le couvre.'))
      .toBe('La formation [SEO](/formations/seo) le couvre.');
    expect(retirerLesPrix('Elle coûte 15000 FCFA.')).toBe('Elle coûte.');
    expect(retirerLesPrix('Fais 3 publications par semaine.')).toBe('Fais 3 publications par semaine.');
  });
});
