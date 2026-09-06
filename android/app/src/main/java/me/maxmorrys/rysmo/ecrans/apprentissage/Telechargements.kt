package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Territoire

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES TÉLÉCHARGEMENTS — kit `Telechargements` (`ScreensNatif.js:182-238`).
 *
 * ⛔ CET ÉCRAN EST LE PLUS DIFFICILE DU LOT, PARCE QUE TOUT CE QU'IL MONTRE EST UN CHIFFRE.
 *
 * « 3 leçons hors connexion », « 21 Mo sur ton téléphone », « vidéo 480p · 12 Mo », « 21,2 Mo
 * sur 512 Mo », une barre à 4 %. Aucun de ces nombres n'existe : il n'y a pas de dispositif
 * de téléchargement dans l'application, et il ne peut pas y en avoir — la vidéo de leçon
 * n'est pas un fichier mais un `iframe` hébergé ailleurs (`constat-hors-ligne.md` § 1), et
 * ni `media3-exoplayer` ni `media3-session` ne sont en dépendance.
 *
 * Recopier ces valeurs, ce serait annoncer à quelqu'un qu'il occupe 21 Mo de son téléphone.
 * Sur le marché visé, un forfait est compté et un stockage est petit : c'est une information
 * sur laquelle on AGIT — on efface, on attend le Wi-Fi. Une information fausse coûte donc un
 * geste réel, pas seulement une impression.
 *
 * ⚠️ LE PORT LE SAVAIT ET S'EST FAIT PIÉGER QUAND MÊME. Son écran était « 100 % démo » avec
 * une garde `if (STOCKAGE === null)` qui, en production, ne laissait que la branche vide —
 * plus trois contrôles `disabled` rendus par-dessus. Le résultat n'était pas un écran neutre :
 * c'était un écran de réglages inertes, avec un interrupteur Wi-Fi qui ne réglait rien.
 *
 * ⭐ CE QUI RESTE VRAI EST GARDÉ. L'encart de vérité du kit ne mesure rien : il énonce où
 * vivent la progression, les notes et les certificats. C'est vrai aujourd'hui, ça le restera,
 * et c'est précisément ce qu'on vient vérifier avant de vider un stockage.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranTelechargements(
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Profil",
        onRetour = onRetour,
        titre = "Téléchargements",
    ) {
        Eyebrow("Sur cet appareil", Modifier.padding(top = 6.dp))
        Display(
            listOf("HORS", "CONNEXION."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )

        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Ce que l'application occupe sur ton téléphone",
            origine = "Aucun dispositif de téléchargement n'existe — la vidéo de leçon n'est "
                + "pas un fichier, et aucune dépendance de lecture ou de stockage n'est "
                + "déclarée",
            degat = "Annoncer « 21 Mo occupés » quand rien n'a été mesuré fait effacer des "
                + "leçons qui ne sont pas là, ou attendre un Wi-Fi qui ne sert à rien. Sur un "
                + "forfait compté, un poids faux coûte un geste réel.",
            modifier = Modifier.padding(top = 20.dp),
            hauteur = 4,
        )

        EncartDeVerite(
            sourcil = "Ce que supprimer ne touche pas",
            texte = "Ta progression, tes notes et tes certificats vivent sur ton compte, pas "
                + "sur le téléphone. Vider le stockage ne fait que retélécharger plus tard.",
            modifier = Modifier.padding(top = 18.dp),
        )

        EncartDeVerite(
            sourcil = "Pourquoi il n'y a aucun réglage ici",
            texte = "Le kit place ici un interrupteur « Wi-Fi seulement » et une qualité "
                + "vidéo. Les deux règlent un téléchargement qui n'existe pas : un "
                + "interrupteur qui bascule sans rien changer se lit comme un réglage pris "
                + "en compte, et il ne le sera pas.",
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}
