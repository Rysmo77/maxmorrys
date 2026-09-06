package me.maxmorrys.rysmo.donnees

import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LIRE UNE VUE — une seule mécanique, pour tous les écrans.
 *
 * Le serveur ne renvoie pas des documents mais des VUES : des modèles déjà joints, déjà
 * calculés, et surtout DÉJÀ ESTAMPILLÉS. Chaque réponse porte son `releveA`, et c'est lui qui
 * date les nombres affichés. `releveA` est une porte de CI côté serveur : les 17 handlers le
 * posent, et un handler qui l'oublierait serait refusé.
 *
 * ⭐ CE QUE CETTE CLASSE GARANTIT, ET QUE LE PORT NE GARANTISSAIT PAS : LES DEUX CHEMINS
 * PRODUISENT LA MÊME PROVENANCE. Frais ou caché, `Provenance.asOf` est la chaîne du SERVEUR.
 * Là-bas, le chemin caché la reconstruisait depuis l'horloge du téléphone, et le même écran
 * datait donc ses nombres de deux façons selon qu'il avait touché le réseau.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
class LectureDeVue(
    @PublishedApi internal val appel: Appel,
    val cache: CacheDesVues,
) {

    /**
     * Lit une vue et rend son état.
     *
     * ⚠️ L'ORDRE DES SITUATIONS COMPTE, ET `Restauration` PASSE AVANT `Anonyme`. Avant le
     * premier verdict de la session, on ne SAIT pas s'il y a quelqu'un ; les confondre renvoie
     * vers la connexion quelqu'un de déjà connecté, le temps d'un battement.
     *
     * ⚠️ UN SUCCÈS DE CACHE NE PASSE PAS PAR `Charge`. C'est ce qui évite le clignotement :
     * l'écran ne vide pas son contenu pour le remplir avec le même.
     *
     * @param forcer vrai pour une reprise explicite — le seul cas où l'on repart alors qu'une
     *   entrée fraîche existe.
     */
    inline fun <reified T> lire(
        nomDeVue: String,
        session: Session,
        params: JsonObject = JsonObject(emptyMap()),
        forcer: Boolean = false,
    ): Etat<T> {
        when (session) {
            is Session.Restauration -> return Etat.Restauration
            is Session.Anonyme -> return Etat.Anonyme
            /* ⛔ PANNE SANS REPRISE. Le port posait ici une lambda vide : l'écran affichait
               « Réessayer » et le geste ne faisait RIEN. Le drapeau est dans l'état. */
            is Session.NonConfiguree ->
                return Etat.Panne(session.motif, CodeErreur.FAILED_PRECONDITION, reprenable = false)
            is Session.Connectee -> Unit
        }

        val complets = LectureDeVue.parametresComplets(nomDeVue, params)
        val cle = CacheDesVues.cle(session.uid, nomDeVue, complets)

        if (!forcer) {
            cache.lire(cle)?.let { entree ->
                /* ⭐ `entree.releveA` EST LA CHAÎNE DU SERVEUR, pas l'instant d'insertion.
                   C'est ici, exactement, que le port perdait la date. */
                return decoder(nomDeVue, entree.valeur, entree.releveA)
            }
        }

        return try {
            val brut = appel.appelerBrut(LectureDeVue.callableDe(nomDeVue), complets)
            val enveloppe = brut.jsonObject
            val charge = enveloppe["vue"] ?: JsonNull

            /*
             * ⛔ PAS DE REPLI SUR L'HORLOGE LOCALE. Le port faisait
             * `reponse.releveA ? new Date(reponse.releveA) : new Date()` — une date du téléphone
             * qui se présente comme une date du serveur. Une estampille manquante est une
             * VIOLATION DU CONTRAT côté serveur, pas un cas à combler : on le dit.
             */
            val releveA = enveloppe["releveA"]?.jsonPrimitive?.contentOrNull
                ?: throw ErreurAppel(
                    CodeErreur.INTERNAL,
                    "« $nomDeVue » a répondu sans `releveA` — un nombre n'existe pas sans sa date",
                    "Le serveur a répondu quelque chose d'inattendu.",
                    reprenable = true,
                )

            cache.poser(cle, nomDeVue, charge, releveA)
            decoder(nomDeVue, charge, releveA)
        } catch (echec: ErreurAppel) {
            /* Une panne n'est JAMAIS mise en cache : servir un échec pendant trente secondes
               ferait rater un geste que le serveur aurait accepté. */
            Etat.Panne(echec.motif, echec.code, echec.reprenable)
        } catch (echec: SerializationException) {
            /*
             * ⚠️ LE DÉCODAGE EST DANS LE `try`, ET CE N'EST PAS DE LA PRUDENCE DE STYLE. Les
             * types TypeScript sont effacés à l'exécution : rien ne pouvait échouer côté port.
             * Ici, un champ NON NULLABLE du contrat que le serveur cesserait d'envoyer ferait
             * TOMBER l'écran. Il devient une panne nommée — dégradée, pas morte.
             */
            Etat.Panne(
                "Le serveur a répondu quelque chose d'inattendu.",
                CodeErreur.INTERNAL,
                reprenable = true,
            )
        }
    }

    /** Décode la charge dans le type du contrat, ou produit `Vide` avec son SENS. */
    @PublishedApi
    internal inline fun <reified T> decoder(nomDeVue: String, charge: JsonElement, releveA: String): Etat<T> {
        val provenance = Provenance(Source.SERVEUR, releveA)
        if (estVide(charge)) return Etat.Vide(provenance, sensDuVide(nomDeVue))
        return Etat.Servie(Appel.JSON.decodeFromJsonElement<T>(charge), provenance)
    }

    companion object {
        /** `appClubListe.membre` s'appelle `appClubListe`. La table vient du contrat. */
        @PublishedApi
        internal fun callableDe(nomDeVue: String): String =
            Vues.CALLABLE[nomDeVue]
                ?: error("« $nomDeVue » n'est pas une vue du contrat.")

        /**
         * Les paramètres de l'appel, DISCRIMINANT COMPRIS.
         *
         * ⚠️ LE DISCRIMINANT EST POSÉ ICI, PAS À L'APPEL. La fiche de membre a été
         * INATTEIGNABLE parce que les écrans poussaient vers elle sans le paramètre qu'elle
         * exige : la vue jetait `invalid-argument`, l'écran sortait par sa branche courte, et
         * le bouton « Signaler ce profil » n'était jamais rendu. Ce qui est dans le contrat ne
         * doit pas dépendre de ce qu'un écran a pensé à passer.
         */
        @PublishedApi
        internal fun parametresComplets(nomDeVue: String, params: JsonObject): JsonObject {
            val discriminant = Vues.DISCRIMINANT[nomDeVue] ?: return params
            return buildJsonObject {
                params.forEach { (clef, valeur) -> put(clef, valeur) }
                put(discriminant.first, JsonPrimitive(discriminant.second))
            }
        }
    }
}
