import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Le fichier testé est le MÊME que celui inliné dans les nœuds Code de WF-TG-ROUTER
 * (`scripts/n8n-patch-strategy-2026.py` le lit et le colle). Le tester ici, c'est tester ce qui
 * tourne réellement en production — pas une réimplémentation qui divergerait au premier correctif.
 *
 * On l'évalue via `new Function(...)`, c'est-à-dire **exactement comme n8n exécute un nœud Code** :
 * un corps de fonction, sans `module`, sans `require`, sans `import`. Si quelqu'un y glisse une
 * syntaxe de module un jour, ces tests tombent au chargement — avant la production.
 *
 * Ce qu'on protège : un toggle qui se trompe d'index ne lève aucune erreur. Il coche simplement le
 * mauvais outil, et les 4 contenus ATELIER de la semaine partent sur le mauvais sujet.
 */
const SRC = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../n8n/strategy-2026/lib/picker.js'),
  'utf8'
);

const picker = new Function(
  `${SRC}\nreturn { PICK_LIMITS, MENUS, esc, parseList, parsePicked, serializePicked, togglePick, renderMenu, selectedOptions, extraireListe, pickText };`
)() as Record<string, never> & {
  PICK_LIMITS: Record<string, number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
};

const {
  PICK_LIMITS, parseList, parsePicked, serializePicked,
  togglePick, renderMenu, selectedOptions, esc, extraireListe, pickText,
} = picker;

/**
 * L'enveloppe RÉELLE renvoyée par le nœud Gemini en production, relevée le 2026-08-06 sur
 * l'exécution 6086 de WF-TG-ROUTER. C'est cette forme-là qu'un parseur naïf ne sait pas lire :
 * il ne trouve rien, ne lève rien, et retombe sur son repli — le menu n'affiche plus qu'un outil
 * alors que le modèle en avait proposé sept.
 */
const ENVELOPPE_GEMINI = {
  candidates: [{
    content: {
      parts: [{
        text: JSON.stringify({
          outils: [
            { nom: 'Perplexity AI', angle: 'Optimiser les citations IA', piste: 'Apprenants', gain: '+30 %' },
            { nom: 'Local Falcon', angle: 'Suivre ta fiche Google', piste: 'Commerçants', gain: '1 place' },
            { nom: 'HeyGen', angle: 'Vidéos avec avatars IA', piste: 'Mixte', gain: '5× plus de contenu' },
          ],
        }),
      }],
    },
  }],
};

const OUTILS = [
  { nom: 'Canva', angle: 'le kit de marque' },
  { nom: 'CapCut', angle: 'les sous-titres automatiques' },
  { nom: 'Notion', angle: 'le calendrier de contenu' },
  { nom: 'Perplexity', angle: 'la veille en 10 minutes' },
  { nom: 'Gamma', angle: 'des carrousels générés' },
  { nom: 'Google Business', angle: 'la fiche, champ par champ' },
];

/** Rejoue une suite de clics et rend la sélection finale, comme le ferait NocoDB entre deux clics. */
function clics(indices: number[], menu = 'tool', options = OUTILS) {
  let csv = '';
  const refus: (string | null)[] = [];
  for (const i of indices) {
    const r = togglePick(csv, i, menu, options.length);
    csv = serializePicked(r.picked);
    refus.push(r.refus);
  }
  return { csv, refus };
}

describe('quotas', () => {
  it('vaut 3 outils et 2 tendances — soit 4 contenus ATELIER et 2 RADAR par semaine', () => {
    expect(PICK_LIMITS).toEqual({ tool: 3, trend: 2 });
  });
});

describe('togglePick', () => {
  it('coche une option libre', () => {
    expect(clics([2]).csv).toBe('2');
  });

  it('décoche au second clic — c’est ce qui rend la sélection réversible', () => {
    expect(clics([2, 2]).csv).toBe('');
  });

  it('recoche au troisième clic', () => {
    expect(clics([2, 2, 2]).csv).toBe('2');
  });

  it('accumule plusieurs choix et les garde triés', () => {
    expect(clics([4, 0, 2]).csv).toBe('0,2,4');
  });

  it('refuse au-delà du quota, sans toucher à la sélection', () => {
    const { csv, refus } = clics([0, 1, 2, 3]);
    expect(csv).toBe('0,1,2');           // le 4ᵉ n'est pas entré
    expect(refus[3]).toContain('Maximum 3');
    expect(refus.slice(0, 3)).toEqual([null, null, null]);
  });

  it('laisse décocher même une fois le quota atteint', () => {
    const { csv } = clics([0, 1, 2, 1]);
    expect(csv).toBe('0,2');
  });

  it('applique le quota propre aux tendances (2, pas 3)', () => {
    const { csv, refus } = clics([0, 1, 2], 'trend');
    expect(csv).toBe('0,1');
    expect(refus[2]).toContain('Maximum 2');
  });

  it('refuse un index hors liste plutôt que de créer un choix fantôme', () => {
    const r = togglePick('', 99, 'tool', OUTILS.length);
    expect(r.picked).toEqual([]);
    expect(r.refus).toBe('Choix inconnu');
  });

  it('refuse un index négatif ou non numérique', () => {
    expect(togglePick('', -1, 'tool', 6).refus).toBe('Choix inconnu');
    expect(togglePick('', 'abc', 'tool', 6).refus).toBe('Choix inconnu');
  });
});

describe('parsePicked — la valeur vient de la table Config, elle peut être n’importe quoi', () => {
  it('lit un CSV normal', () => {
    expect(parsePicked('0,2,4', 6)).toEqual([0, 2, 4]);
  });

  it('tolère le vide, null et undefined', () => {
    expect(parsePicked('', 6)).toEqual([]);
    expect(parsePicked(null, 6)).toEqual([]);
    expect(parsePicked(undefined, 6)).toEqual([]);
  });

  it('dédoublonne', () => {
    expect(parsePicked('1,1,1,2', 6)).toEqual([1, 2]);
  });

  it('écarte les index hors liste — une option a pu disparaître entre deux clics', () => {
    expect(parsePicked('0,9,3', 6)).toEqual([0, 3]);
  });

  it('écarte le bruit sans jeter', () => {
    expect(parsePicked('0, ,x,2,-1', 6)).toEqual([0, 2]);
  });

  it('lit le sentinel de remise à zéro « - » comme une sélection vide', () => {
    // Les nœuds de reset écrivent « - » plutôt qu'une chaîne vide : rien ne garantit qu'un
    // mapping `defineBelow` écrive bien du vide plutôt que d'ignorer le champ, et un
    // reset qui n'a pas lieu rouvre le menu avec les choix de la semaine précédente.
    expect(parsePicked('-', 6)).toEqual([]);
  });
});

describe('parseList — les options viennent de Config, en JSON', () => {
  it('lit un tableau JSON', () => {
    expect(parseList('[{"nom":"Canva"}]')).toEqual([{ nom: 'Canva' }]);
  });

  it('rend un tableau vide sur du JSON cassé plutôt que de faire tomber le workflow', () => {
    expect(parseList('{pas du json')).toEqual([]);
    expect(parseList('')).toEqual([]);
    expect(parseList(null)).toEqual([]);
  });

  it('rend un tableau vide si le JSON est valide mais n’est pas un tableau', () => {
    expect(parseList('{"nom":"Canva"}')).toEqual([]);
  });
});

describe('extraireListe — lire la réponse du modèle quelle que soit sa forme', () => {
  it('lit l’enveloppe BRUTE de Gemini — le cas qui a cassé la production', () => {
    const outils = extraireListe(ENVELOPPE_GEMINI, ['outils', 'Outils']);
    expect(outils).toHaveLength(3);
    expect(outils.map((o: { nom: string }) => o.nom))
      .toEqual(['Perplexity AI', 'Local Falcon', 'HeyGen']);
  });

  it('lit aussi l’objet déjà simplifié', () => {
    expect(extraireListe({ outils: [{ nom: 'Canva' }] }, ['outils'])).toHaveLength(1);
  });

  it('accepte la clé avec une majuscule', () => {
    expect(extraireListe({ Outils: [{ nom: 'Canva' }] }, ['outils', 'Outils'])).toHaveLength(1);
  });

  it('retire les barrières de code markdown', () => {
    const brut = { text: '```json\n{"outils":[{"nom":"Gamma"}]}\n```' };
    expect(extraireListe(brut, ['outils'])).toEqual([{ nom: 'Gamma' }]);
  });

  it('accepte un tableau nu', () => {
    expect(extraireListe({ text: '[{"nom":"Notion"}]' }, ['outils'])).toEqual([{ nom: 'Notion' }]);
  });

  it('rend [] sans jeter sur une réponse illisible', () => {
    expect(extraireListe({ text: 'désolé, je ne peux pas' }, ['outils'])).toEqual([]);
    expect(extraireListe(null, ['outils'])).toEqual([]);
    expect(extraireListe({}, ['outils'])).toEqual([]);
    expect(extraireListe({ candidates: [] }, ['outils'])).toEqual([]);
  });

  it('sert aussi aux tendances et aux posts — même extracteur partout', () => {
    const env = (cle: string, val: unknown) =>
      ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ [cle]: val }) }] } }] });
    expect(extraireListe(env('tendances', [{ titre: 'GEO' }]), ['tendances'])).toHaveLength(1);
    expect(extraireListe(env('posts', [{ titre: 'A' }, { titre: 'B' }]), ['posts'])).toHaveLength(2);
  });

  it('pickText descend dans l’enveloppe sans se perdre', () => {
    expect(pickText(ENVELOPPE_GEMINI)).toContain('Perplexity');
    expect(pickText('déjà du texte')).toBe('déjà du texte');
    expect(pickText(null)).toBeNull();
  });
});

describe('renderMenu', () => {
  const render = (picked: number[], menu = 'tool') =>
    renderMenu(menu, OUTILS, picked, 'Thème : « Être trouvé »');

  it('marque les options cochées et laisse les autres vides', () => {
    const { text } = render([0, 2]);
    expect(text).toContain('✅ 1. <b>Canva</b>');
    expect(text).toContain('⬜ 2. <b>CapCut</b>');
    expect(text).toContain('✅ 3. <b>Notion</b>');
  });

  it('affiche le compteur sur le quota', () => {
    expect(render([0, 2]).text).toContain('2/3 choisis');
    expect(render([]).text).toContain('0/3 choisis');
  });

  it('rappelle le thème en sous-titre', () => {
    expect(render([]).text).toContain('Thème : « Être trouvé »');
  });

  it('produit un bouton par option, trois par ligne, plus la ligne « Terminé »', () => {
    const { keyboard } = render([]);
    const rows = keyboard.inline_keyboard;
    expect(rows).toHaveLength(3);                  // 6 options → 2 lignes + 1 ligne Terminé
    expect(rows[0]).toHaveLength(3);
    expect(rows[1]).toHaveLength(3);
    expect(rows[2]).toHaveLength(1);
  });

  it('encode l’index dans callback_data, jamais le contenu — Telegram plafonne à 64 octets', () => {
    const { keyboard } = render([]);
    const datas = keyboard.inline_keyboard.flat().map((b: { callback_data: string }) => b.callback_data);
    expect(datas).toEqual([
      'pick:tool:0', 'pick:tool:1', 'pick:tool:2',
      'pick:tool:3', 'pick:tool:4', 'pick:tool:5',
      'done:tool:0',
    ]);
    for (const d of datas) expect(Buffer.byteLength(d, 'utf8')).toBeLessThanOrEqual(64);
  });

  it('respecte le format `action:kind:id` du parseur existant — exactement 3 segments', () => {
    const { keyboard } = render([1]);
    for (const b of keyboard.inline_keyboard.flat()) {
      expect(b.callback_data.split(':')).toHaveLength(3);
    }
  });

  it('reflète l’état coché jusque dans les boutons', () => {
    const { keyboard } = render([1]);
    const labels = keyboard.inline_keyboard.flat().map((b: { text: string }) => b.text);
    expect(labels[0]).toBe('⬜ 1');
    expect(labels[1]).toBe('✅ 2');
  });

  it('dit clairement qu’il faut cocher quand rien ne l’est', () => {
    const rows = render([]).keyboard.inline_keyboard;
    expect(rows[rows.length - 1][0].text).toContain('coche d’abord');
  });

  it('compte les choix sur le bouton Terminé', () => {
    const rows = render([0, 2]).keyboard.inline_keyboard;
    expect(rows[rows.length - 1][0].text).toBe('✓ Terminé (2)');
  });

  it('change de libellé et de callback selon le menu', () => {
    const { text, keyboard } = render([], 'trend');
    expect(text).toContain('Les tendances de la semaine');
    expect(text).toContain('0/2 choisis');
    expect(keyboard.inline_keyboard.flat()[0].callback_data).toBe('pick:trend:0');
  });

  it('gère une liste vide sans planter — il reste le bouton Terminé', () => {
    const { keyboard } = renderMenu('tool', [], [], '');
    expect(keyboard.inline_keyboard).toHaveLength(1);
  });

  it('nomme les options mal formées plutôt que d’afficher « undefined »', () => {
    const { text } = renderMenu('tool', [{}, { titre: 'Sans angle' }], [], '');
    expect(text).toContain('Option 1');
    expect(text).toContain('Sans angle');
    expect(text).not.toContain('undefined');
  });
});

describe('esc — le message part en parse_mode HTML', () => {
  it('neutralise les chevrons et l’esperluette', () => {
    expect(esc('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
  });

  it('empêche une option de casser le balisage du message', () => {
    const { text } = renderMenu('tool', [{ nom: '<b>injection</b>', angle: 'x' }], [], '');
    expect(text).not.toContain('<b>injection</b>');
    expect(text).toContain('&lt;b&gt;injection&lt;/b&gt;');
  });
});

describe('selectedOptions', () => {
  it('rend les options retenues dans l’ordre d’affichage', () => {
    expect(selectedOptions(OUTILS, [4, 0]).map((o: { nom: string }) => o.nom)).toEqual(['Canva', 'Gamma']);
  });

  it('ignore un index qui ne pointe plus sur rien', () => {
    expect(selectedOptions(OUTILS, [0, 99])).toHaveLength(1);
  });

  it('rend une liste vide quand rien n’est coché', () => {
    expect(selectedOptions(OUTILS, [])).toEqual([]);
  });
});

describe('le cycle complet, tel qu’il se joue sur Telegram', () => {
  it('coche, décoche, recoche, refuse le quota, et finit sur une sélection juste', () => {
    // Canva, CapCut, Notion, puis on retire CapCut, puis on tente Perplexity et Gamma.
    let csv = '';
    const seq: Array<[number, string | null]> = [];
    for (const i of [0, 1, 2, 1, 3, 4]) {
      const r = togglePick(csv, i, 'tool', OUTILS.length);
      csv = serializePicked(r.picked);
      seq.push([i, r.refus]);
    }
    expect(csv).toBe('0,2,3');                       // Canva, Notion, Perplexity
    expect(seq[5][1]).toContain('Maximum 3');        // Gamma refusé, quota atteint
    expect(selectedOptions(OUTILS, parsePicked(csv, OUTILS.length)).map((o: { nom: string }) => o.nom))
      .toEqual(['Canva', 'Notion', 'Perplexity']);
  });
});
