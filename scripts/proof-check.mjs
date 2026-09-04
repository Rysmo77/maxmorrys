#!/usr/bin/env node
/**
 * LA BARRIÈRE QUI MANQUAIT — une donnée contre la phrase qui la décrit.
 *
 * `ds:check` garde la monospace, `seo:check` les miroirs SEO, `og:check` les cartes de
 * partage. Aucun ne regarde ce qui a pourtant coûté le plus cher sur ce dépôt : une PHRASE
 * qui affirme quelque chose sur une DONNÉE, et que rien ne relie à elle.
 *
 * Les trois cas relevés le 03/09/2026 se ressemblent tous :
 *
 *   • « Les jalons marqués déclaré n'ont pas de lien » — la première URL posée l'aurait
 *     rendue fausse, et l'encart n'aurait jamais disparu de lui-même ;
 *   • « Pas encore de page Spotify à te donner » — écrite DEUX fois, dans quatre fichiers
 *     avec l'anglais : le jour de la publication, l'une des deux aurait survécu à l'autre ;
 *   • « La grille de prix, relevée au 2 août 2026 » — une date gelée dans la prose, à côté
 *     d'une grille relue en base à chaque affichage.
 *
 * Aucun des trois ne casse quoi que ce soit. Aucun ne se voit à l'écran. Tous les trois font
 * mentir la page dont le métier est précisément d'être vérifiable — et le seul endroit d'où
 * ils se voient est celui-ci.
 *
 *   node scripts/proof-check.mjs           # les invariants hors ligne, sortie 1 au premier manquement
 *   node scripts/proof-check.mjs --links   # + les URLs publiées, une requête par adresse
 *
 * `--links` sort du réseau : il vit dans un rendez-vous HEBDOMADAIRE, pas dans la CI de
 * chaque livraison. Un site tiers qui tombe un mardi ne doit pas bloquer une livraison ; il
 * doit se voir, ce qui n'est pas la même chose.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LINKS = process.argv.includes('--links');
const findings = [];
const add = (regle, fichier, detail) => findings.push({ regle, fichier, detail });
const lire = (p) => readFileSync(join(root, p), 'utf8');
const lireJson = (p) => JSON.parse(lire(p));

/* La donnée d'un côté, la page de l'autre : ce script garde les deux, il ne les confond pas. */
const JALONS = lire('src/lib/about/milestones.ts');
const FR = lireJson('src/i18n/locales/fr/about.json');
const EN = lireJson('src/i18n/locales/en/about.json');

/** Les clés d'un tableau littéral TypeScript : `['m2014', 'm2018']` → ['m2014','m2018']. */
const clesDe = (source) => [...source.matchAll(/'([^']+)'/g)].map((m) => m[1]);

/* ══ 1 · LES JALONS EXISTENT VRAIMENT, DANS LES DEUX LANGUES ═══════════════════════════
   `CHAPTERS` est la seule liste, et elle nomme des clés i18n. Une clé renommée d'un côté
   sans l'autre ne lève rien à l'exécution : i18next rend la clé elle-même, et la frise
   affiche « milestones.m2019.title » à un visiteur, sur la page qui vend la rigueur. */
const chapitres = JALONS.match(/const CHAPTERS = \[([\s\S]*?)\] as const;/);
if (!chapitres) add('1 · jalons', 'src/lib/about/milestones.ts', 'CHAPTERS introuvable — le script ne sait plus ce qu\'il garde');
const jalons = chapitres ? clesDe(chapitres[1]).filter((k) => k.startsWith('m')) : [];

for (const cle of jalons) {
  for (const [langue, table] of [['fr', FR], ['en', EN]]) {
    const j = table.milestones?.[cle];
    if (!j) add('1 · jalons', `src/i18n/locales/${langue}/about.json`, `le jalon « ${cle} » de CHAPTERS n'existe pas ici`);
    else for (const champ of ['year', 'lieu', 'title', 'desc']) {
      if (!j[champ]) add('1 · jalons', `src/i18n/locales/${langue}/about.json`, `milestones.${cle}.${champ} manque`);
    }
  }
}

/* ══ 2 · AUCUNE PREUVE ORPHELINE ══════════════════════════════════════════════════════
   Une URL posée sur une clé qui n'existe plus ne s'affiche nulle part et ne prévient
   personne : le jalon reste « déclaré » alors que quelqu'un a cru le sourcer. Même chose
   pour une clé rangée en « non prouvable » qui ne désigne plus rien. */
const bloc = (nom, motif) => {
  const m = JALONS.match(motif);
  return m ? clesDe(m[1]).filter((k) => k.startsWith('m')) : [];
};
const prouves = bloc('MILESTONE_PROOFS', /const MILESTONE_PROOFS[^{]*\{([\s\S]*?)\n\};/);
const nonProuvables = bloc('MILESTONE_UNPROVABLE', /const MILESTONE_UNPROVABLE[^=]*= new Set\(\[([\s\S]*?)\]\)/);

for (const [nom, liste] of [['MILESTONE_PROOFS', prouves], ['MILESTONE_UNPROVABLE', nonProuvables]]) {
  for (const cle of liste) {
    if (!jalons.includes(cle)) add('2 · preuves orphelines', 'src/lib/about/milestones.ts', `${nom} porte « ${cle} », qui n'est dans aucun chapitre`);
  }
}
for (const cle of prouves) {
  if (nonProuvables.includes(cle)) {
    add('2 · preuves orphelines', 'src/lib/about/milestones.ts', `« ${cle} » est à la fois prouvé et déclaré non prouvable — l'un des deux ment`);
  }
}

/* ══ 3 · LA DATE DU RELEVÉ SUIT LE TEXTE QU'ELLE DATE ══════════════════════════════════
   `DECLARED_AT` dit « parcours déclaré par Max-Morrys · relevé du 30/08/2026 ». Le texte
   des jalons, lui, vit dans `about.json`. Rien ne relie les deux : une correction de
   libellé garde la date d'un relevé qui n'a pas eu lieu. L'empreinte les relie. */
const canonique = (o) => JSON.stringify(o, Object.keys(o ?? {}).sort());
const empreinte = createHash('sha256')
  .update(jalons.map((k) => `${k}|${canonique(FR.milestones?.[k])}|${canonique(EN.milestones?.[k])}`).join('\n'))
  .digest('hex')
  .slice(0, 16);
const declaree = JALONS.match(/const MILESTONES_FINGERPRINT = '([0-9a-f]+)'/)?.[1];

if (!declaree) {
  add('3 · empreinte', 'src/lib/about/milestones.ts', `MILESTONES_FINGERPRINT manque — la valeur attendue est '${empreinte}'`);
} else if (declaree !== empreinte) {
  add('3 · empreinte', 'src/lib/about/milestones.ts',
    `la liste des jalons a changé (empreinte ${empreinte}, déclarée ${declaree}). ` +
    'Relis-la, mets DECLARED_AT à la date du relevé, puis reporte la nouvelle empreinte.');
}

/* ══ 4 · LES EMPLACEMENTS DÉCLARÉS SE FERMENT SEULS ════════════════════════════════════
   Un aveu qui ne se rend que sous condition disparaît quand la matière arrive. Un aveu
   rendu inconditionnellement demande qu'un humain se souvienne de le supprimer — et c'est
   exactement ce que le portrait a demandé, une fois, avec succès, ce qui ne prouve rien. */
const PORTES = [
  ['src/pages/About.tsx', /\{MILESTONES_OWED\.length > 0 && \(/, 'l\'encart des jalons ne compte plus ce qu\'il réclame — il ne pourra plus se fermer'],
  ['src/pages/About.tsx', /\{podcastPlatform === null && \(/, 'l\'encart « Liens à confirmer » ne suit plus podcastPlatform'],
  ['src/pages/MediaPole.tsx', /\{podcastPlatform === null && \(/, 'la phrase « pas encore de page Spotify » ne suit plus podcastPlatform'],
  ['src/pages/MediaPole.tsx', /\{podcastPlatform !== null && \(/, 'la rangée d\'écoute n\'apparaîtra pas quand la plateforme sera déclarée'],
];
for (const [fichier, motif, detail] of PORTES) {
  if (!motif.test(lire(fichier))) add('4 · portes', fichier, detail);
}

/* ══ 5 · LA DATE D'UNE GRILLE VIT AVEC LA GRILLE ═══════════════════════════════════════ */
if (!/export const CATALOGUE_REVISED_AT/.test(lire('src/lib/presence/offer.ts'))) {
  add('5 · dates de catalogue', 'src/lib/presence/offer.ts', 'CATALOGUE_REVISED_AT a quitté le catalogue');
}
for (const [fichier, constante] of [['src/pages/PresenceDigitale.tsx', 'CATALOGUE_REVISED_AT'], ['src/pages/ClubDigitos.tsx', 'CLUB_TERMS_REVISED_AT']]) {
  if (new RegExp(`const ${constante}\\s*=\\s*new Date`).test(lire(fichier))) {
    add('5 · dates de catalogue', fichier, `${constante} est redéclarée dans la page — elle appartient au module qui porte les valeurs`);
  }
}

/* ══ 6 · AUCUNE DATE ÉCRITE DANS LA COPIE ══════════════════════════════════════════════
   Une date en toutes lettres dans un fichier de traduction est une donnée déguisée en
   phrase : elle ne bouge pas quand la chose qu'elle date bouge, et elle est recopiée
   autant de fois qu'il y a de langues. Elle s'interpole (`{{asOf}}`) depuis la valeur
   qu'elle décrit, ou elle n'existe pas.

   DEUX EXCEPTIONS, ET TOUTES LES DEUX PROUVENT LA RÈGLE. La date d'une loi (`legal.json`) et
   la période d'un emploi (`about.json` → `experiences.*`) sont le FAIT CITÉ lui-même : elles
   ne suivent aucune donnée du dépôt et ne doivent jamais bouger. Tout le reste décrit quelque
   chose qui, lui, bouge.

   ⚠️ LE MOIS SEUL COMPTE AUSSI. La règle ne cherchait qu'une date complète — « 2 août 2026 ».
   Elle serait passée à côté de « la plateforme a ouvert en avril 2026 », qui est exactement le
   même défaut d'un cran plus haut : une donnée déguisée en phrase, recopiée par langue. */
const MOIS = 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre'
  + '|January|February|March|April|May|June|July|August|September|October|November|December';
const DATE_ÉCRITE = new RegExp(`\\b(?:${MOIS})\\s+\\d{4}\\b|\\b\\d{1,2}(?:er)? (?:${MOIS})\\b|\\b(?:${MOIS}) \\d{1,2}, \\d{4}\\b`, 'i');
const EXEMPTS = new Set(['legal.json']);
/** Chemins de clés dont la date EST le fait cité. `.` initial : le chemin est absolu. */
const CLÉS_EXEMPTES = [/^\.experiences\./];

for (const langue of ['fr', 'en']) {
  const dossier = `src/i18n/locales/${langue}`;
  for (const fichier of readdirSync(join(root, dossier))) {
    if (!fichier.endsWith('.json') || EXEMPTS.has(fichier)) continue;
    const parcourir = (noeud, chemin) => {
      if (typeof noeud === 'string') {
        if (DATE_ÉCRITE.test(noeud) && !CLÉS_EXEMPTES.some((re) => re.test(chemin))) {
          add('6 · dates en toutes lettres', `${dossier}/${fichier}`,
            `${chemin.slice(1)} porte une date écrite — interpole-la depuis la donnée qu'elle date`);
        }
        return;
      }
      if (noeud && typeof noeud === 'object') for (const [k, v] of Object.entries(noeud)) parcourir(v, `${chemin}.${k}`);
    };
    parcourir(lireJson(`${dossier}/${fichier}`), '');
  }
}

/* ══ 7 · LES ADRESSES PUBLIÉES RÉPONDENT ═══════════════════════════════════════════════
   Onze réalisations clientes et trois ventures sont nommées publiquement, chacune avec son
   URL. Une preuve qui répond 404 prouve le contraire de ce qu'elle affirme.

   ⚠️ CE CONTRÔLE ATTRAPE LA DISPARITION, PAS LA CONFUSION. Une page parquée répond 200
   comme une autre. `lauraverse.blog` est déduit d'un sous-domaine trouvé dans un dépôt, pas
   d'une URL canonique (voir `clients.ts`) : il répond, et ça ne dit toujours pas que c'est
   le bon site. Cette vérification-là reste humaine. */
if (LINKS) {
  const urls = [];
  for (const f of ['src/lib/brand/clients.ts', 'src/lib/brand/ventures.ts']) {
    for (const m of lire(f).matchAll(/^\s*website: '([^']+)'/gm)) urls.push([f, m[1]]);
  }
  if (urls.length === 0) add('7 · adresses', 'src/lib/brand/', 'aucune URL trouvée — le contrôle ne garde plus rien');

  await Promise.all(urls.map(async ([fichier, url]) => {
    const stop = AbortSignal.timeout(15_000);
    try {
      let r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: stop });
      /* Certains hébergeurs refusent HEAD et répondent 405 : on retente en GET avant de
         conclure à une disparition. Un faux positif ici ferait ignorer le contrôle entier. */
      if (r.status === 405 || r.status === 501) r = await fetch(url, { redirect: 'follow', signal: stop });
      if (!r.ok) add('7 · adresses', fichier, `${url} répond ${r.status}`);
    } catch (error) {
      add('7 · adresses', fichier, `${url} injoignable — ${error instanceof Error ? error.message : error}`);
    }
  }));
}

/* ══ 8 · LES MOYENS DE PAIEMENT SE COMPTENT AU MÊME ENDROIT ════════════════════════════
   Le 04/09/2026, l'accueil annonçait « Tu paies en Wave ou en Orange Money » pendant que le
   tunnel de paiement en acceptait TROIS, carte comprise, et que les CGV l'engageaient déjà.
   Les deux fichiers étaient justes séparément ; la contradiction ne vivait qu'ENTRE eux, et
   c'est précisément l'angle mort de toutes les autres barrières. Quelqu'un sans compte Wave
   lisait sur la première page du site qu'il ne pouvait pas acheter — alors qu'il pouvait.

   LA RÈGLE COMPARE DES FAITS, PAS DES PHRASES. Elle n'épingle aucune formulation : elle
   extrait l'ENSEMBLE des marques citées et le compare à la liste qui fait autorité, celle
   du tunnel. On réécrit librement, on ne peut plus en oublier une.

   Une chaîne qui n'en cite qu'UNE est un libellé (`checkout.methodWave`), pas une liste :
   elle ne déclenche rien. Il faut au moins deux marques pour qu'une énumération commence,
   et une énumération commencée doit être complète. */
const MARQUES = [
  /* Sensible à la casse, et c'est délibéré : `leaderboard.truth` parle d'une « joining
     wave », une vague de membres. La marque porte une capitale, le nom commun non. */
  ['Wave', /\bWave\b/],
  ['Om', /Orange Money/i],
  ['Card', /\bcartes?\b|\bcards?\b/i],
];
const marquesDe = (texte) => new Set(MARQUES.filter(([, re]) => re.test(texte)).map(([k]) => k));

const CHECKOUT = lire('src/pages/lms/Checkout.tsx');
const blocMethods = CHECKOUT.match(/const METHODS = \[([\s\S]*?)\n\];/);
const MOYENS = new Set(blocMethods ? [...blocMethods[1].matchAll(/key: '([^']+)'/g)].map((m) => m[1]) : []);
if (MOYENS.size === 0) {
  add('8 · moyens de paiement', 'src/pages/lms/Checkout.tsx',
    'METHODS introuvable — la règle ne sait plus à quoi comparer, et passerait au vert en ne gardant rien');
}

/** Toutes les chaînes des deux catalogues, avec leur chemin. Les règles 8 et 10 s'en servent. */
const toutesLesChaines = () => {
  const sorties = [];
  for (const langue of ['fr', 'en']) {
    const dossier = `src/i18n/locales/${langue}`;
    for (const fichier of readdirSync(join(root, dossier))) {
      if (!fichier.endsWith('.json')) continue;
      const parcourir = (noeud, chemin) => {
        if (typeof noeud === 'string') return sorties.push([`${dossier}/${fichier}`, chemin.slice(1), noeud]);
        if (noeud && typeof noeud === 'object') for (const [k, v] of Object.entries(noeud)) parcourir(v, `${chemin}.${k}`);
      };
      parcourir(lireJson(`${dossier}/${fichier}`), '');
    }
  }
  return sorties;
};
const CHAINES = toutesLesChaines();

if (MOYENS.size > 0) {
  for (const [fichier, chemin, valeur] of CHAINES) {
    const citees = marquesDe(valeur);
    if (citees.size < 2 || citees.size >= MOYENS.size) continue;
    const manquants = [...MOYENS].filter((m) => !citees.has(m));
    add('8 · moyens de paiement', fichier,
      `${chemin} énumère ${[...citees].join(' + ')} mais oublie ${manquants.join(' + ')} — le tunnel en accepte ${MOYENS.size}`);
  }
}

/* ══ 9 · LE MIROIR SEO AFFIRME LES MÊMES FAITS QUE L'INTERFACE ═════════════════════════
   `static-pages.ts` est servi aux ROBOTS, l'i18n est servi aux HUMAINS, et les deux
   décrivent le même produit. Rien ne les relie : le 04/09/2026, j'ai corrigé la phrase de
   paiement d'un seul côté et le site s'est contredit entre son aperçu de partage et sa
   propre page, sans qu'aucun test bronche.

   ON NE PEUT PAS DÉDUPLIQUER, ET IL NE FAUT PAS. Le texte SEO est à la troisième personne
   (« Le paiement se fait… ») quand l'interface tutoie (« Tu paies… ») : deux écritures
   différentes du même fait, et c'est voulu. La règle compare donc les ENSEMBLES de marques
   des deux côtés, pas les mots. Reformule tant que tu veux ; oublie un moyen d'un seul
   côté, et ça tombe. */
const STATIC_PAGES = lire('worker/apps/site/src/prerender/static-pages.ts');
const MIROIRS = [
  ['/', 'src/i18n/locales/fr/home.json', ['hero.lede', 'why.r1Body']],
  ['/club-des-digitos', 'src/i18n/locales/fr/club.json',
    ['publicPage.payWave', 'publicPage.payOrange', 'publicPage.payCard']],
];
const auChemin = (table, chemin) => chemin.split('.').reduce((o, k) => o?.[k], table);

for (const [route, source, cles] of MIROIRS) {
  const bloc = STATIC_PAGES.match(new RegExp(`'${route}': \\{([\\s\\S]*?)\\n  \\},`));
  if (!bloc) {
    add('9 · miroir SEO', 'worker/apps/site/src/prerender/static-pages.ts',
      `la route ${route} est introuvable — la règle ne garde plus ce miroir`);
    continue;
  }
  const table = lireJson(source.replace(`${root}/`, ''));
  const cote_i18n = marquesDe(cles.map((c) => auChemin(table, c) ?? '').join(' \n '));
  const cote_seo = marquesDe(bloc[1]);
  const ecart = [...new Set([...cote_i18n, ...cote_seo])].filter((m) => cote_i18n.has(m) !== cote_seo.has(m));
  if (ecart.length > 0) {
    add('9 · miroir SEO', 'worker/apps/site/src/prerender/static-pages.ts',
      `${route} : l'interface cite {${[...cote_i18n].join(', ')}}, le miroir cite {${[...cote_seo].join(', ')}} — ` +
      `écart sur ${ecart.join(' + ')}. Les robots et les humains ne liraient pas la même promesse.`);
  }
}

/* ══ 10 · AUCUNE PHRASE NE NIE CE QUE LE PRODUIT PROPOSE ═══════════════════════════════
   Le 04/09/2026, le pied de page a reçu un formulaire d'inscription à la lettre. Cent
   lignes plus bas, dans LE MÊME COMPOSANT, une phrase écrite des mois plus tôt affirmait
   toujours « il n'y a pas encore de lettre par e-mail ». Sur toutes les pages du site.

   Aucune barrière ne pouvait le voir : la clé existait, le ton tenait, la phrase ne portait
   pas de date. Elle n'était fausse que par rapport à du CODE, et c'est ce lien-là qu'on
   déclare ici. Chaque entrée dit : « si cette chose existe dans le code, alors aucune
   traduction ne peut prétendre le contraire. »

   ⚠️ CETTE RÈGLE NE GARDE QUE CE QU'ON Y INSCRIT. Elle n'est pas une intelligence, c'est un
   registre. Une fonctionnalité livrée sans son entrée ici passe au vert sans rien garder —
   c'est le pire mode d'échec d'une barrière, et il vaut mieux le savoir en l'écrivant. */
const NIÉS = [
  {
    quoi: 'la lettre',
    preuve: ['src/components/layout/Footer.tsx', /NewsletterForm/],
    interdits: [
      /pas encore de lettre/i,
      /no email newsletter/i,
      /seul moyen de suivre/i,
      /only way to follow/i,
    ],
  },
];

for (const { quoi, preuve: [fichierPreuve, motifPreuve], interdits } of NIÉS) {
  if (!motifPreuve.test(lire(fichierPreuve))) continue;
  for (const [fichier, chemin, valeur] of CHAINES) {
    const touche = interdits.find((re) => re.test(valeur));
    if (touche) {
      add('10 · négations périmées', fichier,
        `${chemin} nie ${quoi}, que ${fichierPreuve} monte pourtant (${touche})`);
    }
  }
}

/* ── Le verdict ──────────────────────────────────────────────────────────────────────── */
if (findings.length === 0) {
  console.log(`\nproof:check — ${LINKS ? 'dix' : 'neuf'} invariants tiennent, ${jalons.length} jalons vérifiés. 0 constat.\n`);
  process.exit(0);
}

console.log(`\nproof:check — ${findings.length} constat(s)\n`);
const groupes = new Map();
for (const f of findings) {
  if (!groupes.has(f.regle)) groupes.set(f.regle, []);
  groupes.get(f.regle).push(f);
}
for (const [regle, liste] of groupes) {
  console.log(`  ── ${regle} — ${liste.length} constat(s)`);
  for (const f of liste) console.log(`     ${f.fichier}  ${f.detail}`);
}
console.log('');
process.exit(1);
