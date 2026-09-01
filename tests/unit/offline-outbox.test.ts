/**
 * LA FILE D'ENVOI EST LA SEULE PIÈCE DU PRODUIT QUI DOIT SURVIVRE À CE QUI LA CASSE.
 *
 * Tout le reste de l'écran hors connexion se relit : le cache est là ou il n'est pas là, et
 * on le voit. La file, elle, contient des gestes que la personne a DÉJÀ faits — une leçon
 * terminée dans un taxi, une note écrite dans une cour sans réseau. Si elle se perd, ce n'est
 * pas un affichage qui se dégrade, c'est du travail qui n'a jamais eu lieu, et c'est la
 * personne qui paie la panne du produit.
 *
 * D'où ce fichier, et d'où les quatre propriétés qu'il verrouille :
 *
 *   1. ELLE SURVIT AU RECHARGEMENT. C'est la raison d'être du stockage local plutôt que de la
 *      mémoire : une file en mémoire disparaît au rechargement, c'est-à-dire exactement quand
 *      elle sert. Le test relit donc à travers le stockage, jamais à travers une variable.
 *   2. ELLE GARDE SON ORDRE. Rejouer une note avant la leçon qu'elle annote produirait un état
 *      que personne n'a vécu.
 *   3. ELLE S'ARRÊTE AU PREMIER ÉCHEC, et ne perd rien de ce qui n'est pas passé. Un rejeu qui
 *      saute l'entrée qui coince est pire que pas de rejeu du tout : il perd en silence.
 *   4. ELLE EST BORNÉE. `localStorage` a un quota PARTAGÉ : une file sans plafond ne casserait
 *      pas que la file, elle ferait échouer l'écriture du consentement et de la langue.
 *
 * ET « il y a 12 min » EST UNE MESURE. L'âge se dérive de l'instant de mise en file, il ne se
 * décore pas — c'est ce qui autorise l'écran à l'écrire en monospace (règle 6).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OUTBOX_MAX,
  clearOutbox,
  dropFromOutbox,
  flushOutbox,
  outboxAge,
  outboxReplayReady,
  queueOffline,
  readOutbox,
  setWifiOnly,
  wifiOnly,
  type OutboxEntry,
} from '../../src/lib/pwa/offline';

/** Un stockage local complet, en mémoire — la même fabrique que `popup-variant.test.ts`. */
function makeStorage(): Storage {
  let data: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = String(v); },
    removeItem: (k: string) => { delete data[k]; },
    clear: () => { data = {}; },
    key: (i: number) => Object.keys(data)[i] ?? null,
    get length() { return Object.keys(data).length; },
  } as Storage;
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('la file survit à ce qui la casse', () => {
  it('se relit à travers le stockage, pas à travers la mémoire', () => {
    queueOffline('lesson-done', 'Leçon 5 terminée', 'lecon-5');

    // On relit ce qui a été ÉCRIT, comme le ferait un rechargement de page : une file qui ne
    // vivrait qu'en mémoire rendrait ce test vert sans rien garantir.
    const brut = localStorage.getItem('mm-outbox');
    expect(brut, 'rien n’a été écrit dans le stockage local').toBeTruthy();
    expect(JSON.parse(brut as string)).toHaveLength(1);
    expect(readOutbox()[0].label).toBe('Leçon 5 terminée');
  });

  it('garde le type, le libellé et l’instant de mise en file', () => {
    const avant = Date.now();
    const entree = queueOffline('note', '1 note écrite');
    expect(entree).not.toBeNull();
    expect(entree?.kind).toBe('note');
    expect(entree?.label).toBe('1 note écrite');
    expect(entree?.queuedAt).toBeGreaterThanOrEqual(avant);
  });

  it('rend la file dans son ordre de départ : la plus ancienne d’abord', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-01T10:00:00Z'));
    queueOffline('lesson-done', 'la première');
    vi.setSystemTime(new Date('2026-09-01T10:05:00Z'));
    queueOffline('note', 'la seconde');
    vi.setSystemTime(new Date('2026-09-01T10:09:00Z'));
    queueOffline('bookmark', 'la troisième');

    expect(readOutbox().map((e) => e.label)).toEqual(['la première', 'la seconde', 'la troisième']);
  });

  it('ignore une entrée illisible sans emporter les autres', () => {
    queueOffline('note', 'celle qui est bonne');
    const lues = JSON.parse(localStorage.getItem('mm-outbox') as string) as unknown[];
    // Une entrée écrite par une version précédente, ou éditée à la main.
    localStorage.setItem('mm-outbox', JSON.stringify([{ id: 'x' }, ...lues, 'pas un objet']));

    expect(readOutbox().map((e) => e.label)).toEqual(['celle qui est bonne']);
  });

  it('survit à un stockage qui ne contient pas du JSON', () => {
    localStorage.setItem('mm-outbox', 'pas du json');
    expect(readOutbox()).toEqual([]);
  });

  it('est bornée, et sacrifie la PLUS ANCIENNE — jamais celle qu’on vient de faire', () => {
    for (let i = 0; i < OUTBOX_MAX + 5; i += 1) queueOffline('note', `note ${i}`);

    const file = readOutbox();
    expect(file).toHaveLength(OUTBOX_MAX);
    // La dernière posée est là ; les cinq premières sont parties.
    expect(file[file.length - 1].label).toBe(`note ${OUTBOX_MAX + 4}`);
    expect(file[0].label).toBe('note 5');
  });

  it('retire une entrée sans emporter un geste posé entre-temps', () => {
    const a = queueOffline('lesson-done', 'à retirer');
    queueOffline('note', 'à garder');
    dropFromOutbox(a?.id ?? '');
    expect(readOutbox().map((e) => e.label)).toEqual(['à garder']);
  });

  it('se vide', () => {
    queueOffline('note', 'peu importe');
    clearOutbox();
    expect(readOutbox()).toEqual([]);
  });
});

describe('le rejeu ne perd rien', () => {
  it('envoie la plus ancienne d’abord et retire ce qui est passé', async () => {
    queueOffline('lesson-done', 'la première');
    queueOffline('note', 'la seconde');

    const vues: string[] = [];
    const bilan = await flushOutbox(async (e: OutboxEntry) => { vues.push(e.label); return true; });

    expect(vues).toEqual(['la première', 'la seconde']);
    expect(bilan).toEqual({ sent: 2, kept: 0 });
    expect(readOutbox()).toEqual([]);
  });

  it('S’ARRÊTE au premier échec et garde tout ce qui n’est pas passé', async () => {
    queueOffline('lesson-done', 'passe');
    queueOffline('note', 'coince');
    queueOffline('bookmark', 'derrière');

    const vues: string[] = [];
    const bilan = await flushOutbox(async (e: OutboxEntry) => {
      vues.push(e.label);
      return e.label === 'passe';
    });

    // « derrière » n'a même pas été tentée : sauter l'entrée qui coince produirait un état que
    // personne n'a vécu — une note posée sur une leçon que le serveur croit encore en cours.
    expect(vues).toEqual(['passe', 'coince']);
    expect(bilan).toEqual({ sent: 1, kept: 2 });
    expect(readOutbox().map((e) => e.label)).toEqual(['coince', 'derrière']);
  });

  it('traite une exception de l’expéditeur comme un échec, et ne perd pas l’entrée', async () => {
    queueOffline('note', 'celle qui explose');
    const bruit = vi.spyOn(console, 'error').mockImplementation(() => {});

    const bilan = await flushOutbox(async () => { throw new Error('réseau coupé au milieu'); });

    expect(bilan).toEqual({ sent: 0, kept: 1 });
    expect(readOutbox().map((e) => e.label)).toEqual(['celle qui explose']);
    bruit.mockRestore();
  });

  it('n’annonce AUCUN rejeu automatique tant que personne n’en a branché un', () => {
    /*
     * C'est le constat que l'écran lit pour choisir ce qu'il écrit. Aucun module du dépôt
     * n'appelle `startOutboxFlush` : brancher un rejeu sur des écritures qu'on n'a pas lues
     * reviendrait à promettre un envoi qui peut écrire n'importe quoi. Le jour où quelqu'un
     * le branche, ce test devient rouge — et c'est le bon moment pour relire la phrase que
     * l'écran affiche sous la file.
     */
    expect(outboxReplayReady()).toBe(false);
  });
});

describe('l’âge d’une entrée est mesuré, pas décoré', () => {
  const t0 = new Date('2026-09-01T10:00:00Z').getTime();
  const min = 60_000;

  it('compte en minutes sous une heure', () => {
    expect(outboxAge(t0, t0 + 12 * min)).toEqual({ unit: 'minutes', value: 12 });
    expect(outboxAge(t0, t0 + 59 * min)).toEqual({ unit: 'minutes', value: 59 });
  });

  it('passe en heures à soixante minutes, en jours à vingt-quatre heures', () => {
    expect(outboxAge(t0, t0 + 60 * min)).toEqual({ unit: 'hours', value: 1 });
    expect(outboxAge(t0, t0 + 23 * 60 * min)).toEqual({ unit: 'hours', value: 23 });
    expect(outboxAge(t0, t0 + 24 * 60 * min)).toEqual({ unit: 'days', value: 1 });
  });

  it('rend zéro, jamais un négatif, si l’horloge a reculé', () => {
    // Un téléphone dont l'heure se resynchronise en arrière est banal. « il y a -3 min » ne
    // veut rien dire, et un nombre qui ne veut rien dire ne s'affiche pas (règle 6).
    expect(outboxAge(t0, t0 - 3 * min)).toEqual({ unit: 'minutes', value: 0 });
  });
});

describe('« télécharger en Wi-Fi seulement » est frugal par défaut', () => {
  it('vaut vrai tant que personne ne l’a éteint', () => {
    expect(wifiOnly()).toBe(true);
  });

  it('se souvient d’avoir été éteint, puis rallumé', () => {
    setWifiOnly(false);
    expect(wifiOnly()).toBe(false);
    setWifiOnly(true);
    expect(wifiOnly()).toBe(true);
  });

  it('retombe sur le défaut frugal quand le stockage refuse', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('navigation privée'); },
      setItem: () => { throw new Error('navigation privée'); },
    });
    // Ni exception qui remonte, ni réglage inventé : c'est le forfait de quelqu'un.
    expect(() => setWifiOnly(false)).not.toThrow();
    expect(wifiOnly()).toBe(true);
  });
});
