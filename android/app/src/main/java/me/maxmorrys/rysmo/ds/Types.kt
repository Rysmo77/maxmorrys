package me.maxmorrys.rysmo.ds

import androidx.compose.runtime.Immutable
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

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
        val rad = Math.toRadians((angleDeg - 90.0))
        val dx = cos(rad).toFloat()
        val dy = sin(rad).toFloat()
        /* Le segment est étiré pour que le dégradé couvre la boîte entière quel que soit
           l'angle — sinon les coins restent à la couleur de l'arrêt le plus proche. */
        val moitie = (abs(dx) * taille.width + abs(dy) * taille.height) / 2f
        val cx = taille.width / 2f
        val cy = taille.height / 2f
        return Brush.linearGradient(
            colorStops = arrets.toTypedArray(),
            start = Offset(cx - dx * moitie, cy - dy * moitie),
            end = Offset(cx + dx * moitie, cy + dy * moitie),
        )
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
