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

/** La source de tout nombre de cet écran-témoin : le transfert de conception, daté. */
export const SOURCE: NumSource = { cite: 'handoff_natif — kit de référence' };

/** La date du transfert. Elle accompagne chaque nombre, sans exception. */
export const RELEVE = new Date('2026-09-02T00:00:00Z');

/** La personne dont le transfert dessine le parcours, d'un bout à l'autre. */
export const MOI = {
  prenom: 'Aïssatou',
  nom: 'Aïssatou Ndiaye',
  initiale: 'A',
  email: 'aissatou@exemple.sn',
  ouvertureCompte: '12 août',
} as const;

/** Le site. L'application n'encaisse rien : elle y renvoie (AD-11, App Store 3.1.1). */
export const SITE = 'https://maxmorrys.me';

/* ─────────────────────────  CE QUI S'APPREND  ───────────────────────── */

export const FORMATION = {
  slug: 'referencement-local',
  titre: 'Référencement local pour ton commerce',
  titreCourt: 'Référencement local',
  meta: 'SEO · 6 modules · 47 leçons · débutant',
  prix: 95000,
  echelonnement: '3 × 31 700',
  lecons: 47,
  leconsFaites: 16,
  progression: 34,
  arret: "Tu t'es arrêtée il y a 8 jours",
  moduleEnCours: 'Module 3 · Leçon 5',
  leconEnCours: 'Les mots que tapent tes clients',
} as const;

export const FORMATION_2 = {
  slug: 'ia-prospection',
  titre: "L'IA au service de ta prospection",
  meta: 'IA · 9 modules · 68 leçons · avancé',
  prix: 200000,
  echelonnement: '4 × 50 000',
} as const;

/** Le programme du module en cours. `poids` n'est pas décoratif : le forfait est compté. */
export const PROGRAMME = [
  { titre: 'Choisir tes mots-clés', meta: '06:12 · téléchargé · 12 Mo', etat: 'done' },
  { titre: 'Ce que cherche un client à Dakar', meta: '07:48 · téléchargé · 9 Mo', etat: 'done' },
  { titre: 'Les mots que tapent tes clients', meta: '08:24 · en cours', etat: 'current' },
  { titre: 'Écrire une fiche qui remonte', meta: '07:03', etat: 'todo' },
  { titre: 'Exercice : ta liste de 20 mots', meta: 'PDF · 180 Ko', etat: 'todo', doc: true },
] as const;

/** Les modules verrouillés du mur de paiement. Le premier, lui, se regarde sans payer. */
export const MODULES_MUR = [
  { titre: 'Pourquoi ta boutique est invisible', meta: 'module 1 · 4 leçons · 22 min', ouvert: true },
  { titre: 'Ta fiche Google, pas à pas', meta: '11 leçons · 1 h 08', ouvert: false },
  { titre: 'Les mots que tapent tes clients', meta: '9 leçons · 54 min', ouvert: false },
] as const;

export const NOTES = [
  { texte: "Lister ce que la cliente dit à voix haute, pas ce que je vends.", date: '04/09 · 21:14 · Leçon 5' },
  { texte: '« cosmétique Almadies » plutôt que « cosmétique Sénégal ».', date: '04/09 · 21:02 · Leçon 5' },
  { texte: 'Vérifier les horaires de la fiche Google avant le week-end.', date: '28/08 · 08:47 · Leçon 4' },
  { texte: 'Garder les 20 mots qui reviennent, jeter le reste.', date: '27/08 · 22:31 · Leçon 4' },
  { texte: 'Photos de la boutique : refaire celles de la vitrine.', date: '21/08 · 19:05 · Leçon 2' },
] as const;

export const NOTES_TOTAL = { notes: 14, lecons: 6 } as const;

/* ─────────────────────────  CE QUI SE GARDE HORS RÉSEAU  ───────────────────────── */

export const TELECHARGE = [
  { titre: 'Choisir tes mots-clés', meta: 'vidéo 480p · 12 Mo' },
  { titre: 'Ce que cherche un client à Dakar', meta: 'vidéo 480p · 9 Mo' },
  { titre: 'Exercice : ta liste de 20 mots', meta: 'PDF · 180 Ko', doc: true },
] as const;

export const STOCKAGE = {
  occupe: '21,2 Mo',
  occupeCourt: '21 Mo',
  plafond: '512 Mo',
  pourcentage: 4,
  qualite: '480p',
} as const;

/** Ce qui attend le retour du réseau. La file est un objet PERMANENT, pas un rattrapage. */
export const FILE_ENVOI = [
  { titre: 'Leçon 5 terminée', meta: 'il y a 12 min', glyphe: 'check' as const },
  { titre: '1 note écrite', meta: 'il y a 9 min', glyphe: 'comment' as const },
] as const;

/* ─────────────────────────  LE CERTIFICAT  ───────────────────────── */

export const CERTIFICAT = {
  code: 'MM-C7K4-9RTX-2081',
  titulaire: MOI.nom,
  formation: FORMATION.titre,
  emisLe: '12/09/2026',
  lecons: 47,
  lien: `${SITE}/verifier/MM-C7K4-9RTX-2081`,
} as const;

/* ─────────────────────────  LE RÉPÉTITEUR  ───────────────────────── */

export const QUOTA = { utilise: 3, total: 5 } as const;

export const ECHANGE = [
  { de: 'ai', texte: "Salut Aïssatou. Je suis ton répétiteur — tu peux me donner un autre nom quand tu veux. Tu t'es arrêtée à la leçon 5 du module 3. On la reprend, ou tu as une question ?" },
  { de: 'me', texte: 'Comment je choisis mes mots-clés ?' },
  { de: 'ai', texte: "Trois points, dans cet ordre :\n\n1. Ce que tes clientes disent à voix haute en entrant — pas ce que toi tu vends.\n2. Le nom de ton quartier.\n3. Ce que tapent celles qui ne te connaissent pas encore." },
] as const;

export const RENVOI_COURS = {
  eyebrow: 'Depuis ton cours',
  titre: 'Module 3, leçon 4 — « Ce que cherche un client à Dakar »',
} as const;

export const MEMOIRE = [
  { fait: 'Tu gères la page Instagram de ta cousine coiffeuse, le week-end.', depuis: 'depuis le 12 août' },
  { fait: 'Tu vends des cosmétiques aux Almadies.', depuis: 'depuis le 12 août' },
  { fait: 'Ton objectif : être trouvable sur Google Maps avant décembre.', depuis: 'depuis le 28 août' },
  { fait: 'Tu préfères les réponses courtes, en trois points.', depuis: 'depuis le 2 septembre' },
  { fait: 'Tu travailles surtout le soir, après 21 h.', depuis: 'depuis le 4 septembre' },
] as const;

/* ─────────────────────────  LE CLUB  ───────────────────────── */

export const CLUB = {
  prixMois: 1658,
  prixAn: 19900,
  prixParraine: 16915,
  echeance: '14/02/2027',
  depuis: 'février',
  bilan: [
    { n: 6, l: 'sessions suivies' },
    { n: 14, l: 'opportunités vues' },
    { n: 2, l: 'missions décrochées' },
  ],
} as const;

export const CLUB_FIL = [
  {
    auteur: 'Seynabou K.', initiales: 'SK', categorie: 'Entraide', quand: 'il y a 2 h',
    texte: "J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ». Je mets ma liste de mots en commentaire si ça sert à quelqu'un.",
    aime: 12, republie: 3, commente: 7,
  },
] as const;

export const CLUB_MISSION = {
  meta: 'Mission · Dakar · publiée hier',
  titre: 'Fiche Google pour trois boutiques',
  budget: 180000,
  note: 'Budget annoncé par la personne qui publie',
} as const;

export const AGENDA = [
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

export const EPISODE = {
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

export const VIDEO = {
  titre: 'Trois heures au marché Sandaga',
  eyebrow: 'Vidéo · 12 juillet',
  badge: 'Vidéo · 16:9',
  cout: ['18:04', '96 Mo en HD', '24 Mo en 480p'],
} as const;

export const TRANSCRIPTION = [
  { t: '00:42', l: "Fatou : « Je payais 15 000 par semaine en pub, et je vendais autant qu'avant. »" },
  { t: '04:18', l: '« La première cliente venue de Google avait cherché cosmétique Almadies. »' },
  { t: '11:05', l: 'La différence entre une page Facebook et une fiche Google.' },
  { t: '28:12', l: "Ce qu'elle referait autrement, et ce qu'elle ne referait pas." },
] as const;

/* ─────────────────────────  PRÉSENCE DIGITALE (TPE)  ───────────────────────── */

export const PACK = {
  nom: 'Pack Visible',
  prix: 250000,
  prixBarre: 295000,
  ancrage: 400000,
  lignes: [
    'Fiche Google optimisée', 'Site vitrine · 5 pages', 'Photos et textes',
    'Prise en main · 1 h', 'Nom de domaine · 1 an',
  ],
} as const;

export const DEVIS = {
  reference: 'MM-D-4831',
  lien: `${SITE}/devis/MM-D-4831`,
  emisLe: '05/09/2026',
  valideJusqu: '05/10/2026',
  validite: 'Valide 30 j',
} as const;

export const QUESTION_TPE = {
  question: 'Tes clients te trouvent comment aujourd’hui ?',
  reponses: ['Bouche-à-oreille et passage', 'WhatsApp et Facebook', 'Je ne sais pas trop'],
  etape: 2, total: 3,
} as const;

/* ─────────────────────────  LA CONSOLE, RÔLE SUPPORT  ───────────────────────── */

/** Cinq écrans sur dix-neuf. Les quatorze autres restent au tableau de bord desktop. */
export const SUPPORT_PORTEE = [
  { titre: 'Messages', compte: 0, href: '/console/messages' },
  { titre: 'Témoignages', compte: 0, href: '/console/temoignages' },
  { titre: 'Rendez-vous', compte: 0, href: '/console/rendez-vous' },
  { titre: 'Prospects', compte: 1, href: '/console/prospects' },
  { titre: 'Projets', compte: 0, href: '/console/projets' },
] as const;

export const PROSPECT = {
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

export const DISCUSSIONS = [
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

export const MEMBRE = {
  nom: 'Seynabou Kane', initiales: 'SK', metier: 'Coiffure à domicile',
  ville: 'Dakar · Ouakam', depuis: 'membre depuis février',
  presentation: "Je coiffe à domicile depuis quatre ans. J'ai refait ma fiche Google en août, et j'essaie de comprendre ce qui fait revenir les clientes plutôt que ce qui les fait venir une fois.",
  formations: ['Référencement local'],
  contributions: 14,
} as const;

/** Le classement est PAR VAGUE D'ARRIVÉE, jamais absolu — voir l'écran pour la raison. */
export const CLASSEMENT = {
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

export const OPPORTUNITES = [
  {
    type: 'Mission', titre: 'Fiche Google pour trois boutiques', lieu: 'Dakar', quand: 'publiée hier',
    budget: 180000, par: 'Groupement des commerçants de Ouakam',
  },
  {
    type: "Appel d'offres", titre: 'Refonte de la page Facebook · restaurant', lieu: 'Dakar, Plateau',
    quand: 'il y a 3 j', budget: 75000, par: 'Restaurant Le Baobab',
  },
] as const;

export const PARRAINAGE = {
  code: 'AISSATOU-24',
  lien: `${SITE}/club?code=AISSATOU-24`,
  remiseFilleul: 2985,
  prixParraine: CLUB.prixParraine,
  filleuls: 2,
  /** Ce que TOI tu gagnes : rien en argent. Voir l'écran — c'est la décision, pas un oubli. */
  gainParrain: 'un mois offert par filleul qui reste 90 jours',
} as const;

export const CLUB_INFOS = {
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
