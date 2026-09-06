package me.maxmorrys.rysmo.donnees

import kotlinx.serialization.json.JsonObject

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES ERREURS — un code pour brancher, un motif pour lire, et jamais l'inverse.
 *
 * ⛔ ON NE MONTRE JAMAIS UN CODE BRUT : un code ne dit à personne quoi faire. `ErreurAppel`
 * sépare donc deux choses qui ne doivent jamais se confondre : `message` part dans la trace,
 * `motif` s'affiche.
 *
 * ⭐ DIX CODES CANONIQUES, ET LE DIXIÈME EST UN TROU REFERMÉ. Le port en portait neuf. Il lui
 * manquait `already-exists`, que le serveur lève sur TROIS des cinq callables de PAIEMENT
 * (`payments.ts:149,182,185,325`) plus `admin.ts:141`. Rien ne cassait — `versCode` le
 * ramenait à `INCONNU` et le message du serveur s'affichait — mais le client ne pouvait pas
 * BRANCHER dessus, alors que c'est précisément le cas « tu es déjà membre actif du Club »,
 * qui doit mener ailleurs qu'à un écran d'erreur.
 *
 * ⚠️ ET `deadline-exceeded` N'EST JAMAIS LEVÉ PAR CE SERVEUR. Vérifié : sur les 17 codes de
 * `HttpsErrorCode`, neuf seulement sont levés dans `worker/apps/api/src`, et celui-là n'en
 * fait pas partie. C'est le CLIENT qui le fabrique, pour son propre délai, et lui seul.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
enum class CodeErreur(val jeton: String) {
    UNAUTHENTICATED("unauthenticated"),
    PERMISSION_DENIED("permission-denied"),
    NOT_FOUND("not-found"),
    INVALID_ARGUMENT("invalid-argument"),
    RESOURCE_EXHAUSTED("resource-exhausted"),
    FAILED_PRECONDITION("failed-precondition"),
    ALREADY_EXISTS("already-exists"),
    UNAVAILABLE("unavailable"),

    /**
     * ⚠️ FABRIQUÉ PAR LE CLIENT SEUL. Le serveur ne le lève jamais ; il porte notre propre
     * dépassement de délai. Le recevoir DU serveur reste possible en théorie (le protocole
     * le définit), et le mapping le traite alors comme `UNAVAILABLE` — même geste offert.
     */
    DEADLINE_EXCEEDED("deadline-exceeded"),
    INTERNAL("internal"),

    /** Le serveur a dit un code que cette version ne connaît pas. */
    INCONNU("inconnu");

    companion object {
        /**
         * `UNAUTHENTICATED` → `UNAUTHENTICATED`, `RESOURCE_EXHAUSTED` → `RESOURCE_EXHAUSTED`.
         *
         * ⚠️ LE SERVEUR ÉCRIT LE NOM CANONIQUE EN MAJUSCULES_SOULIGNÉES (`oncall.ts:60-62`),
         * jamais la forme à tirets. Un client qui comparerait à `resource-exhausted` ne
         * reconnaîtrait RIEN, et tous les messages d'erreur deviendraient inexploitables sans
         * qu'aucune exception ne se produise.
         */
        fun depuisLeStatut(statut: String?): CodeErreur {
            if (statut == null) return INCONNU
            val tirets = statut.lowercase().replace('_', '-')
            return entries.firstOrNull { it.jeton == tirets } ?: INCONNU
        }
    }
}

/**
 * Un échec d'appel, avec ce qui part dans la trace ET ce que la personne lit.
 *
 * `details` porte la charge structurée que le serveur joint à `resource-exhausted` — le seul
 * endroit qui en fournit (`lib/rysmo-quota.ts:231-244`), et il le fait pour que le client
 * puisse PROPOSER L'ACHAT plutôt qu'afficher un mur.
 *
 * ⚠️ `details.upgradeUrl` EST UN CHEMIN DU SITE WEB, pas une route de l'application. Le
 * traduire en destination locale est obligatoire ; l'ouvrir tel quel a déjà produit trois
 * cartes pointant vers des routes du site inexistantes côté natif.
 */
class ErreurAppel(
    val code: CodeErreur,
    message: String,
    /** Ce que la personne lit. Distinct du message technique. */
    val motif: String,
    /** Vrai quand un nouveau geste a une chance d'aboutir. Alimente `Etat.Panne.reprenable`. */
    val reprenable: Boolean,
    /**
     * ⚠️ TYPÉ `JsonObject`, PAS `Map<String, Any?>`. Un `Map<String, Any?>` accepterait le même
     * argument — `JsonObject` en est un, la covariance le permet — mais il rendrait `Any?` à la
     * lecture, et le détail structuré redeviendrait une devinette côté écran. Le compilateur ne
     * l'aurait pas dit : c'est un test qui l'a dit.
     */
    val details: JsonObject? = null,
) : Exception(message)

/**
 * Ce qu'on montre.
 *
 * ⭐ LE MESSAGE DU SERVEUR EST PRÉFÉRÉ QUAND IL EXISTE, et ce n'est pas un repli paresseux :
 * les handlers écrivent en français, POUR ÊTRE LUS — « Tu n'es pas inscrite à cette
 * formation. » (`marquerLecon.ts:62`). Les motifs codés en dur ci-dessous ne remplacent que
 * les codes dont le message serveur est technique ou absent.
 */
fun motifLisible(code: CodeErreur, messageDuServeur: String): String = when (code) {
    CodeErreur.UNAUTHENTICATED -> "Ta session a expiré."
    CodeErreur.PERMISSION_DENIED -> "Ton compte n'a pas accès à ça."
    CodeErreur.NOT_FOUND -> "Ça n'existe pas, ou plus."
    CodeErreur.RESOURCE_EXHAUSTED -> "Tu as atteint la limite pour aujourd'hui."
    CodeErreur.UNAVAILABLE, CodeErreur.DEADLINE_EXCEEDED -> "Le serveur ne répond pas."
    /* ⚠️ `already-exists` GARDE LE MESSAGE DU SERVEUR, délibérément. « Tu es déjà membre
       actif du Club » n'est pas une erreur à afficher en rouge : c'est une information dont
       l'écran doit tirer une DESTINATION. Un motif générique la détruirait. */
    else -> messageDuServeur.ifBlank { "Quelque chose a échoué côté serveur." }
}

/**
 * Le geste a-t-il une chance d'aboutir en le refaisant ?
 *
 * ⛔ C'EST CE DRAPEAU QUI EMPÊCHE UN BOUTON MORT. Le port affichait « Réessayer » sur une
 * panne de configuration de build, où le geste ne pouvait RIEN faire.
 */
fun estReprenable(code: CodeErreur): Boolean = when (code) {
    /* Refaire l'appel peut aboutir : c'est le réseau, le serveur ou le délai qui a fléchi. */
    CodeErreur.UNAVAILABLE, CodeErreur.DEADLINE_EXCEEDED, CodeErreur.INTERNAL, CodeErreur.INCONNU -> true
    /* Le second `401` après rejeu : la reprise passe par la reconnexion, pas par le bouton. */
    CodeErreur.UNAUTHENTICATED -> false
    /* Un refus, une absence, un argument invalide, un quota atteint, un doublon : refaire
       le même geste donnerait exactement la même réponse. */
    else -> false
}
