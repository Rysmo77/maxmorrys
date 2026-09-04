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

/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE REPLI TEXTE ÉTAIT LA PORTE — audit du 03/09/2026.
 *
 * Le test « échappe ce que le visiteur a tapé » ci-dessus ne regardait QUE le HTML, et le
 * HTML allait bien. Le courrier a deux corps, et le second n'échappe rien — il n'a pas à le
 * faire, c'est du texte brut. Sauf que les clients de messagerie transforment d'eux-mêmes
 * une URL en lien cliquable : le champ « objet », que `firestore.rules` ne contraignait pas
 * et qu'un anonyme pouvait écrire, suffisait donc à placer la destination d'un attaquant
 * dans un message signé SPF/DKIM au nom de Max-Morrys.
 *
 * Ces tests tiennent la garde sur les DEUX corps. Un futur contributeur qui ajouterait un
 * champ libre au courrier sans le faire passer par `assainirChampLibre` les casse.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
describe('assainirChampLibre — ce qui sort ne porte pas la charge utile', () => {
  it('retire une adresse explicite des DEUX corps', () => {
    const m = buildAppointmentNotice(
      { ...DEMANDE, objet: 'Urgent : confirme sur https://paye-ici.example/compte' },
      'fr',
      'https://maxmorrys.me',
    );
    expect(m.text).not.toContain('paye-ici.example');
    expect(m.html).not.toContain('paye-ici.example');
    expect(m.text).toContain('[lien retire]');
  });

  it('retire aussi un domaine nu, que plusieurs clients rendent cliquable', () => {
    const m = buildAppointmentNotice({ ...DEMANDE, nom: 'Voir paye-ici.top' }, 'fr', 'https://x');
    expect(m.text).not.toContain('paye-ici.top');
    expect(m.html).not.toContain('paye-ici.top');
  });

  it('retire mailto: et www. sans schéma', () => {
    const m = buildAppointmentNotice(
      { ...DEMANDE, objet: 'ecris a mailto:pirate@example.test ou www.example.test' },
      'fr',
      'https://x',
    );
    expect(m.text).not.toContain('pirate@example.test');
    expect(m.text).not.toContain('www.example.test');
  });

  it('aplatit les sauts de ligne qui fabriquent une fausse mise en page', () => {
    const m = buildAppointmentNotice(
      { ...DEMANDE, objet: 'Coaching\n\n--\nMax-Morrys\nService facturation' },
      'fr',
      'https://x',
    );
    // La ligne « Objet : … » du repli texte ne doit pas pouvoir en engendrer quatre.
    const ligneObjet = m.text.split('\n').find((l) => l.startsWith('Objet'));
    expect(ligneObjet).toContain('Service facturation');
    expect(m.text.split('\n').filter((l) => l.includes('Service facturation'))).toHaveLength(1);
  });

  it('borne la longueur, quel que soit ce que portait le document', () => {
    // Des documents créés AVANT le durcissement des règles passent encore par ici.
    const m = buildAppointmentNotice({ ...DEMANDE, objet: 'x'.repeat(5000) }, 'fr', 'https://x');
    expect(m.text.length).toBeLessThan(2000);
  });

  it('NON-REGRESSION : un trait d’union légitime survit', () => {
    // La première version de la classe de caractères avalait le tiret : « Max-Morrys »
    // devenait « Max Morrys » dans le courrier adressé à un prospect.
    const m = buildAppointmentNotice({ ...DEMANDE, nom: 'Awa Ndiaye-Fall' }, 'fr', 'https://x');
    expect(m.text).toContain('Awa Ndiaye-Fall');
  });

  it('NON-REGRESSION : un objet ordinaire traverse intact', () => {
    const m = buildAppointmentNotice({ ...DEMANDE, objet: 'Audit de presence digitale' }, 'fr', 'https://x');
    expect(m.text).toContain('Audit de presence digitale');
    expect(m.text).not.toContain('[lien retire]');
  });
});
