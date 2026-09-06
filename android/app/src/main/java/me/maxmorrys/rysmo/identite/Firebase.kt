package me.maxmorrys.rysmo.identite

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import me.maxmorrys.rysmo.BuildConfig
import me.maxmorrys.rysmo.donnees.Configuration

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * FIREBASE, CONSTRUIT À LA MAIN — sans greffon Gradle et sans `google-services.json`.
 *
 * Le chemin standard pose ici deux risques mesurés, écrits en tête de `build.gradle.kts` :
 * le greffon `com.google.gms.google-services` échoue à la CONFIGURATION quand le fichier
 * manque — et il manquerait en CI —, et sa compatibilité avec AGP 9.4 n'est pas établie
 * dans ce projet, qui a déjà vu AGP 9 refuser un autre greffon sans échappatoire.
 *
 * `FirebaseOptions` accepte les trois valeurs directement. C'est exactement ce que le
 * fichier JSON aurait fourni, moins le fichier.
 *
 * ⛔ `firebase-auth` ET RIEN D'AUTRE DE FIREBASE. Pas de Firestore — toutes les lectures
 * passent par le Worker, qui refait ses propres contrôles parce que l'accès REST par compte
 * de service CONTOURNE `firestore.rules`. Pas de Storage — les médias vivent sur R2. Pas de
 * Messaging — aucune notification n'est envoyée.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Le nom de l'instance. `[DEFAULT]` est réservé à `FirebaseApp.initializeApp(context)`. */
private const val NOM_INSTANCE = "rysmo"

/**
 * Les trois clés attendues, et le nom sous lequel `motifManquant()` les citera.
 *
 * ⚠️ CE SONT LES NOMS QUE QUELQU'UN LIRA À L'ÉCRAN quand la construction est incomplète.
 * Ils doivent donc désigner ce qu'il faut aller chercher — la clé de construction, pas une
 * abstraction. C'est aussi ce que gardait `mobile-app-config.test.ts` : « les six clés
 * présentes à l'export », la porte qui empêchait un binaire incomplet d'atteindre un magasin.
 */
fun configurationDIdentite(): Configuration = Configuration(
    valeursDeConstruction = mapOf(
        "FIREBASE_API_KEY" to BuildConfig.FIREBASE_API_KEY.ifBlank { null },
        "FIREBASE_APP_ID" to BuildConfig.FIREBASE_APP_ID.ifBlank { null },
        "FIREBASE_PROJECT_ID" to BuildConfig.FIREBASE_PROJECT_ID.ifBlank { null },
    ),
)

/**
 * L'instance Firebase du processus, ou `null` si la construction est incomplète.
 *
 * ⚠️ RENDRE `null` PLUTÔT QUE LEVER. Une construction sans clés n'est pas une panne à
 * signaler par un plantage : c'est un état que `Configuration.motifManquant()` sait nommer
 * et que l'écran sait afficher. Lever ici ferait mourir l'application au démarrage sur un
 * défaut de chaîne de compilation — le pire endroit pour l'apprendre.
 */
@Volatile
private var instance: FirebaseApp? = null

@Synchronized
fun firebaseOuNull(contexte: Context): FirebaseApp? {
    instance?.let { return it }
    if (configurationDIdentite().motifManquant() != null) return null

    val options = FirebaseOptions.Builder()
        .setApiKey(BuildConfig.FIREBASE_API_KEY)
        .setApplicationId(BuildConfig.FIREBASE_APP_ID)
        .setProjectId(BuildConfig.FIREBASE_PROJECT_ID)
        .build()

    /*
     * ⚠️ `initializeApp` LÈVE SI LE NOM EST DÉJÀ PRIS, et le rattraper n'est pas de la
     * paresse : deux chemins peuvent monter l'identité — l'activité au démarrage, et un
     * test d'instrumentation. Le second appel doit rendre la même instance, pas mourir.
     *
     * `applicationContext` : un contexte d'activité retenu par un objet de processus
     * fuirait l'activité entière à chaque rotation.
     */
    val app = runCatching { FirebaseApp.initializeApp(contexte.applicationContext, options, NOM_INSTANCE) }
        .getOrElse { runCatching { FirebaseApp.getInstance(NOM_INSTANCE) }.getOrNull() }

    return app?.also { instance = it }
}

/** L'authentification, ou `null` si la construction est incomplète. */
fun authOuNull(contexte: Context): FirebaseAuth? =
    firebaseOuNull(contexte)?.let(FirebaseAuth::getInstance)
