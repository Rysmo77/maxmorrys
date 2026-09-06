package me.maxmorrys.rysmo.ds

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.Shape
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ANGLE CSS DEVIENT DEUX POINTS COMPOSE.
 *
 * La règle CSS : l'angle est mesuré DEPUIS LE HAUT, dans le sens horaire (0° vers le haut,
 * 90° vers la droite, 135° du haut-gauche vers le bas-droite), et les deux extrémités sont
 * les PROJECTIONS DES COINS sur la ligne de dégradé — de sorte que la boîte entière soit
 * couverte.
 *
 *     dx = sin(A)                  repère écran : x vers la droite, y vers le BAS
 *     dy = −cos(A)
 *     L  = |W · dx| + |H · dy|
 *     start = C − (L/2)·(dx, dy)   end = C + (L/2)·(dx, dy)
 *
 * ⚠️ LE PORT REACT NATIVE NORMALISAIT PAR `max(|x|, |y|)`, ce qui envoie le dégradé de COIN
 * À COIN de la boîte. C'est exact pour un carré, et faux pour tout le reste : un bouton
 * pilule de 320 × 54 dp à 135° reçoit une rampe de couleur sensiblement différente de celle
 * du web. Personne ne le voit en relecture, parce que ça reste un dégradé.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
fun bornesDeAngle(angleDeg: Float, taille: Size): Pair<Offset, Offset> {
    val rad = Math.toRadians(angleDeg.toDouble())
    val dx = sin(rad).toFloat()
    val dy = -cos(rad).toFloat()
    val longueur = abs(taille.width * dx) + abs(taille.height * dy)
    val centre = Offset(taille.width / 2f, taille.height / 2f)
    val demi = Offset(dx, dy) * (longueur / 2f)
    return (centre - demi) to (centre + demi)
}

/**
 * Une brosse posée sur une boîte PLUS LARGE que la vue.
 *
 * ⚠️ `ProgressBar` et `Skeleton` déclarent `background-size: 220%` et `280%`, parce que le
 * CSS anime la position du fond. En Compose, cela se rend en donnant à `bornesDeAngle` une
 * largeur virtuelle — JAMAIS en étirant la vue, qui déformerait aussi ses enfants.
 *
 * `glissement` est en fraction de la largeur RÉELLE : c'est ce que le miroitement du
 * squelette anime. Ses bornes viennent du CSS, pas de l'intuition — voir `Skeleton`.
 */
fun Degrade.brosseEtiree(taille: Size, facteur: Float, glissement: Float = 0f): Brush {
    val virtuelle = Size(taille.width * facteur, taille.height)
    val (debut, fin) = bornesDeAngle(angleDeg, virtuelle)
    /*
     * ⚠️ LA BOÎTE VIRTUELLE EST DÉJÀ CALÉE À GAUCHE, et c'est ce qu'il faut.
     * `background-position` vaut 0 par défaut : le fond de 220 % ou 280 % de large a son
     * bord gauche sur celui de la boîte. Une première version RECENTRAIT la boîte virtuelle
     * sur la vue — ce qui décalait la rampe d'un demi-écart et faisait démarrer la barre de
     * progression au VIOLET là où le kit la fait démarrer au BLEU. Le défaut ressemble à un
     * choix de dégradé ; seule la mesure le distingue.
     *
     * `glissement` est en fractions de la largeur RÉELLE, comme le CSS le calcule :
     * `offset = position × (largeurBoîte − largeurImage)`.
     */
    val recalage = Offset(glissement * taille.width, 0f)
    return Brush.linearGradient(
        colorStops = arrets.toTypedArray(),
        start = debut + recalage,
        end = fin + recalage,
    )
}

/**
 * Le modificateur d'usage : la taille n'est connue qu'au dessin, donc le dégradé ne peut
 * pas être construit à la composition.
 */
fun Modifier.fondDegrade(d: Degrade, forme: Shape = RectangleShape): Modifier =
    this.clip(forme).drawBehind { drawRect(d.brosse(size)) }

/** Idem, pour une brosse plus large que la boîte (`ProgressBar`, `Skeleton`). */
fun Modifier.fondDegradeEtire(
    d: Degrade,
    facteur: Float,
    forme: Shape = RectangleShape,
    glissement: () -> Float = { 0f },
): Modifier = this.clip(forme).drawBehind {
    drawRect(d.brosseEtiree(size, facteur, glissement()))
}
