package me.maxmorrys.rysmo.ecrans

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import me.maxmorrys.rysmo.donnees.ErreurAppel
import me.maxmorrys.rysmo.identite.PorteeIdentifiee

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * ÉCRIRE — et périmer ce que l'écriture vient de rendre faux.
 *
 * ⛔ `Perime.PAR_ECRITURE` EST GÉNÉRÉ DEPUIS LE CONTRAT, ET PERSONNE NE L'APPELAIT. Le
 * serveur déclare quelles vues chaque écriture invalide : bloquer quelqu'un en périme CINQ.
 * Sans cet appel, le cache de trente secondes servirait l'ancienne réponse — croiser le même
 * nom la minute d'après annulerait le geste À L'ÉCRAN, alors qu'il a bien été enregistré.
 * C'est le pire endroit possible pour ce défaut : quelqu'un qui bloque un harceleur le verrait
 * revenir.
 *
 * ⚠️ L'INVALIDATION EST FAITE ICI, PAS PAR LE CACHE LUI-MÊME. Le cache ne sait pas ce qu'une
 * écriture change — c'est le contrat qui le sait, et il le dit. Lui faire deviner reviendrait
 * à tout vider à chaque écriture, ce qui recharge cinq écrans pour en changer un.
 *
 * ⚠️ ET RIEN N'EST PÉRIMÉ SI L'ÉCRITURE A ÉCHOUÉ. Vider le cache sur un échec ferait
 * recharger, donc réafficher exactement la même chose, en donnant l'impression que quelque
 * chose s'est passé.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
class Ecrivain internal constructor(
    private val lancer: (String, JsonObject, (Throwable?) -> Unit) -> Unit,
) {
    /**
     * @param onFini reçoit `null` en cas de succès, l'échec sinon.
     *   ⚠️ Le rappel s'exécute sur le fil PRINCIPAL : il peut poser un état de composition.
     */
    operator fun invoke(nom: String, params: JsonObject = JsonObject(emptyMap()), onFini: (Throwable?) -> Unit) {
        lancer(nom, params, onFini)
    }
}

@Composable
fun ecrivain(): Ecrivain {
    val contexte = LocalContext.current
    val portee = rememberCoroutineScope()
    return remember(contexte, portee) {
        Ecrivain { nom, params, onFini ->
            portee.launch {
                val echec = withContext(Dispatchers.IO) {
                    val appel = PorteeIdentifiee.appelOuNull(contexte)
                        ?: return@withContext IllegalStateException(
                            "L'identification n'est pas disponible.",
                        )
                    runCatching { appel.appelerBrut(nom, params) }
                        .fold(
                            onSuccess = {
                                /* ⛔ APRÈS le succès, jamais avant : périmer d'abord ferait
                                   recharger l'ancienne valeur si l'écriture échouait ensuite. */
                                PorteeIdentifiee.lectureOuNull(contexte)?.cache?.perimerApres(nom)
                                null
                            },
                            onFailure = { it },
                        )
                }
                onFini(echec)
            }
        }
    }
}

/** Le motif lisible d'un échec d'écriture, ou un repli qui ne prétend pas savoir. */
fun motifDe(echec: Throwable?): String? = when (echec) {
    null -> null
    is ErreurAppel -> echec.motif
    else -> "Le geste n'a pas pu partir."
}
