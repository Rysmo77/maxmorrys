import { describe, expect, it } from 'vitest';

import { catalogueSansPrix } from '../src/lib/rysmo-canal';
import { ligneFormation } from '../src/lib/rysmo-context';
import { PLATFORM_KNOWLEDGE, PLATFORM_KNOWLEDGE_APP } from '../src/lib/rysmo-knowledge';
import { lirePrenom, promptStable, sectionTon } from '../src/lib/rysmo-prompt';

/**
 * Le ton préféré de Max (test à l'aveugle du 01/11/2026) SANS perdre les règles de vérité.
 */

describe('le ton de Rysmo', () => {
  const ton = sectionTon(false).join('\n');

  it('salue par le prénom, tutoie, reconnaît la difficulté, finit par une étape ou une question', () => {
    expect(ton).toMatch(/prénom/);
    expect(ton).toMatch(/Tutoie toujours/);
    expect(ton).toMatch(/reconnaître ce qui est difficile/);
    expect(ton).toMatch(/prochaine étape concrète OU une question ouverte/);
    expect(ton).toMatch(/Jamais sec ni administratif/);
  });

  it("propose UN article du blog, seulement parmi ceux du catalogue", () => {
    expect(ton).toMatch(/UN article du blog — un seul/);
    expect(ton).toMatch(/UNIQUEMENT un article listé dans « ARTICLES DU BLOG »/);
  });

  it('les règles de vérité restent dans le prompt, après le ton', () => {
    const prompt = promptStable(false, 'web', 'CATALOGUE-ICI');
    expect(prompt.indexOf('RÈGLE STRICTE')).toBeGreaterThan(prompt.indexOf('Ton —'));
    expect(prompt).toContain(PLATFORM_KNOWLEDGE);
    expect(prompt.endsWith('CATALOGUE-ICI')).toBe(true);
    expect(promptStable(false, 'app', '')).toContain(PLATFORM_KNOWLEDGE_APP);
    expect(promptStable(true, 'web', '')).toContain('ALWAYS reply in English');
  });
});

describe('lirePrenom', () => {
  it('prend le premier prénom réel', () => {
    expect(lirePrenom('Awa Diop')).toBe('Awa');
    expect(lirePrenom('  Ndèye-Fatou  Sarr')).toBe('Ndèye-Fatou');
  });
  it("refuse ce qui n'est pas un prénom : début d'e-mail, nom de repli, balisage", () => {
    expect(lirePrenom('awa.diop92')).toBe('');
    expect(lirePrenom('Étudiant')).toBe('');
    expect(lirePrenom('Student')).toBe('');
    expect(lirePrenom('<script>')).toBe('');
    expect(lirePrenom(undefined)).toBe('');
    expect(lirePrenom('A')).toBe('');
  });
});

describe('les formations du catalogue (Firestore, 01/11/2026)', () => {
  const cm = {
    title: 'Devenir Community Manager Freelance en Afrique : Ta route vers le succès',
    slug: 'devenir-community-manager-freelance-en-afrique',
    category: 'Marketing Digital',
    level: 'debutant',
    // Le codec Firestore rend les entiers en nombres (integerValue décodé).
    price: 40000,
    promoPrice: 25000,
    status: 'published',
    comingSoon: true,
    preorderEnabled: false,
    launchAt: '',
    launchLabel: '',
  };

  it('dit le statut réel, le prix payé et le prix membre (−20 %, comme au débit)', () => {
    const ligne = ligneFormation(cm);
    expect(ligne).toContain('"Devenir Community Manager Freelance en Afrique : Ta route vers le succès"');
    expect(ligne).toContain("à venir, pas encore ouverte (aucune date annoncée) — liste d'attente sur sa page");
    expect(ligne).toContain('25000 FCFA, 20000 FCFA pour un membre du Club');
    expect(ligne.endsWith('→ /formations/devenir-community-manager-freelance-en-afrique')).toBe(true);
  });

  it('une formation ouverte est dite ouverte ; une date annoncée est reprise telle quelle', () => {
    expect(ligneFormation({ ...cm, comingSoon: false })).toContain(' · ouverte · ');
    expect(ligneFormation({ ...cm, launchAt: '2026-12-01' })).toContain('ouverture annoncée : 2026-12-01');
    expect(ligneFormation({ ...cm, preorderEnabled: true })).toContain('précommande ouverte');
  });

  it("l'application ne reçoit ni prix ni précommande", () => {
    const nettoye = catalogueSansPrix(ligneFormation({ ...cm, preorderEnabled: true }));
    expect(nettoye).not.toMatch(/FCFA|précommande|membre du Club/);
    expect(nettoye).toMatch(/· à venir, bientôt disponible \(aucune date annoncée\) →/);
  });
});

describe('la base de connaissance sur les formations (décision de Max, 01/11/2026)', () => {
  it('renvoie au catalogue, interdit toute autre formation, ne dit plus « aucune n’est ouverte »', () => {
    for (const base of [PLATFORM_KNOWLEDGE, PLATFORM_KNOWLEDGE_APP]) {
      expect(base).toMatch(/UNIQUEMENT celles du CATALOGUE/);
      expect(base).toMatch(/N'en invente AUCUNE autre/);
      expect(base).toMatch(/formation SEO/);
      expect(base).not.toMatch(/AUCUNE n'est ouverte/);
    }
  });
});
