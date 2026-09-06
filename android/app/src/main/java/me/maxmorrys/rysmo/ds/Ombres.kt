package me.maxmorrys.rysmo.ds

import android.graphics.BlurMaskFilter
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.addOutline
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.Dp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES 19 OMBRES DU SYSTÈME, ET LES 13 QUE LE KIT N'A PAS MISES EN JETON.
 *
 * ⛔ `Modifier.shadow` NE SAIT PAS exprimer un décalage, un rayon de flou, un étalement et
 * une couleur indépendants : il ne prend qu'une élévation. Les ombres du kit se dessinent
 * donc à la main.
 *
 * ⛔ LE RAYON CSS N'EST PAS L'ÉCART-TYPE. `box-shadow … 38px …` correspond à une gaussienne
 * d'écart-type 19. `BlurMaskFilter(flou / 2, NORMAL)`. Prendre le rayon tel quel double
 * l'étalement de toutes les ombres du produit — et ça ressemble à un choix esthétique.
 *
 * ⚠️ CE QUE CE RENDU COÛTE SOUS API 28. `Paint.setMaskFilter` n'est honoré par le canevas
 * matériel qu'à partir d'Android 9. En dessous, l'ombre ne se dessine PAS — elle ne
 * plante pas, elle disparaît. C'est une dégradation acceptable ici, et pour la raison même
 * qui fait tenir le verre sans flou : « ce qui fait qu'un verre a l'air d'un verre n'est
 * pas le flou, c'est le liseré de lumière de 1 px en haut, la bordure blanche, et la
 * saturation. » Le liseré, lui, est un TRAIT : il se dessine partout.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Une ombre portée. `null` et les ombres intérieures ne dessinent rien : une `inset` est un
 * liseré, pas une ombre — voir `liseretHaut`.
 *
 * Les trois anneaux (`focusRing`, `errorRing`, `ctlSelRing`) passent par ici sans flou :
 * `0 0 0 3px` n'est ni décalé ni flouté, c'est le CONTOUR ÉLARGI peint derrière la forme.
 * C'est exactement ce que le CSS produit, et ça évite un second chemin de rendu.
 */
fun Modifier.ombre(o: Ombre?, forme: Shape): Modifier =
    if (o == null || o.inset) this else this.drawBehind { dessineOmbre(o, forme) }

/** Idem, mais posé PAR-DESSUS le contenu — pour un anneau de focus qui doit rester visible. */
fun Modifier.anneau(o: Ombre?, forme: Shape): Modifier =
    if (o == null || o.inset) this else this.drawWithContent {
        dessineOmbre(o, forme)
        drawContent()
    }

private fun DrawScope.dessineOmbre(o: Ombre, forme: Shape) {
    val etalePx = o.etale.toPx()
    val contour = forme.createOutline(
        Size(size.width + etalePx * 2f, size.height + etalePx * 2f),
        layoutDirection,
        this,
    )
    val chemin = Path().apply { addOutline(contour) }
    val flouPx = o.flou.toPx()
    drawIntoCanvas { toile ->
        /* ⚠️ Un `android.graphics.Paint` DIRECT, pas un `Paint` de Compose converti :
           `asFrameworkPaint()` est déprécié, et de toute façon `BlurMaskFilter` est une
           notion de la plateforme — passer par l'abstraction pour en ressortir aussitôt
           n'apporte rien qu'un aller-retour. */
        val cadre = android.graphics.Paint()
        cadre.isAntiAlias = true
        cadre.color = o.couleur.toArgb()
        /* ⚠️ `BlurMaskFilter` REFUSE un rayon nul (IllegalArgumentException). Les anneaux
           `0 0 0 3px` n'ont pas de flou : on saute le filtre plutôt que de forcer un 0,01
           qui ferait croire à un flou là où il n'y en a pas. */
        if (flouPx > 0f) cadre.maskFilter = BlurMaskFilter(flouPx / 2f, BlurMaskFilter.Blur.NORMAL)
        translate(o.dx.toPx() - etalePx, o.dy.toPx() - etalePx) {
            toile.nativeCanvas.drawPath(chemin.asAndroidPath(), cadre)
        }
    }
}

/**
 * LE LISERÉ DE LUMIÈRE — `inset 0 1px 0 rgba(255,255,255,.75)`.
 *
 * Compose n'a pas d'ombre intérieure. Les sept `inset` du système sont tous le même
 * objet : un trait de 1 dp en haut, à l'intérieur du rognage, sans flou (leur troisième
 * valeur vaut 0). C'est LUI qui porte l'effet de verre, dans les deux modes : ne jamais le
 * supprimer au prétexte que le flou a disparu.
 *
 * `rayon` retire de chaque extrémité la largeur du coin arrondi, pour que le trait ne
 * déborde pas dans la courbe.
 */
fun Modifier.liseretHaut(o: Ombre?, rayon: Dp): Modifier =
    if (o == null || !o.inset) this else this.drawWithContent {
        drawContent()
        val r = rayon.toPx().coerceAtMost(size.width / 2f)
        val y = o.dy.toPx() / 2f
        drawLine(
            color = o.couleur,
            start = Offset(r, y),
            end = Offset(size.width - r, y),
            strokeWidth = o.dy.toPx().coerceAtLeast(1f),
        )
    }
