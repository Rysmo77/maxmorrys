import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Contrôles sur les workflows n8n générés par `scripts/n8n-patch-strategy-2026.py`.
 *
 * Ces fichiers ne s'exécutent que dans n8n, en ligne, sur des clics Telegram réels : impossible de
 * les tester de bout en bout ici. On vérifie donc tout ce qui est vérifiable hors ligne — et qui
 * échouerait autrement en production, un vendredi soir.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = join(ROOT, 'n8n/strategy-2026');

type Node = {
  name: string;
  type: string;
  id: string;
  parameters?: Record<string, unknown> & { jsCode?: string; filterByFormula?: string };
};
type Workflow = {
  name: string;
  nodes: Node[];
  connections: Record<string, { main?: Array<Array<{ node: string }> | null> }>;
};

const FILES = readdirSync(DIR).filter((f) => f.endsWith('.json'));
const load = (f: string): Workflow => JSON.parse(readFileSync(join(DIR, f), 'utf8'));

/** n8n exécute un nœud Code comme un corps de fonction ASYNC : `await` au premier niveau y est légal. */
const AsyncFunction = Object.getPrototypeOf(async function () { /* noop */ }).constructor;

const N8N_GLOBALS = ['$json', '$now', '$input', '$', '$itemIndex', 'DateTime', '$getWorkflowStaticData'];

describe('les workflows générés existent', () => {
  it('couvre les quatre workflows patchés plus le filet de sécurité', () => {
    expect(FILES.sort()).toEqual([
      'WF-PICKS-RELANCE.json', 'WF-SOCIAL-03.json', 'WF-SOCIAL-04.json',
      'WF-TG-ROUTER.json', 'WF-THEMES.json',
    ]);
  });
});

describe.each(FILES)('%s', (file) => {
  const wf = load(file);

  it('parse tous ses nœuds Code comme corps de fonction async', () => {
    const casses: string[] = [];
    for (const n of wf.nodes) {
      const code = n.parameters?.jsCode;
      if (!code) continue;
      try {
        new AsyncFunction(...N8N_GLOBALS, code);
      } catch (e) {
        casses.push(`${n.name} → ${(e as Error).message}`);
      }
    }
    expect(casses).toEqual([]);
  });

  it('ne cite aucun nœud inexistant dans ses connexions', () => {
    const noms = new Set(wf.nodes.map((n) => n.name));
    const inconnus: string[] = [];
    for (const [src, outs] of Object.entries(wf.connections ?? {})) {
      if (!noms.has(src)) inconnus.push(`source: ${src}`);
      for (const branche of outs.main ?? []) {
        for (const c of branche ?? []) if (!noms.has(c.node)) inconnus.push(`cible: ${c.node}`);
      }
    }
    expect(inconnus).toEqual([]);
  });

  it('n’a ni nom ni id de nœud en double', () => {
    const noms = wf.nodes.map((n) => n.name);
    const ids = wf.nodes.map((n) => n.id);
    expect(new Set(noms).size).toBe(noms.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ne laisse aucun placeholder non résolu dans le code des nœuds', () => {
    // `{PICKER}` n'était substitué que pour les nœuds AJOUTÉS. Un nœud simplement patché
    // (`TH — Parse posts`) est parti en production avec le placeholder littéral : le code
    // s'exécutait quand même — `{PICKER}` est un bloc valide en JS — mais sans la bibliothèque,
    // donc `extraireListe` n'existait pas.
    const fautifs = wf.nodes
      .filter((n) => (n.parameters?.jsCode ?? '').includes('{PICKER}'))
      .map((n) => n.name);
    expect(fautifs).toEqual([]);
  });

  it('les nœuds qui appellent la bibliothèque l’embarquent bien', () => {
    const manquants = wf.nodes
      .filter((n) => {
        const c = n.parameters?.jsCode ?? '';
        return /\b(extraireListe|togglePick|renderMenu|selectedOptions|parsePicked)\s*\(/.test(c)
          && !c.includes('function extraireListe');
      })
      .map((n) => n.name);
    expect(manquants).toEqual([]);
  });

  /**
   * n8n ne résout `{{ … }}` que dans une EXPRESSION, reconnaissable à son `=` initial. Un prompt
   * qui l'oublie part chez le modèle avec ses accolades en toutes lettres : il ne voit ni titre ni
   * texte, et improvise. C'est ce qui a produit 26 légendes hors-sujet entre le 7 et le 20 août
   * 2026 — toutes la même, sous des titres qui n'avaient rien à voir — pendant que la créa, elle,
   * affichait le vrai titre. D'où la plainte « les images ne matchent pas avec les textes ».
   */
  it('n’envoie aucun prompt à un modèle avec des accolades non résolues', () => {
    const litteraux: string[] = [];
    for (const n of wf.nodes) {
      if (!n.type.toLowerCase().includes('gemini')) continue;
      const messages =
        (n.parameters as { messages?: { values?: Array<{ content?: string }> } })?.messages?.values ?? [];
      for (const m of messages) {
        const c = m.content ?? '';
        if (c.includes('{{') && !c.startsWith('=')) litteraux.push(n.name);
      }
    }
    expect(litteraux).toEqual([]);
  });

  /**
   * `$input.item` et `$itemIndex` n'existent QUE dans le mode « une fois par item ». Un nœud Code
   * qui les appelle en `runOnceForAllItems` lève à la première exécution — et seulement à la
   * première exécution qui a des données, ce qui peut arriver des semaines plus tard.
   * Vécu : `Build — URL publique` (WF-SOCIAL-04) a porté ce défaut du 7 au 20 août sans le montrer,
   * la file d'illustration étant vide.
   */
  it('n’utilise `$input.item` que dans les nœuds Code en mode « par item »', () => {
    const fautifs = wf.nodes
      .filter((n) => n.parameters?.jsCode)
      .filter((n) => (n.parameters as { mode?: string }).mode !== 'runOnceForEachItem')
      .filter((n) => /\$input\.item|\$itemIndex/.test(n.parameters!.jsCode as string))
      .map((n) => n.name);
    expect(fautifs).toEqual([]);
  });

  /**
   * NocoDB rend ses dates en « 2026-08-24 09:00:00+00:00 » — une espace là où l'ISO 8601 veut un
   * « T ». `DateTime.fromISO` les refuse (`unparsable`), et comme le code teste `isValid` avant de
   * compter, il compte zéro sans jamais lever. Airtable rendait `…T09:00:00.000Z` : la migration du
   * 2026-08-06 a donc éteint en silence la garde de WF-THEMES (« cette semaine est déjà remplie »)
   * et le diagnostic de WF-PICKS-RELANCE. Constaté le 2026-08-21 : `targetCount = 0` sur une semaine
   * qui portait 19 contenus. `fromSQL` lit ce format.
   */
  it('lit les dates NocoDB avec un repli tolérant, jamais `fromISO` seul', () => {
    // On ne vise que les LECTURES (`x.Date_Publication_Prevue`) : un nœud qui ÉCRIT ce champ
    // (`Date_Publication_Prevue: s.date`) part d'une date que Luxon a produite, déjà en ISO.
    const fautifs = wf.nodes
      .filter((n) => /[.[]['"]?Date_Publication_Prevue/.test(n.parameters?.jsCode ?? ''))
      .filter((n) => /fromISO/.test(n.parameters!.jsCode as string))
      .filter((n) => !/fromSQL/.test(n.parameters!.jsCode as string))
      .map((n) => n.name);
    expect(fautifs).toEqual([]);
  });

  it('ne conserve pas la copie périmée des nœuds (`activeVersion`)', () => {
    // L'export brut du serveur embarque `activeVersion.nodes`, figée à une version antérieure.
    // La garder trompe toute relecture : on la purge à la génération.
    expect(Object.keys(wf)).not.toContain('activeVersion');
  });
});

describe('la migration NocoDB est respectée', () => {
  /**
   * Les patchs ont d'abord été construits sur les sauvegardes du 9 juillet, antérieures à la
   * migration Airtable → NocoDB du 2026-08-06. Les importer aurait ramené quatre workflows sur
   * Airtable — donc sur la copie gelée de rollback, que plus personne ne lit.
   */
  it.each(FILES)('%s ne contient plus aucun nœud Airtable', (file) => {
    const restants = load(file).nodes
      .filter((n) => n.type.toLowerCase().includes('airtable'))
      .map((n) => n.name);
    expect(restants).toEqual([]);
  });

  /**
   * n8n **n'exécute pas la suite d'un nœud qui produit zéro item**. Une lecture qui peut
   * légitimement ne rien trouver n'est donc pas une branche « sans résultat » : c'est une branche
   * MORTE, en silence.
   *
   * Vécu en production le 2026-08-06 : `PK — Outils récents` ne trouvait aucun contenu ATELIER
   * (le champ `Serie` venait d'être créé), et tout le menu des outils — branché derrière — ne
   * s'est jamais déclenché. Le run a duré 0,5 s et est passé « success ».
   */
  it.each([
    ['WF-TG-ROUTER.json', 'PK — Outils récents (NocoDB)'],
    ['WF-PICKS-RELANCE.json', 'Relance — Lire Contenus (NocoDB)'],
    ['WF-PICKS-RELANCE.json', 'Relance — Lire Config (NocoDB)'],
  ])('%s / %s produit toujours un item, même sans résultat', (file, nom) => {
    const n = load(file).nodes.find((x) => x.name === nom);
    expect(n, `nœud ${nom} introuvable`).toBeDefined();
    expect((n as unknown as { alwaysOutputData?: boolean }).alwaysOutputData).toBe(true);
  });

  it('chaque lecture NocoDB est suivie de son aplatisseur', () => {
    // Le nœud NocoDB rend `{id, fields:{…}}` ; l'ancien nœud Airtable rendait `{id, …champs}` à
    // plat. Le motif retenu à la migration : `<nom> (NocoDB)` + un nœud Code portant le nom
    // d'origine qui aplatit, pour que les expressions `$('<nom>')` en aval restent valables.
    for (const file of FILES) {
      const wf = load(file);
      const noms = new Set(wf.nodes.map((n) => n.name));
      const sansAplatisseur = wf.nodes
        .filter((n) => n.name.endsWith(' (NocoDB)'))
        .filter((n) => (n.parameters as { operation?: string })?.operation === 'search')
        .filter((n) => !noms.has(n.name.replace(/ \(NocoDB\)$/, '')))
        .map((n) => `${file} / ${n.name}`);
      expect(sansAplatisseur).toEqual([]);
    }
  });
});

describe('WF-TG-ROUTER — l’état des menus', () => {
  const wf = load('WF-TG-ROUTER.json');
  const config = wf.nodes.find((n) => n.name === 'Airtable — Lire Config (NocoDB)');
  const where = () =>
    ((config?.parameters as { options?: { where?: string } })?.options?.where) ?? '';

  /**
   * Le piège central du mécanisme : une clé absente de ce `where` est **invisible** pour tout le
   * workflow, sans la moindre erreur. C'est exactement ce qui fait perdre le thème cliqué —
   * `THEMES_CURRENT` n'y figurait pas, et l'expansion retombe sur « Contenu de la semaine ».
   * La migration NocoDB a repris le filtre verbatim : le bug a survécu, on le corrige ici.
   */
  it.each([
    'THEMES_CURRENT', 'PICK_THEME',
    'TOOLS_CURRENT', 'TOOLS_PICKED', 'TRENDS_CURRENT', 'TRENDS_PICKED',
  ])('lit la clé %s depuis Config', (cle) => {
    expect(where()).toContain(`(Cle,eq,${cle})`);
  });

  it('conserve les six clés d’origine (credentials et accès Paperclip)', () => {
    for (const cle of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'PAPERCLIP_BASE',
      'PAPERCLIP_COMPANY_ID', 'CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET']) {
      expect(where()).toContain(`(Cle,eq,${cle})`);
    }
  });

  it('écrit les cinq nouveaux champs dans TH — Créer posts', () => {
    // NocoDB n'a pas de `typecast` : un champ absent du mapper explicite n'est pas écrit, en silence.
    const mapper = (wf.nodes.find((n) => n.name === 'TH — Créer posts')
      ?.parameters as { fieldsMapper?: { value?: Record<string, string> } })?.fieldsMapper?.value ?? {};
    for (const champ of ['Serie', 'Offre', 'Cible', 'Outil', 'Brief']) {
      expect(Object.keys(mapper)).toContain(champ);
    }
    // Les sept champs d'origine ne doivent pas avoir été perdus au passage.
    for (const champ of ['Titre', 'Reseau', 'Format_Post', 'Pilier', 'Thematique',
      'Date_Publication_Prevue', 'Status']) {
      expect(Object.keys(mapper)).toContain(champ);
    }
  });
});

describe('WF-TG-ROUTER — le rituel du vendredi s’enchaîne', () => {
  const wf = load('WF-TG-ROUTER.json');
  const cibles = (src: string) =>
    (wf.connections[src]?.main ?? []).flatMap((b) => (b ?? []).map((c) => c.node));

  it('le clic sur un thème ouvre le menu des outils, il ne lance plus l’expansion', () => {
    const apres = cibles('IF theme');
    expect(apres).toContain('PK — Outils récents (NocoDB)');
    expect(apres).not.toContain('TH — Décliner (build)');
    expect(cibles('PK — Outils récents (NocoDB)')).toEqual(['PK — Outils récents']);
  });

  it('les deux nouveaux aiguillages partent de Parse — Update, comme les autres', () => {
    const fanout = cibles('Parse — Update');
    expect(fanout).toContain('IF toggle');
    expect(fanout).toContain('IF done');
    // Les branches existantes ne doivent pas avoir été perdues au passage.
    for (const f of ['IF post', 'IF pc', 'IF cmd', 'IF email', 'IF wa', 'IF theme']) {
      expect(fanout).toContain(f);
    }
  });

  it('un clic de toggle enregistre la sélection, accuse réception ET réédite le message', () => {
    expect(cibles('IF toggle')).toEqual(['PK — Toggle']);
    expect(cibles('PK — Toggle').sort()).toEqual(
      // L'édition passe désormais par « IF menu modifié » : un clic refusé ne doit pas rééditer
      // un message inchangé, que Telegram rejetterait.
      ['IF menu modifié', 'IF sél. outils', 'IF sél. tendances', 'PK — accusé (toggle)'].sort()
    );
    expect(cibles('IF sél. outils')).toEqual(['PK — MAJ outils']);
    expect(cibles('IF sél. tendances')).toEqual(['PK — MAJ tendances']);
  });

  it('ne réduit jamais TOOLS_CURRENT à la sélection — les index pointeraient à côté', () => {
    // `TOOLS_PICKED` contient des index dans la liste COMPLÈTE des outils proposés. Un nœud qui
    // réécrirait `TOOLS_CURRENT` avec les seuls outils retenus décalerait ces index, et
    // l'expansion piocherait le mauvais outil — silencieusement.
    const ecrivains = wf.nodes
      .filter((n) => (n.parameters as { operation?: string })?.operation === 'upsert')
      .filter((n) => {
        const v = (n.parameters as { fieldsMapper?: { value?: Record<string, string> } })
          ?.fieldsMapper?.value;
        return v?.Cle === 'TOOLS_CURRENT';
      })
      .map((n) => n.name);
    // Un seul écrivain légitime : celui qui pose la liste proposée par le modèle.
    expect(ecrivains).toEqual(['PK — Stocker outils']);
  });

  it('résout l’Id sur chaque upsert — NocoDB ne matche pas sur une clé métier', () => {
    // NocoDB fait PATCH si `id`, POST sinon. Sans résolution d'Id, chaque clic créerait une ligne
    // au lieu de mettre à jour la sienne, et la sélection ne serait jamais relue.
    const sansId = wf.nodes
      .filter((n) => (n.parameters as { operation?: string })?.operation === 'upsert')
      .filter((n) => !((n.parameters as { id?: string })?.id ?? '').includes('.find('))
      .map((n) => n.name);
    expect(sansId).toEqual([]);
  });

  it('n’écrit jamais Config avec une clé dynamique — tous les upserts ont une clé littérale', () => {
    // Le reste du système n'utilise que des clés en dur ; rien ne garantit que `matchingColumns`
    // sache résoudre une expression, et un upsert qui rate son match crée un doublon en silence.
    const dynamiques = wf.nodes
      .filter((n) => (n.parameters as { operation?: string })?.operation === 'upsert')
      .filter((n) => {
        const cle = (n.parameters as { fieldsMapper?: { value?: { Cle?: string } } })?.fieldsMapper?.value?.Cle;
        return typeof cle === 'string' && cle.startsWith('=');
      })
      .map((n) => n.name);
    expect(dynamiques).toEqual([]);
  });

  it('la validation des outils enchaîne sur le menu des tendances', () => {
    expect(cibles('IF done')).toContain('PK — Done');
    expect(cibles('PK — Done')).toContain('IF suite tendances');
    expect(cibles('IF suite tendances')).toEqual(['PK — Tendances (build)']);
  });

  it('la validation des tendances — et elle seule — déclenche l’expansion', () => {
    expect(cibles('IF suite expansion')).toEqual(['TH — Décliner (build)']);
    const versExpansion = Object.entries(wf.connections)
      .filter(([, outs]) => (outs.main ?? []).some((b) => (b ?? []).some((c) => c.node === 'TH — Décliner (build)')))
      .map(([src]) => src);
    expect(versExpansion).toEqual(['IF suite expansion']);
  });

  it('remet la sélection à zéro avant d’envoyer un menu — sinon la semaine passée pré-coche', () => {
    expect(cibles('PK — Stocker outils')).toEqual(['PK — Reset choix outils']);
    expect(cibles('PK — Reset choix outils')).toEqual(['PK — Envoyer outils']);
    expect(cibles('PK — Stocker tendances')).toEqual(['PK — Reset choix tendances']);
    expect(cibles('PK — Reset choix tendances')).toEqual(['PK — Envoyer tendances']);
  });

  /**
   * Un nœud n8n s'exécute UNE FOIS PAR ITEM entrant. Sur un nœud qui envoie un message Telegram,
   * ça donne une rafale de messages identiques — vécu le 2026-08-06 : `TH — Créer posts` sort 21
   * lignes, donc 21 confirmations « Semaine générée ».
   *
   * On contrôle la CLASSE de bug, pas les trois instances : tout envoi de message dont l'amont
   * peut produire plusieurs items doit porter `executeOnce`.
   */
  it('aucun envoi Telegram ne peut partir en rafale', () => {
    const amont: Record<string, string[]> = {};
    for (const [src, outs] of Object.entries(wf.connections)) {
      for (const b of outs.main ?? []) {
        for (const c of b ?? []) (amont[c.node] ??= []).push(src);
      }
    }
    // Nœuds capables d'émettre plusieurs items : les écritures NocoDB et le parseur des 21 posts.
    const multi = new Set(
      wf.nodes
        .filter((n) => {
          const op = (n.parameters as { operation?: string })?.operation;
          return (n.type.endsWith('nocoDb') && (op === 'create' || op === 'upsert'))
            || n.name === 'TH — Parse posts';
        })
        .map((n) => n.name)
    );
    const risques = wf.nodes
      .filter((n) => n.type.endsWith('httpRequest'))
      .filter((n) => /sendMessage|editMessageText/.test(JSON.stringify(n.parameters)))
      .filter((n) => (amont[n.name] ?? []).some((s) => multi.has(s)))
      .filter((n) => !(n as unknown as { executeOnce?: boolean }).executeOnce)
      .map((n) => n.name);
    expect(risques).toEqual([]);
  });

  it('ne réédite pas le message quand le clic a été refusé', () => {
    // Telegram rejette une édition sans changement (`message is not modified`), ce qui faisait
    // échouer le workflow et déclencher l'alerte WF-ERR à chaque 4ᵉ outil cliqué.
    const cibles = (src: string) =>
      (wf.connections[src]?.main ?? []).flatMap((b) => (b ?? []).map((c) => c.node));
    expect(cibles('PK — Toggle')).not.toContain('PK — Éditer message');
    expect(cibles('IF menu modifié')).toEqual(['PK — Éditer message']);
    // L'accusé, lui, doit rester direct : c'est lui qui affiche « Maximum 3 ».
    expect(cibles('PK — Toggle')).toContain('PK — accusé (toggle)');
  });

  it('donne des credentials à chaque nœud NocoDB et Gemini ajouté', () => {
    // Un nœud fabriqué sans credentials s'importe sans bruit et échoue à la première exécution.
    const sansCreds = wf.nodes
      .filter((n) => n.name.startsWith('PK — ') || n.name.startsWith('Gemini — Proposer'))
      .filter((n) => n.type.includes('airtable') || n.type.includes('googleGemini'))
      .filter((n) => !(n as { credentials?: unknown }).credentials)
      .map((n) => n.name);
    expect(sansCreds).toEqual([]);
  });
});

describe('WF-TG-ROUTER — la grille reste celle de la stratégie', () => {
  const wf = load('WF-TG-ROUTER.json');
  const code = wf.nodes.find((n) => n.name === 'TH — Décliner (build)')?.parameters?.jsCode ?? '';
  const bloc = /const GRID=\[(.*?)\n\];/s.exec(code)?.[1] ?? '';
  // `[^']+` et non `\w+` : en JavaScript `\w` est purement ASCII, et « Commerçants » serait
  // silencieusement ignoré — la grille paraîtrait amputée de ses quatre créneaux Facebook.
  const grid = [...bloc.matchAll(/\[\s*(\d+),\s*(\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\]/g)]
    .map((m) => ({ jour: +m[1], heure: +m[2], reseau: m[3], format: m[4], serie: m[5], cible: m[6] }));

  it('extrait bien les 21 créneaux — sinon tous les contrôles suivants passeraient à vide', () => {
    expect(bloc).not.toBe('');
    expect(grid).toHaveLength(21);
  });

  it('compte 21 créneaux : 14 posts et 7 stories', () => {
    expect(grid).toHaveLength(21);
    expect(grid.filter((g) => g.format === 'story')).toHaveLength(7);
  });

  it('ne programme ni vidéo ni TikTok (décision board du 2026-08-06)', () => {
    expect(grid.filter((g) => g.reseau === 'tiktok')).toEqual([]);
    expect(grid.filter((g) => ['reel', 'short', 'live'].includes(g.format))).toEqual([]);
  });

  it('respecte le mix des séries sur les 14 posts', () => {
    const posts = grid.filter((g) => g.format !== 'story');
    const mix: Record<string, number> = {};
    for (const p of posts) mix[p.serie] = (mix[p.serie] ?? 0) + 1;
    expect(mix).toEqual({ ATELIER: 3, OFFRE: 3, RADAR: 2, PREUVE: 2, COULISSES: 2, CERCLE: 2 });
  });

  it('laisse 4 créneaux ATELIER et 2 RADAR — ce qui borne les quotas de choix', () => {
    expect(grid.filter((g) => g.serie === 'ATELIER')).toHaveLength(4);
    expect(grid.filter((g) => g.serie === 'RADAR')).toHaveLength(2);
  });

  it('correspond exactement à la semaine 1 du calendrier éditorial', () => {
    const csv = readFileSync(join(ROOT, 'docs/calendrier_editorial_12_semaines.csv'), 'utf8')
      .trim().split('\n');
    const entetes = csv[0].split(',');
    const lundi = Date.UTC(2026, 7, 10);
    const semaine1 = csv.slice(1)
      .map((l) => {
        // Découpage CSV minimal : seuls Thematique et Titre sont entre guillemets, et on ne les lit pas.
        const cols = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, ''));
        return Object.fromEntries(entetes.map((h, i) => [h, cols[i]]));
      })
      .filter((r) => r.Semaine === '1')
      .map((r) => {
        const d = new Date(r.Date_Publication_Prevue.replace('+00:00', 'Z'));
        return {
          jour: Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - lundi) / 86400000),
          heure: d.getUTCHours(),
          reseau: r.Reseau, format: r.Format_Post, serie: r.Serie,
        };
      });

    const cle = (g: { jour: number; heure: number; reseau: string; format: string; serie: string }) =>
      `${g.jour}|${g.heure}|${g.reseau}|${g.format}|${g.serie}`;
    expect(grid.map(cle).sort()).toEqual(semaine1.map(cle).sort());
  });
});
