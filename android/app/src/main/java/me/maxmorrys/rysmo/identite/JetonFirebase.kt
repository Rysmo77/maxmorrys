package me.maxmorrys.rysmo.identite

import android.content.Context
import com.google.android.gms.tasks.Tasks
import com.google.firebase.auth.FirebaseAuth
import me.maxmorrys.rysmo.donnees.FournisseurDeJeton
import java.util.concurrent.TimeUnit

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE PRODUCTEUR DE JETON — et la seule exigence dure de la couche de données.
 *
 * ⛔ SAVOIR FORCER UN RAFRAÎCHISSEMENT N'EST PAS UNE OPTION. `Appel` rejoue UNE fois sur un
 * `401`, avec `forcerRafraichissement = true`. Sans ce chemin, un jeton expiré — ils durent
 * une heure — déconnecterait quelqu'un de parfaitement connecté, et la reconnexion
 * paraîtrait aléatoire parce qu'elle dépendrait de l'heure de la dernière ouverture.
 *
 * ⚠️ SYNCHRONE, ET C'EST VOULU. `FournisseurDeJeton.jeton()` n'est pas `suspend` parce que
 * toute la couche de données est bloquante : elle est appelée depuis `Dispatchers.IO`, jamais
 * depuis la composition. `Tasks.await()` s'y branche donc directement — et il LÈVE s'il est
 * appelé sur le fil principal, ce qui transforme une erreur de fil en panne immédiate et
 * nommée plutôt qu'en gel silencieux.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
class JetonFirebase(private val auth: FirebaseAuth) : FournisseurDeJeton {

    /**
     * @return le jeton d'identité, ou `null` si personne n'est connecté.
     *
     * ⚠️ `null` N'EST PAS UNE ERREUR. `Appel` l'interprète comme « pas d'en-tête
     * d'autorisation » — ce qui est exact pour un catalogue parcouru sans compte. Une panne
     * de production de jeton, elle, remonte en exception et devient une panne de transport.
     */
    override fun jeton(forcerRafraichissement: Boolean): String? {
        val utilisateur = auth.currentUser ?: return null
        /*
         * ⚠️ UN DÉLAI EXPLICITE, PLUS COURT QUE CELUI DE L'APPEL. `Appel` se donne 20 s pour
         * l'aller-retour complet ; si la production du jeton en mangeait autant, la requête
         * qui suit n'aurait plus de temps et la panne serait attribuée au réseau — c'est-à-dire
         * au forfait de quelqu'un — alors qu'elle vient de l'identité.
         */
        return Tasks.await(utilisateur.getIdToken(forcerRafraichissement), DELAI_SECONDES, TimeUnit.SECONDS).token
    }

    private companion object {
        const val DELAI_SECONDES = 10L
    }
}

/** Le producteur du processus, ou `null` si la construction est incomplète. */
fun jetonOuNull(contexte: Context): FournisseurDeJeton? =
    authOuNull(contexte)?.let(::JetonFirebase)
