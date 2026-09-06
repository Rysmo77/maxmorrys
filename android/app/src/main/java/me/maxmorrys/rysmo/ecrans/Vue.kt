package me.maxmorrys.rysmo.ecrans

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import me.maxmorrys.rysmo.donnees.CodeErreur
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.identite.PorteeIdentifiee
import me.maxmorrys.rysmo.identite.configurationDIdentite

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LIRE UNE VUE DEPUIS UN ÉCRAN — une seule fois, pour quarante écrans.
 *
 * ⛔ CE QUI EST RECOPIÉ DÉRIVE, PUIS MANQUE. C'est la leçon de la bande d'onglets du Club :
 * le port React Native recopiait sa coquille dans chaque écran, et la bande a fini par
 * n'exister dans aucun. Quarante écrans qui recopieraient chacun `withContext(Dispatchers.IO)`,
 * la reprise et la gestion du `NonConfiguree` produiraient quarante variantes, dont quelques
 * unes fausses — et les fausses ne se verraient que sur l'appareil de quelqu'un d'autre.
 *
 * Ce qui est centralisé ici, et qu'aucun écran n'a donc à savoir :
 *
 *   · ⛔ `Appel` EST BLOQUANT, délibérément — la couche de données ne déclare pas de
 *     coroutines, et « le choix du fil appartient à la couche au-dessus ». C'est ici, et
 *     c'est `IO` : appelé depuis la composition, ce même code lèverait `NetworkOnMainThread`.
 *   · Les phases de session sont tranchées par `LectureDeVue.lire` lui-même — `Restauration`
 *     avant `Anonyme`, et `NonConfiguree` en panne NON REPRENABLE.
 *   · La reprise explicite passe `forcer = true` : sans lui, le cache de trente secondes
 *     rendrait la même réponse et le bouton « Réessayer » n'aurait rien fait.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** L'état d'une vue, et de quoi la redemander. */
class VueLue<T>(
    val etat: Etat<T>,
    /**
     * ⚠️ ELLE N'EST PAS DANS L'ÉTAT, ET C'EST LA MÊME RAISON QU'AILLEURS. Une fonction dans
     * l'état casse l'égalité structurelle : deux `Panne` identiques ne seraient jamais égales,
     * `distinctUntilChanged` ne filtrerait rien, et toute recomposition deviendrait
     * inconditionnelle. L'état dit si la reprise a un SENS (`Panne.reprenable`) ; c'est
     * l'écran qui la déclenche.
     */
    val reprendre: () -> Unit,
)

/**
 * Lit une vue et suit son état.
 *
 * @param params les paramètres de la vue. ⚠️ Le DISCRIMINANT n'en fait pas partie :
 *   `LectureDeVue` le pose lui-même depuis le contrat, pour qu'aucun appelant ne puisse
 *   l'oublier.
 */
@Composable
inline fun <reified T> vue(
    nomDeVue: String,
    session: Session,
    params: JsonObject = JsonObject(emptyMap()),
): VueLue<T> {
    val contexte = LocalContext.current
    var etat by remember(nomDeVue, params) { mutableStateOf<Etat<T>>(Etat.Restauration) }
    var reprise by remember(nomDeVue, params) { mutableIntStateOf(0) }

    LaunchedEffect(nomDeVue, params, session, reprise) {
        /*
         * ⚠️ `null` QUAND LA CONSTRUCTION EST INCOMPLÈTE, et on rend alors la MÊME panne que
         * `LectureDeVue` aurait rendue. Laisser passer l'appel produirait une panne de
         * TRANSPORT — c'est-à-dire accuser le réseau, donc le forfait de quelqu'un, d'un
         * défaut de chaîne de compilation.
         */
        val lecture = PorteeIdentifiee.lectureOuNull(contexte)
        if (lecture == null) {
            etat = Etat.Panne(
                motif = configurationDIdentite().motifManquant()
                    ?: "L'identification n'est pas disponible.",
                code = CodeErreur.FAILED_PRECONDITION,
                reprenable = false,
            )
            return@LaunchedEffect
        }
        etat = withContext(Dispatchers.IO) {
            lecture.lire<T>(nomDeVue, session, params, forcer = reprise > 0)
        }
    }

    return VueLue(etat) { reprise += 1 }
}
