/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE CONTENU DE RÉFÉRENCE DU TRANSFERT — une seule porte, et elle est nommée.
 *
 * Les écrans du transfert `handoff_natif/` codent leurs valeurs EN DUR : c'est assumé, le
 * fichier readme le dit — « ce sont des maquettes de référence, pas du code de production
 * […] reprends la structure, les valeurs de style et l'ordre des éléments. Pas
 * l'architecture. »
 *
 * Recopier ces valeurs DANS les écrans reproduirait l'architecture qu'on nous dit de ne pas
 * reprendre, et le port a sa propre règle sur ce point : aucun écran ne simule de données.
 * Les deux se concilient exactement ici — **le contenu est de la donnée, et il vit dans un
 * module de données.** Un écran ne fabrique rien : il lit ce fichier, comme il lira demain
 * une collection Firestore. Brancher le SDK, c'est remplacer ce module, pas trente écrans.
 *
 * ET IL PORTE SA SOURCE. La règle 6 du système — « un nombre en monospace vient de la base
 * ou d'une source citée, sinon il ne s'affiche pas » — n'est pas contournée : `SOURCE` cite
 * le transfert, et `RELEVE` porte sa date. Un prix affiché ici dit donc d'où il vient, et
 * `<Num>` refuse toujours d'écrire un chiffre sans date.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
import type { NumSource } from '../ds';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * L'INTERRUPTEUR DE CONTENU — et pourquoi il est fermé PAR DÉFAUT.
 *
 * `DEMO` est FAUX sauf preuve du contraire. Un build de production n'a rien à déclarer pour
 * être honnête : il l'est parce que personne n'a rien allumé. L'inverse — une porte ouverte
 * que la production devrait penser à refermer — aurait la forme exacte du défaut qu'on vient
 * de corriger : une garantie qui repose sur le fait que quelqu'un s'en souvienne.
 *
 * Deux façons de l'ouvrir, aucune accidentelle :
 *   `__DEV__`                      le serveur Metro. On développe sur du contenu, et un
 *                                  build de développement ne s'installe chez personne.
 *   `EXPO_PUBLIC_CONTENU_DEMO=1`   déclaré dans `eas.json`, sur `development` et `preview`
 *                                  UNIQUEMENT. `tests/unit/mobile-ds.test.ts` échoue si le
 *                                  profil `production` le porte un jour.
 *
 * ── POURQUOI CETTE LIGNE VIT ICI, ET PAS DANS UN MODULE À ELLE ────────────────────────────
 * Elle y a vécu, et c'était plus propre à lire. Mais Metro inline `process.env.EXPO_PUBLIC_*`
 * à la transformation, et son minifieur ne replie une branche morte QUE dans le module où la
 * condition est littérale. Importée, la condition restait opaque : les chaînes du transfert —
 * « aissatou@exemple.sn », « Vendre sans budget pub » — se retrouvaient EMBARQUÉES dans le
 * paquet de production, simplement inatteignables. Mesuré, pas supposé : 3 octets d'écart
 * entre les deux paquets au lieu de plusieurs kilo-octets.
 *
 * Une définition unique, dans le module qu'elle garde : le minifieur remplace alors chaque
 * `DEMO ? … : null` par `null` et laisse tomber la plupart des constantes devenues inutiles.
 * Mesuré après correction : **3,4 Ko de moins** dans le paquet de production, et les textes du
 * transfert en sont sortis.
 *
 * ⚠️ MAIS L'ÉLIMINATION N'EST PAS TOTALE, et il ne faut pas le promettre : quelques littéraux
 * courts survivent au repliage (les codes `MM-C7K4-9RTX-2081`, `MM-D-4831`, `AISSATOU-24`).
 * Ils sont INATTEIGNABLES à l'exécution — aucun écran ne peut les afficher, le type l'interdit
 * — mais ils restent lisibles par qui décompresse le paquet. La garantie qui compte est celle
 * de l'exécution, et elle est tenue par le compilateur ; celle du paquet est un bonus partiel.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const DEMO = process.env.EXPO_PUBLIC_CONTENU_DEMO === '1' || __DEV__;

/** La source de tout nombre de cet écran-témoin : le transfert de conception, daté. */
export const SOURCE: NumSource = { cite: 'handoff_natif — kit de référence' };

/** La date du transfert. Elle accompagne chaque nombre, sans exception. */
export const RELEVE = new Date('2026-09-02T00:00:00Z');

/** La personne dont le transfert dessine le parcours, d'un bout à l'autre. */
const KIT_MOI = {
  prenom: 'Aïssatou',
  nom: 'Aïssatou Ndiaye',
  initiale: 'A',
  email: 'aissatou@exemple.sn',
  ouvertureCompte: '12 août',
} as const;

/** Le site. L'application n'encaisse rien : elle y renvoie (AD-11, App Store 3.1.1). */
/*
 * L'adresse du site est une CONSTANTE PRIVÉE d'abord, ré-exportée ensuite : une liaison
 * exportée est « vivante » pour le minifieur, et un gabarit qui la référence résiste au
 * repliage. Ça n'a pas suffi à faire disparaître les trois codes — voir la note ci-dessus —
 * mais ça retire une raison de les garder, et l'écriture reste la bonne.
 */
const KIT_SITE = 'https://maxmorrys.me';
export const SITE = KIT_SITE;

/* ─────────────────────────  CE QUI S'APPREND  ───────────────────────── */

const KIT_FORMATION = {
  slug: 'referencement-local',
  titre: 'Référencement local pour ton commerce',
  titreCourt: 'Référencement local',
  meta: 'SEO · 6 modules · 47 leçons · débutant',
  lecons: 47,
  leconsFaites: 16,
  progression: 34,
  arret: "Tu t'es arrêtée il y a 8 jours",
  moduleEnCours: 'Module 3 · Leçon 5',
  leconEnCours: 'Les mots que tapent tes clients',
} as const;

const KIT_FORMATION_2 = {
  slug: 'ia-prospection',
  titre: "L'IA au service de ta prospection",
  meta: 'IA · 9 modules · 68 leçons · avancé',
} as const;

/** Le programme du module en cours. `poids` n'est pas décoratif : le forfait est compté. */
const KIT_PROGRAMME = [
  { titre: 'Choisir tes mots-clés', meta: '06:12 · téléchargé · 12 Mo', etat: 'done' },
  { titre: 'Ce que cherche un client à Dakar', meta: '07:48 · téléchargé · 9 Mo', etat: 'done' },
  { titre: 'Les mots que tapent tes clients', meta: '08:24 · en cours', etat: 'current' },
  { titre: 'Écrire une fiche qui remonte', meta: '07:03', etat: 'todo' },
  { titre: 'Exercice : ta liste de 20 mots', meta: 'PDF · 180 Ko', etat: 'todo', doc: true },
] as const;

/** Les modules verrouillés du mur de paiement. Le premier, lui, se regarde sans payer. */
const KIT_MODULES_MUR = [
  { titre: 'Pourquoi ta boutique est invisible', meta: 'module 1 · 4 leçons · 22 min', ouvert: true },
  { titre: 'Ta fiche Google, pas à pas', meta: '11 leçons · 1 h 08', ouvert: false },
  { titre: 'Les mots que tapent tes clients', meta: '9 leçons · 54 min', ouvert: false },
] as const;

const KIT_NOTES = [
  { texte: "Lister ce que la cliente dit à voix haute, pas ce que je vends.", date: '04/09 · 21:14 · Leçon 5' },
  { texte: '« cosmétique Almadies » plutôt que « cosmétique Sénégal ».', date: '04/09 · 21:02 · Leçon 5' },
  { texte: 'Vérifier les horaires de la fiche Google avant le week-end.', date: '28/08 · 08:47 · Leçon 4' },
  { texte: 'Garder les 20 mots qui reviennent, jeter le reste.', date: '27/08 · 22:31 · Leçon 4' },
  { texte: 'Photos de la boutique : refaire celles de la vitrine.', date: '21/08 · 19:05 · Leçon 2' },
] as const;

const KIT_NOTES_TOTAL = { notes: 14, lecons: 6 } as const;

/* ─────────────────────────  CE QUI SE GARDE HORS RÉSEAU  ───────────────────────── */

const KIT_TELECHARGE = [
  { titre: 'Choisir tes mots-clés', meta: 'vidéo 480p · 12 Mo' },
  { titre: 'Ce que cherche un client à Dakar', meta: 'vidéo 480p · 9 Mo' },
  { titre: 'Exercice : ta liste de 20 mots', meta: 'PDF · 180 Ko', doc: true },
] as const;

const KIT_STOCKAGE = {
  occupe: '21,2 Mo',
  occupeCourt: '21 Mo',
  plafond: '512 Mo',
  pourcentage: 4,
  qualite: '480p',
} as const;

/** Ce qui attend le retour du réseau. La file est un objet PERMANENT, pas un rattrapage. */
const KIT_FILE_ENVOI = [
  { titre: 'Leçon 5 terminée', meta: 'il y a 12 min', glyphe: 'check' as const },
  { titre: '1 note écrite', meta: 'il y a 9 min', glyphe: 'comment' as const },
] as const;

/* ─────────────────────────  LE CERTIFICAT  ───────────────────────── */

const KIT_CERTIFICAT = {
  code: 'MM-C7K4-9RTX-2081',
  titulaire: KIT_MOI.nom,
  formation: KIT_FORMATION.titre,
  emisLe: '12/09/2026',
  lecons: 47,
  lien: `${KIT_SITE}/verifier/MM-C7K4-9RTX-2081`,
} as const;

/* ─────────────────────────  LE RÉPÉTITEUR  ───────────────────────── */

const KIT_QUOTA = { utilise: 3, total: 5 } as const;

const KIT_ECHANGE = [
  { de: 'ai', texte: "Salut Aïssatou. Je suis ton répétiteur — tu peux me donner un autre nom quand tu veux. Tu t'es arrêtée à la leçon 5 du module 3. On la reprend, ou tu as une question ?" },
  { de: 'me', texte: 'Comment je choisis mes mots-clés ?' },
  { de: 'ai', texte: "Trois points, dans cet ordre :\n\n1. Ce que tes clientes disent à voix haute en entrant — pas ce que toi tu vends.\n2. Le nom de ton quartier.\n3. Ce que tapent celles qui ne te connaissent pas encore." },
] as const;

const KIT_RENVOI_COURS = {
  eyebrow: 'Depuis ton cours',
  titre: 'Module 3, leçon 4 — « Ce que cherche un client à Dakar »',
} as const;

const KIT_MEMOIRE = [
  { fait: 'Tu gères la page Instagram de ta cousine coiffeuse, le week-end.', depuis: 'depuis le 12 août' },
  { fait: 'Tu vends des cosmétiques aux Almadies.', depuis: 'depuis le 12 août' },
  { fait: 'Ton objectif : être trouvable sur Google Maps avant décembre.', depuis: 'depuis le 28 août' },
  { fait: 'Tu préfères les réponses courtes, en trois points.', depuis: 'depuis le 2 septembre' },
  { fait: 'Tu travailles surtout le soir, après 21 h.', depuis: 'depuis le 4 septembre' },
] as const;

/* ─────────────────────────  LE CLUB  ───────────────────────── */

const KIT_CLUB = {
  echeance: '14/02/2027',
  depuis: 'février',
  bilan: [
    { n: 6, l: 'sessions suivies' },
    { n: 14, l: 'opportunités vues' },
    { n: 2, l: 'missions décrochées' },
  ],
} as const;

const KIT_CLUB_FIL = [
  {
    auteur: 'Seynabou K.', initiales: 'SK', categorie: 'Entraide', quand: 'il y a 2 h',
    texte: "J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ». Je mets ma liste de mots en commentaire si ça sert à quelqu'un.",
    aime: 12, republie: 3, commente: 7,
  },
] as const;

const KIT_CLUB_MISSION = {
  meta: 'Mission · Dakar · publiée hier',
  titre: 'Fiche Google pour trois boutiques',
  budget: 180000,
  note: 'Budget annoncé par la personne qui publie',
} as const;

const KIT_AGENDA = [
  {
    jour: 'Jeudi 10 septembre', titre: 'Ta fiche Google, en direct',
    horaire: '20:00 → 21:00 · en ligne', glyphe: 'chat' as const,
    territoire: 'transforme' as const, inscrite: true,
  },
  {
    jour: 'Samedi 20 septembre', titre: 'Atelier fiche produit',
    horaire: '10:00 → 13:00 · Dakar, Point E', glyphe: 'users' as const,
    territoire: 'digitalise' as const, inscrite: false, places: '4 / 12 places',
  },
] as const;

/* ─────────────────────────  LE PÔLE MÉDIA  ───────────────────────── */

const KIT_EPISODE = {
  titre: 'Vendre sans budget pub, avec Fatou D.',
  titreCourt: 'Vendre sans budget pub',
  invitee: 'avec Fatou D.',
  eyebrow: 'Podcast · épisode 1 · 6 août',
  chapo: "Elle a arrêté la publicité payante pendant trois mois pour voir. Le chiffre n'a pas bougé.",
  duree: '34:20',
  position: '08:12',
  restant: '−26:08',
  poids: '31 Mo',
  cout: ['34:20', '31 Mo', 'Transcription · 0 Mo'],
  date: '6 août 2026',
} as const;

const KIT_VIDEO = {
  titre: 'Trois heures au marché Sandaga',
  eyebrow: 'Vidéo · 12 juillet',
  badge: 'Vidéo · 16:9',
  cout: ['18:04', '96 Mo en HD', '24 Mo en 480p'],
} as const;

const KIT_TRANSCRIPTION = [
  { t: '00:42', l: "Fatou : « Je payais 15 000 par semaine en pub, et je vendais autant qu'avant. »" },
  { t: '04:18', l: '« La première cliente venue de Google avait cherché cosmétique Almadies. »' },
  { t: '11:05', l: 'La différence entre une page Facebook et une fiche Google.' },
  { t: '28:12', l: "Ce qu'elle referait autrement, et ce qu'elle ne referait pas." },
] as const;

/* ─────────────────────────  PRÉSENCE DIGITALE (TPE)  ───────────────────────── */

/* `KIT_PACK` a été RETIRÉ le 05/09/2026. L'offre Présence Digitale n'est pas un contenu à
   simuler : c'est ce que l'entreprise vend. Elle vit désormais dans `contenu/engagement.ts`,
   hors de l'interrupteur — sinon l'écran `/presence`, atteignable depuis l'onglet Profil,
   était vide en production. Deux copies d'un prix finissent toujours par diverger ; il n'y
   en a plus qu'une. */

const KIT_DEVIS = {
  reference: 'MM-D-4831',
  lien: `${KIT_SITE}/devis/MM-D-4831`,
  emisLe: '05/09/2026',
  valideJusqu: '05/10/2026',
  validite: 'Valide 30 j',
} as const;

const KIT_QUESTION_TPE = {
  question: 'Tes clients te trouvent comment aujourd’hui ?',
  reponses: ['Bouche-à-oreille et passage', 'WhatsApp et Facebook', 'Je ne sais pas trop'],
  etape: 2, total: 3,
} as const;

/* ─────────────────────────  LA CONSOLE, RÔLE SUPPORT  ───────────────────────── */


const KIT_PROSPECT = {
  titre: 'Boutique de cosmétiques · Almadies',
  meta: 'Pack Visible · 250 000 F · « nouveau » depuis le 6 août',
  statut: 'à traiter',
} as const;

/* ─────────────────────────  LE CLUB — LES CINQ ONGLETS DE LISTE  ─────────────────────────
 *
 * Le transfert les laisse volontairement de côté : « ils se portent à l'identique des trois
 * dessinés — le mur, le fil, l'agenda ; les dessiner un par un n'apprendrait rien. » Leur
 * contenu de référence vit donc ici, dans la même voix et sous la même source citée, pour que
 * les cinq écrans soient JUGEABLES au lieu d'être cinq états vides.
 */

const KIT_DISCUSSIONS = [
  {
    categorie: 'Entraide', titre: "Ma fiche Google refuse ma photo de devanture, quelqu'un a eu ça ?",
    auteur: 'Awa T.', initiales: 'AT', quand: 'il y a 3 h', reponses: 4, resolu: true,
  },
  {
    categorie: 'Outils', titre: 'Wave ou Orange Money pour encaisser en boutique : vous faites quoi ?',
    auteur: 'Modou S.', initiales: 'MS', quand: 'hier', reponses: 11, resolu: false,
  },
  {
    categorie: 'Clients', titre: "Une cliente demande une facture avec NINEA. Je n'en ai pas encore.",
    auteur: 'Fatou D.', initiales: 'FD', quand: 'il y a 2 j', reponses: 6, resolu: true,
  },
  {
    categorie: 'Entraide', titre: 'Combien de temps avant que la fiche remonte dans les résultats ?',
    auteur: 'Seynabou K.', initiales: 'SK', quand: 'il y a 4 j', reponses: 8, resolu: false,
  },
] as const;

const KIT_MEMBRE = {
  nom: 'Seynabou Kane', initiales: 'SK', metier: 'Coiffure à domicile',
  ville: 'Dakar · Ouakam', depuis: 'membre depuis février',
  presentation: "Je coiffe à domicile depuis quatre ans. J'ai refait ma fiche Google en août, et j'essaie de comprendre ce qui fait revenir les clientes plutôt que ce qui les fait venir une fois.",
  formations: ['Référencement local'],
  contributions: 14,
} as const;

/** Le classement est PAR VAGUE D'ARRIVÉE, jamais absolu — voir l'écran pour la raison. */
const KIT_CLASSEMENT = {
  vague: 'Arrivées en février',
  rang: 3, surCombien: 12, points: 240, semaine: 40,
  lignes: [
    { rang: 1, nom: 'Modou S.', initiales: 'MS', points: 310, moi: false },
    { rang: 2, nom: 'Awa T.', initiales: 'AT', points: 275, moi: false },
    { rang: 3, nom: 'Toi', initiales: 'A', points: 240, moi: true },
    { rang: 4, nom: 'Fatou D.', initiales: 'FD', points: 232, moi: false },
    { rang: 5, nom: 'Ibrahima N.', initiales: 'IN', points: 198, moi: false },
  ],
} as const;

const KIT_OPPORTUNITES = [
  {
    type: 'Mission', titre: 'Fiche Google pour trois boutiques', lieu: 'Dakar', quand: 'publiée hier',
    budget: 180000, par: 'Groupement des commerçants de Ouakam',
  },
  {
    type: "Appel d'offres", titre: 'Refonte de la page Facebook · restaurant', lieu: 'Dakar, Plateau',
    quand: 'il y a 3 j', budget: 75000, par: 'Restaurant Le Baobab',
  },
] as const;

/*
 * ⚠️ LES MONTANTS ONT QUITTÉ CE MODULE — prix des formations, prix du Club, prix parrainé,
 * remise du filleul. L'application est passée en CONSULTATION SEULE : elle ouvre ce qui est
 * déjà acquis et ne propose rien à l'achat (App Store 3.1.1, résolu par retrait).
 *
 * Un chiffre laissé ici serait réapparu tôt ou tard dans un écran — c'est ce que fait un
 * contenu de démonstration, il remplit les trous. Les prix de `KIT_PACK` restent, eux :
 * Présence Digitale est une prestation du MONDE RÉEL, que la règle 3.1.5(a) exige justement
 * de transacter hors du magasin.
 */
const KIT_PARRAINAGE = {
  code: 'AISSATOU-24',
  lien: `${KIT_SITE}/club?code=AISSATOU-24`,
  filleuls: 2,
  /** Ce que TOI tu gagnes : rien en argent. Voir l'écran — c'est la décision, pas un oubli. */
  gainParrain: 'un mois offert par filleul qui reste 90 jours',
} as const;

const KIT_CLUB_INFOS = {
  garanti: [
    '2 sessions en direct par mois, avec moi',
    'Les missions que je sors de mon carnet',
    'Les ateliers à Dakar, places membres',
    "Une réponse de moi, pas d'un modérateur",
  ],
  pasGaranti: [
    'Des clients',
    'Un revenu',
    'Une place à chaque atelier — elles sont comptées',
    'Une réponse dans l’heure : je réponds dans la journée ouvrée',
  ],
} as const;

/** Ce que chaque écran du rôle support a À TRAITER. Un compte est un relevé, jamais une
    propriété de l'écran : il vit donc ici, et il disparaît avec le reste. */
const KIT_SUPPORT_COMPTES: Record<string, number> = {
  Messages: 0, Témoignages: 0, 'Rendez-vous': 0, Prospects: 1, Projets: 0,
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   L'INTERRUPTEUR. C'est la SEULE sortie de ce module.

   Rien au-dessus n'est exporté : les valeurs du transfert sont des constantes privées, et
   elles ne franchissent cette ligne que si `DEMO` est vrai. En production, chaque contenu vaut
   `null` (un objet) ou `[]` (une liste) — et le TYPE le dit, donc le compilateur oblige chaque
   écran à traiter le cas.

   C'est un MÉCANISME, pas une promesse : on n'oublie pas une branche que `tsc` refuse de
   compiler. Le port avait déjà appris la différence — un commentaire affirmait « aucune donnée
   n'est simulée » pendant que 42 écrans en affichaient.
   ═══════════════════════════════════════════════════════════════════════════════════ */

export const MOI: typeof KIT_MOI | null = DEMO ? KIT_MOI : null;
export const FORMATION: typeof KIT_FORMATION | null = DEMO ? KIT_FORMATION : null;
export const FORMATION_2: typeof KIT_FORMATION_2 | null = DEMO ? KIT_FORMATION_2 : null;
export const PROGRAMME: typeof KIT_PROGRAMME | readonly [] = DEMO ? KIT_PROGRAMME : [];
export const MODULES_MUR: typeof KIT_MODULES_MUR | readonly [] = DEMO ? KIT_MODULES_MUR : [];
export const NOTES: typeof KIT_NOTES | readonly [] = DEMO ? KIT_NOTES : [];
export const NOTES_TOTAL: typeof KIT_NOTES_TOTAL | null = DEMO ? KIT_NOTES_TOTAL : null;
export const TELECHARGE: typeof KIT_TELECHARGE | readonly [] = DEMO ? KIT_TELECHARGE : [];
export const STOCKAGE: typeof KIT_STOCKAGE | null = DEMO ? KIT_STOCKAGE : null;
export const FILE_ENVOI: typeof KIT_FILE_ENVOI | readonly [] = DEMO ? KIT_FILE_ENVOI : [];
export const CERTIFICAT: typeof KIT_CERTIFICAT | null = DEMO ? KIT_CERTIFICAT : null;
export const QUOTA: typeof KIT_QUOTA | null = DEMO ? KIT_QUOTA : null;
export const ECHANGE: typeof KIT_ECHANGE | readonly [] = DEMO ? KIT_ECHANGE : [];
export const RENVOI_COURS: typeof KIT_RENVOI_COURS | null = DEMO ? KIT_RENVOI_COURS : null;
export const MEMOIRE: typeof KIT_MEMOIRE | readonly [] = DEMO ? KIT_MEMOIRE : [];
export const CLUB: typeof KIT_CLUB | null = DEMO ? KIT_CLUB : null;
export const CLUB_FIL: typeof KIT_CLUB_FIL | readonly [] = DEMO ? KIT_CLUB_FIL : [];
export const CLUB_MISSION: typeof KIT_CLUB_MISSION | null = DEMO ? KIT_CLUB_MISSION : null;
export const AGENDA: typeof KIT_AGENDA | readonly [] = DEMO ? KIT_AGENDA : [];
export const EPISODE: typeof KIT_EPISODE | null = DEMO ? KIT_EPISODE : null;
export const VIDEO: typeof KIT_VIDEO | null = DEMO ? KIT_VIDEO : null;
export const TRANSCRIPTION: typeof KIT_TRANSCRIPTION | readonly [] = DEMO ? KIT_TRANSCRIPTION : [];
export const DEVIS: typeof KIT_DEVIS | null = DEMO ? KIT_DEVIS : null;
export const QUESTION_TPE: typeof KIT_QUESTION_TPE | null = DEMO ? KIT_QUESTION_TPE : null;
export const PROSPECT: typeof KIT_PROSPECT | null = DEMO ? KIT_PROSPECT : null;
export const DISCUSSIONS: typeof KIT_DISCUSSIONS | readonly [] = DEMO ? KIT_DISCUSSIONS : [];
export const MEMBRE: typeof KIT_MEMBRE | null = DEMO ? KIT_MEMBRE : null;
export const CLASSEMENT: typeof KIT_CLASSEMENT | null = DEMO ? KIT_CLASSEMENT : null;
export const OPPORTUNITES: typeof KIT_OPPORTUNITES | readonly [] = DEMO ? KIT_OPPORTUNITES : [];
export const PARRAINAGE: typeof KIT_PARRAINAGE | null = DEMO ? KIT_PARRAINAGE : null;
export const CLUB_INFOS: typeof KIT_CLUB_INFOS | null = DEMO ? KIT_CLUB_INFOS : null;
export const SUPPORT_COMPTES: typeof KIT_SUPPORT_COMPTES | null = DEMO ? KIT_SUPPORT_COMPTES : null;
