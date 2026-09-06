package me.maxmorrys.rysmo.session

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * CE QUE L'APPAREIL SE RAPPELLE — et le peu que ça doit être.
 *
 * Un seul drapeau pour l'instant : l'accueil a-t-il déjà été vu. Il décide de la première
 * bifurcation du graphe, et de rien d'autre.
 *
 * ⛔ RIEN D'IDENTIFIANT NE VIENDRA ICI. C'est la décision AD-11, payée une fois : le nom du
 * tuteur, le profil, la progression vivent côté serveur. Les recopier localement crée une
 * SECONDE SOURCE DE VÉRITÉ à réconcilier — et la réconciliation est toujours écrite après
 * le bogue qu'elle aurait dû empêcher.
 *
 * ⚠️ Ce n'est pas non plus l'endroit d'un jeton d'authentification. Les préférences ne sont
 * pas chiffrées ; le stockage chiffré est un autre dispositif (lot 5).
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

private val Context.magasin: DataStore<Preferences> by preferencesDataStore(name = "rysmo")

private val ACCUEIL_VU = booleanPreferencesKey("accueil_vu")

/**
 * ⛔ LE VERROU BIOMÉTRIQUE EST UN BOOLÉEN, ET IL N'A RIEN À FAIRE DANS UN COFFRE.
 *
 * La spécification du port posait ce drapeau dans `expo-secure-store`, et son propre journal
 * en nommait la conséquence : « une lecture de SecureStore qui échoue ouvre SANS verrou …
 * un trousseau corrompu éteint alors le verrou en silence ». Le chiffrer coûtait donc une
 * panne muette, pour protéger une valeur qui ne cache rien — elle ne dit pas QUI, ni quoi,
 * elle dit seulement « cette personne a demandé qu'on lui redemande ».
 *
 * ⚠️ ET SURTOUT, LE CHIFFRER NE PROTÉGERAIT PAS CE QU'ON CROIT. Un drapeau qu'un accès au
 * disque peut retourner ne défend rien contre quelqu'un qui a déjà cet accès. Ce que le
 * verrou protège est l'ACCÈS À L'APPLICATION sur un téléphone déverrouillé et prêté — pas
 * la session, qui n'est ni ici ni chiffrée, et l'écran de la biométrie le dit en toutes
 * lettres : « un raccourci, pas un remplacement ».
 *
 * ⛔ Le stockage chiffré reste un dispositif à part, et il n'est PAS construit au lot 5 :
 * aucun producteur de jeton d'identité n'étant choisi, il n'y a rien à chiffrer.
 */
private val VERROU_BIOMETRIQUE = booleanPreferencesKey("verrou_biometrique")

class Preferences(private val contexte: Context) {

    /**
     * Faux tant que l'accueil n'a pas été parcouru — ou passé, ce qui compte pareil.
     *
     * ⚠️ Il vaut faux AUSSI au tout premier relevé, avant que le disque n'ait répondu. C'est
     * pourquoi l'écran de lancement attend une valeur avant d'aiguiller : partir sur le
     * défaut ferait revoir l'accueil à chaque démarrage, sur les appareils lents seulement.
     */
    val accueilVu: Flow<Boolean> = contexte.magasin.data.map { it[ACCUEIL_VU] ?: false }

    /** Posé quand l'accueil est terminé OU passé : passer, c'est l'avoir vu. */
    suspend fun marquerAccueilVu() {
        contexte.magasin.edit { it[ACCUEIL_VU] = true }
    }

    /**
     * Le verrou biométrique est-il armé ?
     *
     * ⚠️ FAUX PAR DÉFAUT, ET C'EST LA SEULE VALEUR SÛRE. Un défaut à `true` enfermerait
     * quelqu'un derrière un verrou qu'il n'a jamais posé — et sur un appareil sans capteur,
     * derrière un verrou qu'il ne peut pas ouvrir. Le sas attend d'ailleurs une valeur avant
     * de rendre quoi que ce soit : partir du défaut ferait apparaître le contenu une image
     * avant le verrou, ce qui revient à ne pas l'avoir posé.
     */
    val verrouBiometrique: Flow<Boolean> = contexte.magasin.data.map { it[VERROU_BIOMETRIQUE] ?: false }

    /**
     * Arme ou désarme le verrou.
     *
     * ⛔ N'EST APPELÉ QU'APRÈS UNE AUTHENTIFICATION RÉUSSIE, à l'armement. Poser le drapeau
     * sur la seule intention — « j'ai touché le bouton » — armerait un verrou que la personne
     * n'a jamais ouvert une fois, et le premier essai serait au démarrage suivant, quand il
     * est trop tard pour se rendre compte que le capteur ne la reconnaît pas.
     */
    suspend fun poserVerrouBiometrique(arme: Boolean) {
        contexte.magasin.edit { it[VERROU_BIOMETRIQUE] = arme }
    }
}
