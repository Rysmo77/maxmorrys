/* ═══════════════════════════════════════════════════════════════════════════════════════
 * ÉMETTEUR TYPESCRIPT — le consommateur du contrat qui TIENT le serveur.
 *
 * ⭐ C'EST CE FICHIER QUI FAIT TOUT LE TRAVAIL DU DISPOSITIF, et pas le Kotlin.
 *
 * Les 17 handlers `app*` étaient typés `Promise<unknown>` : rien ne les empêchait de
 * changer de forme. Une fois qu'ils annoncent `Promise<Reponse<'appMoi'>>`, c'est le
 * COMPILATEUR TypeScript qui les tient au contrat — dans le job `workers` qui tourne déjà,
 * sans coût d'exécution, et sans expression régulière.
 *
 * ⛔ POURQUOI UN CHAMP NULLABLE SE GÉNÈRE AUSSI FACULTATIF (`x?: T | null`).
 * `asText()` rend `string | undefined` (worker/apps/api/src/lib/values.ts:35), et
 * `JSON.stringify` OMET une clé dont la valeur est `undefined`. Le corps servi ne porte donc
 * pas toujours la clé. Générer `x: T | null` refuserait le code servi aujourd'hui ; générer
 * `x?: T` laisserait passer un `null` que Kotlin refuserait. Les deux à la fois disent la
 * vérité : la clé peut manquer, et sa valeur peut être nulle.
 *
 * ⛔ POURQUOI `ouvert: true` OUVRE LE TYPE TYPESCRIPT SANS OUVRIR L'ÉNUMÉRATION KOTLIN.
 * `Moi.role` est un ensemble fermé du PRODUIT et une chaîne libre de la BASE : `moi.ts:57`
 * rend `asText(document.data.role) ?? 'student'`. Exiger l'union du handler l'obligerait à
 * NORMALISER la valeur — c'est-à-dire à changer la réponse servie. Le TypeScript reste donc
 * ouvert (`| (string & {})`, qui garde l'autocomplétion), et c'est le client qui porte le
 * cas `inconnu`, là où il ne coûte rien.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

/** `appClubListe.membre` -> `AppClubListeMembre`. Sert à nommer les alias générés. */
const enPascal = (s) =>
  s.split(/[^A-Za-z0-9]+/).filter(Boolean).map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join('');

/** Une clé d'objet TypeScript : nue si elle est un identifiant, entre guillemets sinon. */
const cle = (k) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k));

const litteral = (v) => JSON.stringify(v);

/** Un `doc` du contrat, rendu en commentaire de bloc TypeScript sur une ligne. */
function commentaire(doc, indentation) {
  if (!doc) return '';
  const texte = Array.isArray(doc) ? doc.join(' ') : doc;
  return `${indentation}/** ${texte.replace(/\*\//g, '* /')} */\n`;
}

/**
 * Un type du contrat -> son écriture TypeScript.
 *
 * `unions` est la table des unions dédupliquées (voir `vues-gen.mjs`) : deux champs qui
 * portent le même ensemble fermé partagent UN nom de type, sinon Kotlin et TypeScript
 * finiraient avec deux énumérations jumelles qui dérivent séparément.
 */
export function typeTs(t, unions, ouvert = false) {
  if (t === 'texte') return 'string';
  if (t === 'entier' || t === 'decimal') return 'number';
  if (t === 'booleen') return 'boolean';
  if (t === 'horodatage') return 'string';
  if (typeof t === 'object' && t !== null) {
    if (t.liste !== undefined) return `${typeTs(t.liste, unions)}[]`;
    if (t.objet !== undefined) return t.objet;
    if (t.union !== undefined) {
      const nom = unions.get(JSON.stringify(t.union));
      if (!nom) throw new Error(`vues:gen/ts — union non enregistrée : ${JSON.stringify(t.union)}`);
      return ouvert ? `${nom} | (string & {})` : nom;
    }
  }
  throw new Error(`vues:gen/ts — type inconnu : ${JSON.stringify(t)}`);
}

/** Une forme -> un `interface`. Les champs nullables sont AUSSI facultatifs, cf. l'en-tête. */
function forme(nom, def, unions) {
  const champs = Object.entries(def.champs).map(([c, d]) => {
    const base = typeTs(d.type, unions, d.ouvert === true);
    const t = d.nul ? `${base} | null` : base;
    return `${commentaire(d.doc, '  ')}  ${cle(c)}${d.nul ? '?' : ''}: ${t};`;
  });
  return `${commentaire(def.doc, '')}export interface ${nom} {\n${champs.join('\n')}\n}`;
}

export function emettreTs(contrat, entete) {
  const unions = contrat.__unions;
  const morceaux = [entete, ''];

  /* Les unions d'abord : les formes les référencent. */
  morceaux.push('/* ── Les ensembles fermés ─────────────────────────────────────────── */');
  for (const [valeursJson, nom] of unions) {
    const valeurs = JSON.parse(valeursJson).map(litteral).join(' | ');
    morceaux.push(`export type ${nom} = ${valeurs};`);
  }
  morceaux.push('');

  morceaux.push('/* ── Les formes servies ───────────────────────────────────────────── */');
  for (const [nom, def] of Object.entries(contrat.formes)) morceaux.push(forme(nom, def, unions), '');

  if (contrat.formesEntree) {
    morceaux.push("/* ── Les formes d'entrée ──────────────────────────────────────────── */");
    for (const [nom, def] of Object.entries(contrat.formesEntree)) morceaux.push(forme(nom, def, unions), '');
  }

  /* ── Les vues ─────────────────────────────────────────────────────────────────── */
  const noms = Object.keys(contrat.vues);
  morceaux.push(
    '/* ── Les vues ─────────────────────────────────────────────────────── */',
    `export type NomDeVue =\n${noms.map((n) => `  | ${litteral(n)}`).join('\n')};`,
    '',
    '/** La charge utile de chaque vue, sans son enveloppe. */',
    'export interface FormeDeVue {',
    ...noms.map((n) => `  ${cle(n)}: ${typeTs(contrat.vues[n].forme, unions)};`),
    '}',
    '',
    'export type Vue<N extends NomDeVue> = FormeDeVue[N];',
    '',
    '/**',
    " * CE QUE `vue: null` SIGNIFIE, PAR VUE — la nuance que le port aplatissait.",
    ' *',
    " * Le port ramenait les trois sens à une seule phase `vide`. Le commentaire de `useClub`",
    " * énonçait pourtant la différence — « elle décide de ce qu'on lit après avoir laissé",
    ' * expirer son accès » — mais rien dans le protocole ne la portait. Elle est ici, en',
    ' * donnée, et le client en tire trois écrans distincts.',
    ' */',
    'export interface VueNulleDe {',
    ...noms.map((n) => `  ${cle(n)}: ${litteral(contrat.vues[n].vueNulle)};`),
    '}',
    '',
    '/**',
    " * L'ENVELOPPE, et la seule chose que les 19 formes de réponse ont en commun.",
    ' *',
    " * ⚠️ DEUX NIVEAUX DE DÉBALLAGE, PAS UN. Le protocole `onCall` écrit `{\"result\": …}` ;",
    ' * la charge utile d\'une vue porte `{vue, releveA}`. Le corps complet est donc',
    ' * `{"result":{"vue":…,"releveA":…}}`.',
    ' *',
    ' * `vue` est NON NULLABLE pour les vues dont le contrat dit `vueNulle: "jamais"` : c\'est',
    " * le compilateur qui refuse alors qu'un handler y rende `null`.",
    ' */',
    'export type Reponse<N extends NomDeVue> = {',
    "  vue: VueNulleDe[N] extends 'jamais' ? Vue<N> : Vue<N> | null;",
    '  releveA: string;',
    '};',
    '',
  );

  /* Une callable qui sert plusieurs formes selon un discriminant : un alias par callable. */
  const parCallable = new Map();
  for (const n of noms) {
    const callable = n.split('.')[0];
    if (!parCallable.has(callable)) parCallable.set(callable, []);
    parCallable.get(callable).push(n);
  }
  for (const [callable, vues] of parCallable) {
    if (vues.length < 2) continue;
    const champ = contrat.vues[vues[0]].discriminant?.champ ?? '?';
    morceaux.push(
      '/**',
      ` * ${callable} s'ouvre en ${vues.length} selon son paramètre \`${champ}\` : le serveur sert`,
      ` * ${vues.length} formes de réponse derrière UN nom de callable.`,
      ' */',
      `export type Reponse${enPascal(callable).replace(/^App/, 'App')} =\n${vues.map((v) => `  | Reponse<${litteral(v)}>`).join('\n')};`,
      '',
    );
  }

  /* ── Les écritures ────────────────────────────────────────────────────────────── */
  const ecritures = Object.keys(contrat.ecritures);
  morceaux.push(
    '/* ── Les écritures ────────────────────────────────────────────────── */',
    `export type NomDEcriture =\n${ecritures.map((n) => `  | ${litteral(n)}`).join('\n')};`,
    '',
    'export interface SortieDEcriture {',
    ...ecritures.map((n) => `  ${cle(n)}: ${typeTs(contrat.ecritures[n].sortie, unions)};`),
    '}',
    '',
    'export type Sortie<N extends NomDEcriture> = SortieDEcriture[N];',
    '',
    '/**',
    ' * CE QUE CHAQUE ÉCRITURE PÉRIME — le défaut du port, rendu en donnée générée.',
    ' *',
    " * ⛔ Le cache de 30 s n'avait AUCUNE invalidation par l'écriture. `marquerLecon` rendait",
    " * une progression recalculée, et rien n'évinçait `appEspace`, `appLecon` ni `appCours` :",
    " * pendant trente secondes, revenir sur l'onglet d'à côté montrait l'état d'avant.",
    " * C'est POUR CELA que `ecrireUneNote` et `posterAuClub` renvoient l'objet écrit — un",
    " * contournement qui marche pour l'écran actif, pas pour le voisin.",
    ' */',
    'export const VUES_PERIMEES: Readonly<Record<NomDEcriture, readonly NomDeVue[]>> = {',
    ...ecritures.map((n) => `  ${cle(n)}: [${contrat.ecritures[n].perime.map(litteral).join(', ')}],`),
    '} as const;',
    '',
  );

  return `${morceaux.join('\n')}`.replace(/\n{3,}/g, '\n\n');
}
