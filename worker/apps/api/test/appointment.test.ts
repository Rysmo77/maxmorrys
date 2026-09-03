import { describe, expect, it } from 'vitest';

import { buildAppointmentNotice } from '../src/lib/appointment';

/**
 * Ce courrier est le premier — et longtemps le seul — que reçoive un prospect. Deux choses
 * doivent tenir : il porte le créneau DEMANDÉ, et il ne prétend pas l'avoir confirmé.
 */

const DEMANDE = { nom: 'Awa', date: '2026-09-20', heure: '18:30', objet: 'Coaching' };

describe('buildAppointmentNotice', () => {
  it('porte le créneau demandé, dans les deux langues', () => {
    for (const langue of ['fr', 'en'] as const) {
      const m = buildAppointmentNotice(DEMANDE, langue, 'https://maxmorrys.me');
      for (const attendu of ['2026-09-20', '18:30', 'Coaching', 'Awa']) {
        expect(m.html, `${langue}/html`).toContain(attendu);
        expect(m.text, `${langue}/texte`).toContain(attendu);
      }
      expect(m.subject.length).toBeGreaterThan(0);
    }
  });

  /*
   * ⚠️ LE TEST QUI COMPTE. Le statut initial d'une demande est `pending`, la confirmation est
   * un geste MANUEL depuis la console, aucun créneau n'est vérifié — deux personnes peuvent
   * demander la même heure — et aucun calendrier n'est tenu. Écrire « confirmé » serait donc
   * promettre ce que le produit ne tient pas, exactement la faute que ce dépôt a corrigée
   * ailleurs (la lettre par e-mail, les notes en étoiles, les chiffres inventés).
   *
   * Le mot est interdit dans les deux langues, y compris sous sa forme fléchie.
   */
  it('ne prétend JAMAIS confirmer le rendez-vous', () => {
    const fr = buildAppointmentNotice(DEMANDE, 'fr', 'https://maxmorrys.me');
    expect(fr.text).toMatch(/ne vaut pas confirmation/i);
    expect(fr.text).not.toMatch(/\b(est|a été)\s+confirmé/i);
    expect(fr.text).not.toMatch(/rendez-vous confirmé/i);

    const en = buildAppointmentNotice(DEMANDE, 'en', 'https://maxmorrys.me');
    expect(en.text).toMatch(/not a confirmation/i);
    expect(en.text).not.toMatch(/\b(is|has been)\s+confirmed/i);
    expect(en.text).not.toMatch(/booking confirmed/i);
  });

  it('dit que le créneau n’est pas encore bloqué', () => {
    expect(buildAppointmentNotice(DEMANDE, 'fr', 'https://x').text).toMatch(/pas encore bloqué/i);
    expect(buildAppointmentNotice(DEMANDE, 'en', 'https://x').text).toMatch(/not held yet/i);
  });

  it('échappe ce que le visiteur a tapé', () => {
    // Le nom vient d'un formulaire public : il ne doit pas pouvoir injecter de balise.
    const m = buildAppointmentNotice({ ...DEMANDE, nom: '<script>alert(1)</script>' }, 'fr', 'https://x');
    expect(m.html).not.toContain('<script>alert(1)</script>');
    expect(m.html).toContain('&lt;script&gt;');
  });

  it('renvoie vers la page de contact de la bonne langue', () => {
    expect(buildAppointmentNotice(DEMANDE, 'fr', 'https://maxmorrys.me').html).toContain('https://maxmorrys.me/contact');
    expect(buildAppointmentNotice(DEMANDE, 'en', 'https://maxmorrys.me').html).toContain('https://maxmorrys.me/en/contact');
  });
});
