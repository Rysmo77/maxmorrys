/*
 * ⛔ FICHIER GÉNÉRÉ PAR `npm run vues:gen` — NE PAS ÉDITER.
 *
 * La source est `worker/apps/api/src/vues/vues.contrat.json`, seul artefact de cette couche
 * écrit à la main. Kotlin et Swift ne sont écrits ni l'un ni l'autre à la main : c'est ce qui
 * rend leur dérive IMPOSSIBLE, et pas seulement improbable.
 */

package me.maxmorrys.rysmo.donnees

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

/* ── Les ensembles fermés ─────────────────────────────────────────── */

/**
 * Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans
 * ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.
 */
@Serializable(with = MoiRole.Serialiseur::class)
enum class MoiRole(val jeton: String) {
    STUDENT("student"),
    ADMIN("admin"),
    SUPPORT("support"),

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<MoiRole> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.MoiRole", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): MoiRole {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: MoiRole) {
            encoder.encodeString(value.jeton)
        }
    }
}

/**
 * Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans
 * ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.
 */
@Serializable(with = LeconLigneEtat.Serialiseur::class)
enum class LeconLigneEtat(val jeton: String) {
    DONE("done"),
    CURRENT("current"),
    TODO("todo"),

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<LeconLigneEtat> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.LeconLigneEtat", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): LeconLigneEtat {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: LeconLigneEtat) {
            encoder.encodeString(value.jeton)
        }
    }
}

/**
 * Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans
 * ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.
 */
@Serializable(with = SeanceCollection.Serialiseur::class)
enum class SeanceCollection(val jeton: String) {
    CLUB_SESSIONS("club_sessions"),
    CLUB_EVENTS("club_events"),

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<SeanceCollection> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.SeanceCollection", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): SeanceCollection {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: SeanceCollection) {
            encoder.encodeString(value.jeton)
        }
    }
}

/**
 * Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans
 * ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.
 */
@Serializable(with = SeanceGlyphe.Serialiseur::class)
enum class SeanceGlyphe(val jeton: String) {
    CHAT("chat"),
    USERS("users"),

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<SeanceGlyphe> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.SeanceGlyphe", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): SeanceGlyphe {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: SeanceGlyphe) {
            encoder.encodeString(value.jeton)
        }
    }
}

/**
 * Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans
 * ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.
 */
@Serializable(with = SeanceTerritoire.Serialiseur::class)
enum class SeanceTerritoire(val jeton: String) {
    TRANSFORME("transforme"),
    DIGITALISE("digitalise"),

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<SeanceTerritoire> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.SeanceTerritoire", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): SeanceTerritoire {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: SeanceTerritoire) {
            encoder.encodeString(value.jeton)
        }
    }
}

/**
 * Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans
 * ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.
 */
@Serializable(with = RepetiteurEchangeDe.Serialiseur::class)
enum class RepetiteurEchangeDe(val jeton: String) {
    ME("me"),
    AI("ai"),

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<RepetiteurEchangeDe> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.RepetiteurEchangeDe", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): RepetiteurEchangeDe {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: RepetiteurEchangeDe) {
            encoder.encodeString(value.jeton)
        }
    }
}

/**
 * Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans
 * ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.
 */
@Serializable(with = CibleBlocageType.Serialiseur::class)
enum class CibleBlocageType(val jeton: String) {
    MEMBRE("membre"),
    MESSAGE("message"),
    DISCUSSION("discussion"),
    OPPORTUNITE("opportunite"),

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<CibleBlocageType> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.CibleBlocageType", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): CibleBlocageType {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: CibleBlocageType) {
            encoder.encodeString(value.jeton)
        }
    }
}

/**
 * Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans
 * ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.
 */
@Serializable(with = PosterAuClubCategorie.Serialiseur::class)
enum class PosterAuClubCategorie(val jeton: String) {
    ENTRAIDE("Entraide"),
    OUTILS("Outils"),
    VICTOIRES("Victoires"),
    QUESTIONS("Questions"),

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<PosterAuClubCategorie> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.PosterAuClubCategorie", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): PosterAuClubCategorie {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: PosterAuClubCategorie) {
            encoder.encodeString(value.jeton)
        }
    }
}

/* ── Les formes servies ───────────────────────────────────────────── */

/**
 * Qui regarde. L'initiale est CALCULÉE côté serveur, jamais stockée : un nom qui change doit la
 * changer.
 */
@Serializable
data class Moi(
    val prenom: String,
    val nom: String,
    val initiale: String,
    val email: String? = null,
    /** « 12 août » — DÉJÀ MIS EN FORME, pas une date à reformater. L'année est omise volontairement. */
    val ouvertureCompte: String? = null,
    /**
     * Le nom du répétiteur vit dans le profil, pas sur l'appareil : un stockage local en ferait une
     * seconde source de vérité.
     */
    val tuteur: String? = null,
    /**
     * ⚠️ ENSEMBLE FERMÉ CÔTÉ PRODUIT, OUVERT CÔTÉ SERVEUR. `moi.ts:57` rend
     * `asText(document.data.role) ?? 'student'` : la valeur vient de la BASE, donc le serveur peut
     * légitimement émettre n'importe quelle chaîne. Le client porte l'énumération plus son cas
     * `inconnu` ; le TypeScript reste ouvert, sinon le compilateur exigerait du handler une garantie
     * que son code ne donne pas — et la seule façon de la lui donner serait de NORMALISER la valeur,
     * c'est-à-dire de changer la réponse servie.
     */
    val role: MoiRole,
    val xp: Int,
)

/**
 * La reprise — ce que l'accueil propose de rouvrir. N'existe dans AUCUN document : c'est une
 * jointure `enrollments` × `formations` plus deux calculs de dates.
 */
@Serializable
data class Espace(
    val slug: String,
    val titre: String,
    /**
     * Premier segment avant « pour », « : » ou un tiret cadratin. L'écran a deux lignes ; un titre
     * complet y déborde.
     */
    val titreCourt: String,
    /** Chaîne d'affichage déjà jointe par ` · `. Ne pas la redécouper. */
    val meta: String,
    val lecons: Int,
    val leconsFaites: Int,
    /** Pourcentage 0-100, borné et arrondi par `marquerLecon`. */
    val progression: Int,
    /** « Tu t'es arrêtée il y a 8 jours ». Une phrase, pas une durée. */
    val arret: String? = null,
    /**
     * ⚠️ `asText()` rend `undefined`, que `JSON.stringify` OMET : la clé est absente du corps, elle ne
     * vaut pas `null`. C'est pourquoi tout champ nullable se génère aussi FACULTATIF des deux côtés.
     */
    val moduleEnCours: String? = null,
    /** Même absence possible que `moduleEnCours`. */
    val leconEnCours: String? = null,
)

/**
 * Une ligne du catalogue. ⛔ AUCUN PRIX N'EN SORT, et ce n'est pas un oubli : un catalogue qui
 * affiche des montants EST une vitrine. `formations` porte un `price` ; il s'arrête au serveur.
 */
@Serializable
data class Cours(
    val id: String,
    val slug: String,
    val titre: String,
    val titreCourt: String,
    val meta: String,
    /**
     * Le niveau descend comme une DONNÉE, à côté de sa mise en forme dans `meta` : sur une chaîne
     * d'affichage on ne peut ni compter ni filtrer.
     */
    val niveau: String? = null,
    /** Calculé depuis les inscriptions de la personne, jamais depuis un paramètre. */
    val acquise: Boolean,
)

/** Un module dans la fiche d'une formation. */
@Serializable
data class ModuleFiche(
    val titre: String,
    /**
     * « module 2 · 5 leçons · 54 min ». Le temps MANQUE quand une seule durée du module ne se laisse
     * pas lire — un total amputé se lirait comme une mesure.
     */
    val meta: String,
    /**
     * Vrai si le module contient au moins une leçon `isFree`. On ne suppose PAS que c'est le premier :
     * c'est l'administration qui décide.
     */
    val ouvert: Boolean,
)

@Serializable
data class Formation(
    val titre: String,
    val titreCourt: String,
    val meta: String,
    val lecons: Int,
    val modules: List<ModuleFiche>,
)

/** Une ligne du programme du module en cours. */
@Serializable
data class LeconLigne(
    val id: String,
    val titre: String,
    /**
     * ⚠️ NI DURÉE NI POIDS INVENTÉS. Sur ce marché un forfait est compté : le poids en mégaoctets
     * décide de charger maintenant ou d'attendre le Wi-Fi. Le champ est ABSENT quand la base ne l'a
     * pas.
     */
    val meta: String? = null,
    /** Le seul ensemble fermé que le port React Native avait conservé. */
    val etat: LeconLigneEtat,
    val doc: Boolean,
)

@Serializable
data class Lecon(
    val moduleTitre: String? = null,
    val programme: List<LeconLigne>,
)

/**
 * ⚠️ NOMMÉE ICI : elle était anonyme des deux côtés (`notes.ts:51`, inline dans `VueNotes`). « 14
 * notes · 6 leçons » ne dit pas la même chose que « 14 notes » — le second nombre compte les
 * leçons DISTINCTES annotées.
 */
@Serializable
data class NotesTotal(
    val notes: Int,
    val lecons: Int,
)

@Serializable
data class Note(
    val id: String,
    val texte: String,
    /**
     * ⛔ DEUX FORMES POUR UN MÊME NOM, ET C'EST UNE CONTRADICTION DU SERVEUR. `appNotes` compose «
     * 04/09 · 21:14 · <leçon> » (`notes.ts:58-60`) ; `ecrireUneNote` rend `asText(lessonLabel) ??
     * null` (`ecrireUneNote.ts:67`), c'est-à-dire LE LIBELLÉ DE LA LEÇON, pas une date. La trancher
     * est une modification du Worker, donc hors du périmètre de ce lot : le contrat la NOMME, il ne la
     * corrige pas. C'est pourquoi l'écriture porte sa propre forme `NoteEcrite` plutôt que de
     * réutiliser `Note`.
     */
    val date: String? = null,
)

@Serializable
data class Notes(
    val total: NotesTotal,
    val notes: List<Note>,
)

/**
 * ⚠️ Un certificat est un document OPPOSABLE : quatre champs solidaires — titulaire, formation,
 * date, code. Le serveur ne rend que les jeux COMPLETS ; un jeu partiel produirait un document au
 * nom de quelqu'un avec le code d'un autre.
 */
@Serializable
data class Certificat(
    val code: String,
    val titulaire: String,
    val formation: String,
    /** Chaîne ISO brute de `issuedAt`, PAS mise en forme — contrairement à `Moi.ouvertureCompte`. */
    val emisLe: String,
    /**
     * 0 = « non relevé » pour l'écran, qui le rend par `Num`. Les certificats émis avant le correctif
     * du champ `certificateCode` n'ont pas ce compte, et il ne s'invente pas.
     */
    val lecons: Int,
)

@Serializable
data class Certificats(
    /**
     * Chaîne ISO brute. Elle est là pour DATER LE ZÉRO : « zéro certificat depuis l'ouverture de ton
     * compte » se lit, « — » ne se lit pas.
     */
    val ouvertureCompte: String? = null,
    val certificats: List<Certificat>,
    /**
     * Non montré à la personne : il part en trace. Un certificat amputé côté base est un défaut de
     * données, pas un vide légitime.
     */
    val incomplets: Int,
)

/** ⚠️ NOMMÉE ICI parce qu'elle était anonyme des deux côtés (`club.ts:90-94`). Voir `n`. */
@Serializable
data class ClubBilanTuile(
    /**
     * ⛔ NON NULLABLE, CONTRE LE COMMENTAIRE DE `club.ts:88-89`. Celui-ci affirme « Un `null` y reste
     * `null` : trois tuiles qui affichent “non relevé” valent mieux qu'un zéro qu'on n'a pas mesuré. »
     * LE CODE NE PEUT PAS LE TENIR : `count(...).catch(() => 0)` (`club.ts:63, 68`) et `toNumber(...,
     * 0)` (`:93`) servent une agrégation REFUSÉE comme un zéro MESURÉ. Même motif dans
     * `console.ts:49`. Le contrat dit la vérité du code, pas celle du commentaire ; faire passer
     * `.catch(() => 0)` à `.catch(() => null)` est une décision produit, et elle n'a pas eu lieu.
     */
    val n: Int,
    val l: String,
)

@Serializable
data class Club(
    /** JJ/MM/AAAA, déjà mis en forme. */
    val echeance: String? = null,
    /** Nom du mois, en français, en minuscule. */
    val depuis: String? = null,
    val bilan: List<ClubBilanTuile>,
)

/**
 * Une séance de l'agenda. `club_sessions` (les directs) et `club_events` (les ateliers) ont la
 * même forme à l'écran et des règles distinctes en base : la fusion et le tri vivent au serveur,
 * sinon ils se referaient dans chaque client.
 */
@Serializable
data class Seance(
    val id: String,
    /**
     * ⚠️ CE JETON REPART AU SERVEUR. `reserverSession` le reçoit et le revalide contre la même liste
     * fermée (`reserverSession.ts:42`). Le typer `texte` des deux côtés — ce que faisait le port —
     * laissait un aller-retour de jeton non vérifié par le compilateur.
     */
    val collection: SeanceCollection,
    /** « Mardi 9 septembre ». Déjà mis en forme. */
    val jour: String? = null,
    /** Une séance sans titre n'est pas rendue. */
    val titre: String,
    val horaire: String? = null,
    /** Nom d'icône, choisi par le serveur d'après la collection. */
    val glyphe: SeanceGlyphe,
    /**
     * Un des quatre territoires de marque du design system. Chaque teinte porte un TERRITOIRE : les
     * confondre change le sens, pas seulement la couleur.
     */
    val territoire: SeanceTerritoire,
    /**
     * LU, pas deviné : l'existence de `registrations/{uid}`. Un compteur dirait combien, jamais QUI —
     * et c'est « qui » que l'écran affiche.
     */
    val inscrite: Boolean,
    /**
     * « 8 / 12 places », ou RIEN. Les deux nombres ou aucun : une jauge à moitié relevée sur un
     * atelier à douze places décide à la place de quelqu'un.
     */
    val places: String? = null,
)

@Serializable
data class CompteBloque(
    val id: String,
    /**
     * Un profil disparu est OMIS, jamais rendu « Membre inconnu » : une telle ligne dans une liste de
     * blocage empêche de comprendre ce qu'on regarde.
     */
    val nom: String,
    val initiales: String,
)

/**
 * La guideline App Store 1.2 demande de pouvoir bloquer. Elle n'exige pas de pouvoir débloquer —
 * mais un geste irréversible pris dans un moment d'agacement, sur une plateforme où l'on se croise
 * professionnellement, ne se répare plus.
 */
@Serializable
data class Blocages(
    val comptes: List<CompteBloque>,
)

/** ⚠️ NOMMÉE ICI : anonyme des deux côtés (`clubClassement.ts:87-93`). */
@Serializable
data class ClassementLigne(
    val rang: Int,
    /**
     * « Toi » plutôt que son propre nom : c'est ce que l'écran cherche du regard. L'uid ne sort jamais
     * d'ici.
     */
    val nom: String,
    /**
     * Chaîne VIDE sur sa propre ligne, pas `null` : l'écran n'a pas d'initiales à dessiner à côté de «
     * Toi ».
     */
    val initiales: String,
    val points: Int,
    val moi: Boolean,
)

/**
 * ⚠️ LE CLASSEMENT EST PAR VAGUE D'ARRIVÉE, JAMAIS ABSOLU. Un classement absolu mesurerait
 * l'ancienneté, et quelqu'un qui arrive en novembre ne rattraperait jamais quelqu'un arrivé en
 * février. La règle est appliquée au serveur, pas devinée à l'écran.
 */
@Serializable
data class Classement(
    /** « Arrivées en septembre ». */
    val vague: String,
    /**
     * `null` quand la personne ne figure pas dans sa propre vague — un rang absent n'est pas un rang
     * zéro.
     */
    val rang: Int? = null,
    val surCombien: Int,
    val points: Int,
    val semaine: Int,
    /** Coupé à 10 par le serveur. */
    val lignes: List<ClassementLigne>,
)

@Serializable
data class ClubMission(
    val meta: String,
    val titre: String,
    /**
     * Un budget inventé fixe une attente de revenu chez quelqu'un qui organise son temps dessus.
     * Absent tant qu'il n'est pas annoncé.
     */
    val budget: Double? = null,
    /**
     * Constante du serveur : « Budget annoncé par la personne qui publie ». L'écran ne doit pas la
     * réécrire.
     */
    val note: String,
)

/**
 * Un message du mur. ⚠️ MÊME FORME EXACTE que la sortie de `posterAuClub` — c'est délibéré :
 * l'écran insère le message écrit sans relire la liste (contournement du défaut d'invalidation,
 * voir `ecritures`).
 */
@Serializable
data class ClubMessage(
    val id: String,
    /**
     * Un message sans auteur nommé n'est PAS rendu — mieux vaut un fil plus court qu'une ligne signée
     * « undefined ».
     */
    val auteur: String,
    val initiales: String,
    /**
     * ⚠️ PAS UNE UNION, ET C'EST MESURÉ. En LECTURE le serveur rend `asText(m.data.category) ??
     * 'Entraide'` (`clubFil.ts:104`) : la valeur vient de la base, elle est libre. En ÉCRITURE seule,
     * `posterAuClub` la compare à quatre valeurs fermées — c'est là, et là seulement, que l'union
     * existe.
     */
    val categorie: String,
    /** « il y a 2 h », « hier ». Déjà mis en forme ; une date ISO ne se lit pas dans un fil. */
    val quand: String? = null,
    val texte: String,
    val aime: Int,
    val republie: Int,
    val commente: Int,
)

@Serializable
data class ClubFil(
    val mission: ClubMission? = null,
    /**
     * Le serveur LIT 60 pour en rendre 40 : les messages des comptes bloqués sont retirés APRÈS la
     * lecture, et lire 40 pour en rendre 35 ferait rétrécir le fil de quelqu'un qui bloque cinq
     * comptes bavards — un filtre qui se lit comme une panne.
     */
    val fil: List<ClubMessage>,
)

@Serializable
data class Discussion(
    val id: String,
    val categorie: String,
    val titre: String,
    val auteur: String,
    val initiales: String,
    val quand: String? = null,
    val reponses: Int,
    val resolu: Boolean,
)

@Serializable
data class Opportunite(
    val id: String,
    /** Valeur libre de la base, défaut « Mission ». */
    val type: String,
    val titre: String,
    val lieu: String? = null,
    val quand: String? = null,
    val budget: Double? = null,
    val par: String? = null,
)

/**
 * ⛔ NI TÉLÉPHONE NI ADRESSE, JAMAIS. `club_profiles` peut les porter ; ils ne sortent pas d'ici
 * (`clubListe.ts:26-29`). Un champ transmis « au cas où » finit toujours par s'afficher quelque
 * part.
 */
@Serializable
data class Membre(
    val nom: String,
    val initiales: String,
    val metier: String? = null,
    val ville: String? = null,
    /** « membre il y a 3 j ». Déjà mis en forme. */
    val depuis: String? = null,
    val presentation: String? = null,
    val formations: List<String>,
    val contributions: Int,
    /**
     * Pour que l'écran propose « Débloquer » plutôt que « Bloquer » : un bouton qui rebloque quelqu'un
     * de déjà bloqué ne dit rien de son effet.
     */
    val bloque: Boolean,
    /**
     * ⚠️ LA SEULE SORTIE D'UID DU PRODUIT, ASSUMÉE. Sans elle on ne peut ni bloquer ni débloquer
     * depuis la fiche (`clubListe.ts:162-165`). Il ne s'agit plus d'un auteur croisé dans une liste,
     * mais de la personne dont on regarde la fiche, à sa demande explicite.
     */
    val id: String,
)

/**
 * ⚠️ LE CODE SE CRÉE À LA PREMIÈRE LECTURE — une écriture dans une vue, délibérée : c'est ce que
 * fait déjà le web, avec le MÊME format, pour que les deux plateformes délivrent le même code à la
 * même personne. L'opération est idempotente.
 */
@Serializable
data class Parrainage(
    val code: String,
    /**
     * Composé au SERVEUR pour qu'un changement de domaine ne laisse pas une version installée partager
     * des liens morts pendant des mois.
     */
    val lien: String,
    /**
     * COMBIEN, jamais QUI. Un parrain n'a pas à connaître la liste de gens qu'on n'a pas prévenus
     * qu'ils y figuraient.
     */
    val filleuls: Int,
)

/**
 * ⚠️ NOMMÉE ICI, ET SES CINQ CLÉS SONT FIXES. Le port la typait `Record<string, number>` : un
 * dictionnaire perd l'ordre d'affichage et rend les clés invérifiables. Les clés sont en français,
 * avec accent et trait d'union — le générateur Kotlin leur adjoint donc un `@SerialName`.
 */
@Serializable
data class ConsoleComptes(
    @SerialName("Messages")
    val messages: Int,
    @SerialName("Témoignages")
    val temoignages: Int,
    @SerialName("Rendez-vous")
    val rendezVous: Int,
    @SerialName("Prospects")
    val prospects: Int,
    @SerialName("Projets")
    val projets: Int,
)

/**
 * ⚠️ NOMMÉE ICI : anonyme des deux côtés (`console.ts:78-83`). Le PLUS ANCIEN non traité, pas le
 * plus récent — une file de support se prend par le bout qui attend depuis le plus longtemps.
 */
@Serializable
data class ConsoleProspect(
    val titre: String,
    val meta: String? = null,
    /** Constante du serveur : « à traiter ». */
    val statut: String,
)

@Serializable
data class Console(
    val comptes: ConsoleComptes,
    val prospect: ConsoleProspect? = null,
)

@Serializable
data class Episode(
    val titre: String,
    val titreCourt: String,
    val invitee: String? = null,
    val eyebrow: String,
    val chapo: String? = null,
    val duree: String? = null,
    val lien: String? = null,
    /**
     * Durée et poids, DÉJÀ MIS EN FORME. Ce qui manque est ABSENT de la liste, jamais arrondi : sur un
     * forfait compté, un poids inventé décide à la place de quelqu'un.
     */
    val cout: List<String>,
    /**
     * Texte brut, éventuellement en markdown. Le kit la dessinait en lignes horodatées (« 00:42 · … »)
     * — une forme qu'aucun champ ne porte. L'écran la rend en paragraphes plutôt que d'inventer des
     * minutages.
     */
    val transcription: String? = null,
)

@Serializable
data class Video(
    val titre: String,
    val eyebrow: String,
    val lien: String? = null,
    val cout: List<String>,
)

@Serializable
data class Media(
    val episode: Episode? = null,
    val video: Video? = null,
)

/**
 * ⚠️ NOMMÉE ICI : anonyme des deux côtés (`repetiteur.ts:64`). `utilise` et `total` sont ceux du
 * SERVEUR, pas une soustraction faite au client : le plafond dépend du forfait, et un client qui
 * le déduirait se tromperait au premier changement d'offre.
 */
@Serializable
data class RepetiteurQuota(
    val utilise: Int,
    val total: Int,
)

/**
 * ⚠️ NOMMÉE ICI : anonyme des deux côtés (`repetiteur.ts:66-73`). Chaque ligne est ce que le
 * répétiteur a RETENU de quelqu'un — « tu vends des cosmétiques aux Almadies ». En inventer une
 * seule serait dire à quelqu'un qu'on a retenu de lui une chose qu'il n'a jamais dite.
 */
@Serializable
data class RepetiteurFait(
    val id: String,
    val fait: String,
    /** « depuis le 12 août ». Un fait sans date ne se conteste pas. */
    val depuis: String? = null,
)

/**
 * ⚠️ NOMMÉE ICI : anonyme des deux côtés (`repetiteur.ts:76-84`). L'ordre est INVERSÉ par le
 * serveur : la requête descend pour prendre les plus récents, l'écran monte pour lire dans le sens
 * d'une conversation.
 */
@Serializable
data class RepetiteurEchange(
    val id: String,
    /**
     * ⛔ DEUX VOCABULAIRES POUR LE MÊME AXE, ET LE CONTRAT LES NOMME TOUS LES DEUX. La LECTURE parle
     * `me`/`ai` (`repetiteur.ts:81`) ; l'ÉCRITURE `rysmo` parle `user`/`assistant`. Le port traduisait
     * dans un écran ; sans contrat, la traduction se réinvente dans chaque plateforme. Voir
     * `ecritures.rysmo.entree.conversationHistory` pour l'autre moitié.
     */
    val de: RepetiteurEchangeDe,
    val texte: String,
)

@Serializable
data class Repetiteur(
    val quota: RepetiteurQuota,
    val memoire: List<RepetiteurFait>,
    val echange: List<RepetiteurEchange>,
)

/**
 * La note TELLE QU'ÉCRITE. Renvoyée plutôt qu'un accusé pour que l'écran l'insère sans relire la
 * liste — voir `ecritures.ecrireUneNote.perime`. ⚠️ FORME DISTINCTE de `Note` : son champ `date`
 * ne porte pas la même chose (voir `Note.date`).
 */
@Serializable
data class NoteEcrite(
    val id: String,
    val texte: String,
    /** ⛔ LE LIBELLÉ DE LA LEÇON, pas une date. Contradiction du serveur, nommée dans `Note.date`. */
    val date: String? = null,
    val createdAt: String,
)

/**
 * Ce que `marquerLecon` recalcule. Le pourcentage est DÉDUIT au serveur, jamais transmis : un
 * `progress` envoyé par l'appelant serait un curseur qu'on lui tend — il n'aurait qu'à écrire 100
 * pour obtenir son certificat.
 */
@Serializable
data class BilanLecon(
    val progression: Int,
    val leconsFaites: Int,
    val lecons: Int,
    /** L'écran a besoin de SAVOIR si le certificat est atteignable, pas de le décider. */
    val complete: Boolean,
    val titre: String? = null,
)

@Serializable
data class NoteEnveloppe(
    val note: NoteEcrite,
)

@Serializable
data class MessageEnveloppe(
    val message: ClubMessage,
)

@Serializable
data class Inscription(
    val inscrite: Boolean,
)

@Serializable
data class AccuseSignalement(
    val recu: Boolean,
)

@Serializable
data class BilanBlocage(
    val bloque: Boolean,
    /** Plafonné à 200 par le serveur, qui lève `resource-exhausted` au-delà. */
    val combien: Int,
)

/** ⚠️ IDEMPOTENT : `cree` vaut `false` quand le profil existait déjà, et ce n'est PAS une erreur. */
@Serializable
data class ProfilCree(
    val cree: Boolean,
    val uid: String,
)

@Serializable
data class Succes(
    val success: Boolean,
)

/* ── Les formes d'entrée ──────────────────────────────────────────── */

/**
 * ⚠️ ON DÉSIGNE UN CONTENU, PAS UNE PERSONNE — sauf pour `membre`. Le serveur résout l'auteur :
 * l'uid ne circule pas depuis une liste.
 */
@Serializable
data class CibleBlocage(
    val type: CibleBlocageType,
    /** Refusé s'il contient un `/` : ce n'est jamais un chemin de collection. */
    val id: String,
)

/**
 * L'enveloppe commune aux 19 formes de réponse. ⚠️ DEUX NIVEAUX DE DÉBALLAGE, PAS UN : le
 * protocole onCall écrit {"result": …}, et la charge d'une vue porte {vue, releveA}. `releveA` est
 * l'estampille DU SERVEUR ; c'est elle qui date les nombres à l'écran, et elle ne doit jamais être
 * remplacée par l'horloge du téléphone.
 */
@Serializable
data class Reponse<T>(
    val vue: T? = null,
    val releveA: String,
)

/**
 * Les TROIS sens de `vue: null`, que le port aplatissait en une seule phase `vide`. Le serveur
 * choisit délibérément `vue: null` plutôt que `permission-denied` pour le Club, et
 * `permission-denied` pour la console : cette asymétrie est un choix produit, et elle est ici en
 * donnée plutôt qu'en connaissance orale.
 */
enum class SensDuVide {
    /** Le serveur ne rend jamais `null` sur cette vue. Un vide y est un vide de contenu. */
    JAMAIS,

    /** « Le Club est réservé aux membres. » Une invitation, pas une porte. */
    SANS_ACCES,

    /** « Tu n'as encore rien ici. » */
    SANS_DONNEE,
}

/**
 * ⭐ LES NOMS DE CALLABLES, À UN SEUL ENDROIT — et c'est ce qui rebranche une porte de CI.
 * `tests/unit/worker-routage-callables.test.ts` vérifie que toute callable appelée par le natif
 * est bien servie par le Worker ; sans ces littéraux repérables, elle passait au vert sur un
 * dossier vide. Un nom absent de MIGRATED n'échoue pas franchement : il part au relais mort et
 * reçoit la page HTML 404 de Google, ce qui se lit comme une panne de réseau. C'est ce défaut-là
 * qui a empêché tout abonnement au Club.
 */
object Callables {
    const val APP_MOI = "appMoi"
    const val APP_ESPACE = "appEspace"
    const val APP_COURS = "appCours"
    const val APP_FORMATION = "appFormation"
    const val APP_LECON = "appLecon"
    const val APP_NOTES = "appNotes"
    const val APP_CERTIFICATS = "appCertificats"
    const val APP_CLUB = "appClub"
    const val APP_CLUB_AGENDA = "appClubAgenda"
    const val APP_CLUB_BLOCAGES = "appClubBlocages"
    const val APP_CLUB_CLASSEMENT = "appClubClassement"
    const val APP_CLUB_FIL = "appClubFil"
    const val APP_CLUB_LISTE = "appClubListe"
    const val APP_CLUB_PARRAINAGE = "appClubParrainage"
    const val APP_CONSOLE = "appConsole"
    const val APP_MEDIA = "appMedia"
    const val APP_REPETITEUR = "appRepetiteur"
    const val ECRIRE_UNE_NOTE = "ecrireUneNote"
    const val MARQUER_LECON = "marquerLecon"
    const val POSTER_AU_CLUB = "posterAuClub"
    const val RESERVER_SESSION = "reserverSession"
    const val SIGNALER_MEMBRE = "signalerMembre"
    const val BLOQUER_MEMBRE = "bloquerMembre"
    const val CREER_MON_PROFIL = "creerMonProfil"
    const val CLEAR_RYSMO_MEMORY = "clearRysmoMemory"
}

object Vues {
    /**
     * Le paramètre `onglet` des vues discriminées : une constante, jamais une chaîne recopiée à
     * l'appel.
     */
    object Onglet {
        const val DISCUSSIONS = "discussions"
        const val OPPORTUNITES = "opportunites"
        const val MEMBRE = "membre"
    }

    /**
     * Les noms de VUE du contrat — discriminant compris, contrairement à `Callables`. C'est ce que
     * `LectureDeVue.lire` attend : `appClubListe.membre` désigne une forme de réponse, `appClubListe`
     * désigne la callable qui en sert trois.
     */
    object Noms {
        const val APP_MOI = "appMoi"
        const val APP_ESPACE = "appEspace"
        const val APP_COURS = "appCours"
        const val APP_FORMATION = "appFormation"
        const val APP_LECON = "appLecon"
        const val APP_NOTES = "appNotes"
        const val APP_CERTIFICATS = "appCertificats"
        const val APP_CLUB = "appClub"
        const val APP_CLUB_AGENDA = "appClubAgenda"
        const val APP_CLUB_BLOCAGES = "appClubBlocages"
        const val APP_CLUB_CLASSEMENT = "appClubClassement"
        const val APP_CLUB_FIL = "appClubFil"
        const val APP_CLUB_LISTE_DISCUSSIONS = "appClubListe.discussions"
        const val APP_CLUB_LISTE_OPPORTUNITES = "appClubListe.opportunites"
        const val APP_CLUB_LISTE_MEMBRE = "appClubListe.membre"
        const val APP_CLUB_PARRAINAGE = "appClubParrainage"
        const val APP_CONSOLE = "appConsole"
        const val APP_MEDIA = "appMedia"
        const val APP_REPETITEUR = "appRepetiteur"
    }

    /**
     * ⚠️ LE DISCRIMINANT D'UNE VUE, ET LE DÉFAUT QU'IL FERME. `appClubListe` s'ouvre en trois selon
     * son paramètre `onglet`, et la fiche de membre a été INATTEIGNABLE parce qu'aucun écran ne
     * passait ce qu'elle exigeait : la vue jetait `invalid-argument`, l'écran sortait par sa branche
     * courte, et le bouton « Signaler ce profil » n'était jamais rendu. Sur les quatre exigences de la
     * guideline App Store 1.2, le signalement comptait pour zéro. Le paramètre est donc POSÉ PAR LE
     * CONTRAT, jamais recopié à l'appel.
     */
    val DISCRIMINANT: Map<String, Pair<String, String>> = mapOf(
        "appClubListe.discussions" to ("onglet" to "discussions"),
        "appClubListe.opportunites" to ("onglet" to "opportunites"),
        "appClubListe.membre" to ("onglet" to "membre"),
    )

    /**
     * Le nom de la CALLABLE derrière chaque nom de vue : `appClubListe.membre` s'appelle
     * `appClubListe`.
     */
    val CALLABLE: Map<String, String> = mapOf(
        "appMoi" to "appMoi",
        "appEspace" to "appEspace",
        "appCours" to "appCours",
        "appFormation" to "appFormation",
        "appLecon" to "appLecon",
        "appNotes" to "appNotes",
        "appCertificats" to "appCertificats",
        "appClub" to "appClub",
        "appClubAgenda" to "appClubAgenda",
        "appClubBlocages" to "appClubBlocages",
        "appClubClassement" to "appClubClassement",
        "appClubFil" to "appClubFil",
        "appClubListe.discussions" to "appClubListe",
        "appClubListe.opportunites" to "appClubListe",
        "appClubListe.membre" to "appClubListe",
        "appClubParrainage" to "appClubParrainage",
        "appConsole" to "appConsole",
        "appMedia" to "appMedia",
        "appRepetiteur" to "appRepetiteur",
    )

    /** Ce que `vue: null` veut dire, vue par vue. Clé : le nom du contrat, discriminant compris. */
    val SENS_DU_VIDE: Map<String, SensDuVide> = mapOf(
        "appMoi" to SensDuVide.SANS_DONNEE,
        "appEspace" to SensDuVide.SANS_DONNEE,
        "appCours" to SensDuVide.JAMAIS,
        "appFormation" to SensDuVide.SANS_DONNEE,
        "appLecon" to SensDuVide.SANS_DONNEE,
        "appNotes" to SensDuVide.JAMAIS,
        "appCertificats" to SensDuVide.JAMAIS,
        "appClub" to SensDuVide.SANS_ACCES,
        "appClubAgenda" to SensDuVide.SANS_ACCES,
        "appClubBlocages" to SensDuVide.SANS_ACCES,
        "appClubClassement" to SensDuVide.SANS_ACCES,
        "appClubFil" to SensDuVide.SANS_ACCES,
        "appClubListe.discussions" to SensDuVide.SANS_ACCES,
        "appClubListe.opportunites" to SensDuVide.SANS_ACCES,
        "appClubListe.membre" to SensDuVide.SANS_ACCES,
        "appClubParrainage" to SensDuVide.SANS_ACCES,
        "appConsole" to SensDuVide.JAMAIS,
        "appMedia" to SensDuVide.JAMAIS,
        "appRepetiteur" to SensDuVide.JAMAIS,
    )
}

/**
 * ⛔ CE QUE CHAQUE ÉCRITURE PÉRIME. Le cache du port n'avait AUCUNE invalidation : `marquerLecon`
 * rendait une progression recalculée et rien n'évinçait `appEspace`, `appLecon` ni `appCours`.
 * Pendant trente secondes, l'onglet d'à côté montrait l'état d'avant. C'est du code généré, pas
 * une discipline.
 */
object Perime {
    val PAR_ECRITURE: Map<String, List<String>> = mapOf(
        "ecrireUneNote" to listOf("appNotes"),
        "marquerLecon" to listOf("appEspace", "appLecon", "appCours", "appCertificats"),
        "posterAuClub" to listOf("appClubFil"),
        "reserverSession" to listOf("appClubAgenda"),
        "signalerMembre" to listOf(),
        "bloquerMembre" to listOf("appClubBlocages", "appClubFil", "appClubListe.discussions", "appClubListe.opportunites", "appClubListe.membre"),
        "creerMonProfil" to listOf("appMoi"),
        "clearRysmoMemory" to listOf("appRepetiteur"),
    )
}
