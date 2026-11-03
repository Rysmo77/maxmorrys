import { describe, it, expect } from 'vitest';
import {
  FENETRE_RELAIS_MS,
  analyserEspaces,
  espaceRelais,
  lireDemandeRelais,
  lireHorodatage,
  noterEspace,
  relaisApresDeconnexion,
  relaisPermis,
  sessionPerimee,
  urlDemandeRelais,
} from '../../src/lib/sessionRelais';

/**
 * Le relais de session (audit E1, 03/11/2026) : connecté·e sur l'Edu, une adresse du hub ou
 * du Club ouverte SANS clic (tapée, favori, nouvel onglet) tombait sur `/connexion`.
 */

describe('indication des espaces connectés', () => {
  it('ne garde que des noms d’espace connus, dans l’ordre canonique', () => {
    expect(analyserEspaces('club,edu,inconnu, hub')).toEqual(['hub', 'edu', 'club']);
    expect(analyserEspaces(null)).toEqual([]);
    expect(analyserEspaces('')).toEqual([]);
  });

  it('ajoute et retire un espace, et se vide en null', () => {
    expect(noterEspace(null, 'edu', true)).toBe('edu');
    expect(noterEspace('edu', 'club', true)).toBe('edu,club');
    expect(noterEspace('edu,club', 'edu', true)).toBe('edu,club');
    expect(noterEspace('edu,club', 'edu', false)).toBe('club');
    expect(noterEspace('club', 'club', false)).toBeNull();
  });

  it('ne porte aucune donnée personnelle', () => {
    expect(noterEspace('uid-123,alice@example.com', 'hub', true)).toBe('hub');
  });
});

describe('choix de l’espace à solliciter', () => {
  it('prend un AUTRE espace connecté', () => {
    expect(espaceRelais('hub', ['edu'])).toBe('edu');
    expect(espaceRelais('edu', ['hub', 'edu', 'club'])).toBe('hub');
  });

  it('ne se sollicite jamais lui-même', () => {
    expect(espaceRelais('edu', ['edu'])).toBeNull();
    expect(espaceRelais('club', [])).toBeNull();
  });
});

describe('garde anti-boucle', () => {
  const t0 = 1_800_000_000_000;
  it('permet un premier relais', () => {
    expect(relaisPermis(null, t0)).toBe(true);
  });
  it('refuse un second relais dans la fenêtre', () => {
    expect(relaisPermis(String(t0), t0 + 1000)).toBe(false);
    expect(relaisPermis(String(t0), t0 + FENETRE_RELAIS_MS - 1)).toBe(false);
  });
  it('le permet de nouveau après la fenêtre, ou sur une marque illisible ou future', () => {
    expect(relaisPermis(String(t0), t0 + FENETRE_RELAIS_MS)).toBe(true);
    expect(relaisPermis('n’importe quoi', t0)).toBe(true);
    expect(relaisPermis(String(t0 + 60_000), t0)).toBe(true);
  });
});

describe('demande de relais', () => {
  const retour = 'https://maxmorrys.me/compte?onglet=1';

  it('vise la racine de l’espace sollicité, l’adresse de retour dans le fragment', () => {
    const url = urlDemandeRelais('edu', 'https://maxmorrys.me', retour);
    expect(url).toBe(`https://edu.maxmorrys.me/#relais=${encodeURIComponent(retour)}`);
    expect(new URL(url).search).toBe('');
  });

  it('aller-retour : la demande se relit à l’identique sur l’espace sollicité', () => {
    const fragment = new URL(urlDemandeRelais('edu', 'https://maxmorrys.me', retour)).hash.slice(1);
    expect(lireDemandeRelais(fragment, 'https://edu.maxmorrys.me')).toEqual({ retour, reste: '' });
  });

  it('garde le reste du fragment', () => {
    const r = lireDemandeRelais(`a=1&relais=${encodeURIComponent(retour)}&b=2`, 'https://edu.maxmorrys.me');
    expect(r).toEqual({ retour, reste: 'a=1&b=2' });
  });

  it('n’est pas une redirection ouverte : un domaine étranger est refusé', () => {
    for (const mauvais of [
      'https://evil.example/compte',
      'https://maxmorrys.me.evil.example/',
      'javascript:alert(1)',
      'https://edu.maxmorrys.me/mes-formations', // l'hôte courant lui-même
      'pas une url',
    ]) {
      const r = lireDemandeRelais(`relais=${encodeURIComponent(mauvais)}`, 'https://edu.maxmorrys.me');
      expect(r, mauvais).toEqual({ retour: null, reste: '' });
    }
  });

  it('accepte les deux autres espaces', () => {
    expect(lireDemandeRelais(`relais=${encodeURIComponent('https://club.maxmorrys.me/fil')}`, 'https://edu.maxmorrys.me')?.retour)
      .toBe('https://club.maxmorrys.me/fil');
    expect(lireDemandeRelais(`relais=${encodeURIComponent('https://maxmorrys.me/')}`, 'https://club.maxmorrys.me')?.retour)
      .toBe('https://maxmorrys.me/');
  });

  it('suit les hôtes de développement', () => {
    const r = lireDemandeRelais(`relais=${encodeURIComponent('http://localhost:5173/compte')}`, 'http://edu.localhost:5173');
    expect(r?.retour).toBe('http://localhost:5173/compte');
  });

  it('ignore un fragment sans demande (dont le code de transfert `h=`)', () => {
    expect(lireDemandeRelais('h=abcdefghijklmnopqrstuvwxyz', 'https://maxmorrys.me')).toBeNull();
    expect(lireDemandeRelais('', 'https://maxmorrys.me')).toBeNull();
  });
});

describe('la déconnexion volontaire tient', () => {
  const deconnexion = 1_800_000_000_000;

  it('lit un horodatage, ou null', () => {
    expect(lireHorodatage(String(deconnexion))).toBe(deconnexion);
    expect(lireHorodatage(null)).toBeNull();
    expect(lireHorodatage('abc')).toBeNull();
    expect(lireHorodatage('0')).toBeNull();
  });

  it('sans déconnexion notée, aucune session n’est périmée', () => {
    expect(sessionPerimee(null, null)).toBe(false);
    expect(sessionPerimee(1, null)).toBe(false);
  });

  it('une session ouverte AVANT la déconnexion se ferme ; une session sans début connu aussi', () => {
    expect(sessionPerimee(deconnexion - 1, deconnexion)).toBe(true);
    expect(sessionPerimee(null, deconnexion)).toBe(true);
  });

  it('une session ouverte APRÈS la déconnexion reste', () => {
    expect(sessionPerimee(deconnexion + 1, deconnexion)).toBe(false);
  });

  it('pas de relais tant qu’aucune connexion fraîche n’a suivi la déconnexion', () => {
    expect(relaisApresDeconnexion(null, deconnexion)).toBe(false);
    expect(relaisApresDeconnexion(deconnexion - 1, deconnexion)).toBe(false);
    expect(relaisApresDeconnexion(deconnexion, deconnexion)).toBe(false);
    expect(relaisApresDeconnexion(deconnexion + 1, deconnexion)).toBe(true);
    expect(relaisApresDeconnexion(null, null)).toBe(true);
  });

  it('scénario : déconnexion sur le hub, l’Edu garde une vieille session, puis reconnexion', () => {
    const debutEdu = deconnexion - 60_000;
    // L'Edu au chargement : fermée, et ne répond à aucun relais.
    expect(sessionPerimee(debutEdu, deconnexion)).toBe(true);
    // Le hub, anonyme, ne tente pas de relais.
    expect(relaisApresDeconnexion(debutEdu, deconnexion)).toBe(false);
    // Reconnexion fraîche sur le Club : le relais redevient possible depuis le hub.
    const reconnexion = deconnexion + 5_000;
    expect(relaisApresDeconnexion(reconnexion, deconnexion)).toBe(true);
    expect(sessionPerimee(reconnexion, deconnexion)).toBe(false);
  });
});
