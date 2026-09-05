package me.maxmorrys.rysmo.ds

import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import me.maxmorrys.rysmo.R

/**
 * LES NEUF FONTES, ET LE SEUL ENDROIT OÙ LEUR NOM DE DESIGN RENCONTRE LEUR NOM DE FICHIER.
 *
 * ⛔ `aapt2` REFUSE tout ce qui n'est pas [a-z0-9_] dans `res/font/`. Les fichiers livrés
 * s'appellent `SchibstedGrotesk_500Medium.ttf` ; sous ce nom, la compilation des ressources
 * échoue. Ils sont donc déposés en minuscules avec séparateurs, et cette table est le pont.
 *
 * Elle est écrite à la main — c'est assumé. `Metrique.fBody` vaut « Schibsted Grotesk », le
 * nom que le design emploie, qui ne peut pas être un identifiant de ressource. Un test
 * garde la correspondance DANS LES DEUX SENS : chaque famille citée par les jetons a ses
 * fichiers, et chaque fichier déposé sert à quelque chose.
 */

/** Le corps de texte. Quatre graisses, du régulier au gras. */
val SchibstedGrotesk = FontFamily(
    Font(R.font.schibsted_grotesk_400_regular, FontWeight.Normal),
    Font(R.font.schibsted_grotesk_500_medium, FontWeight.Medium),
    Font(R.font.schibsted_grotesk_600_semi_bold, FontWeight.SemiBold),
    Font(R.font.schibsted_grotesk_700_bold, FontWeight.Bold),
)

/** Les titres d'affichage. Le noir 900 porte les grands corps du kit. */
val Fraunces = FontFamily(
    Font(R.font.fraunces_400_regular, FontWeight.Normal),
    Font(R.font.fraunces_700_bold, FontWeight.Bold),
    Font(R.font.fraunces_900_black, FontWeight.Black),
)

/** Le chiffre et le code. */
val JetBrainsMono = FontFamily(
    Font(R.font.jet_brains_mono_400_regular, FontWeight.Normal),
    Font(R.font.jet_brains_mono_700_bold, FontWeight.Bold),
)

/**
 * Le nom de design -> la famille chargée. Lu par le test qui garde la correspondance ;
 * le code d'écran, lui, nomme la famille directement.
 */
val FAMILLES: Map<String, FontFamily> = mapOf(
    Metrique.fBody to SchibstedGrotesk,
    Metrique.fDisplay to Fraunces,
    Metrique.fMono to JetBrainsMono,
)
