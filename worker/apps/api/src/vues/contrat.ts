/*
 * ⛔ FICHIER GÉNÉRÉ PAR `npm run vues:gen` — NE PAS ÉDITER.
 *
 * La source est `worker/apps/api/src/vues/vues.contrat.json`, seul artefact de cette couche
 * écrit à la main. Toute retouche ici est effacée à la prochaine génération, et
 * `npm run vues:check` la refuse avant.
 */

/* ── Les ensembles fermés ─────────────────────────────────────────── */
export type MoiRole = "student" | "admin" | "support";
export type LeconLigneEtat = "done" | "current" | "todo";
export type SeanceCollection = "club_sessions" | "club_events";
export type SeanceGlyphe = "chat" | "users";
export type SeanceTerritoire = "transforme" | "digitalise";
export type RepetiteurEchangeDe = "me" | "ai";
export type CibleBlocageType = "membre" | "message" | "discussion" | "opportunite";
export type PosterAuClubCategorie = "Entraide" | "Outils" | "Victoires" | "Questions";

/* ── Les formes servies ───────────────────────────────────────────── */
/** Qui regarde. L'initiale est CALCULÉE côté serveur, jamais stockée : un nom qui change doit la changer. */
export interface Moi {
  prenom: string;
  nom: string;
  initiale: string;
  email?: string | null;
  /** « 12 août » — DÉJÀ MIS EN FORME, pas une date à reformater. L'année est omise volontairement. */
  ouvertureCompte?: string | null;
  /** Le nom du répétiteur vit dans le profil, pas sur l'appareil : un stockage local en ferait une seconde source de vérité. */
  tuteur?: string | null;
  /** ⚠️ ENSEMBLE FERMÉ CÔTÉ PRODUIT, OUVERT CÔTÉ SERVEUR. `moi.ts:57` rend `asText(document.data.role) ?? 'student'` : la valeur vient de la BASE, donc le serveur peut légitimement émettre n'importe quelle chaîne. Le client porte l'énumération plus son cas `inconnu` ; le TypeScript reste ouvert, sinon le compilateur exigerait du handler une garantie que son code ne donne pas — et la seule façon de la lui donner serait de NORMALISER la valeur, c'est-à-dire de changer la réponse servie. */
  role: MoiRole | (string & {});
  xp: number;
}

/** La reprise — ce que l'accueil propose de rouvrir. N'existe dans AUCUN document : c'est une jointure `enrollments` × `formations` plus deux calculs de dates. */
export interface Espace {
  slug: string;
  titre: string;
  /** Premier segment avant « pour », « : » ou un tiret cadratin. L'écran a deux lignes ; un titre complet y déborde. */
  titreCourt: string;
  /** Chaîne d'affichage déjà jointe par ` · `. Ne pas la redécouper. */
  meta: string;
  lecons: number;
  leconsFaites: number;
  /** Pourcentage 0-100, borné et arrondi par `marquerLecon`. */
  progression: number;
  /** « Tu t'es arrêtée il y a 8 jours ». Une phrase, pas une durée. */
  arret?: string | null;
  /** ⚠️ `asText()` rend `undefined`, que `JSON.stringify` OMET : la clé est absente du corps, elle ne vaut pas `null`. C'est pourquoi tout champ nullable se génère aussi FACULTATIF des deux côtés. */
  moduleEnCours?: string | null;
  /** Même absence possible que `moduleEnCours`. */
  leconEnCours?: string | null;
}

/** Une ligne du catalogue. ⛔ AUCUN PRIX N'EN SORT, et ce n'est pas un oubli : un catalogue qui affiche des montants EST une vitrine. `formations` porte un `price` ; il s'arrête au serveur. */
export interface Cours {
  id: string;
  slug: string;
  titre: string;
  titreCourt: string;
  meta: string;
  /** Le niveau descend comme une DONNÉE, à côté de sa mise en forme dans `meta` : sur une chaîne d'affichage on ne peut ni compter ni filtrer. */
  niveau?: string | null;
  /** Calculé depuis les inscriptions de la personne, jamais depuis un paramètre. */
  acquise: boolean;
}

/** Un module dans la fiche d'une formation. */
export interface ModuleFiche {
  titre: string;
  /** « module 2 · 5 leçons · 54 min ». Le temps MANQUE quand une seule durée du module ne se laisse pas lire — un total amputé se lirait comme une mesure. */
  meta: string;
  /** Vrai si le module contient au moins une leçon `isFree`. On ne suppose PAS que c'est le premier : c'est l'administration qui décide. */
  ouvert: boolean;
}

export interface Formation {
  titre: string;
  titreCourt: string;
  meta: string;
  lecons: number;
  modules: ModuleFiche[];
}

/** Une ligne du programme du module en cours. */
export interface LeconLigne {
  id: string;
  titre: string;
  /** ⚠️ NI DURÉE NI POIDS INVENTÉS. Sur ce marché un forfait est compté : le poids en mégaoctets décide de charger maintenant ou d'attendre le Wi-Fi. Le champ est ABSENT quand la base ne l'a pas. */
  meta?: string | null;
  /** Le seul ensemble fermé que le port React Native avait conservé. */
  etat: LeconLigneEtat;
  doc: boolean;
}

export interface Lecon {
  moduleTitre?: string | null;
  programme: LeconLigne[];
}

/** ⚠️ NOMMÉE ICI : elle était anonyme des deux côtés (`notes.ts:51`, inline dans `VueNotes`). « 14 notes · 6 leçons » ne dit pas la même chose que « 14 notes » — le second nombre compte les leçons DISTINCTES annotées. */
export interface NotesTotal {
  notes: number;
  lecons: number;
}

export interface Note {
  id: string;
  texte: string;
  /** ⛔ DEUX FORMES POUR UN MÊME NOM, ET C'EST UNE CONTRADICTION DU SERVEUR. `appNotes` compose « 04/09 · 21:14 · <leçon> » (`notes.ts:58-60`) ; `ecrireUneNote` rend `asText(lessonLabel) ?? null` (`ecrireUneNote.ts:67`), c'est-à-dire LE LIBELLÉ DE LA LEÇON, pas une date. La trancher est une modification du Worker, donc hors du périmètre de ce lot : le contrat la NOMME, il ne la corrige pas. C'est pourquoi l'écriture porte sa propre forme `NoteEcrite` plutôt que de réutiliser `Note`. */
  date?: string | null;
}

export interface Notes {
  total: NotesTotal;
  notes: Note[];
}

/** ⚠️ Un certificat est un document OPPOSABLE : quatre champs solidaires — titulaire, formation, date, code. Le serveur ne rend que les jeux COMPLETS ; un jeu partiel produirait un document au nom de quelqu'un avec le code d'un autre. */
export interface Certificat {
  code: string;
  titulaire: string;
  formation: string;
  /** Chaîne ISO brute de `issuedAt`, PAS mise en forme — contrairement à `Moi.ouvertureCompte`. */
  emisLe: string;
  /** 0 = « non relevé » pour l'écran, qui le rend par `Num`. Les certificats émis avant le correctif du champ `certificateCode` n'ont pas ce compte, et il ne s'invente pas. */
  lecons: number;
}

export interface Certificats {
  /** Chaîne ISO brute. Elle est là pour DATER LE ZÉRO : « zéro certificat depuis l'ouverture de ton compte » se lit, « — » ne se lit pas. */
  ouvertureCompte?: string | null;
  certificats: Certificat[];
  /** Non montré à la personne : il part en trace. Un certificat amputé côté base est un défaut de données, pas un vide légitime. */
  incomplets: number;
}

/** Le miroir PUBLIC d'un certificat, tel que `certificate_lookups` le porte. ⛔ QUATRE CHAMPS, ET PAS UN DE PLUS : cette forme est servie SANS SESSION, donc tout champ ajouté ici est une donnée personnelle publiée sans le vouloir — le miroir ne porte d'ailleurs ni UID ni adresse, et `worker-certificats.test.ts` le garde. ⚠️ Elle NE PORTE PAS `lecons`, contrairement à `Certificat` : l'émission ne l'écrit pas dans le miroir (`issueCertificate.ts:110-115`), et le « 47 / 47 » du kit est une donnée de démonstration. La page web l'omet déjà pour cette raison exacte (`VerifyCertificate.tsx:39-45`). */
export interface CertificatPublic {
  /** Le code ÉCRIT EN BASE, jamais celui reçu de l'appelant : réafficher ce qu'on vient de taper ne prouve rien. */
  code: string;
  formation: string;
  titulaire: string;
  /** Chaîne ISO brute de `issuedAt`, PAS mise en forme — comme `Certificat.emisLe`. */
  emisLe: string;
}

/** ⚠️ NOMMÉE ICI parce qu'elle était anonyme des deux côtés (`club.ts:90-94`). Voir `n`. */
export interface ClubBilanTuile {
  /** ⛔ NON NULLABLE, CONTRE LE COMMENTAIRE DE `club.ts:88-89`. Celui-ci affirme « Un `null` y reste `null` : trois tuiles qui affichent “non relevé” valent mieux qu'un zéro qu'on n'a pas mesuré. » LE CODE NE PEUT PAS LE TENIR : `count(...).catch(() => 0)` (`club.ts:63, 68`) et `toNumber(..., 0)` (`:93`) servent une agrégation REFUSÉE comme un zéro MESURÉ. Même motif dans `console.ts:49`. Le contrat dit la vérité du code, pas celle du commentaire ; faire passer `.catch(() => 0)` à `.catch(() => null)` est une décision produit, et elle n'a pas eu lieu. */
  n: number;
  l: string;
}

export interface Club {
  /** JJ/MM/AAAA, déjà mis en forme. */
  echeance?: string | null;
  /** Nom du mois, en français, en minuscule. */
  depuis?: string | null;
  bilan: ClubBilanTuile[];
}

/** Une séance de l'agenda. `club_sessions` (les directs) et `club_events` (les ateliers) ont la même forme à l'écran et des règles distinctes en base : la fusion et le tri vivent au serveur, sinon ils se referaient dans chaque client. */
export interface Seance {
  id: string;
  /** ⚠️ CE JETON REPART AU SERVEUR. `reserverSession` le reçoit et le revalide contre la même liste fermée (`reserverSession.ts:42`). Le typer `texte` des deux côtés — ce que faisait le port — laissait un aller-retour de jeton non vérifié par le compilateur. */
  collection: SeanceCollection;
  /** « Mardi 9 septembre ». Déjà mis en forme. */
  jour?: string | null;
  /** Une séance sans titre n'est pas rendue. */
  titre: string;
  horaire?: string | null;
  /** Nom d'icône, choisi par le serveur d'après la collection. */
  glyphe: SeanceGlyphe;
  /** Un des quatre territoires de marque du design system. Chaque teinte porte un TERRITOIRE : les confondre change le sens, pas seulement la couleur. */
  territoire: SeanceTerritoire;
  /** LU, pas deviné : l'existence de `registrations/{uid}`. Un compteur dirait combien, jamais QUI — et c'est « qui » que l'écran affiche. */
  inscrite: boolean;
  /** « 8 / 12 places », ou RIEN. Les deux nombres ou aucun : une jauge à moitié relevée sur un atelier à douze places décide à la place de quelqu'un. */
  places?: string | null;
}

export interface CompteBloque {
  id: string;
  /** Un profil disparu est OMIS, jamais rendu « Membre inconnu » : une telle ligne dans une liste de blocage empêche de comprendre ce qu'on regarde. */
  nom: string;
  initiales: string;
}

/** La guideline App Store 1.2 demande de pouvoir bloquer. Elle n'exige pas de pouvoir débloquer — mais un geste irréversible pris dans un moment d'agacement, sur une plateforme où l'on se croise professionnellement, ne se répare plus. */
export interface Blocages {
  comptes: CompteBloque[];
}

/** ⚠️ NOMMÉE ICI : anonyme des deux côtés (`clubClassement.ts:87-93`). */
export interface ClassementLigne {
  rang: number;
  /** « Toi » plutôt que son propre nom : c'est ce que l'écran cherche du regard. L'uid ne sort jamais d'ici. */
  nom: string;
  /** Chaîne VIDE sur sa propre ligne, pas `null` : l'écran n'a pas d'initiales à dessiner à côté de « Toi ». */
  initiales: string;
  points: number;
  moi: boolean;
}

/** ⚠️ LE CLASSEMENT EST PAR VAGUE D'ARRIVÉE, JAMAIS ABSOLU. Un classement absolu mesurerait l'ancienneté, et quelqu'un qui arrive en novembre ne rattraperait jamais quelqu'un arrivé en février. La règle est appliquée au serveur, pas devinée à l'écran. */
export interface Classement {
  /** « Arrivées en septembre ». */
  vague: string;
  /** `null` quand la personne ne figure pas dans sa propre vague — un rang absent n'est pas un rang zéro. */
  rang?: number | null;
  surCombien: number;
  points: number;
  semaine: number;
  /** Coupé à 10 par le serveur. */
  lignes: ClassementLigne[];
}

export interface ClubMission {
  meta: string;
  titre: string;
  /** Un budget inventé fixe une attente de revenu chez quelqu'un qui organise son temps dessus. Absent tant qu'il n'est pas annoncé. */
  budget?: number | null;
  /** Constante du serveur : « Budget annoncé par la personne qui publie ». L'écran ne doit pas la réécrire. */
  note: string;
}

/** Un message du mur. ⚠️ MÊME FORME EXACTE que la sortie de `posterAuClub` — c'est délibéré : l'écran insère le message écrit sans relire la liste (contournement du défaut d'invalidation, voir `ecritures`). */
export interface ClubMessage {
  id: string;
  /** Un message sans auteur nommé n'est PAS rendu — mieux vaut un fil plus court qu'une ligne signée « undefined ». */
  auteur: string;
  initiales: string;
  /** ⚠️ PAS UNE UNION, ET C'EST MESURÉ. En LECTURE le serveur rend `asText(m.data.category) ?? 'Entraide'` (`clubFil.ts:104`) : la valeur vient de la base, elle est libre. En ÉCRITURE seule, `posterAuClub` la compare à quatre valeurs fermées — c'est là, et là seulement, que l'union existe. */
  categorie: string;
  /** « il y a 2 h », « hier ». Déjà mis en forme ; une date ISO ne se lit pas dans un fil. */
  quand?: string | null;
  texte: string;
  aime: number;
  republie: number;
  commente: number;
}

export interface ClubFil {
  mission?: ClubMission | null;
  /** Le serveur LIT 60 pour en rendre 40 : les messages des comptes bloqués sont retirés APRÈS la lecture, et lire 40 pour en rendre 35 ferait rétrécir le fil de quelqu'un qui bloque cinq comptes bavards — un filtre qui se lit comme une panne. */
  fil: ClubMessage[];
}

export interface Discussion {
  id: string;
  categorie: string;
  titre: string;
  auteur: string;
  initiales: string;
  quand?: string | null;
  reponses: number;
  resolu: boolean;
}

export interface Opportunite {
  id: string;
  /** Valeur libre de la base, défaut « Mission ». */
  type: string;
  titre: string;
  lieu?: string | null;
  quand?: string | null;
  budget?: number | null;
  par?: string | null;
}

/** ⛔ NI TÉLÉPHONE NI ADRESSE, JAMAIS. `club_profiles` peut les porter ; ils ne sortent pas d'ici (`clubListe.ts:26-29`). Un champ transmis « au cas où » finit toujours par s'afficher quelque part. */
export interface Membre {
  nom: string;
  initiales: string;
  metier?: string | null;
  ville?: string | null;
  /** « membre il y a 3 j ». Déjà mis en forme. */
  depuis?: string | null;
  presentation?: string | null;
  formations: string[];
  contributions: number;
  /** Pour que l'écran propose « Débloquer » plutôt que « Bloquer » : un bouton qui rebloque quelqu'un de déjà bloqué ne dit rien de son effet. */
  bloque: boolean;
  /** ⚠️ LA SEULE SORTIE D'UID DU PRODUIT, ASSUMÉE. Sans elle on ne peut ni bloquer ni débloquer depuis la fiche (`clubListe.ts:162-165`). Il ne s'agit plus d'un auteur croisé dans une liste, mais de la personne dont on regarde la fiche, à sa demande explicite. */
  id: string;
}

/** ⚠️ LE CODE SE CRÉE À LA PREMIÈRE LECTURE — une écriture dans une vue, délibérée : c'est ce que fait déjà le web, avec le MÊME format, pour que les deux plateformes délivrent le même code à la même personne. L'opération est idempotente. */
export interface Parrainage {
  code: string;
  /** Composé au SERVEUR pour qu'un changement de domaine ne laisse pas une version installée partager des liens morts pendant des mois. */
  lien: string;
  /** COMBIEN, jamais QUI. Un parrain n'a pas à connaître la liste de gens qu'on n'a pas prévenus qu'ils y figuraient. */
  filleuls: number;
}

/** ⚠️ NOMMÉE ICI, ET SES CINQ CLÉS SONT FIXES. Le port la typait `Record<string, number>` : un dictionnaire perd l'ordre d'affichage et rend les clés invérifiables. Les clés sont en français, avec accent et trait d'union — le générateur Kotlin leur adjoint donc un `@SerialName`. */
export interface ConsoleComptes {
  Messages: number;
  "Témoignages": number;
  "Rendez-vous": number;
  Prospects: number;
  Projets: number;
}

/** ⚠️ NOMMÉE ICI : anonyme des deux côtés (`console.ts:78-83`). Le PLUS ANCIEN non traité, pas le plus récent — une file de support se prend par le bout qui attend depuis le plus longtemps. */
export interface ConsoleProspect {
  titre: string;
  meta?: string | null;
  /** Constante du serveur : « à traiter ». */
  statut: string;
}

export interface Console {
  comptes: ConsoleComptes;
  prospect?: ConsoleProspect | null;
}

export interface Episode {
  titre: string;
  titreCourt: string;
  invitee?: string | null;
  eyebrow: string;
  chapo?: string | null;
  duree?: string | null;
  lien?: string | null;
  /** Durée et poids, DÉJÀ MIS EN FORME. Ce qui manque est ABSENT de la liste, jamais arrondi : sur un forfait compté, un poids inventé décide à la place de quelqu'un. */
  cout: string[];
  /** Texte brut, éventuellement en markdown. Le kit la dessinait en lignes horodatées (« 00:42 · … ») — une forme qu'aucun champ ne porte. L'écran la rend en paragraphes plutôt que d'inventer des minutages. */
  transcription?: string | null;
}

export interface Video {
  titre: string;
  eyebrow: string;
  lien?: string | null;
  cout: string[];
}

export interface Media {
  episode?: Episode | null;
  video?: Video | null;
}

/** ⚠️ NOMMÉE ICI : anonyme des deux côtés (`repetiteur.ts:64`). `utilise` et `total` sont ceux du SERVEUR, pas une soustraction faite au client : le plafond dépend du forfait, et un client qui le déduirait se tromperait au premier changement d'offre. */
export interface RepetiteurQuota {
  utilise: number;
  total: number;
}

/** ⚠️ NOMMÉE ICI : anonyme des deux côtés (`repetiteur.ts:66-73`). Chaque ligne est ce que le répétiteur a RETENU de quelqu'un — « tu vends des cosmétiques aux Almadies ». En inventer une seule serait dire à quelqu'un qu'on a retenu de lui une chose qu'il n'a jamais dite. */
export interface RepetiteurFait {
  id: string;
  fait: string;
  /** « depuis le 12 août ». Un fait sans date ne se conteste pas. */
  depuis?: string | null;
}

/** ⚠️ NOMMÉE ICI : anonyme des deux côtés (`repetiteur.ts:76-84`). L'ordre est INVERSÉ par le serveur : la requête descend pour prendre les plus récents, l'écran monte pour lire dans le sens d'une conversation. */
export interface RepetiteurEchange {
  id: string;
  /** ⛔ DEUX VOCABULAIRES POUR LE MÊME AXE, ET LE CONTRAT LES NOMME TOUS LES DEUX. La LECTURE parle `me`/`ai` (`repetiteur.ts:81`) ; l'ÉCRITURE `rysmo` parle `user`/`assistant`. Le port traduisait dans un écran ; sans contrat, la traduction se réinvente dans chaque plateforme. Voir `ecritures.rysmo.entree.conversationHistory` pour l'autre moitié. */
  de: RepetiteurEchangeDe;
  texte: string;
}

export interface Repetiteur {
  quota: RepetiteurQuota;
  memoire: RepetiteurFait[];
  echange: RepetiteurEchange[];
}

/** La note TELLE QU'ÉCRITE. Renvoyée plutôt qu'un accusé pour que l'écran l'insère sans relire la liste — voir `ecritures.ecrireUneNote.perime`. ⚠️ FORME DISTINCTE de `Note` : son champ `date` ne porte pas la même chose (voir `Note.date`). */
export interface NoteEcrite {
  id: string;
  texte: string;
  /** ⛔ LE LIBELLÉ DE LA LEÇON, pas une date. Contradiction du serveur, nommée dans `Note.date`. */
  date?: string | null;
  createdAt: string;
}

/** Ce que `marquerLecon` recalcule. Le pourcentage est DÉDUIT au serveur, jamais transmis : un `progress` envoyé par l'appelant serait un curseur qu'on lui tend — il n'aurait qu'à écrire 100 pour obtenir son certificat. */
export interface BilanLecon {
  progression: number;
  leconsFaites: number;
  lecons: number;
  /** L'écran a besoin de SAVOIR si le certificat est atteignable, pas de le décider. */
  complete: boolean;
  titre?: string | null;
}

export interface NoteEnveloppe {
  note: NoteEcrite;
}

export interface MessageEnveloppe {
  message: ClubMessage;
}

export interface Inscription {
  inscrite: boolean;
}

export interface AccuseSignalement {
  recu: boolean;
}

export interface BilanBlocage {
  bloque: boolean;
  /** Plafonné à 200 par le serveur, qui lève `resource-exhausted` au-delà. */
  combien: number;
}

/** ⚠️ IDEMPOTENT : `cree` vaut `false` quand le profil existait déjà, et ce n'est PAS une erreur. */
export interface ProfilCree {
  cree: boolean;
  uid: string;
}

export interface Succes {
  success: boolean;
}

/* ── Les formes d'entrée ──────────────────────────────────────────── */
/** ⚠️ ON DÉSIGNE UN CONTENU, PAS UNE PERSONNE — sauf pour `membre`. Le serveur résout l'auteur : l'uid ne circule pas depuis une liste. */
export interface CibleBlocage {
  type: CibleBlocageType;
  /** Refusé s'il contient un `/` : ce n'est jamais un chemin de collection. */
  id: string;
}

/* ── Les vues ─────────────────────────────────────────────────────── */
export type NomDeVue =
  | "appMoi"
  | "appEspace"
  | "appCours"
  | "appFormation"
  | "appLecon"
  | "appNotes"
  | "appCertificats"
  | "appVerifierCertificat"
  | "appClub"
  | "appClubAgenda"
  | "appClubBlocages"
  | "appClubClassement"
  | "appClubFil"
  | "appClubListe.discussions"
  | "appClubListe.opportunites"
  | "appClubListe.membre"
  | "appClubParrainage"
  | "appConsole"
  | "appMedia"
  | "appRepetiteur";

/** La charge utile de chaque vue, sans son enveloppe. */
export interface FormeDeVue {
  appMoi: Moi;
  appEspace: Espace;
  appCours: Cours[];
  appFormation: Formation;
  appLecon: Lecon;
  appNotes: Notes;
  appCertificats: Certificats;
  appVerifierCertificat: CertificatPublic;
  appClub: Club;
  appClubAgenda: Seance[];
  appClubBlocages: Blocages;
  appClubClassement: Classement;
  appClubFil: ClubFil;
  "appClubListe.discussions": Discussion[];
  "appClubListe.opportunites": Opportunite[];
  "appClubListe.membre": Membre;
  appClubParrainage: Parrainage;
  appConsole: Console;
  appMedia: Media;
  appRepetiteur: Repetiteur;
}

export type Vue<N extends NomDeVue> = FormeDeVue[N];

/**
 * CE QUE `vue: null` SIGNIFIE, PAR VUE — la nuance que le port aplatissait.
 *
 * Le port ramenait les trois sens à une seule phase `vide`. Le commentaire de `useClub`
 * énonçait pourtant la différence — « elle décide de ce qu'on lit après avoir laissé
 * expirer son accès » — mais rien dans le protocole ne la portait. Elle est ici, en
 * donnée, et le client en tire trois écrans distincts.
 */
export interface VueNulleDe {
  appMoi: "sansDonnee";
  appEspace: "sansDonnee";
  appCours: "jamais";
  appFormation: "sansDonnee";
  appLecon: "sansDonnee";
  appNotes: "jamais";
  appCertificats: "jamais";
  appVerifierCertificat: "sansDonnee";
  appClub: "sansAcces";
  appClubAgenda: "sansAcces";
  appClubBlocages: "sansAcces";
  appClubClassement: "sansAcces";
  appClubFil: "sansAcces";
  "appClubListe.discussions": "sansAcces";
  "appClubListe.opportunites": "sansAcces";
  "appClubListe.membre": "sansAcces";
  appClubParrainage: "sansAcces";
  appConsole: "jamais";
  appMedia: "jamais";
  appRepetiteur: "jamais";
}

/**
 * ⭐ LES VUES SERVIES SANS JETON — `session: "aucune"` dans le contrat.
 *
 * Une seule à ce jour, et c'est voulu : `appVerifierCertificat`. Un certificat se vérifie
 * par quelqu'un qui n'a pas de compte, sinon il ne prouve rien. Toutes les autres vues
 * sont personnelles et appellent `requireAuth`.
 *
 * ⚠️ CETTE LISTE EST LA SOURCE DE L'EXEMPTION, pas un commentaire sur elle.
 * `tests/unit/worker-vues-natives.test.ts` en dérive les handlers dispensés de
 * `requireAuth` : un handler qu'on oublierait d'authentifier sans l'avoir déclaré ici
 * reste refusé par la porte.
 */
export const VUES_SANS_SESSION: readonly NomDeVue[] = ["appVerifierCertificat"] as const;

/**
 * L'ENVELOPPE, et la seule chose que les 19 formes de réponse ont en commun.
 *
 * ⚠️ DEUX NIVEAUX DE DÉBALLAGE, PAS UN. Le protocole `onCall` écrit `{"result": …}` ;
 * la charge utile d'une vue porte `{vue, releveA}`. Le corps complet est donc
 * `{"result":{"vue":…,"releveA":…}}`.
 *
 * `vue` est NON NULLABLE pour les vues dont le contrat dit `vueNulle: "jamais"` : c'est
 * le compilateur qui refuse alors qu'un handler y rende `null`.
 */
export type Reponse<N extends NomDeVue> = {
  vue: VueNulleDe[N] extends 'jamais' ? Vue<N> : Vue<N> | null;
  releveA: string;
};

/**
 * appClubListe s'ouvre en 3 selon son paramètre `onglet` : le serveur sert
 * 3 formes de réponse derrière UN nom de callable.
 */
export type ReponseAppClubListe =
  | Reponse<"appClubListe.discussions">
  | Reponse<"appClubListe.opportunites">
  | Reponse<"appClubListe.membre">;

/* ── Les écritures ────────────────────────────────────────────────── */
export type NomDEcriture =
  | "ecrireUneNote"
  | "marquerLecon"
  | "posterAuClub"
  | "reserverSession"
  | "signalerMembre"
  | "bloquerMembre"
  | "creerMonProfil"
  | "clearRysmoMemory";

export interface SortieDEcriture {
  ecrireUneNote: NoteEnveloppe;
  marquerLecon: BilanLecon;
  posterAuClub: MessageEnveloppe;
  reserverSession: Inscription;
  signalerMembre: AccuseSignalement;
  bloquerMembre: BilanBlocage;
  creerMonProfil: ProfilCree;
  clearRysmoMemory: Succes;
}

export type Sortie<N extends NomDEcriture> = SortieDEcriture[N];

/**
 * CE QUE CHAQUE ÉCRITURE PÉRIME — le défaut du port, rendu en donnée générée.
 *
 * ⛔ Le cache de 30 s n'avait AUCUNE invalidation par l'écriture. `marquerLecon` rendait
 * une progression recalculée, et rien n'évinçait `appEspace`, `appLecon` ni `appCours` :
 * pendant trente secondes, revenir sur l'onglet d'à côté montrait l'état d'avant.
 * C'est POUR CELA que `ecrireUneNote` et `posterAuClub` renvoient l'objet écrit — un
 * contournement qui marche pour l'écran actif, pas pour le voisin.
 */
export const VUES_PERIMEES: Readonly<Record<NomDEcriture, readonly NomDeVue[]>> = {
  ecrireUneNote: ["appNotes"],
  marquerLecon: ["appEspace", "appLecon", "appCours", "appCertificats"],
  posterAuClub: ["appClubFil"],
  reserverSession: ["appClubAgenda"],
  signalerMembre: [],
  bloquerMembre: ["appClubBlocages", "appClubFil", "appClubListe.discussions", "appClubListe.opportunites", "appClubListe.membre"],
  creerMonProfil: ["appMoi"],
  clearRysmoMemory: ["appRepetiteur"],
} as const;
