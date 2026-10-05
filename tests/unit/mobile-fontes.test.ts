/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES FONTES DU NATIF ET CELLES DU WEB SONT LA MÊME DÉCISION, ÉCRITE DEUX FOIS.
 *
 * Le web charge ses trois familles par l'`@import` de `src/design-system/css/tokens/fonts.css`,
 * copie littérale du kit. Le natif ne peut pas lire ce fichier : Metro ne résout rien hors de
 * `mobile/`, et un `.css` n'aurait aucun sens dans React Native. La table est donc RECOPIÉE
 * dans `mobile/ds/Fontes.ts`.
 *
 * LA RECOPIE EST LE MÉCANISME, PAS LE DÉFAUT — mais elle exige cette porte, exactement comme
 * `fonts-sync.test.ts` est la contrepartie obligatoire de l'URL dupliquée dans `index.html`.
 *
 * Ce qu'aucune autre porte ne voit :
 *
 *   · UNE FAMILLE CITÉE ET JAMAIS CHARGÉE. C'est la dette d'origine, et elle a vécu tout le
 *     port : trente-neuf fichiers écrivaient `fontFamily: 'Fraunces'` sans que rien ne charge
 *     Fraunces. React Native ne se plaint pas d'une famille inconnue — il rend en police
 *     système, en silence. Le typecheck est vert, le bundle se construit, l'application
 *     s'ouvre. Seul un œil qui connaît la marque voit le défaut.
 *
 *   · UNE GRAISSE QUI DÉRIVE. Une Fraunces 700 là où le kit dit 900 ne casse RIEN : la mise
 *     en page tient, le texte se lit. C'est un écart de marque invisible en revue de code,
 *     et invisible sur une capture prise sans la référence à côté.
 *
 *   · UN NOM RENOMMÉ. Les écrans citent `SchibstedGrotesk`, sans espace, alors que la vraie
 *     famille s'appelle « Schibsted Grotesk ». Le nom du natif est donc un ALIAS, et il doit
 *     rester le mot exact que les écrans écrivent — sinon la police système revient, sans
 *     erreur ni avertissement.
 *
 *   · UN PAQUET DÉCLARÉ ET PAS INSTALLÉ. `mobile-app-config.test.ts` garde les greffons ;
 *     personne ne gardait les fontes, qui viennent pourtant elles aussi d'un paquet.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;
const MOBILE = join(ROOT, 'mobile');
const CSS_DES_FONTES = join(ROOT, 'src/design-system/css/tokens/fonts.css');
const CHARGEUR = join(MOBILE, 'ds/Fontes.ts');
const DOSSIER_DES_FONTES = join(MOBILE, 'assets/fonts');

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) out.push(p);
  }
  return out;
}

/** Le code servi, commentaires retirés — une famille NOMMÉE dans une explication n'en est pas une. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const rel = (p: string) => p.slice(ROOT.length);

/* ── LE KIT ─────────────────────────────────────────────────────────────────────────────── */

/**
 * Les familles du kit et leurs graisses, lues dans l'`@import` de `fonts.css`.
 *
 * L'URL Google porte les graisses par axe : `Fraunces:opsz,wght@9..144,400;9..144,700` déclare
 * DEUX axes et deux tuples. On lit donc la position de `wght` dans la liste des axes, puis la
 * composante correspondante de chaque tuple — lire « le dernier nombre » marcherait aujourd'hui
 * et casserait le jour où le kit ajoute un axe après `wght`.
 */
function graissesDuKit(): Map<string, number[]> {
  const css = readFileSync(CSS_DES_FONTES, 'utf8');
  const url = css.match(/@import\s+url\(["']([^"']+)["']\)/)?.[1];
  if (!url) throw new Error('tokens/fonts.css ne contient plus d’@import de fonte');

  const familles = new Map<string, number[]>();
  for (const m of url.matchAll(/family=([^&]+)/g)) {
    const [nom, spec] = m[1].split(':');
    const famille = decodeURIComponent(nom).replace(/\+/g, ' ');
    if (!spec) {
      familles.set(famille, [400]); // une famille sans axe est servie en régulier
      continue;
    }
    const [axes, tuples] = spec.split('@');
    const i = axes.split(',').indexOf('wght');
    if (i < 0) throw new Error(`« ${famille} » est déclarée sans axe wght dans fonts.css`);
    const graisses = tuples.split(';').map((t) => Number(t.split(',')[i]));
    familles.set(famille, [...new Set(graisses)].sort((a, b) => a - b));
  }
  return familles;
}

/** Le nom que le natif donne à une famille du kit : le même, sans les espaces. */
const nomNatif = (familleDuKit: string) => familleDuKit.replace(/\s+/g, '');

/** Le paquet Expo qui porte une famille du kit. */
const paquetDe = (familleDuKit: string) =>
  `@expo-google-fonts/${familleDuKit.toLowerCase().replace(/\s+/g, '-')}`;

/* ── LE CHARGEUR ────────────────────────────────────────────────────────────────────────── */

/**
 * Ce que `ds/Fontes.ts` charge : famille → graisse → nom de la constante importée.
 *
 * Lu dans le TEXTE, pas importé. Le module tire des `.ttf` par `require`, ce que Vitest ne
 * sait pas résoudre — et de toute façon la question posée ici est celle de la SOURCE : deux
 * tables recopiées l'une de l'autre se comparent à la lecture.
 */
function chargeur(): Map<string, Map<number, string>> {
  const bloc = code(CHARGEUR).match(/export const FONTES = \{([\s\S]*?)\n\} as const;/)?.[1];
  if (!bloc) throw new Error('ds/Fontes.ts n’expose plus de table `FONTES` lisible');

  const table = new Map<string, Map<number, string>>();
  for (const f of bloc.matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
    const graisses = new Map<number, string>();
    for (const g of f[2].matchAll(/(\d{3}):\s*([A-Za-z0-9_]+)/g)) {
      graisses.set(Number(g[1]), g[2]);
    }
    table.set(f[1], graisses);
  }
  return table;
}

/** Toutes les familles citées par un fichier natif, dans son code. */
function famillesCitees(file: string): string[] {
  return [...new Set([...code(file).matchAll(/fontFamily:\s*'([^']+)'/g)].map((m) => m[1]))];
}

/** Le sous-chemin de paquet d'où le chargeur tire une constante : `…/900Black`. */
function sousCheminDe(constante: string): string | undefined {
  const m = code(CHARGEUR)
    .match(new RegExp(`import \\{ ${constante} \\} from '(@expo-google-fonts/[^']+)'`));
  return m?.[1];
}

/* ── CE QUE LE BINAIRE DIT DE LUI-MÊME ──────────────────────────────────────────────────
 *
 * Un `.ttf` commité est une SECONDE SOURCE, et le dépôt fait payer celles-là cher. Le nom
 * du fichier n'est pas une preuve : n'importe quel binaire peut s'appeler
 * `Fraunces_900Black.ttf`. Ces deux lectures interrogent la fonte elle-même — sa table
 * `OS/2` pour la graisse, sa table `name` pour la famille — et c'est la seule chose qui
 * rende la divergence impossible plutôt qu'improbable.
 */

/** Les tables d'un `.ttf`, par leur étiquette de quatre octets. */
function tablesDe(buf: Buffer): Record<string, { offset: number }> {
  const tables: Record<string, { offset: number }> = {};
  const nombre = buf.readUInt16BE(4);
  for (let i = 0; i < nombre; i++) {
    const r = 12 + i * 16;
    tables[buf.toString('latin1', r, r + 4)] = { offset: buf.readUInt32BE(r + 8) };
  }
  return tables;
}

/** `OS/2.usWeightClass` — la graisse que la fonte déclare, en 100…900. */
function graisseDuBinaire(buf: Buffer): number {
  const os2 = tablesDe(buf)['OS/2'];
  if (!os2) throw new Error('fonte sans table OS/2');
  return buf.readUInt16BE(os2.offset + 4);
}

/**
 * La famille que la fonte déclare.
 *
 * `nameID` 16 (« famille typographique ») quand il existe, `nameID` 1 sinon : les fichiers
 * statiques de Google écrivent `1 = "Schibsted Grotesk SemiBold"` pour les graisses hors
 * régulier/gras, et rangent le vrai nom de famille dans 16. Lire 1 seul ferait échouer la
 * porte sur trois fichiers parfaitement valides.
 */
function familleDuBinaire(buf: Buffer): string {
  const name = tablesDe(buf).name;
  if (!name) throw new Error('fonte sans table name');
  const b = name.offset;
  const count = buf.readUInt16BE(b + 2);
  const chaines = b + buf.readUInt16BE(b + 4);
  const parId = new Map<number, string>();
  for (let i = 0; i < count; i++) {
    const r = b + 6 + i * 12;
    const plateforme = buf.readUInt16BE(r);
    const id = buf.readUInt16BE(r + 6);
    if (id !== 1 && id !== 16) continue;
    const debut = chaines + buf.readUInt16BE(r + 10);
    const brut = buf.subarray(debut, debut + buf.readUInt16BE(r + 8));
    // Plateforme 3 (Windows) encode en UTF-16 gros-boutien ; les autres, en octets simples.
    const valeur = plateforme === 3
      ? Buffer.from(brut).swap16().toString('utf16le')
      : brut.toString('latin1');
    if (!parId.has(id)) parId.set(id, valeur);
  }
  const famille = parId.get(16) ?? parId.get(1);
  if (!famille) throw new Error('fonte sans nom de famille');
  return famille;
}

/** Le greffon `expo-font` tel qu'`app.json` le déclare. */
function greffonDesFontes(): {
  android?: { fonts?: { fontFamily: string; fontDefinitions: { path: string; weight: number }[] }[] };
  ios?: { fonts?: string[] };
} {
  const app = JSON.parse(readFileSync(join(MOBILE, 'app.json'), 'utf8')).expo;
  const entree = (app.plugins ?? [])
    .find((p: unknown) => Array.isArray(p) && p[0] === 'expo-font');
  if (!entree) throw new Error('app.json ne déclare plus le greffon expo-font');
  return entree[1] ?? {};
}

/** Le fichier attendu pour une graisse : le nom de la constante que le chargeur importe. */
function fichiersAttendus(): { famille: string; graisse: number; base: string }[] {
  const attendus: { famille: string; graisse: number; base: string }[] = [];
  for (const [famille, graisses] of chargeur()) {
    for (const [graisse, constante] of graisses) attendus.push({ famille, graisse, base: constante });
  }
  return attendus;
}

/* ── LES PORTES ─────────────────────────────────────────────────────────────────────────── */

describe('fontes natives — la table est bien lue des deux côtés', () => {
  it('le kit déclare trois familles, chacune avec ses graisses', () => {
    const kit = graissesDuKit();
    expect([...kit.keys()].sort()).toEqual(['Fraunces', 'JetBrains Mono', 'Schibsted Grotesk']);
    for (const [famille, graisses] of kit) {
      expect(graisses.length, `« ${famille} » sans aucune graisse — le test ne vérifie plus rien`)
        .toBeGreaterThan(0);
    }
  });

  it('le chargeur expose une table lisible', () => {
    const table = chargeur();
    expect(table.size, 'aucune famille lue dans ds/Fontes.ts').toBe(3);
    for (const [famille, graisses] of table) {
      expect(graisses.size, `« ${famille} » sans graisse dans le chargeur`).toBeGreaterThan(0);
    }
  });
});

describe('fontes natives — les familles citées sont celles qui sont chargées', () => {
  it('`ds/Type.tsx` ne cite aucune famille que le chargeur ignore, ni l’inverse', () => {
    /*
     * `Type.tsx` est la source des trois rôles — affichage, corps, nombres vérifiables. Une
     * quatrième famille y entrerait par un quatrième rôle, et le chargeur ne le saurait pas.
     */
    const citees = famillesCitees(join(MOBILE, 'ds/Type.tsx')).sort();
    const chargees = [...chargeur().keys()].sort();
    expect(citees, `familles citées par ds/Type.tsx : ${citees.join(', ')}`).toEqual(chargees);
  });

  it('aucun écran natif ne cite une famille absente du chargeur', () => {
    const chargees = new Set(chargeur().keys());
    const fautes: string[] = [];
    for (const f of walk(MOBILE)) {
      for (const famille of famillesCitees(f)) {
        if (!chargees.has(famille)) fautes.push(`${rel(f)} → « ${famille} »`);
      }
    }
    expect(
      fautes,
      'Une famille citée et non chargée rend en police système, sans erreur ni avertissement. '
      + 'C’est le défaut exact que ce fichier existe pour fermer.',
    ).toEqual([]);
  });

  it('chaque famille du kit porte au natif son nom sans espace', () => {
    const chargees = new Set(chargeur().keys());
    for (const famille of graissesDuKit().keys()) {
      expect(
        chargees,
        `Le kit déclare « ${famille} » ; le natif doit l’enregistrer sous « ${nomNatif(famille)} », `
        + 'qui est le mot que les écrans écrivent.',
      ).toContain(nomNatif(famille));
    }
  });
});

describe('fontes natives — les graisses sont celles du kit, littéralement', () => {
  it('aucune graisse du kit ne manque au chargeur, et le chargeur n’en invente aucune', () => {
    const kit = graissesDuKit();
    const table = chargeur();
    const fautes: string[] = [];

    for (const [famille, attendues] of kit) {
      const chargees = [...(table.get(nomNatif(famille)) ?? new Map()).keys()].sort((a, b) => a - b);
      for (const g of attendues) {
        if (!chargees.includes(g)) fautes.push(`${nomNatif(famille)} ${g} — déclarée par fonts.css, absente du chargeur`);
      }
      for (const g of chargees) {
        if (!attendues.includes(g)) fautes.push(`${nomNatif(famille)} ${g} — chargée, absente de fonts.css`);
      }
    }
    expect(
      fautes,
      'Une graisse qui dérive ne casse rien : la page tient, le texte se lit. C’est un écart '
      + 'de marque invisible en revue de code.',
    ).toEqual([]);
  });

  it('chaque graisse pointe la constante de SA graisse, pas celle d’à côté', () => {
    /*
     * `900: Fraunces_700Bold` compilerait, se bundlerait et s'afficherait. Seule la lecture
     * du nom de la constante attrape la substitution.
     */
    const fautes: string[] = [];
    for (const [famille, graisses] of chargeur()) {
      for (const [graisse, constante] of graisses) {
        if (!constante.startsWith(`${famille}_${graisse}`)) {
          fautes.push(`${famille} ${graisse} → ${constante}`);
        }
      }
    }
    expect(fautes).toEqual([]);
  });

  it('chaque famille charge la graisse de base, celle du nom nu', () => {
    /*
     * Le chargeur enregistre la graisse de base sous le nom de famille NU — c'est lui, et lui
     * seul, que les trente-neuf fichiers citent. Une famille sans cette graisse laisserait
     * donc son nom nu jamais enregistré : toute la famille retomberait en police système.
     */
    const base = Number(code(CHARGEUR).match(/export const GRAISSE_BASE = (\d+);/)?.[1]);
    expect(base, 'ds/Fontes.ts n’expose plus de GRAISSE_BASE lisible').toBeGreaterThan(0);
    for (const [famille, graisses] of chargeur()) {
      expect([...graisses.keys()], `« ${famille} » ne charge pas la graisse de base`).toContain(base);
    }
  });
});

describe('fontes natives — les paquets sont installés, et la racine attend', () => {
  it('chaque famille du kit a son paquet dans les dépendances, et le chargeur l’importe', () => {
    const paquet = JSON.parse(readFileSync(join(MOBILE, 'package.json'), 'utf8'));
    const source = code(CHARGEUR);
    for (const famille of graissesDuKit().keys()) {
      const nom = paquetDe(famille);
      expect(paquet.dependencies[nom], `${nom} n’est pas installé`).toBeTruthy();
      expect(source, `ds/Fontes.ts n’importe rien de ${nom}`)
        .toMatch(new RegExp(`from '${nom}(/[^']+)?'`));
    }
    // Le chargeur lui-même : `expo-font` n'était qu'une dépendance transitive d'`expo`.
    expect(paquet.dependencies['expo-font']).toBeTruthy();
  });

  it('aucune fonte n’est importée par le baril de son paquet', () => {
    /*
     * MESURÉ, PAS SUPPOSÉ. `import … from '@expo-google-fonts/fraunces'` tire le baril, qui
     * fait `require()` des dix-huit fichiers du paquet. Metro suit les `require` : le paquet
     * Android est parti avec 47 `.ttf` là où neuf servent, soit environ 4,5 Mo de fontes que
     * rien n'affiche. Rien ne casse — c'est bien pour ça que personne ne le verrait.
     *
     * Le chemin profond (`…/900Black`) ne tire que son fichier.
     */
    const fautes = [...code(CHARGEUR).matchAll(/from '(@expo-google-fonts\/[^']+)'/g)]
      .map((m) => m[1])
      .filter((chemin) => chemin.split('/').length < 3);
    expect(
      fautes,
      'Import du baril : tout le paquet entre dans le bundle, italiques comprises.',
    ).toEqual([]);
  });

  it('la racine ne rend rien tant que les fontes ne sont pas tranchées', () => {
    /*
     * L'invariant : premier écran EN MARQUE, jamais un premier écran en police système suivi
     * d'un saut. Il tient à deux choses dans `app/_layout.tsx` — l'attente, et le retour vide
     * pendant l'attente. Retirer l'une des deux rouvre le saut sans rien casser d'autre.
     */
    const racine = code(join(MOBILE, 'app/_layout.tsx'));
    expect(racine).toMatch(/useFontesChargees\(\)/);
    expect(racine).toMatch(/if\s*\(!\s*\w+\s*\)\s*return null;/);
  });
});

describe('fontes natives — les binaires commités ne peuvent pas diverger du kit', () => {
  /*
   * LE DÉPÔT PORTE MAINTENANT NEUF `.ttf`, et c'est une seconde source.
   *
   * L'interdit d'origine — « aucun binaire dans le dépôt » — a été levé pour une raison
   * précise : le greffon `expo-font` est le SEUL mécanisme qui lie plusieurs graisses sous
   * un même nom de famille côté natif, et il ne sait lire que des chemins de fichiers. Le
   * risque qu'il rouvre est celui que l'interdit fermait : deux copies qui dérivent.
   *
   * Ces trois portes le referment autrement — par la vérification plutôt que par
   * l'abstinence. La chaîne n'a aucun bout libre :
   *
   *     fonts.css  →  ds/Fontes.ts  →  assets/fonts/*.ttf  →  app.json  →  les octets
   */
  it('le dossier porte exactement les fichiers que le chargeur nomme', () => {
    const attendus = fichiersAttendus().map((f) => `${f.base}.ttf`).sort();
    const presents = readdirSync(DOSSIER_DES_FONTES).sort();
    expect(
      presents,
      'Un fichier en trop est du poids que rien n’affiche ; un fichier en moins fait échouer '
      + 'le `prebuild`, c’est-à-dire beaucoup plus tard.',
    ).toEqual(attendus);
  });

  it('chaque binaire DIT lui-même la famille et la graisse que son nom annonce', () => {
    /*
     * Le nom du fichier n'est pas une preuve : n'importe quel binaire peut s'appeler
     * `Fraunces_900Black.ttf`. On interroge donc la fonte — `OS/2.usWeightClass` et sa table
     * `name` — plutôt que son étiquette.
     */
    const fautes: string[] = [];
    for (const { famille, graisse, base } of fichiersAttendus()) {
      const buf = readFileSync(join(DOSSIER_DES_FONTES, `${base}.ttf`));
      const dite = graisseDuBinaire(buf);
      if (dite !== graisse) fautes.push(`${base}.ttf annonce ${graisse}, la fonte déclare ${dite}`);
      const nom = familleDuBinaire(buf);
      if (nomNatif(nom) !== famille) {
        fautes.push(`${base}.ttf annonce ${famille}, la fonte déclare « ${nom} »`);
      }
    }
    expect(fautes).toEqual([]);
  });

  it('quand les paquets sont installés, chaque binaire en est la copie exacte', () => {
    /*
     * La PROVENANCE, quand elle est vérifiable. `npm test` tourne à la racine, où
     * `mobile/node_modules` n'est pas installé (la CI ne l'installe que dans le job natif) :
     * la porte s'efface alors plutôt que d'échouer pour une raison qui n'est pas la sienne.
     * Les deux portes ci-dessus, elles, ne dépendent de rien et tiennent toujours.
     */
    const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
    const fautes: string[] = [];
    let verifies = 0;
    for (const { base } of fichiersAttendus()) {
      const sousChemin = sousCheminDe(base);
      if (!sousChemin) {
        fautes.push(`${base} n’est importé d’aucun paquet par ds/Fontes.ts`);
        continue;
      }
      const source = join(MOBILE, 'node_modules', sousChemin, `${base}.ttf`);
      if (!existsSync(source)) continue;
      verifies++;
      if (sha(source) !== sha(join(DOSSIER_DES_FONTES, `${base}.ttf`))) {
        fautes.push(`${base}.ttf diffère de ${sousChemin} — le dépôt a dérivé du paquet`);
      }
    }
    expect(fautes).toEqual([]);
    if (verifies > 0) expect(verifies).toBe(fichiersAttendus().length);
  });
});

describe('fontes natives — le greffon lie les mêmes graisses, sous les mêmes noms', () => {
  /*
   * C'EST LE GREFFON QUI REND LES GRAISSES SUR ANDROID, PAS LE CHARGEUR À L'EXÉCUTION.
   *
   * `expo-font` n'enregistre à l'exécution qu'UNE fonte par nom : sur Android il ne remplit
   * que la case NORMAL de `ReactFontManager`, donc tout `fontWeight` ≥ 700 retombait sur la
   * police système graissée — c'est-à-dire TOUTE la Fraunces, qui n'est jamais demandée en
   * dessous de 700. Le greffon écrit une famille XML par nom, avec un `app:fontWeight` par
   * graisse, et l'enregistre par `addCustomFont` : ce chemin-là est consulté EN PREMIER et
   * choisit la bonne graisse.
   *
   * Si cette déclaration s'écarte du kit, rien ne casse — les graisses redeviennent
   * approximatives, en silence.
   */
  it('android.fonts déclare les trois familles, aux graisses du kit, sur des fichiers présents', () => {
    const declare = greffonDesFontes().android?.fonts ?? [];
    const attendu = fichiersAttendus();

    expect([...declare.map((f) => f.fontFamily)].sort()).toEqual([...chargeur().keys()].sort());

    const aplati = declare
      .flatMap((f) => f.fontDefinitions.map((d) => `${f.fontFamily} ${d.weight} ${d.path}`))
      .sort();
    const voulu = attendu
      .map((f) => `${f.famille} ${f.graisse} ./assets/fonts/${f.base}.ttf`)
      .sort();
    expect(aplati).toEqual(voulu);

    for (const f of declare) {
      for (const d of f.fontDefinitions) {
        expect(
          existsSync(join(MOBILE, d.path)),
          `${d.path} est déclaré au greffon et n’existe pas — le prebuild échouera`,
        ).toBe(true);
      }
    }
  });

  it('ios.fonts embarque exactement les mêmes neuf fichiers', () => {
    const declare = [...(greffonDesFontes().ios?.fonts ?? [])].sort();
    const voulu = fichiersAttendus().map((f) => `./assets/fonts/${f.base}.ttf`).sort();
    expect(
      declare,
      'iOS lit le nom de famille DANS le fichier : un fichier manquant ici, et sa graisse '
      + 'n’existe pas sur la plateforme.',
    ).toEqual(voulu);
  });

  it('le greffon reste dans `plugins`, et son paquet dans les dépendances', () => {
    // Le même invariant que `mobile-app-config.test.ts:55`, rappelé ici parce que c'est ce
    // fichier qu'on lit quand on touche aux fontes.
    const app = JSON.parse(readFileSync(join(MOBILE, 'app.json'), 'utf8')).expo;
    const noms = (app.plugins ?? []).map((p: unknown) => (Array.isArray(p) ? p[0] : p));
    expect(noms).toContain('expo-font');
  });
});
