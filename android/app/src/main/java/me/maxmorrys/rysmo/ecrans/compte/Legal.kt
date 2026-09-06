package me.maxmorrys.rysmo.ecrans.compte

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.localeCourante
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.Typo
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.ecrans.apprentissage.SITE_PUBLIC

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES TEXTES QUI ENGAGENT — ⛔ LE KIT NE DESSINE PAS CET ÉCRAN, ET LES MAGASINS L'EXIGENT.
 *
 * App Store 5.1.1(i) veut la politique de confidentialité AU POINT DE CRÉATION DU COMPTE,
 * pas seulement dans une fiche de magasin ; Play en exige l'URL. Avant que le port ne
 * l'ajoute, l'application n'en citait aucune — `grep -ri "legal|confidentialite"` sur
 * `mobile/` ne renvoyait rien — et il y avait PIRE que l'absence : « politique de
 * confidentialité » était rendue en bleu et en gras, la forme exacte d'un lien, À
 * L'INTÉRIEUR du contrôle de la case newsletter. La toucher cochait la case.
 *
 * ⛔ LA GARANTIE QUI COMPTE ICI N'EST PAS QUE L'ÉCRAN EXISTE, C'EST QUE SES QUATRE ADRESSES
 * MÈNENT QUELQUE PART. C'était le deuxième cas de `mobile-legal.test.ts`, perdu avec le
 * port : « Le jour où `/legal/cgu` devient `/legal/conditions`, le site continue de
 * fonctionner et l'application ouvre un 404 — sur l'écran qui porte l'engagement juridique,
 * et sans que personne ne le voie. » Un lien sortant échoue en SILENCE : le navigateur
 * s'ouvre, la page dit « introuvable », et rien dans l'application ne le sait.
 * `tests/unit/natif-compte.test.ts` apparie de nouveau ces quatre chemins aux routes de
 * `src/App.tsx`.
 *
 * ── POURQUOI DES LIENS SORTANTS, ET PAS LE TEXTE ICI ─────────────────────────────────
 * Ces textes changent, et ils doivent changer à UN SEUL endroit. Recopiés dans
 * l'application, ils seraient figés à la version du dernier build : le site dirait une
 * chose, une application installée depuis six mois en dirait une autre, et c'est la seconde
 * qui engagerait quand même.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⛔ LA RACINE ET LES CHEMINS SONT SÉPARÉS, ET LA PORTE EN DÉPEND.
 *
 * Le site sert ces pages sous `legal/…` (`src/App.tsx`). Écrire les quatre URL entières
 * rendrait la porte incapable de reconnaître un chemin d'un morceau d'adresse ; les garder
 * découpés lui donne exactement le jeton que le routeur du site déclare.
 */
internal const val SITE_LEGAL: String = "$SITE_PUBLIC/legal"

/** La même racine, préfixée comme le site préfixe son arbre anglais. */
internal const val SITE_LEGAL_EN: String = "$SITE_PUBLIC/en/legal"

/**
 * L'adresse à ouvrir, dans la langue de l'appareil.
 *
 * ⚠️ LA LANGUE VIENT DE L'APPAREIL, PAS D'UNE PRÉFÉRENCE DE COMPTE — parce qu'il n'y a pas
 * encore de compte. Le jour où le profil en portera une, c'est elle qui devra primer : quelqu'un
 * qui a choisi le français dans l'application ne veut pas des CGU en anglais parce qu'il voyage
 * avec un téléphone emprunté.
 */
internal fun TexteLegal.adresse(anglais: Boolean): String =
    if (anglais) "$SITE_LEGAL_EN$cheminEn" else "$SITE_LEGAL$chemin"

/** Un texte légal : son chemin sous `legal/`, son titre, et ce qu'il règle. */
internal data class TexteLegal(
    val chemin: String,
    /**
     * Le même texte, à son adresse ANGLAISE.
     *
     * ⛔ LE SITE TRADUIT SES SEGMENTS, PAS SEULEMENT SON TEXTE. `/legal/cgu` devient
     * `/en/legal/terms-of-use` (`src/i18n/segments.ts`). Servir l'adresse française à
     * quelqu'un dont l'appareil est en anglais l'envoie sur une page qu'il ne peut pas
     * lire — et sur des conditions générales, c'est le pire endroit possible pour
     * supposer que « ça se comprend quand même ».
     */
    val cheminEn: String,
    val titre: String,
    val meta: String,
)

/**
 * Les quatre textes. ⚠️ Le site en sert un cinquième — la politique de cookies — qui n'est
 * pas cité ici : cette application n'a pas de navigateur intégré et ne pose aucun témoin de
 * connexion. Citer un texte qui ne s'applique pas à ce qu'on tient dans la main n'ajoute pas
 * de la transparence, ça dilue les trois qui engagent vraiment.
 */
internal val TEXTES_LEGAUX: List<TexteLegal> = listOf(
    TexteLegal(
        chemin = "/confidentialite",
        cheminEn = "/privacy",
        titre = "Politique de confidentialité",
        meta = "ce qui est collecté, pourquoi, et pour combien de temps",
    ),
    TexteLegal(
        chemin = "/cgu",
        cheminEn = "/terms-of-use",
        titre = "Conditions générales d'utilisation",
        meta = "ce que tu acceptes en créant un compte",
    ),
    TexteLegal(
        chemin = "/cgv",
        cheminEn = "/terms-of-sale",
        titre = "Conditions générales de vente",
        meta = "les achats se font sur le site, pas ici",
    ),
    TexteLegal(
        chemin = "/mentions-legales",
        cheminEn = "/legal-notice",
        titre = "Mentions légales",
        meta = "qui édite ce service, et comment le joindre",
    ),
)

@Composable
fun EcranLegal(
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    /* `localeCourante()` est OBSERVABLE : changer la langue du téléphone recompose l'écran
       et les liens suivent. Lire `Locale.getDefault()` ici les figerait sur la langue du
       démarrage — le défaut que `ds/Locale.kt` existe pour empêcher. */
    val enAnglais = localeCourante().language == "en"
    /* L'adresse qu'aucun navigateur n'a pu ouvrir. `null` tant que tout va bien. */
    var adresseOrpheline by remember { mutableStateOf<String?>(null) }

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Profil",
        onRetour = onRetour,
        titre = "Textes légaux",
        droite = {
            IconButton(libelle = "Fermer", onPress = onRetour) {
                Icon("close", description = null, taille = 17.dp, epaisseur = 2.4f)
            }
        },
    ) {
        Eyebrow("Ce qui t'engage, et ce qui nous engage", Modifier.padding(top = 6.dp))

        Surface(Niveau.FLAT, Modifier.padding(top = 12.dp).fillMaxWidth(), rembourrage = 16.dp) {
            Column {
                TEXTES_LEGAUX.forEachIndexed { index, texte ->
                    key(texte.chemin) {
                        LessonRow(
                            titre = texte.titre,
                            etat = EtatLecon.PLAIN,
                            meta = texte.meta,
                            derniere = index == TEXTES_LEGAUX.lastIndex,
                            queue = {
                                /* Le glyphe « sortant » n'est pas décoratif : il prévient que
                                   le geste QUITTE l'application. Sans lui, un retour arrière
                                   qui ne ramène pas au même endroit passe pour un défaut. */
                                Icon("external", description = null, taille = 15.dp, couleur = jetons.ink2)
                            },
                            onPress = {
                                val adresse = texte.adresse(enAnglais)
                                adresseOrpheline = if (ouvrirDansLeNavigateur(contexte, adresse)) {
                                    null
                                } else {
                                    adresse
                                }
                            },
                        )
                    }
                }
            }
        }

        /*
         * ⛔ UN LIEN QUI N'OUVRE RIEN DOIT DIRE OÙ IL ALLAIT. Sur un téléphone sans
         * navigateur — ils existent, et ce sont souvent les appareils du marché visé —
         * `startActivity` lève, et un `catch` muet transformerait le seul chemin vers les
         * textes légaux en une ligne qui ne fait rien quand on la touche.
         */
        adresseOrpheline?.let { adresse ->
            Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                Column {
                    Eyebrow("Aucun navigateur n'a répondu")
                    Body(
                        "Ce téléphone n'a pas d'application capable d'ouvrir une adresse web. "
                            + "Le texte reste lisible depuis n'importe quel autre appareil, à "
                            + "cette adresse :",
                        Modifier.padding(top = 6.dp),
                        attenue = true,
                    )
                    Text(
                        text = adresse,
                        style = Typo.code,
                        color = jetons.textBody,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
            }
        }

        EncartDeVerite(
            sourcil = "Pourquoi ils s'ouvrent sur le site",
            texte = "Parce qu'ils changent, et qu'ils doivent changer à un seul endroit. "
                + "Recopiés ici, ils seraient figés à la version du jour où tu as installé "
                + "l'application — le site dirait une chose, ton téléphone une autre, et "
                + "c'est quand même la seconde qui t'engagerait.",
            modifier = Modifier.padding(top = 16.dp),
        )

        /*
         * ⭐ LA VERSION, PARCE QUE C'EST CE QUE LE SUPPORT DEMANDE EN PREMIER et que personne
         * ne sait où la trouver. Elle est LUE DU PAQUET INSTALLÉ, pas écrite dans le code :
         * une constante recopiée à la main serait fausse dès le premier oubli, sur la seule
         * information dont le support se sert pour savoir à quoi il parle.
         */
        Text(
            text = "Rysmo ${versionInstallee(contexte)}",
            style = Typo.nombre(11.sp),
            color = jetons.textFaint,
            modifier = Modifier.padding(top = 18.dp),
        )
    }
}

/**
 * Ouvre une adresse dans le navigateur du système. Rend `false` si personne ne sait le faire.
 *
 * ⛔ `ACTION_VIEW` EST SÛR SUR CES QUATRE ADRESSES, ET IL NE L'EST PAS SUR TOUTES. Cette
 * application déclare `maxmorrys.me/formations` et `maxmorrys.me/verifier` en App Links
 * vérifiés (`AndroidManifest.xml`, `autoVerify="true"`) : un `ACTION_VIEW` sur ces
 * préfixes-là se résoudrait SUR NOUS, et l'écran rouvrirait l'écran. `/legal` n'est déclaré
 * nulle part, donc il sort vraiment.
 *
 * ⚠️ Et ce n'est pas un onglet intégré : `androidx.browser` est au catalogue de versions
 * mais PAS en dépendance (`app/build.gradle.kts`). Le geste quitte donc l'application pour
 * de bon — d'où le glyphe « sortant » sur chaque ligne.
 */
private fun ouvrirDansLeNavigateur(contexte: Context, adresse: String): Boolean = try {
    contexte.startActivity(
        Intent(Intent.ACTION_VIEW, adresse.toUri())
            /* Le contexte peut être celui de l'application selon l'hôte de la composition ;
               sans ce drapeau, `startActivity` lève sur un contexte non-activité. */
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    )
    true
} catch (_: ActivityNotFoundException) {
    /* ⚠️ On ne se tait pas : on REND l'échec, et l'écran l'affiche. Une exception
       avalée ici ferait d'une ligne cliquable une ligne inerte. */
    false
}

/**
 * La version du paquet réellement installé.
 *
 * ⚠️ La forme à deux arguments de `getPackageInfo` est dépréciée depuis l'API 33, et son
 * remplaçante `PackageInfoFlags` n'existe qu'à partir de là — `minSdk = 24`. Tant que le
 * plancher n'a pas bougé, c'est cette forme-ci qui marche sur tout le parc.
 */
@Suppress("DEPRECATION")
private fun versionInstallee(contexte: Context): String = try {
    contexte.packageManager.getPackageInfo(contexte.packageName, 0).versionName ?: "—"
} catch (_: PackageManager.NameNotFoundException) {
    /* Un paquet qui ne se trouve pas lui-même : impossible en pratique, et on n'invente
       pas un numéro de version pour autant. Le tiret dit « pas su », pas « 1.0 ». */
    "—"
}
