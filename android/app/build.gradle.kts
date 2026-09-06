/**
 * ⛔ AUCUNE CLÉ N'ENTRE DANS LE DÉPÔT, ET AUCUN GREFFON `google-services` NON PLUS.
 *
 * Le chemin standard de Firebase sur Android — le greffon `com.google.gms.google-services`
 * plus un `google-services.json` — pose ici deux risques mesurés :
 *
 *   1. LA CI CASSERAIT. Le greffon échoue à la CONFIGURATION quand le fichier manque, et
 *      ce fichier n'existe nulle part dans ce dépôt. `ci.yml` ne le fournit pas.
 *   2. SA COMPATIBILITÉ AVEC AGP 9.4 N'EST PAS ÉTABLIE. Ce n'est pas une crainte
 *      gratuite : AGP 9 a déjà REFUSÉ le greffon `kotlin.android` dans ce projet même,
 *      avec un message qui ne laissait pas d'échappatoire.
 *
 * `FirebaseOptions` est donc construit à la main (`identite/Firebase.kt`), et ses trois
 * clés arrivent par `buildConfigField` — exactement comme le site reçoit ses six
 * `VITE_FIREBASE_*` par des secrets de CI.
 *
 * ⚠️ `providers.gradleProperty` PLUTÔT QU'UN FICHIER LU À LA MAIN. Le cache de
 * configuration est ACTIF (`gradle.properties`) : lire un fichier au moment de la
 * configuration produirait un cache que ce fichier n'invalide pas — les clés changeraient
 * sans que la construction s'en aperçoive. L'API des `providers`, elle, est suivie.
 *
 * Où poser les valeurs :
 *   · en local  → `~/.gradle/gradle.properties`, HORS du dépôt
 *   · en CI     → variables `ORG_GRADLE_PROJECT_FIREBASE_*`, depuis les secrets
 *
 * Une clé absente rend une chaîne VIDE, jamais une erreur de construction : c'est
 * `Configuration.motifManquant()` qui la nomme à l'exécution, et l'application le dit à
 * l'écran plutôt que d'échouer là où personne ne lit.
 */
fun cleDeConstruction(nom: String): String =
  providers.gradleProperty(nom).orNull
    ?: providers.environmentVariable(nom).orNull
    ?: ""

plugins {
  alias(libs.plugins.android.application)
  /*
   * ⚠️ PAS DE `kotlin.android` ICI. Depuis AGP 9.0, le support Kotlin est INTÉGRÉ au
   * greffon Android, et appliquer `org.jetbrains.kotlin.android` par-dessus fait échouer
   * la configuration : « no longer required for Kotlin support since AGP 9.0 ».
   * Les greffons de COMPILATEUR (Compose, sérialisation) restent nécessaires, eux.
   */
  alias(libs.plugins.kotlin.compose)
  alias(libs.plugins.kotlin.serialization)
}

android {
  namespace = "me.maxmorrys.rysmo"
  compileSdk = 36

  defaultConfig {
    /*
     * ⛔ TROIS IDENTITÉS QU'UNE RÉÉCRITURE PEUT DÉTRUIRE SANS BRUIT.
     *
     * 1 · `me.maxmorrys.rysmo` est déjà déclaré dans les liens profonds, dans le
     *     manifeste de confidentialité et dans `public/.well-known/assetlinks.json`.
     *     Le changer casserait toute continuité de mise à jour.
     *
     * 2 · La SIGNATURE. `assetlinks.json` publie l'empreinte SHA-256
     *     E7:CB:00:31:C2:9C:DD:C2:4B:2C:15:ED:57:B3:D7:7D:64:3E:59:47:49:BA:03:E8:46:C8:66:46:20:59:38:48
     *     — celle du keystore détenu par EAS (Build Credentials 8UyPdZw7WS). Signer
     *     la version Kotlin avec un keystore NEUF changerait cette empreinte : les
     *     App Links cesseraient d'être vérifiés et Play refuserait la mise à jour
     *     d'un paquet déjà publié. Le keystore doit être exporté d'EAS et réutilisé.
     *     ⚠️ Non résolu à ce jour — voir `_bmad-output/implementation-artifacts/deferred-work.md`.
     *
     * 3 · Le NUMÉRO DE VERSION. Le `versionCode` distant vaut 3 chez EAS
     *     (`appVersionSource: remote`). Play refuse un versionCode inférieur ou égal
     *     à un déjà téléversé : la première build native part donc de 4.
     */
    applicationId = "me.maxmorrys.rysmo"
    minSdk = 24
    targetSdk = 36
    versionCode = 4
    versionName = "1.0.0"

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    vectorDrawables { useSupportLibrary = true }

    /*
     * Les trois seules valeurs dont Firebase Auth a besoin. `storageBucket`,
     * `messagingSenderId` et `databaseUrl` du site ne servent qu'à Storage, FCM et Realtime
     * Database — dont aucun n'est utilisé ici.
     *
     * ⚠️ `FIREBASE_APP_ID` est de la forme `1:<sender>:android:<hash>` et n'existe QUE si
     * une application Android est enregistrée dans la console Firebase sous le paquet
     * `me.maxmorrys.rysmo`. C'est le seul geste qui ne peut pas être fait depuis ici.
     */
    buildConfigField("String", "FIREBASE_API_KEY", "\"${cleDeConstruction("FIREBASE_API_KEY")}\"")
    buildConfigField("String", "FIREBASE_APP_ID", "\"${cleDeConstruction("FIREBASE_APP_ID")}\"")
    buildConfigField("String", "FIREBASE_PROJECT_ID", "\"${cleDeConstruction("FIREBASE_PROJECT_ID")}\"")
  }

  buildTypes {
    debug {
      applicationIdSuffix = ".debug"
      versionNameSuffix = "-debug"
    }
    release {
      isMinifyEnabled = true
      isShrinkResources = true
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      /* ⚠️ Pas de `signingConfig` ici : la clé de production vit chez EAS et ne doit
         jamais entrer dans le dépôt. Une build locale de release sort donc NON signée. */
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
  kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }

  /* ⚠️ `buildConfig` est éteint par défaut depuis AGP 8 : sans cette ligne, les
     `buildConfigField` ci-dessus ne produisent rien et `BuildConfig` n'existe pas. */
  buildFeatures {
    compose = true
    buildConfig = true
  }

  packaging {
    resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" }
  }
}

dependencies {
  implementation(libs.core.ktx)
  implementation(libs.lifecycle.runtime.ktx)
  implementation(libs.lifecycle.viewmodel)
  implementation(libs.activity.compose)
  implementation(libs.splashscreen)

  implementation(platform(libs.compose.bom))
  implementation(libs.compose.ui)
  implementation(libs.compose.ui.graphics)
  implementation(libs.compose.ui.tooling.prev)
  implementation(libs.compose.foundation)
  /* ⚠️ material3 n'est là QUE pour ce que le design system ne réimplémente pas
     (ripple, gestion du focus, échafaudage de test). Le rendu appartient au kit :
     aucun écran ne doit peindre avec un `MaterialTheme.colorScheme`. */
  implementation(libs.compose.material3)

  implementation(libs.navigation.compose)
  implementation(libs.serialization.json)
  implementation(libs.okhttp)
  implementation(libs.datastore.preferences)

  /*
   * ⛔ CES DEUX-LÀ ÉTAIENT AU CATALOGUE SANS ÊTRE DÉCLARÉES, et la différence n'est pas
   * cosmétique : un catalogue de versions ne met RIEN sur le chemin de compilation. Trois
   * fichiers du lot 4 expliquent en commentaire qu'ils ne peuvent pas ouvrir d'onglet
   * personnalisé « parce qu'androidx.browser est au catalogue et pas en dépendance ». Ces
   * commentaires deviennent faux avec cette ligne — ils sont réécrits dans les mêmes fichiers.
   *
   * ⚠️ `biometric` FAIT FUSIONNER `USE_BIOMETRIC` ET `USE_FINGERPRINT` DEPUIS SON PROPRE
   * MANIFESTE, quoi qu'on écrive dans le nôtre. C'est le constat que le port React Native a
   * payé (`spec-biometrie.md`, journal de spécification) : le tableau des permissions ne
   * contrôle que ce qu'on AJOUTE, jamais ce que la fusion apporte. Les deux sont déjà
   * déclarées explicitement dans `AndroidManifest.xml` — donc visibles à la relecture — et
   * `USE_FINGERPRINT` y est plafonnée à l'API 27, où elle cesse de servir.
   */
  implementation(libs.biometric)
  implementation(libs.browser)

  /*
   * ⛔ FIREBASE AUTH — LE PRODUCTEUR DE JETON, ET RIEN D'AUTRE DE FIREBASE.
   *
   * Pas de Firestore : toutes les lectures passent par le Worker, qui refait ses propres
   * contrôles parce que l'accès REST par compte de service CONTOURNE `firestore.rules`.
   * Pas de Storage : les médias vivent sur R2. Pas de Messaging : aucune notification
   * n'est envoyée, et déclarer `POST_NOTIFICATIONS` pour une fonction absente est le
   * défaut qu'on refuse ailleurs.
   *
   * ⚠️ IL ENTRAÎNE `androidx.browser`, QU'ON DÉCLARE DÉJÀ. La nomenclature n'aligne que
   * les artefacts Google : c'est notre version qui gagne, et c'est voulu — l'onglet
   * personnalisé est à nous, pas à Firebase.
   */
  implementation(platform(libs.firebase.bom))
  implementation(libs.firebase.auth)

  debugImplementation(libs.compose.ui.tooling)
  debugImplementation(libs.compose.ui.test.manifest)

  testImplementation(libs.junit)
  androidTestImplementation(libs.androidx.junit)
  androidTestImplementation(libs.espresso.core)
  androidTestImplementation(platform(libs.compose.bom))
  androidTestImplementation(libs.compose.ui.test.junit4)
}
