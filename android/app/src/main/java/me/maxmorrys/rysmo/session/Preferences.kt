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
}
