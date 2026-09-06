package me.maxmorrys.rysmo.donnees

import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.Call
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE CLIENT `onCall` — une seule porte vers `api.maxmorrys.me`.
 *
 * Le protocole est celui de Firebase Functions, réimplémenté par le Worker
 * (`worker/packages/shared/src/oncall.ts`, relevé directement dans `@firebase/functions`) :
 *
 *   requête  POST  {"data": <charge>}   + `Authorization: Bearer <jeton>`
 *   succès   200   {"result": <charge>}
 *   erreur   4xx   {"error": {"status": "UNAUTHENTICATED", "message": …, "details": …}}
 *
 * ⚠️ L'ENVELOPPE EST PLUS STRICTE QUE « `{"data":…}` », et le manquement à n'importe laquelle
 * des quatre exigences donne le même `400` avec le message littéral « Bad Request »
 * (`oncall.ts:93-119`) : type MIME EXACTEMENT `application/json` (le charset est toléré, le
 * serveur coupe sur `;`), corps analysable, racine objet non nulle, et clé `data` DÉFINIE.
 * Conséquences : `{}` est REFUSÉ, `{"data":null}` est accepté, et un `Content-Type` posé par
 * défaut par la bibliothèque HTTP ferait échouer TOUTES les callables d'un coup, avec un
 * message qui ne dit pas pourquoi. Le corps est donc toujours `{"data": <objet>}` — vide si
 * l'appel n'a pas de paramètre, jamais absent.
 *
 * ── ⛔ LE CAS QUI A DÉJÀ COÛTÉ UNE PANNE DE PAIEMENT ─────────────────────────────────
 * Le Worker ne sert un nom que s'il figure dans sa liste `MIGRATED`. Sinon il RELAIE vers
 * `FUNCTIONS_ORIGIN`, où plus aucune Cloud Function n'est déployée — et Google répond une
 * PAGE HTML « 404 Page not found ». Un décodeur naïf lève une erreur de syntaxe, qui se
 * présente comme une panne de réseau : injoignable, alors que le serveur va très bien et que
 * le vrai défaut est un nom oublié dans une liste. C'est exactement ce qui est arrivé à
 * `createClubCharge`, et personne ne pouvait s'abonner au Club. On NOMME donc ce cas.
 *
 * ── ⚠️ CETTE CLASSE EST BLOQUANTE, ET C'EST DÉLIBÉRÉ ─────────────────────────────────
 * `kotlinx-coroutines` n'est pas au catalogue de versions du projet ; il n'arrive
 * qu'en transitif. Ramener `withContext(Dispatchers.IO)` ici ferait dépendre la couche de
 * données d'une version que personne ne déclare — et le jour où l'arbre change, c'est la
 * compilation qui casse, pas un test. Le choix du fil d'exécution appartient à la couche
 * au-dessus ; ici on ne fait que ne jamais être appelé depuis le fil principal.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
class Appel(
    private val config: Configuration,
    private val jetons: FournisseurDeJeton,
    private val reseau: DiagnosticReseau,
    private val client: OkHttpClient = clientParDefaut(),
    /** Horloge MONOTONE en nanosecondes. Injectée pour que le délai se teste sans attendre. */
    private val horloge: () -> Long = System::nanoTime,
) {

    /**
     * Appelle une callable et rend la charge utile déballée.
     *
     * ⚠️ DEUX NIVEAUX DE DÉBALLAGE, PAS UN. L'enveloppe du protocole porte `result` ; la charge
     * d'une VUE porte `vue` — le corps complet est `{"result":{"vue":…,"releveA":…}}`. Cette
     * méthode enlève le premier niveau, pas le second.
     *
     * Jette une [ErreurAppel] — jamais une exception nue : chaque échec porte son motif
     * lisible, pour que les écrans n'aient pas à réinventer une phrase chacun.
     */
    fun appelerBrut(nom: String, data: JsonObject = JsonObject(emptyMap())): JsonElement {
        config.motifManquant()?.let { motif ->
            /* Avant tout réseau : inutile de faire payer un aller-retour pour une construction
               qu'on sait incomplète. Et surtout, pas de reprise — aucun geste ne la répare. */
            throw ErreurAppel(CodeErreur.FAILED_PRECONDITION, motif, motif, reprenable = false)
        }

        return try {
            unTour(nom, data, forcerLeJeton = false)
        } catch (premier: ErreurAppel) {
            /*
             * ⛔ UN JETON EXPIRÉ ET UN JETON ABSENT SONT INDISCERNABLES. Le routeur n'exige
             * jamais de jeton : le vérificateur rend `null` — sans jamais lever — pour un jeton
             * absent, malformé, expiré, ou émis pour un autre projet (`verify.ts:40-61`), et
             * c'est chaque handler qui refuse. Le client ne peut donc pas distinguer « ta
             * session a expiré » de « tu n'es pas connectée » sur la seule réponse.
             *
             * D'où le rejeu : UNE fois, avec un rafraîchissement FORCÉ. Un second `401`
             * seulement fait basculer la session en anonyme. Le port n'avait pas ce rejeu — il
             * s'appuyait sur le rafraîchissement automatique du SDK JS, qui ne se transpose pas
             * tant que le producteur de jeton natif n'est pas choisi.
             */
            if (premier.code != CodeErreur.UNAUTHENTICATED) throw premier
            unTour(nom, data, forcerLeJeton = true)
        }
    }

    private fun unTour(nom: String, data: JsonObject, forcerLeJeton: Boolean): JsonElement {
        /* Le nom d'une callable ne peut pas être un chemin : le routeur refuse tout nom vide
           ou contenant un « / » (`index.ts:87`). `/app/moi` est un 404 ; `/appMoi` est la
           callable. Le vérifier ici évite d'aller chercher la réponse pour l'apprendre. */
        require(nom.isNotEmpty() && !nom.contains('/')) {
            "Nom de callable illégal : « $nom ». Le routeur refuse un nom vide ou contenant un « / »."
        }

        val corps = buildJsonObject { put("data", data) }.toString()

        val requete = Request.Builder()
            .url("${config.apiBase}/$nom")
            .post(corps.toRequestBody(TYPE_JSON))
            .apply {
                jetons.jeton(forcerLeJeton)?.let { header("Authorization", "Bearer $it") }
            }
            .build()

        val appel = client.newCall(requete)
        val debut = horloge()

        val reponse = try {
            appel.execute()
        } catch (echec: IOException) {
            throw echecDeTransport(nom, appel, debut, echec)
        }

        reponse.use { r ->
            val texte = try {
                r.body?.string() ?: ""
            } catch (echec: IOException) {
                throw echecDeTransport(nom, appel, debut, echec)
            }
            return lire(nom, r.code, r.isSuccessful, texte)
        }
    }

    /**
     * ══════════════════════════════════════════════════════════════════════════════════
     * QUATRE CAUSES, QUATRE GESTES — l'échec de transport cesse d'être une phrase unique.
     *
     * Le port répondait « Pas de connexion. » à tout. La phrase est fausse la moitié du temps,
     * et sa fausseté COÛTE quelque chose : elle envoie vérifier un forfait, recharger du
     * crédit, chercher une meilleure antenne — pendant que le serveur, lui, est en train de
     * tomber.
     *
     * ⚠️ SON EN-TÊTE ANNONÇAIT « TROIS CAUSES, TROIS GESTES » ; SON CODE EN DISTINGUAIT QUATRE.
     * La quatrième est la plus honnête : elle dit qu'on NE SAIT PAS. La perdre, c'est se
     * remettre à accuser le forfait de quelqu'un sur une mesure qu'on n'a pas pu faire.
     *
     * ── ⛔ LE DÉLAI SE RECONNAÎT AU SIGNAL QU'ON A POSÉ SOI-MÊME, JAMAIS AU NOM DE LA CLASSE ──
     * Le port a payé cette leçon en trois exemplaires : selon le drapeau de socle et la version
     * du SDK, un même dépassement se présentait comme `TimeoutError`, `AbortError` ou une
     * erreur nommée `Error`. La solution était de retenir le signal et de l'interroger après
     * coup. OkHttp lève, lui, un `InterruptedIOException` stable — mais la leçon ne porte pas
     * sur la stabilité du nom, elle porte sur la SOURCE de la décision : on décide à partir de
     * la limite qu'on a posée, pas du type que la bibliothèque a choisi. Ici, ce sont
     * `appel.isCanceled()` (que le délai d'appel d'OkHttp met à vrai en annulant) et l'écoulé
     * mesuré nous-mêmes.
     *
     * ── ET L'ÉTAT DU RÉSEAU N'EST LU QU'ENSUITE ────────────────────────────────────────
     * Un appel qui dépasse vingt secondes n'a rien à dire du réseau : on tenait la connexion
     * assez longtemps pour attendre. Interroger le système sur ce chemin ajouterait une lecture
     * pour une réponse qui ne changerait pas le motif.
     * ══════════════════════════════════════════════════════════════════════════════════════
     */
    private fun echecDeTransport(nom: String, appel: Call, debutNs: Long, echec: IOException): ErreurAppel {
        val trace = echec.message ?: echec.javaClass.simpleName
        val ecouleMs = (horloge() - debutNs) / 1_000_000

        if (appel.isCanceled() || ecouleMs >= DELAI_MS) {
            return ErreurAppel(
                CodeErreur.DEADLINE_EXCEEDED,
                "Délai de $DELAI_MS ms dépassé sur $nom (écoulé $ecouleMs ms) — $trace",
                "Le serveur met trop de temps.",
                reprenable = true,
            )
        }

        return when (reseau.etat()) {
            EtatReseau.ABSENT -> ErreurAppel(
                CodeErreur.UNAVAILABLE,
                "Aucun réseau au moment de $nom — $trace",
                "Ton téléphone n'a pas de réseau.",
                reprenable = true,
            )
            /* Le téléphone a du réseau et l'appel n'est pas parti : c'est l'autre bout. Le dire
               évite le seul geste inutile — aller vérifier son forfait. */
            EtatReseau.PRESENT -> ErreurAppel(
                CodeErreur.UNAVAILABLE,
                "Réseau présent, $nom injoignable — $trace",
                "Le serveur ne répond pas.",
                reprenable = true,
            )
            EtatReseau.INDETERMINE -> ErreurAppel(
                CodeErreur.UNAVAILABLE,
                "Transport indisponible pour $nom — $trace",
                MOTIF_INDETERMINE,
                reprenable = true,
            )
        }
    }

    /** Séparé du transport pour être testable sans réseau : c'est la moitié qui décode. */
    internal fun lire(nom: String, statut: Int, succes: Boolean, texte: String): JsonElement {
        val debut = texte.trimStart()

        /*
         * ⛔ ON EXAMINE LE CORPS AVANT DE LE DÉCODER. Sur ce chemin, la cause de très loin la
         * plus probable est le relais mort : le corps est alors le HTML de Google. On le dit
         * tel quel plutôt que de le maquiller en panne réseau — c'est un défaut de
         * configuration SERVEUR, et il se corrige en une ligne quand on sait le lire.
         */
        if (debut.isEmpty() || (debut[0] != '{' && debut[0] != '[')) {
            val html = debut.startsWith("<")
            throw ErreurAppel(
                CodeErreur.INTERNAL,
                if (html) "« $nom » a répondu du HTML, pas du JSON — le nom est probablement absent de MIGRATED"
                else "Réponse illisible de « $nom » (HTTP $statut)",
                "Le serveur a répondu quelque chose d'inattendu.",
                reprenable = true,
            )
        }

        val racine = try {
            JSON.parseToJsonElement(texte).jsonObject
        } catch (erreur: IllegalArgumentException) {
            throw ErreurAppel(
                CodeErreur.INTERNAL,
                "Réponse illisible de « $nom » (HTTP $statut) — ${erreur.message}",
                "Le serveur a répondu quelque chose d'inattendu.",
                reprenable = true,
            )
        }

        (racine["error"] as? JsonObject)?.let { erreur ->
            val code = CodeErreur.depuisLeStatut(erreur["status"]?.jsonPrimitive?.contentOrNull)
            val message = erreur["message"]?.jsonPrimitive?.contentOrNull ?: ""
            throw ErreurAppel(
                code,
                message.ifBlank { "Échec de $nom" },
                motifLisible(code, message),
                estReprenable(code),
                details = erreur["details"] as? JsonObject,
            )
        }

        /* Un HTTP non 2xx sans corps `error` : le serveur a refusé sans dire pourquoi. On ne
           lui invente pas de raison, et on garde le statut dans la trace. */
        if (!succes) {
            throw ErreurAppel(
                CodeErreur.INCONNU,
                "HTTP $statut sur $nom",
                "Le serveur a refusé la demande.",
                reprenable = true,
            )
        }

        /*
         * ⚠️ `result` D'ABORD, `data` EN REPLI — ET L'INVERSE SERAIT UNE ERREUR DE CONSTRUCTION.
         * Le port lisait `data ?? result` « dans l'ordre que le client Firebase applique
         * lui-même ». C'est exact POUR LE SDK. Mais `callableResult` (`oncall.ts:122-127`)
         * n'écrit QUE `result` : il n'existe aucun chemin dans `worker/apps/api/src` qui
         * produise une enveloppe `data`. Le repli ne coûte rien et protège d'un retour au SDK ;
         * bâtir quoi que ce soit qui SUPPOSE `data` serait faux.
         *
         * Et un handler qui ne renvoie rien produit `{"result": null}`, pas un corps vide.
         */
        return racine["result"] ?: racine["data"] ?: JsonNull
    }

    companion object {
        /** Repris du port, pas revalidé contre une mesure — c'est nommé, pas oublié. */
        const val DELAI_MS: Long = 20_000

        /** Ce qu'on dit quand on ne sait PAS, et rien d'autre. */
        const val MOTIF_INDETERMINE: String = "Pas de connexion."

        internal val TYPE_JSON = "application/json".toMediaType()

        /**
         * ⛔ IGNORER LES CLÉS INCONNUES N'EST PAS UNE TOLÉRANCE, C'EST LA SURVIE DES VERSIONS
         * INSTALLÉES. Sans ce réglage, AJOUTER un champ côté serveur casse toutes les
         * applications déjà installées, d'un coup, sans qu'aucun client ne soit déployé. Le
         * serveur ajoute des champs : `niveau` a été ajouté à `appCours` pour sortir le niveau
         * de la chaîne d'affichage `meta`.
         */
        val JSON: Json = Json {
            ignoreUnknownKeys = true
            explicitNulls = false
            isLenient = false
        }

        /**
         * ⚠️ UNE SEULE LIMITE, ET C'EST LA NÔTRE.
         *
         * Les délais par défaut d'OkHttp (10 s de lecture, 10 s de connexion) tomberaient AVANT
         * le délai d'appel de 20 s : un serveur lent produirait alors un échec à ~10 s, que
         * notre diagnostic ne reconnaîtrait pas comme un dépassement — il dirait « le serveur ne
         * répond pas » là où il faut dire « le serveur met trop de temps ». Les autres limites
         * sont donc désactivées et `callTimeout` est la seule qui décide, ce qui est exactement
         * la règle : on décide à partir de la limite qu'on a posée soi-même.
         */
        fun clientParDefaut(): OkHttpClient = OkHttpClient.Builder()
            .callTimeout(DELAI_MS, TimeUnit.MILLISECONDS)
            .connectTimeout(0, TimeUnit.MILLISECONDS)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .writeTimeout(0, TimeUnit.MILLISECONDS)
            .build()
    }
}

/**
 * Le jeton d'identité de l'appel en cours, ou `null` s'il n'y a personne.
 *
 * ⚠️ LE PRODUCTEUR N'EST PAS ENCORE CHOISI — SDK Firebase Android (lourd, mais gère le
 * rafraîchissement et la persistance) ou client REST maison contre Identity Toolkit (ce que
 * fait déjà le Worker côté serveur). Le port avait tranché pour le SDK, mais pour une raison
 * MÉCANIQUE qui ne se transpose pas : sous React Native, `getAuth()` donne une persistance en
 * mémoire.
 *
 * Ce que la couche de données EXIGE du vainqueur, quel qu'il soit : savoir forcer un
 * rafraîchissement. Sans ça, le rejeu unique sur `401` ne peut pas exister, et un jeton
 * expiré déconnecte quelqu'un qui était parfaitement connecté.
 */
fun interface FournisseurDeJeton {
    fun jeton(forcerRafraichissement: Boolean): String?
}

/** Décode la charge d'une callable dans le type que le contrat lui donne. */
inline fun <reified T> Appel.appeler(nom: String, data: JsonObject = JsonObject(emptyMap())): T =
    Appel.JSON.decodeFromJsonElement(appelerBrut(nom, data))
