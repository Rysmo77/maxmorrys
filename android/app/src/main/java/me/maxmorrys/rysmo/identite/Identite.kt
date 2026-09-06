package me.maxmorrys.rysmo.identite

import com.google.android.gms.tasks.Tasks
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.UserProfileChangeRequest
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import me.maxmorrys.rysmo.donnees.Appel
import me.maxmorrys.rysmo.donnees.Callables
import java.util.concurrent.TimeUnit

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * SE CONNECTER, CRÉER UN COMPTE, REDEMANDER SON MOT DE PASSE.
 *
 * ⛔ UNE SEULE PHRASE POUR TROIS CAUSES, ET C'EST DÉLIBÉRÉ. Firebase rend le même code —
 * `ERROR_INVALID_CREDENTIAL` — pour un mot de passe faux ET pour un compte inexistant. Ce
 * n'est pas une imprécision de leur part : répondre différemment transformerait l'écran de
 * connexion en outil pour savoir quelles adresses sont inscrites. On ne peut donc PAS écrire
 * « ce compte n'existe pas », et il ne faut pas essayer : la phrase doit couvrir les deux
 * sans mentir sur aucun.
 *
 * ⚠️ ET UN CAS PROPRE À CE PRODUIT, QUI RESTE FAUX. Le site propose déjà « Se connecter avec
 * Google ». Quelqu'un qui s'y est inscrit par ce chemin n'a JAMAIS choisi de mot de passe :
 * ici, il obtiendra `ERROR_INVALID_CREDENTIAL` et lira « cette adresse et ce mot de passe ne
 * vont pas ensemble » — ce qui l'enverra essayer des mots de passe qui n'ont jamais existé.
 * C'est la raison pour laquelle la connexion Google doit arriver vite, et avec elle « Se
 * connecter avec Apple » (App Store 4.8, qui impose les deux ensemble ou aucune).
 *
 * ⚠️ TOUTES CES FONCTIONS SONT BLOQUANTES, comme le reste de la couche de données : elles
 * s'appellent depuis `Dispatchers.IO`. `Tasks.await` lève s'il est appelé sur le fil
 * principal — une erreur de fil devient une panne nommée, pas un gel silencieux.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Ce qui a échoué, en une phrase lisible, plus le code pour la trace. */
class ErreurIdentite(val motif: String, val code: String) : Exception(motif)

private const val DELAI_SECONDES = 20L

private fun <T> attendre(tache: com.google.android.gms.tasks.Task<T>): T =
    Tasks.await(tache, DELAI_SECONDES, TimeUnit.SECONDS)

/**
 * Traduit une exception Firebase en phrase.
 *
 * ⚠️ LES CODES D'ANDROID NE S'ÉCRIVENT PAS COMME CEUX DU SDK JS. Le port React Native lisait
 * `auth/invalid-credential` ; ici c'est `ERROR_INVALID_CREDENTIAL`. Recopier la table de
 * l'un dans l'autre aurait fait tomber TOUS les cas dans le défaut — c'est-à-dire une seule
 * phrase générique pour huit situations, dont trois que la personne peut corriger elle-même.
 */
private fun traduire(erreur: Throwable): Nothing {
    /* La panne de réseau n'est pas une `FirebaseAuthException` : elle a sa propre classe,
       et la confondre avec un identifiant faux accuserait quelqu'un à tort. */
    if (erreur is FirebaseNetworkException) {
        throw ErreurIdentite("Pas de connexion.", "ERROR_NETWORK")
    }
    val code = (erreur as? FirebaseAuthException)?.errorCode
        ?: (erreur.cause as? FirebaseAuthException)?.errorCode
        ?: ""
    val motif = when (code) {
        /* Volontairement une seule phrase pour trois causes : voir l'en-tête. */
        "ERROR_INVALID_CREDENTIAL", "ERROR_WRONG_PASSWORD", "ERROR_USER_NOT_FOUND" ->
            "Cette adresse et ce mot de passe ne vont pas ensemble."
        "ERROR_INVALID_EMAIL" -> "Cette adresse e-mail n'est pas valide."
        "ERROR_EMAIL_ALREADY_IN_USE" -> "Un compte existe déjà avec cette adresse."
        "ERROR_WEAK_PASSWORD" -> "Ce mot de passe est trop court — six caractères au minimum."
        "ERROR_TOO_MANY_REQUESTS" -> "Trop de tentatives. Réessaie dans quelques minutes."
        "ERROR_USER_DISABLED" -> "Ce compte est désactivé."
        else -> "La connexion a échoué."
    }
    throw ErreurIdentite(motif, code.ifBlank { "inconnu" })
}

private inline fun <T> traduisant(bloc: () -> T): T =
    try {
        bloc()
    } catch (erreur: ErreurIdentite) {
        throw erreur
    } catch (erreur: Exception) {
        traduire(erreur)
    }

/** Se connecter avec une adresse et un mot de passe. */
fun connexionEmail(auth: FirebaseAuth, email: String, motDePasse: String) {
    traduisant { attendre(auth.signInWithEmailAndPassword(email.trim(), motDePasse)) }
}

/**
 * Crée le compte ET son profil.
 *
 * ⛔ L'ORDRE COMPTE, ET IL N'EST PAS RATTRAPABLE DANS L'AUTRE SENS. `createUser…` crée le
 * compte d'authentification ; le profil `users/{uid}` vient ensuite, par le serveur. Si la
 * seconde étape échoue, la personne a un compte qui se connecte et aucun profil à lire.
 *
 * On ne peut PAS défaire la première — supprimer un compte tout juste créé demande une
 * ré-authentification — alors on ne fait pas semblant : `creerMonProfil` est IDEMPOTENTE
 * côté serveur, et le prochain lancement la rappellera sans rien écraser.
 */
fun creationEmail(auth: FirebaseAuth, appel: Appel, nom: String, email: String, motDePasse: String) {
    traduisant {
        val identifiants = attendre(auth.createUserWithEmailAndPassword(email.trim(), motDePasse))
        val utilisateur = identifiants.user ?: throw ErreurIdentite(
            "Le compte a été créé mais l'application ne l'a pas reçu. Reconnecte-toi.",
            "utilisateur-absent",
        )
        attendre(
            utilisateur.updateProfile(
                UserProfileChangeRequest.Builder().setDisplayName(nom.trim()).build(),
            ),
        )
        appel.appelerBrut(
            Callables.CREER_MON_PROFIL,
            JsonObject(mapOf("displayName" to JsonPrimitive(nom.trim()))),
        )
    }
}

/**
 * Envoie le lien de réinitialisation.
 *
 * ⛔ NE JAMAIS DISTINGUER UNE ADRESSE INCONNUE D'UNE ADRESSE CONNUE. Firebase ne lève pas
 * d'erreur pour une adresse inexistante, et c'est voulu : répondre différemment ferait de cet
 * écran un outil pour savoir qui est inscrit. Seul un défaut de TRANSPORT mérite d'être
 * signalé ; le reste se tait, exprès, et l'écran affiche le même accusé dans les deux cas.
 */
fun reinitialiser(auth: FirebaseAuth, email: String) {
    try {
        attendre(auth.sendPasswordResetEmail(email.trim()))
    } catch (erreur: Exception) {
        if (erreur is FirebaseNetworkException || erreur.cause is FirebaseNetworkException) {
            throw ErreurIdentite("Pas de connexion.", "ERROR_NETWORK")
        }
        /* Tout le reste est avalé DÉLIBÉRÉMENT — y compris « cette adresse n'existe pas ». */
    }
}

/** Se déconnecter. Local et immédiat : rien à demander au serveur. */
fun deconnexion(auth: FirebaseAuth) {
    auth.signOut()
}
