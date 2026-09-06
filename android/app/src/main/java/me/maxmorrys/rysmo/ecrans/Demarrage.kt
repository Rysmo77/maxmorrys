package me.maxmorrys.rysmo.ecrans

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Degrade
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Mesh
import me.maxmorrys.rysmo.ds.MotSymbole
import me.maxmorrys.rysmo.ds.Metrique
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.StepDots
import me.maxmorrys.rysmo.ds.TailleBouton
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.Wordmark
import me.maxmorrys.rysmo.ds.jetons

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CHAÎNE DE PREMIÈRE OUVERTURE — celle qui n'était atteinte par RIEN.
 *
 * ⛔ DANS LE PORT REACT NATIVE, CES TROIS ÉCRANS ÉTAIENT ÉCRITS ET JAMAIS EXÉCUTÉS.
 *
 * Il n'existait pas d'`app/index.tsx`, donc `expo-router` servait « / » depuis l'onglet
 * Espace : quelqu'un qui ouvrait l'application pour la première fois tombait directement sur
 * « Bonsoir. » et un écran vide. Aucune erreur, aucune trace — l'application avait
 * simplement l'air de commencer au milieu.
 *
 * C'est le défaut que l'utilisateur a signalé en disant qu'il ne voyait pas de page
 * d'accueil. Il n'en manquait aucune : il manquait le chemin qui y menait.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⛔ AUCUN INDICATEUR DE PROGRESSION, et c'est une règle du kit, pas un oubli.
 * « Une barre de chargement qui n'est branchée sur rien est un mensonge de trois secondes. »
 * Cet écran ne montre rien d'autre que la marque, le temps que la session rende son verdict.
 */
@Composable
fun EcranLancement(modifier: Modifier = Modifier) {
    val p = jetons
    Box(modifier.fillMaxSize().background(p.surfacePage)) {
        Mesh(Territoire.TRANSFORME, Modifier.fillMaxSize())
        Column(
            Modifier.fillMaxSize().padding(horizontal = Metrique.gutterScreen),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Wordmark(MotSymbole.RYSMO, taille = 44.sp)
            Body(
                "par Max-Morrys · Dakar",
                Modifier.padding(top = 18.dp),
                grain = GrainCorps.CORPS,
                couleur = p.textFaint,
            )
        }
    }
}

/**
 * Trois panneaux, passables, et surtout : AUCUN COMPTE DEMANDÉ.
 *
 * « Exiger un compte avant d'avoir montré quoi que ce soit, c'est perdre la personne au
 * deuxième écran. » Le catalogue se parcourt sans compte — c'est aussi ce que dit la règle
 * d'aiguillage du lancement.
 */
@Composable
fun EcranOnboarding(
    onTermine: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var panneau by remember { mutableIntStateOf(0) }
    val panneaux = PANNEAUX_ACCUEIL

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        droite = { TexteAction("Passer", onTermine) },
    ) {
        Box(
            Modifier
                .padding(top = 10.dp)
                .fillMaxWidth()
                .height(220.dp)
                .clip(RoundedCornerShape(Metrique.rXl))
                .background(jetons.actionForme.brosseVerticale()),
            contentAlignment = Alignment.Center,
        ) {
            Wordmark(MotSymbole.RYSMO, taille = 34.sp, nuit = true, queue = Color.White)
        }

        Eyebrow("${panneau + 1} sur ${panneaux.size}", Modifier.padding(top = 26.dp))
        Display(panneaux[panneau].titre, cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))
        Body(panneaux[panneau].chapo, Modifier.padding(top = 12.dp), grain = GrainCorps.CHAPO)

        Spacer(Modifier.height(28.dp))
        StepDots(
            total = panneaux.size,
            courant = panneau + 1,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        )
        Button(
            libelle = if (panneau == panneaux.lastIndex) "Commencer" else "Continuer",
            onPress = { if (panneau == panneaux.lastIndex) onTermine() else panneau++ },
            modifier = Modifier.padding(top = 16.dp),
            ton = TonBouton.FORME,
        )
        Body(
            "Aucun compte demandé pour l'instant. Tu peux tout parcourir avant de décider.",
            Modifier.padding(top = 10.dp).fillMaxWidth(),
            couleur = jetons.textFaint,
        )
    }
}

private data class PanneauAccueil(val titre: List<String>, val chapo: String)

/*
 * ⚠️ CE TEXTE VIENT DU KIT, ET IL PROMET DEUX CHOSES QUI N'EXISTENT PAS ENCORE :
 * le téléchargement hors réseau et la reprise automatique de progression. Il est repris
 * TEL QUEL parce que le kit fait autorité sur la copie, et parce que le mensonge ne serait
 * pas de l'écrire ici mais de le laisser à l'écran une fois qu'on aura constaté que le
 * dispositif ne suit pas. Voir `deferred-work.md` : les médias ne sont pas hébergés.
 */
private val PANNEAUX_ACCUEIL = listOf(
    PanneauAccueil(
        listOf("APPRENDS", "QUAND TU PEUX.", "HORS RÉSEAU AUSSI."),
        "Télécharge une leçon en Wi-Fi, regarde-la dans le taxi. Ta progression part toute "
            + "seule au retour du réseau — tu n'as rien à relancer.",
    ),
    PanneauAccueil(
        listOf("UN RÉPÉTITEUR", "QUI CONNAÎT", "TON PARCOURS."),
        "Il a vu ce que tu as terminé et ce que tu as sauté. Ses questions partent de là, "
            + "pas d'un programme générique.",
    ),
    PanneauAccueil(
        listOf("LE CLUB,", "QUAND TU ES", "PRÊTE."),
        "Des entrepreneurs qui construisent au même moment que toi. On y entre par "
            + "abonnement, et on peut tout voir avant de décider.",
    ),
)

/** Un libellé cliquable de barre haute — le « Passer » du kit, à sa taille tactile. */
@Composable
private fun TexteAction(libelle: String, onPress: () -> Unit) {
    Button(libelle, onPress, ton = TonBouton.QUIET, taille = TailleBouton.SM)
}

/**
 * ⛔ CET ÉCRAN N'EST PAS DANS LA CHAÎNE DE PREMIÈRE OUVERTURE, ET C'EST DÉLIBÉRÉ.
 *
 * Le kit le place entre l'accueil et l'espace, et le kit a raison SUR LE PRINCIPE :
 * « on explique AVANT d'ouvrir le dialogue système, parce qu'iOS ne le laisse poser qu'UNE
 * fois ». Mais l'application n'envoie aujourd'hui AUCUNE notification — le dispositif est
 * différé, et rien ne le produit.
 *
 * Demander une permission pour une fonction qui n'existe pas, c'est exactement le défaut
 * corrigé le 05/09/2026 sur l'écran d'accueil, qui promettait des notifications absentes. La
 * permission `POST_NOTIFICATIONS` n'est donc pas davantage déclarée au manifeste : la
 * déclarer élargirait la fiche des magasins pour rien.
 *
 * L'écran EXISTE — il est dessiné, il est construit, il est atteignable depuis le profil —
 * et il dit ce qu'il en est. Il rejoindra la chaîne le jour où une notification part.
 */
@Composable
fun EcranPermissions(
    onSuite: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val p = jetons
    Screen(territoire = Territoire.TRANSFORME, modifier = modifier) {
        Box(
            Modifier
                .padding(top = 8.dp)
                .size(66.dp)
                .clip(RoundedCornerShape(21.dp))
                .background(p.actionTransforme.brosseVerticale()),
            contentAlignment = Alignment.Center,
        ) {
            Icon("bell", description = null, taille = 28.dp, couleur = Color.White, epaisseur = 2.2f)
        }
        Display(
            listOf("JE PEUX TE", "PRÉVENIR QUAND", "TU DÉCROCHES ?"),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 22.dp),
        )
        Body(
            "Tu t'arrêtes rarement parce que tu abandonnes. Tu t'arrêtes parce qu'une semaine "
                + "passe. Une notification à ce moment-là, c'est la seule chose qui marche.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Les notifications",
            origine = "Aucune n'est envoyée à ce jour",
            degat = "Demander la permission maintenant la dépenserait : sur iOS le dialogue "
                + "ne se pose qu'une fois, et un refus ne se rattrape que dans les réglages.",
            modifier = Modifier.padding(top = 20.dp),
        )

        Button(
            "Continuer",
            onSuite,
            modifier = Modifier.padding(top = 18.dp),
            ton = TonBouton.TRANSFORME,
        )
    }
}

/**
 * Un dégradé d'action, peint de haut en bas.
 *
 * ⚠️ `Degrade.brosse(taille)` du design system rend l'angle EXACT du kit, mais exige de
 * connaître la boîte — ce que `Modifier.background` ne donne pas. Ici la boîte est carrée ou
 * presque, et l'écart entre 135° et la verticale ne se voit pas ; sur une boîte allongée il
 * se verrait, et c'est `brosse(taille)` qu'il faudrait, dans un `drawBehind`.
 */
private fun Degrade.brosseVerticale() =
    androidx.compose.ui.graphics.Brush.linearGradient(
        colorStops = arrets.toTypedArray(),
        start = androidx.compose.ui.geometry.Offset.Zero,
        end = androidx.compose.ui.geometry.Offset(0f, Float.POSITIVE_INFINITY),
    )
