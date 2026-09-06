package me.maxmorrys.rysmo.donnees

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA CONFIGURATION DU CLIENT — et pourquoi on ne jette pas au démarrage.
 *
 * Sur le web, une configuration incomplète fait jeter au démarrage : la page blanche
 * s'accompagne d'une erreur lisible dans la console, et un déploiement raté se corrige en
 * cinq minutes.
 *
 * ⛔ SUR UN TÉLÉPHONE, LA MÊME ERREUR DONNE UN ÉCRAN BLANC SANS CONSOLE, dans une application
 * qu'il faut repasser en revue pour corriger. On retient donc le défaut et l'appel répond une
 * panne NOMMÉE, que l'écran sait afficher. L'application est inutile, mais elle le DIT — et
 * elle dit QUOI manque, parce qu'un motif vague ne se corrige pas.
 *
 * ⚠️ Cette panne-là N'EST PAS REPRENABLE : aucun geste de la personne ne posera la clé qui
 * manque. C'est exactement le cas où le port affichait « Réessayer » sur une lambda vide.
 *
 * ⚠️ CE N'EST PAS AU RUNTIME D'ATTRAPER ÇA, c'est à la porte. Une construction incomplète ne
 * doit jamais atteindre un magasin ; ce mécanisme est le filet, pas la garde.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
data class Configuration(
    /**
     * L'origine des callables. Le Worker sert le protocole `onCall` sur son domaine propre —
     * il n'y a qu'UNE porte, et aucun chemin imbriqué : `/appMoi`, jamais `/app/moi`.
     */
    val apiBase: String = API_BASE_PAR_DEFAUT,

    /**
     * Les valeurs de construction exigées par le producteur de jeton d'identité.
     *
     * ⚠️ CE PRODUCTEUR N'EST PAS ENCORE CHOISI — SDK Firebase Android ou client REST maison
     * contre Identity Toolkit. La couche de données n'a pas à le trancher : elle exige
     * seulement de savoir SI la construction est complète, et de nommer ce qui manque. Le
     * vainqueur, lui, devra savoir forcer un rafraîchissement (voir `Appel`).
     */
    val valeursDeConstruction: Map<String, String?> = emptyMap(),
) {
    /**
     * `null` quand tout est là. Sinon, la phrase à afficher — qui NOMME les variables.
     */
    fun motifManquant(): String? {
        val manquantes = valeursDeConstruction.filterValues { it.isNullOrBlank() }.keys.sorted()
        if (manquantes.isEmpty()) return null
        return "Configuration de construction incomplète : ${manquantes.joinToString(", ")}."
    }

    companion object {
        const val API_BASE_PAR_DEFAUT: String = "https://api.maxmorrys.me"
    }
}
