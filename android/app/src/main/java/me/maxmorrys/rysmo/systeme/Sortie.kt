package me.maxmorrys.rysmo.systeme

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabColorSchemeParams
import androidx.browser.customtabs.CustomTabsClient
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.ui.graphics.toArgb
import androidx.core.net.toUri
import me.maxmorrys.rysmo.ds.PALETTE_CLAIRE
import me.maxmorrys.rysmo.ds.PALETTE_SOMBRE

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * SORTIR DE L'APPLICATION — UN SEUL ENDROIT, PARCE QU'IL Y EN AVAIT QUATRE.
 *
 * Avant ce fichier, la même douzaine de lignes vivait en quatre exemplaires :
 * `ecrans/compte/Legal.kt` (privée), `ecrans/media/Commun.kt` (interne), la feuille de
 * partage d'`ecrans/apprentissage/Commun.kt` et celle d'`ecrans/club/Informations.kt`. Le
 * commentaire de `media/Commun.kt` le disait déjà noir sur blanc : « DUPLICATION CONNUE …
 * les deux devraient se rejoindre dans un seul utilitaire de sortie ». Elles se rejoignent
 * ici, et c'est ce fichier qui porte les trois pièges mesurés ci-dessous.
 *
 * ── ⛔ PIÈGE 1 · CERTAINES ADRESSES DU SITE NOUS APPARTIENNENT ──────────────────────────
 * `AndroidManifest.xml` déclare `maxmorrys.me/formations` et `maxmorrys.me/verifier` en App
 * Links VÉRIFIÉS (`autoVerify="true"`). Un `Intent.ACTION_VIEW` sur ces adresses-là se
 * résout SUR NOUS : l'écran rouvre l'application sur elle-même, sans erreur, sans rien dans
 * la trace, et la personne a seulement l'impression que « le bouton ne fait rien ».
 *
 * ⚠️ MA PREMIÈRE VERSION NE POSAIT CE GARDE QUE SUR LE REPLI, et le raisonnement avait l'air
 * bon : un onglet personnalisé porte le paquet du navigateur EXPLICITEMENT, donc il ne peut
 * pas revenir sur nous. C'est exact et ça rate le point — le premier essai cherche une
 * application INSTALLÉE qui revendique l'adresse, et sur ces deux préfixes cette application
 * EST cette application. Le garde précède donc les trois essais.
 *
 * ── ⛔ PIÈGE 2 · UN ONGLET PERSONNALISÉ VOLE L'ADRESSE DE QUELQU'UN D'AUTRE ────────────
 * Il désigne un NAVIGATEUR. Ouvert sur `wa.me`, que WhatsApp déclare en lien applicatif, il
 * sert la page web au lieu d'ouvrir la conversation — sur « En parler sur WhatsApp », qui est
 * la conversion de l'offre Présence Digitale. Même perte sur `open.spotify.com`, qui est la
 * seule façon d'écouter un épisode tant que l'audio n'est pas hébergé. L'onglet est un
 * progrès POUR NOS PAGES et une régression sur celles des autres : l'application installée
 * passe donc avant.
 *
 * ── ⛔ PIÈGE 3 · L'ADRESSE VIENT PARFOIS DU SERVEUR ────────────────────────────────────
 * `video.lien` et `episode.lien` sont des champs de vue : personne ici ne choisit ce qu'ils
 * contiennent. Un garde qui ne vaudrait que pour les adresses écrites dans le code laisserait
 * passer précisément celles qu'on ne relit pas.
 *
 * ── ⚠️ CE QUI CHANGE POUR QUI LISAIT LE CODE D'AVANT ──────────────────────────────────
 * Trois fichiers du lot 4 expliquent en commentaire que l'onglet personnalisé est impossible
 * « parce qu'`androidx.browser` est au catalogue et pas en dépendance ». C'était vrai ; ça ne
 * l'est plus (`app/build.gradle.kts`). Le geste ne quitte donc plus toujours l'application
 * pour de bon — mais le glyphe « sortant » reste juste : un onglet personnalisé EST une
 * sortie, avec son chrome de navigateur et son propre bouton de fermeture.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⛔ LE MIROIR DES APP LINKS — et `tests/unit/natif-capacites.test.ts` refuse qu'il diverge.
 *
 * Ces deux listes recopient `AndroidManifest.xml`. C'est un miroir, donc une dette : ce dépôt
 * en a déjà payé le prix (le prix du Club à treize endroits, le numéro WhatsApp dans neuf
 * fichiers). La seule chose qui distingue un miroir tolérable d'une dérive silencieuse est
 * qu'une porte rougisse quand les deux côtés ne disent plus la même chose.
 *
 * ⚠️ ET LE MANIFESTE COMBINE SES `data` EN PRODUIT CROISÉ : 2 hôtes × 2 préfixes = 4 adresses.
 * La lecture ci-dessous fait la même chose — n'importe quel hôte avec n'importe quel préfixe —
 * parce que c'est ce qu'Android fait, pas ce qui serait joli.
 */
internal val HOTES_APPLICATIFS: List<String> = listOf("maxmorrys.me", "www.maxmorrys.me")

/** Les préfixes que cette application déclare et vérifie. Voir `HOTES_APPLICATIFS`. */
internal val PREFIXES_APPLICATIFS: List<String> = listOf("/formations", "/verifier")

/**
 * Ce qu'il est advenu d'une demande de sortie.
 *
 * ⛔ QUATRE RÉPONSES, PAS UN BOOLÉEN. Un booléen confondrait « aucune application ne sait
 * ouvrir ça » avec « cette adresse est à nous » — deux causes qui appellent deux corrections
 * opposées : la première est l'état d'un téléphone, la seconde est un défaut de code.
 */
enum class ResultatDeSortie {
    /**
     * ⭐ Une application INSTALLÉE revendiquait cette adresse et l'a eue — WhatsApp pour
     * `wa.me`, Spotify pour `open.spotify.com`. C'est le meilleur des quatre, et c'est
     * pour lui que l'ordre des essais est ce qu'il est.
     */
    APPLICATION,

    /** Un onglet personnalisé s'est ouvert, au-dessus de l'application. */
    ONGLET,

    /** Ni application ni onglet : le navigateur a pris la main. */
    NAVIGATEUR,

    /** Personne sur ce téléphone ne sait ouvrir une adresse web. */
    AUCUNE_APPLICATION,

    /**
     * ⛔ L'adresse est un de NOS App Links vérifiés et aucun onglet personnalisé n'existe :
     * un `ACTION_VIEW` reviendrait sur l'application. On ne l'envoie pas.
     */
    REVIENDRAIT_SUR_NOUS,
}

/** Vrai quand quelque chose s'est vraiment ouvert. Les écrans ne demandent que ça. */
val ResultatDeSortie.aOuvert: Boolean
    get() = this == ResultatDeSortie.APPLICATION ||
        this == ResultatDeSortie.ONGLET ||
        this == ResultatDeSortie.NAVIGATEUR

/**
 * Vrai si cette adresse est une de celles que le manifeste déclare et vérifie.
 *
 * ⚠️ LA COMPARAISON EST FAITE SUR L'URI ANALYSÉE, jamais sur la chaîne. `"https://maxmorrys.me
 * .attaquant.example/formations"` commence par la bonne sous-chaîne et n'est pas notre hôte ;
 * `"HTTPS://MAXMORRYS.ME/formations"` est le nôtre et ne commence pas par la bonne sous-chaîne.
 * Un `startsWith` sur l'adresse entière se trompe donc dans les deux sens.
 */
internal fun estUneAdresseDeCetteApplication(adresse: String): Boolean = try {
    val uri = adresse.toUri()
    val schema = uri.scheme?.lowercase()
    val hote = uri.host?.lowercase()
    val chemin = uri.path.orEmpty()
    schema == "https" &&
        hote in HOTES_APPLICATIFS &&
        PREFIXES_APPLICATIFS.any { chemin == it || chemin.startsWith("$it/") }
} catch (_: RuntimeException) {
    /* Une adresse illisible n'est certainement pas une des nôtres, et cette fonction est
       appelée sur un chemin d'erreur : elle ne doit pas remplacer l'échec par le sien. */
    false
}

/**
 * Ouvre une adresse hors de l'application.
 *
 * ⛔ TROIS ESSAIS, DANS CET ORDRE, ET L'ORDRE EST LA PARTIE QUI COMPTE.
 *
 *   0 · si l'adresse est une des NÔTRES, on ne sort pas du tout ;
 *   1 · si une APPLICATION INSTALLÉE la revendique, elle l'a ;
 *   2 · sinon un onglet personnalisé, s'il existe un navigateur qui en sert ;
 *   3 · sinon le navigateur, tel que le système le résout.
 *
 * ⛔ L'ÉTAPE 1 A FAILLI ÊTRE OUBLIÉE, ET C'ÉTAIT UNE RÉGRESSION SUR LE GESTE LE PLUS UTILISÉ
 * DU PRODUIT. Un onglet personnalisé porte le paquet d'un NAVIGATEUR : `wa.me`, que WhatsApp
 * déclare en lien applicatif, se serait ouvert dans le navigateur au lieu de WhatsApp — sur
 * « En parler sur WhatsApp », qui est la conversion de l'offre Présence Digitale. Même chose
 * pour `open.spotify.com`, qui est la seule façon d'écouter un épisode tant que l'audio n'est
 * pas hébergé. L'onglet personnalisé est un progrès POUR NOS PAGES ; il est une perte sur
 * l'adresse de quelqu'un d'autre.
 *
 * ⚠️ AUCUN `Intent.ACTION_VIEW` NE DOIT ÊTRE CONSTRUIT AILLEURS. C'est ce que garde
 * `natif-capacites.test.ts` : la duplication d'avant n'était pas dangereuse parce qu'elle
 * était longue, elle l'était parce que le garde des App Links n'existait que dans deux copies
 * sur trois.
 */
fun ouvrirUneAdresse(contexte: Context, adresse: String): ResultatDeSortie {
    /*
     * ⛔ LE GARDE EST INCONDITIONNEL, ET C'EST UN CHANGEMENT PAR RAPPORT À MA PREMIÈRE
     * VERSION. Je l'avais posé sur le seul repli, en raisonnant qu'un onglet personnalisé ne
     * peut pas revenir sur nous. C'est exact, et ça rate le point : l'étape 1 ci-dessous
     * cherche une application qui revendique l'adresse, et pour `/formations` comme pour
     * `/verifier` CETTE APPLICATION EST CETTE APPLICATION. Le garde doit donc précéder les
     * trois essais, pas seulement le dernier.
     *
     * ⚠️ Et « ne pas sortir » est la bonne réponse, pas un pis-aller : ces adresses ont une
     * destination dans le graphe. Les ouvrir dans un navigateur donnerait une version web de
     * l'écran qu'on est déjà en train de regarder.
     */
    if (estUneAdresseDeCetteApplication(adresse)) return ResultatDeSortie.REVIENDRAIT_SUR_NOUS

    if (uneApplicationRevendique(contexte, adresse)) {
        /* Elle l'a. On ne pose PAS de paquet explicite : c'est le système qui choisit entre
           plusieurs revendiquants, et c'est son travail, pas le nôtre. */
        essayerLeSysteme(contexte, adresse)?.let { return it }
    }

    fournisseurDOnglets(contexte)?.let { fournisseur ->
        val onglet = CustomTabsIntent.Builder()
            .setShowTitle(true)
            .setUrlBarHidingEnabled(true)
            /*
             * ⛔ LES DEUX PORTÉES SONT POSÉES, ET C'EST CE QUI REMPLACE UN PARAMÈTRE `sombre`.
             * L'onglet suit le réglage du système, comme `RysmoTheme` : lui passer le mode à la
             * main obligerait chaque appelant à y penser, et « une prop `dark` est un piège —
             * elle doit être passée à la main partout, personne ne le fait, et le composant
             * retombe silencieusement sur sa valeur claire » (`DS_Final/readme.md`).
             *
             * ⚠️ Les teintes sont LUES DANS LES JETONS, jamais écrites : une couleur écrite ici
             * ne viendrait plus du CSS et dériverait sans que rien ne le voie.
             */
            .setColorScheme(CustomTabsIntent.COLOR_SCHEME_SYSTEM)
            .setDefaultColorSchemeParams(
                CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(PALETTE_CLAIRE.surfacePage.toArgb())
                    .build(),
            )
            .setColorSchemeParams(
                CustomTabsIntent.COLOR_SCHEME_DARK,
                CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(PALETTE_SOMBRE.surfacePage.toArgb())
                    .build(),
            )
            .build()
        onglet.intent.setPackage(fournisseur)
        /* Le contexte peut être celui de l'application selon l'hôte de la composition ; sans
           ce drapeau, `startActivity` lève sur un contexte non-activité. */
        onglet.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            onglet.launchUrl(contexte, adresse.toUri())
            return ResultatDeSortie.ONGLET
        } catch (_: ActivityNotFoundException) {
            /* Le paquet a disparu entre la question et la réponse — désinstallation, profil
               professionnel, mise à jour en cours. On ne se tait pas : on retombe. */
        }
    }

    return essayerLeSysteme(contexte, adresse) ?: ResultatDeSortie.AUCUNE_APPLICATION
}

/**
 * Un `ACTION_VIEW` que le SYSTÈME résout. Rend `null` si personne ne sait le servir.
 *
 * ⚠️ IL N'EST JAMAIS APPELÉ SUR UNE DE NOS ADRESSES : `ouvrirUneAdresse` a déjà refusé. C'est
 * la seule raison pour laquelle il peut se permettre de ne rien vérifier.
 */
private fun essayerLeSysteme(contexte: Context, adresse: String): ResultatDeSortie? = try {
    contexte.startActivity(
        Intent(Intent.ACTION_VIEW, adresse.toUri()).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    )
    ResultatDeSortie.NAVIGATEUR
} catch (_: ActivityNotFoundException) {
    /* ⚠️ On ne se tait pas : on REND l'échec, et l'écran l'affiche. Une exception avalée ici
       ferait d'un bouton une surface inerte, ce qui se lit comme une panne de l'application —
       et sur les textes légaux, c'est le seul chemin qui y mène. */
    null
}

/**
 * ⭐ UNE APPLICATION INSTALLÉE REVENDIQUE-T-ELLE CETTE ADRESSE ?
 *
 * ⛔ « REVENDIQUER » VEUT DIRE « SANS ÊTRE UN NAVIGATEUR ». Tous les navigateurs répondent à
 * toutes les adresses `https` : les compter reviendrait à dire « oui » à chaque fois, et
 * l'onglet personnalisé ne s'ouvrirait jamais. On soustrait donc l'ensemble des navigateurs,
 * obtenu par la sonde documentée — un `http:` SANS hôte, auquel seul un navigateur répond.
 *
 * ⚠️ ET ON SE SOUSTRAIT NOUS-MÊMES, PAR PRÉCAUTION PLUTÔT QUE PAR NÉCESSITÉ : le garde des
 * App Links a déjà refusé nos quatre adresses avant d'arriver ici. Mais un cinquième filtre
 * d'intention ajouté au manifeste et oublié dans `PREFIXES_APPLICATIFS` ferait de nous le
 * revendiquant, et l'application se rouvrirait sur elle-même. Deux gardes pour un défaut
 * silencieux, ce n'est pas de trop.
 *
 * ⚠️ SANS LE `<queries>` DU MANIFESTE, ELLE REND TOUJOURS `false` À PARTIR DE L'API 30 : les
 * paquets ne sont pas visibles par défaut. Le défaut serait muet et partiel — WhatsApp perdu
 * sur les appareils récents seulement.
 */
@Suppress("DEPRECATION")
private fun uneApplicationRevendique(contexte: Context, adresse: String): Boolean = try {
    val paquets = contexte.packageManager
    /* La sonde du navigateur générique : `http:` sans hôte. Aucune application qui ne soit
       pas un navigateur ne déclare un filtre capable de la servir. */
    val navigateurs = paquets
        .queryIntentActivities(Intent(Intent.ACTION_VIEW, Uri.fromParts("http", "", null)), 0)
        .mapNotNull { it.activityInfo?.packageName }
        .toSet()

    paquets.queryIntentActivities(Intent(Intent.ACTION_VIEW, adresse.toUri()), 0)
        .mapNotNull { it.activityInfo?.packageName }
        .any { it !in navigateurs && it != contexte.packageName }
} catch (_: RuntimeException) {
    /*
     * ⚠️ `false` ET PAS UNE EXCEPTION. Une réponse manquante ne doit dégrader que la QUALITÉ
     * de la sortie — onglet au lieu d'application — jamais l'empêcher. `TransactionTooLarge`
     * sur un appareil qui porte trois cents applications est le cas réel de ce `catch`.
     */
    false
}

/**
 * Le paquet qui saura servir un onglet personnalisé, ou `null`.
 *
 * ⛔ IL RÉPOND `null` SANS LE `<queries>` DU MANIFESTE, MÊME AVEC UN NAVIGATEUR INSTALLÉ.
 * Depuis l'API 30, les paquets ne sont pas visibles par défaut ; cette fonction commence par
 * demander qui sait ouvrir une adresse `https`. Le défaut serait muet et partiel — repli
 * systématique sur les appareils récents seulement.
 */
private fun fournisseurDOnglets(contexte: Context): String? = try {
    CustomTabsClient.getPackageName(contexte, null)
} catch (_: RuntimeException) {
    null
}

/**
 * ⭐ LA FEUILLE DE PARTAGE DU SYSTÈME — la seule action native que ces écrans gagnent
 * vraiment, et elle n'exige aucune dépendance.
 *
 * ⛔ CE QUI PART EST UN LIEN, JAMAIS UNE IMAGE. Une capture d'écran de certificat ne se
 * vérifie pas ; le lien, si. C'est la décision du kit (`ScreensNatifApp.js:335`), et elle vaut
 * pour un devis comme pour un code de parrainage : le destinataire doit pouvoir ouvrir et
 * relire à jour, pas regarder une image de ce que le document disait ce jour-là.
 *
 * ⚠️ AUCUN CHEMIN D'ÉCHEC, ET CE N'EST PAS UN OUBLI. `Intent.createChooser` désigne le
 * sélecteur DU SYSTÈME, qui existe toujours : c'est lui qui dit « aucune application ne peut
 * faire ça » le cas échéant. Rendre un booléen ici inventerait un cas que personne ne peut
 * observer, et les appelants en tireraient un message faux.
 */
fun partagerUnTexte(contexte: Context, titre: String, texte: String, lien: String? = null) {
    val envoi = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, titre)
        /* Le lien sur sa propre ligne : collé au texte, il se fait manger par les
           détecteurs d'URL de certaines messageries, qui coupent au premier espace. */
        putExtra(Intent.EXTRA_TEXT, if (lien != null) "$texte\n$lien" else texte)
    }
    /* Le sélecteur est explicite : sans lui, Android peut mémoriser une cible par défaut et
       le geste cesse d'en proposer d'autres — ce qui n'est pas ce qu'un partage promet. */
    contexte.startActivity(
        Intent.createChooser(envoi, titre).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    )
}
