package me.maxmorrys.rysmo.identite

import android.content.Context
import me.maxmorrys.rysmo.donnees.Appel
import me.maxmorrys.rysmo.donnees.CacheDesVues
import me.maxmorrys.rysmo.donnees.DiagnosticSysteme
import me.maxmorrys.rysmo.donnees.FournisseurDeJeton
import me.maxmorrys.rysmo.donnees.LectureDeVue

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA PORTÉE IDENTIFIÉE — une seule par processus, et c'est une contrainte, pas une commodité.
 *
 * ⛔ LE CACHE DES VUES VIT DANS LA LECTURE. Deux `LectureDeVue` en feraient deux, dont aucune
 * ne servirait l'autre : chaque écran repartirait sur le réseau, et deux écrans ouverts sur
 * la même vue afficheraient deux relevés de dates différentes. Le cache existe précisément
 * pour que ça n'arrive pas.
 *
 * ⚠️ SA CLÉ CONTIENT L'`uid` (`Cache.kt`), donc changer de compte ne sert pas les données du
 * précédent. C'est ce qui rend une instance unique sûre malgré la déconnexion.
 *
 * ⚠️ Elle diffère de `PorteePublique` sur un seul point, et il est décisif : celle-ci porte
 * un vrai producteur de jeton. L'autre n'en porte AUCUN, délibérément — un handler public qui
 * lirait l'identité de l'appelant servirait deux réponses selon la présence d'un en-tête.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
object PorteeIdentifiee {

    @Volatile
    private var lecture: LectureDeVue? = null

    /**
     * @return la lecture identifiée, ou `null` si la construction est incomplète.
     *
     * ⚠️ `null` PLUTÔT QU'UNE LECTURE QUI ÉCHOUERAIT. Sans clés de construction, aucun appel
     * ne peut aboutir : rendre une lecture quand même ferait produire à chaque écran une
     * panne de transport, c'est-à-dire accuser le réseau d'un défaut de compilation. La
     * session, elle, dit déjà `NonConfiguree` et l'écran l'affiche.
     */
    @Synchronized
    fun lectureOuNull(contexte: Context): LectureDeVue? {
        lecture?.let { return it }
        val jetons: FournisseurDeJeton = jetonOuNull(contexte) ?: return null
        return LectureDeVue(
            appel = appelOuNull(contexte) ?: return null,
            cache = CacheDesVues(),
        ).also { lecture = it }
    }

    /**
     * L'appel identifié, pour les ÉCRITURES — qui ne passent pas par le cache des vues.
     *
     * ⚠️ Une écriture partagerait le cache si elle passait par `LectureDeVue`, et rien n'y
     * périmerait ce qu'elle vient de changer. Le contrat déclare quelles vues chaque écriture
     * périme (`Vues.kt`) ; c'est à l'appelant de les relire, pas au cache de deviner.
     */
    @Synchronized
    fun appelOuNull(contexte: Context): Appel? {
        val jetons = jetonOuNull(contexte) ?: return null
        return Appel(
            config = configurationDIdentite(),
            jetons = jetons,
            /* `applicationContext` : un contexte d'activité retenu par un objet de processus
               fuirait l'activité entière à chaque rotation. */
            reseau = DiagnosticSysteme(contexte.applicationContext),
        )
    }

    /**
     * Vide le cache. ⛔ À APPELER À CHAQUE CHANGEMENT DE COMPTE.
     *
     * La clé du cache contient l'`uid`, donc les entrées de l'ancien compte ne seraient pas
     * SERVIES au nouveau. Mais elles resteraient en mémoire, et sur un téléphone partagé
     * c'est une trace du précédent que rien n'efface.
     */
    @Synchronized
    fun oublier() {
        lecture = null
    }
}
