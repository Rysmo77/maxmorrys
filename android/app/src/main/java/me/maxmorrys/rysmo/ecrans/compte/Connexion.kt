package me.maxmorrys.rysmo.ecrans.compte

import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.MotSymbole
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.TailleBouton
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.Wordmark
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.navigation.Creation
import me.maxmorrys.rysmo.navigation.Legal
import me.maxmorrys.rysmo.navigation.MotDePasse

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CONNEXION — kit `NatConnexion` (`ScreensNatifCompte.js:24-74`).
 *
 * ⛔ NI CHAMPS NI BOUTON DE CONNEXION, ET CE N'EST PAS UNE PARESSE DE MISE EN PAGE.
 *
 * Aucun producteur de jeton d'identité n'est branché : ni SDK Firebase Android ni client
 * REST contre Identity Toolkit n'est en dépendance (`app/build.gradle.kts`), et
 * `SourceDeSession` rend `NonConfiguree` en le nommant. Rien ne peut authentifier personne.
 *
 * ⚠️ UN CHAMP DE MOT DE PASSE N'EST PAS UN CONTRÔLE MORT ORDINAIRE. Un bouton éteint ne
 * prend rien ; un champ secret, si. Il fait taper à quelqu'un son vrai mot de passe dans un
 * écran qui ne peut ni le vérifier, ni le transmettre, ni rien en faire d'utile — et le
 * clavier du système en garde le contexte. Le port en avait six, de contrôles morts ; celui-
 * ci aurait coûté plus cher que les six autres réunis.
 *
 * ── POURQUOI NI APPLE NI GOOGLE, ET DEUX RAISONS QUI NE SE RECOUVRENT PAS ─────────────
 * 1 · App Store 4.8 rend « Se connecter avec Apple » OBLIGATOIRE dès qu'une connexion tierce
 *     est proposée. Les deux boutons doivent donc partir dans la MÊME livraison : offrir
 *     Google en version n et Apple en n+1 fait rejeter la version n, sans recours.
 * 2 · ⚠️ Le kit rend le bouton Apple sous `os === 'ios'` — sur cette plateforme, la branche
 *     est morte par construction, et la lire comme « il manque un bouton » serait un
 *     contresens. Reste Google, qui exige Credential Manager ou `play-services-auth` :
 *     aucune des deux n'est en dépendance.
 *
 * ⛔ ET LA POMME DU KIT N'EST PAS UNE POMME. `ds/Marque.kt` porte `AppleMark` comme un
 * EMPLACEMENT RÉSERVÉ — un disque plein — et `GoogleMark` comme une transcription du « G »
 * dont seules les quatre teintes sont exactes. Les HIG d'Apple interdisent de redessiner la
 * marque ; l'asset officiel est obligatoire avant toute soumission. Une marque tierce
 * approximative est un motif de rejet qui ne se voit qu'en revue.
 *
 * ⭐ CE QUI RESTE VIF, EN REVANCHE, L'EST VRAIMENT. Les trois sorties de cet écran sont des
 * destinations réelles, et chacune s'ouvre pour dire elle-même ce qui n'est pas branché chez
 * elle — c'est le principe que le hub du Club avait posé dans le port : « Aucun n'est grisé.
 * Chacun s'ouvre et dit lui-même ce qui n'est pas branché. »
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * @param onAller les trois seules sorties : la création, le mot de passe oublié, les textes
 *   légaux. ⭐ La troisième n'est pas un ornement — App Store 5.1.1(i) veut les textes
 *   atteignables au point d'engagement, et quelqu'un doit pouvoir lire ce à quoi il
 *   s'engage AVANT de s'engager, pas après.
 */
@Composable
fun EcranConnexion(
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        /* ⚠️ Pas de `retour` : le kit ferme cet écran par la CROIX de droite, parce qu'il
           s'ouvre en modale. Poser en plus une flèche de retour donnerait deux contrôles
           pour un seul geste — et sur Android la flèche n'a pas de libellé pour dire
           qu'elle mène ailleurs que la croix. */
        droite = {
            IconButton(libelle = "Fermer", onPress = onRetour) {
                Icon("close", description = null, taille = 17.dp, epaisseur = 2.4f)
            }
        },
    ) {
        Wordmark(MotSymbole.RYSMO, taille = 30.sp)
        Display(
            listOf("CONTENT DE", "TE REVOIR."),
            taille = 29.sp,
            modifier = Modifier.padding(top = 18.dp),
        )

        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Te reconnaître",
            origine = "Aucun producteur de jeton d'identité n'est choisi — ni SDK Firebase "
                + "Android, ni client REST contre Identity Toolkit — et `SourceDeSession` "
                + "rend `NonConfiguree` en le nommant",
            degat = "Un champ de mot de passe ici récolterait un vrai secret dans un écran "
                + "qui ne peut rien en faire. Un formulaire qui ne connecte pas est pire "
                + "qu'un formulaire absent : il fait essayer, puis recommencer.",
            modifier = Modifier.padding(top = 20.dp),
        )

        EncartDeVerite(
            sourcil = "Un seul compte, ici et sur le site",
            texte = "C'est le même compte que sur maxmorrys.me : les mêmes cours, la même "
                + "progression, les mêmes certificats. Le jour où cet écran connectera, il ne "
                + "créera pas un second compte à côté du tien.",
            modifier = Modifier.padding(top = 16.dp),
        )

        EncartDeVerite(
            sourcil = "Pourquoi il n'y a pas de bouton Apple ou Google",
            texte = "La règle 4.8 de l'App Store rend « Se connecter avec Apple » obligatoire "
                + "dès qu'une connexion tierce existe : les deux doivent partir ensemble, ou "
                + "la version est refusée. Et la connexion Google demande une dépendance qui "
                + "n'est pas déclarée ici. Deux boutons qui ne connectent pas ne valent pas "
                + "mieux qu'aucun.",
            modifier = Modifier.padding(top = 12.dp),
        )

        Button(
            "Créer un compte, c'est gratuit",
            { onAller(Creation) },
            Modifier.padding(top = 18.dp),
            ton = TonBouton.QUIET,
        )
        Button(
            "Mot de passe oublié ?",
            { onAller(MotDePasse) },
            Modifier.padding(top = 9.dp),
            ton = TonBouton.QUIET,
        )
        Button(
            "Confidentialité et conditions",
            { onAller(Legal) },
            Modifier.padding(top = 9.dp),
            ton = TonBouton.QUIET,
            taille = TailleBouton.SM,
        )
    }
}
