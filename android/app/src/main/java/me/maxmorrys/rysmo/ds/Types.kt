package me.maxmorrys.rysmo.ds

import androidx.compose.runtime.Immutable
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp

/**
 * Les trois formes de jeton que Compose n'a pas en propre.
 *
 * Écrit à la main, contrairement à `Jetons.generated.kt` : ce fichier porte le COMPORTEMENT
 * (comment un angle CSS devient deux points), le fichier généré ne porte que les VALEURS.
 */

/**
 * Un dégradé linéaire, tel que le CSS l'écrit : un angle et des arrêts.
 *
 * ⛔ L'ANGLE CSS N'EST PAS L'ANGLE DE COMPOSE, et l'erreur est silencieuse.
 * En CSS, `0deg` va vers le HAUT et l'angle croît dans le sens des aiguilles.
 * En Compose, un `linearGradient` veut deux points en coordonnées écran, où l'axe Y
 * descend. Prendre l'angle tel quel donne un dégradé retourné — qui ressemble à un
 * dégradé, donc que la relecture ne rattrape pas.
 *
 * La conversion dépend de la taille du composant, inconnue à la génération : c'est
 * pourquoi elle vit ici et pas dans l'émetteur.
 */
@Immutable
data class Degrade(
    val angleDeg: Float,
    val arrets: List<Pair<Float, Color>>,
) {
    fun brosse(taille: Size): Brush {
        /* Le calcul vit dans `bornesDeAngle` (ds/Degrade.kt) : le miroitement du squelette
           et la barre de progression en ont besoin sur une boîte VIRTUELLE plus large que
           la vue, et la même formule ne peut pas exister à deux endroits sans y prendre un
           jour deux valeurs. Le segment couvre la boîte entière quel que soit l'angle —
           sinon les coins restent à la couleur de l'arrêt le plus proche. */
        val (debut, fin) = bornesDeAngle(angleDeg, taille)
        return Brush.linearGradient(colorStops = arrets.toTypedArray(), start = debut, end = fin)
    }
}

/**
 * Une ombre portée ou intérieure.
 *
 * ⚠️ Compose n'a pas d'ombre intérieure, et `Modifier.shadow` ne sait ni décaler
 * indépendamment ni étaler. `inset = true` décrit une LUMIÈRE en haut de la surface
 * (`inset 0 1px 0 blanc`), rendue par un liseré et non par une ombre : voir `Surface`.
 */
@Immutable
data class Ombre(
    val inset: Boolean,
    val dx: Dp,
    val dy: Dp,
    val flou: Dp,
    val etale: Dp,
    val couleur: Color,
)

/** Un trait : épaisseur et teinte, tel que `1.5px solid rgba(...)`. */
@Immutable
data class Bordure(
    val epaisseur: Dp,
    val couleur: Color,
)

/**
 * OÙ S'ACCROCHE UN LOBE DE MAILLAGE.
 *
 * Le kit ancre chaque lobe par DEUX arêtes de sa boîte carrée — `top:-120px;left:-110px`,
 * ou `bottom:-180px;right:-160px`. Ce n'est pas un centre : c'est un bord, et la conversion
 * en centre dépend du côté du lobe ET de l'étendue de l'écran.
 *
 * ⚠️ Ne JAMAIS remplacer ces quatre cas par des pourcentages. C'est par là que le port
 * React Native a produit des lobes elliptiques de rapport 2,2:1 là où le kit demande 1:1 :
 * il posait largeur ET hauteur en pourcentage, donc résolues contre deux axes différents
 * d'un écran qui n'est pas carré, et rien ne le signalait.
 */
@Immutable
sealed interface Ancrage {
    val valeur: Dp

    /** Le centre du lobe sur cet axe, en pixels. `etendue` et `cote` sont en pixels. */
    fun centre(etendue: Float, cote: Float, densite: Density): Float
}

/** `left: -110px` — le bord gauche du lobe est à −110 du bord gauche de l'écran. */
@Immutable
data class Gauche(override val valeur: Dp) : Ancrage {
    override fun centre(etendue: Float, cote: Float, densite: Density): Float =
        with(densite) { valeur.toPx() } + cote / 2f
}

/** `right: -120px` — le bord DROIT du lobe est à −120 du bord droit de l'écran. */
@Immutable
data class Droite(override val valeur: Dp) : Ancrage {
    override fun centre(etendue: Float, cote: Float, densite: Density): Float =
        etendue - with(densite) { valeur.toPx() } - cote / 2f
}

/** `top: -160px`. */
@Immutable
data class Haut(override val valeur: Dp) : Ancrage {
    override fun centre(etendue: Float, cote: Float, densite: Density): Float =
        with(densite) { valeur.toPx() } + cote / 2f
}

/** `bottom: -180px` — un seul lobe s'en sert, le troisième du maillage nuit. */
@Immutable
data class Bas(override val valeur: Dp) : Ancrage {
    override fun centre(etendue: Float, cote: Float, densite: Density): Float =
        etendue - with(densite) { valeur.toPx() } - cote / 2f
}

/**
 * Un lobe du maillage : une teinte, une opacité, deux ancrages.
 *
 * ⛔ La teinte est FIXE. Elle ne se relit jamais par un jeton de marque — voir la tête de
 * `Natif.generated.kt`.
 */
@Immutable
data class Lobe(
    val teinte: Color,
    val opacite: Float,
    val x: Ancrage,
    val y: Ancrage,
)
