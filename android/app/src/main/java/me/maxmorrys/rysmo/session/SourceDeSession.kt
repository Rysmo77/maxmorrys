package me.maxmorrys.rysmo.session

import android.content.Context
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import me.maxmorrys.rysmo.donnees.Configuration
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.autorise
import me.maxmorrys.rysmo.identite.authOuNull
import me.maxmorrys.rysmo.identite.configurationDIdentite

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * QUI REGARDE.
 *
 * ⛔ L'ÉTAT DE DÉPART DÉPEND DE LA CONFIGURATION, ET CE N'EST PAS UN DÉTAIL DE STYLE.
 *
 * `NonConfiguree` est TERMINALE et ne s'atteint pas par transition : `Session.autorise` le
 * dit, et une construction incomplète ne se répare pas à chaud. Une première version partait
 * de `Restauration` puis y basculait — le `require` de `poser()` a arrêté l'application au
 * lancement, en nommant les deux états. Sans cette vérification, elle aurait tourné dans un
 * état que sa propre machine déclare impossible, et le défaut serait ressorti ailleurs.
 *
 * ⚠️ ET L'AUTRE PIÈGE, SYMÉTRIQUE : rendre `Anonyme` quand on ne sait pas. « Personne n'est
 * connecté » serait vrai, et tous les écrans s'afficheraient proprement — mais `Anonyme` est
 * une réponse DÉFINITIVE, qui envoie vers la connexion. La confondre avec « je ne sais pas
 * encore » ferait passer un chantier inachevé pour un produit fini qui refuse l'accès à tout
 * le monde. C'est ce que `NonConfiguree` dit à la place, et sa panne est NON REPRENABLE.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
class SourceDeSession(
    private val configuration: Configuration = configurationDIdentite(),
) {

    private val _etat = MutableStateFlow<Session>(
        configuration.motifManquant()?.let(Session::NonConfiguree) ?: Session.Restauration,
    )
    val etat: StateFlow<Session> = _etat.asStateFlow()

    /** Retenu pour pouvoir se détacher : un écouteur qui survit à son objet fuit l'activité. */
    private var auth: FirebaseAuth? = null
    private var ecouteur: FirebaseAuth.AuthStateListener? = null

    /**
     * Monte l'écouteur d'identité et laisse Firebase rendre le premier verdict.
     *
     * ⛔ LE PREMIER VERDICT N'EST PAS IMMÉDIAT, ET C'EST TOUT L'INTÉRÊT DE `Restauration`.
     * Firebase relit sa session depuis le disque au démarrage : entre le lancement et cette
     * lecture, on ne SAIT pas s'il y a quelqu'un. Décider pendant ce battement renverrait
     * vers la connexion quelqu'un de déjà connecté — le défaut exact que le web a connu.
     *
     * ⚠️ `addAuthStateListener` APPELLE SON ÉCOUTEUR TOUT DE SUITE avec l'état courant, puis
     * à chaque changement. C'est ce qui fait que la déconnexion et la reconnexion passent par
     * le même chemin que le démarrage, sans code séparé pour chacun.
     */
    fun demarrer(contexte: Context) {
        if (_etat.value is Session.NonConfiguree) return
        if (ecouteur != null) return

        val a = authOuNull(contexte) ?: return
        auth = a
        val e = FirebaseAuth.AuthStateListener { courant ->
            val utilisateur = courant.currentUser
            poser(
                if (utilisateur == null) {
                    Session.Anonyme
                } else {
                    Session.Connectee(
                        uid = utilisateur.uid,
                        email = utilisateur.email,
                        nom = utilisateur.displayName,
                    )
                },
            )
        }
        ecouteur = e
        a.addAuthStateListener(e)
    }

    /**
     * Se déconnecter.
     *
     * ⛔ ELLE NE POSE PAS `Anonyme` ELLE-MÊME, et c'est ce qui la rend juste. `signOut()`
     * fait rappeler l'écouteur, qui pose l'état — la déconnexion emprunte donc exactement le
     * même chemin que le démarrage et que la connexion. Poser l'état ici en plus créerait un
     * second chemin, à tenir d'accord avec le premier, pour la même conclusion.
     *
     * ⚠️ C'est aussi la sortie de secours du verrou biométrique : sans elle, un capteur qui
     * cesse de reconnaître rendrait le compte inaccessible depuis ce téléphone.
     */
    fun deconnecter() {
        auth?.signOut()
    }

    /** À appeler quand l'écran hôte disparaît. Un écouteur oublié retient son contexte. */
    fun arreter() {
        ecouteur?.let { auth?.removeAuthStateListener(it) }
        ecouteur = null
    }

    /**
     * Pose l'état suivant, si la machine l'autorise.
     *
     * ⚠️ `Restauration` N'EST JAMAIS RÉATTEINTE, et l'écouteur pourrait la proposer : Firebase
     * peut rappeler avec le même utilisateur. On ignore donc silencieusement une transition
     * vers un état IDENTIQUE — c'est un rappel, pas un changement — et on refuse les autres.
     */
    private fun poser(suivante: Session) {
        if (_etat.value == suivante) return
        require(_etat.value.autorise(suivante)) {
            "Transition de session interdite : ${_etat.value} -> $suivante"
        }
        _etat.value = suivante
    }
}
