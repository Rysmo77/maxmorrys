package me.maxmorrys.rysmo.ecrans.compte

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.Typo
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.navigation.ConsoleEcran
import me.maxmorrys.rysmo.navigation.PorteeSupport

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ACCÈS REFUSÉ — kit `NatInterdit` (`ScreensNatifMedia.js:379-403`).
 *
 * ⭐ LA PHRASE ENTIÈRE DE L'ÉCRAN : UN GARDE DE ROUTE EST DU CODE CLIENT, IL CACHE, IL
 * N'INTERDIT PAS. Quelqu'un qui modifie le paquet, ou qui appelle l'API directement, ne
 * passe pas par ce code. Le vrai cloisonnement est dans les règles de la base et dans
 * `appConsole`, qui lève `permission-denied` hors des rôles `admin` et `support`. Cette page
 * dit simplement, en langage humain, ce qui a DÉJÀ été refusé ailleurs.
 *
 * ⛔ ELLE NE NOMME PAS LE RÔLE, ET LE KIT LE FAIT — écart assumé, mesuré.
 * Le kit écrit « Ton rôle est support » en dur, et le port l'a recopié. Or `Interdit` est un
 * `object` sans argument (`navigation/Destinations.kt`) : cet écran ne REÇOIT pas le rôle,
 * et aucune vue n'a répondu — la session rend `NonConfiguree`. Affirmer « ton rôle est
 * support » à quelqu'un qui est peut-être simple élève serait une donnée d'exemple déguisée
 * en diagnostic, sur l'écran où l'on vient précisément comprendre ce qu'on a le droit de
 * faire. La phrase est donc écrite au conditionnel du FAIT : ce qui est refusé, et ce qui
 * est atteint.
 *
 * ⭐ LE « CINQ », EN REVANCHE, EST VRAI SANS RIEN INTERROGER. Il ne vient pas d'un relevé :
 * c'est la taille de `PorteeSupport`, une énumération de ce binaire. Il ne passe donc pas par
 * `Num` — `Num` exige une provenance parce qu'il affiche une mesure du MONDE, et le nombre
 * d'écrans qu'une énumération déclare n'en est pas une. Écrit en toutes lettres, il aurait
 * dérivé à la première valeur ajoutée.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Le libellé d'une portée du support.
 *
 * ⛔ LE `when` EST EXHAUSTIF SANS `else`, ET C'EST TOUTE LA GARDE. Ajouter une valeur à
 * `PorteeSupport` casse la compilation ici, ce qui force à lui donner son nom. Un `else`
 * rendrait « Messages » pour tout ce qu'on aurait oublié de nommer — la forme la plus
 * discrète d'une donnée fausse.
 *
 * Les cinq noms viennent du kit lui-même (`ScreensNatifMedia.js:361`).
 */
private fun PorteeSupport.libelle(): String = when (this) {
    PorteeSupport.Messages -> "Messages"
    PorteeSupport.Temoignages -> "Témoignages"
    PorteeSupport.RendezVous -> "Rendez-vous"
    PorteeSupport.Prospects -> "Prospects"
    PorteeSupport.Projets -> "Projets"
}

/**
 * @param onAller ⭐ VIF, et c'est ce qui distingue cette page d'un cul-de-sac. La seule
 *   chose utile, quand une porte se ferme, est de repartir au bon endroit : les cinq lignes
 *   ouvrent les cinq écrans que le rôle atteint vraiment.
 */
@Composable
fun EcranInterdit(
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val portees = PorteeSupport.entries

    Screen(
        territoire = Territoire.NUIT,
        modifier = modifier,
        /* ⛔ `sombre` OUVRE UNE PORTÉE DE THÈME, ce n'est pas une prop de style : le /403 est
           sombre même sur un téléphone réglé en clair. Sans elle, chaque encre de cet écran
           serait un gris écrit à la main. */
        sombre = true,
        retour = "Console",
        onRetour = onRetour,
        titre = "Accès refusé",
    ) {
        /*
         * Le « 403 » du kit : monospace 86 px, encre à 14 %. L'opacité est DÉRIVÉE de l'encre
         * du mode, jamais une seconde valeur — en portée nuit `ink` vaut la teinte claire, et
         * un rgba figé y resterait l'encre du mode clair.
         */
        Text(
            text = "403",
            style = Typo.nombre(86.sp),
            color = jetons.ink.copy(alpha = 0.14f),
            modifier = Modifier.padding(top = 14.dp),
        )
        Display(
            listOf("Cette page n'est", "pas pour ce rôle."),
            taille = 26.sp,
            modifier = Modifier.padding(top = 8.dp),
        )
        Body(
            "Le rôle qui te sert atteint exactement ${portees.size} écrans sur ce téléphone, "
                + "et celui-ci n'en fait pas partie. Les autres écrans d'administration "
                + "restent au tableau de bord de bureau — les porter ici serait une "
                + "régression déguisée en couverture.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        Eyebrow("Ce que le rôle support atteint", Modifier.padding(top = 22.dp))
        Surface(Niveau.NIGHT, Modifier.padding(top = 10.dp).fillMaxWidth(), rembourrage = 16.dp) {
            Column {
                portees.forEachIndexed { index, portee ->
                    key(portee) {
                        LessonRow(
                            titre = portee.libelle(),
                            etat = EtatLecon.PLAIN,
                            glyphe = "check",
                            /* Le voile suit l'encre : `mmTeal` bascule avec le mode, et un
                               rgba recopié du kit ne basculerait pas. */
                            fondGlyphe = jetons.mmTeal.copy(alpha = 0.18f),
                            derniere = index == portees.lastIndex,
                            queue = {
                                Icon(
                                    "forward",
                                    description = null,
                                    taille = 15.dp,
                                    couleur = jetons.textFaint,
                                    epaisseur = 2.4f,
                                )
                            },
                            onPress = { onAller(ConsoleEcran(portee)) },
                        )
                    }
                }
            }
        }

        Surface(Niveau.NIGHT, Modifier.padding(top = 16.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Ce que cette page est, exactement")
                Body(
                    "Un garde de route est du code client : il cache, il n'interdit pas. Le "
                        + "vrai cloisonnement est dans les règles de la base et dans la vue "
                        + "elle-même — cette page dit simplement ce qu'elles ont déjà refusé, "
                        + "à quelqu'un qui n'y peut rien.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
            }
        }

        /* ⚠️ LE RETOUR DÉPILE, IL NE POUSSE PAS. Le port faisait `router.replace('/console')`
           depuis les deux contrôles : on revenait à la console par une NOUVELLE entrée, et le
           geste système du téléphone n'en sortait plus. La flèche de la barre et ce bouton
           appellent la même fonction, et cette fonction dépile. */
        Button(
            "Revenir à la console",
            onRetour,
            Modifier.padding(top = 16.dp),
            ton = TonBouton.QUIET,
        )
    }
}
