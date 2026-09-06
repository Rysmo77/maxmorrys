package me.maxmorrys.rysmo.ds

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.Dp
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.sqrt

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE MAILLAGE — LE FOND DE TOUTE L'APPLICATION.
 *
 * Cinq maillages — quatre territoires plus la nuit — de trois lobes chacun, sous un voile
 * de lisibilité vertical. Poids réseau : 0 octet. C'est ce qui remplace la vidéo d'accueil
 * de 2 à 6 Mo, sur un marché où le panier de données 2 Go coûte en médiane 4,2 % du revenu
 * national brut par habitant.
 *
 * ⛔ LES LOBES SONT DES CERCLES, PAS DES ELLIPSES.
 * `DS_Final/brand/mesh.css` : `width:340px;height:340px;border-radius:50%`. Largeur ÉGALE
 * hauteur. Le port React Native posait chaque lobe en `<Rect>` dont la largeur et la
 * hauteur étaient des POURCENTAGES — donc résolues contre deux axes différents d'un écran
 * non carré — avec un dégradé radial en `objectBoundingBox`. Sur 412 × 915 avec r = 0,62,
 * cela donnait une ellipse de rapport 2,2:1 là où le kit demande 1:1. Rien ne le signalait.
 *
 * ⛔ SUR NATIF, LE MAILLAGE EST FIGÉ. La dérive de 25 à 38 s du web n'est pas portée, et ce
 * n'est pas une régression à rattraper : c'est la décision. Elle se rouvre si une mesure
 * sur appareil réel montre que ça tient — pas avant.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Les cinq maillages. `NUIT` est un CINQUIÈME territoire, pas le mode sombre des quatre. */
enum class Territoire { FORME, INFORME, TRANSFORME, DIGITALISE, NUIT }

/** Les quatre territoires de la marque. L'agence est hors territoire ; la nuit aussi. */
val TERRITOIRES_MARQUE = listOf(
    Territoire.FORME, Territoire.INFORME, Territoire.TRANSFORME, Territoire.DIGITALISE,
)

internal fun lobesDe(t: Territoire): List<Lobe> = when (t) {
    Territoire.FORME -> Maillage.forme
    Territoire.INFORME -> Maillage.informe
    Territoire.TRANSFORME -> Maillage.transforme
    Territoire.DIGITALISE -> Maillage.digitalise
    Territoire.NUIT -> Maillage.nuit
}

/** Le nombre d'arrêts échantillonnés sur le profil. Douze suffisent : la rampe est lisse. */
private const val ARRETS = 12

/**
 * Abramowitz & Stegun 7.1.26 — l'erreur maximale est de 1,5e-7, très en dessous du pas
 * d'un canal 8 bits. Compose n'a pas de fonction d'erreur, et `kotlin.math` non plus.
 */
private fun erf(x: Float): Float {
    val signe = if (x < 0) -1f else 1f
    val a = abs(x)
    val t = 1f / (1f + 0.3275911f * a)
    val y = 1f - (
        (
            (
                (
                    (1.061405429f * t - 1.453152027f) * t
                    ) + 1.421413741f
                ) * t - 0.284496736f
            ) * t + 0.254829592f
        ) * t * exp(-a * a)
    return signe * y
}

/**
 * LE PROFIL D'UN DISQUE FLOUTÉ, SANS `Modifier.blur`.
 *
 * ⛔ `Modifier.blur` s'appuie sur `RenderEffect`, API 31+, et le marché visé est bas de
 * gamme (`minSdk = 24`). Il est donc interdit ici. Le flou est remplacé par un dégradé
 * radial dont le profil EST celui du flou : c'est exact, et c'est gratuit — un
 * `ShaderBrush` se compose une fois, pas à chaque image.
 *
 * `filter: blur(σ)` applique une gaussienne d'écart-type σ. Un disque plein de rayon R
 * convolué par cette gaussienne a pour profil d'alpha, à distance r du centre :
 *
 *     alpha(r) = 0,5 · erfc( (r − R) / (σ · √2) )
 *
 * Le rayon utile s'arrête à R + 2,5σ — au-delà, alpha est sous 0,7 %.
 *
 * ⚠️ NE PAS RECOPIER UNE TABLE D'ARRÊTS : elle ne vaut que pour un rapport R/σ donné. Sur
 * Android (R = 230, σ = 52) le rapport vaut 4,42 ; sur iOS (R = 170) il vaut 3,27 et le
 * profil est plus mou. On calcule.
 */
internal fun profilLobe(rayonDisque: Float, sigma: Float): Pair<Float, List<Pair<Float, Float>>> {
    val rTotal = rayonDisque + 2.5f * sigma
    val k = sigma * sqrt(2f)
    val arrets = (0 until ARRETS).map { i ->
        val fraction = i / (ARRETS - 1f)
        fraction to (0.5f * (1f - erf((fraction * rTotal - rayonDisque) / k)))
    }
    return rTotal to arrets
}

/** Le fond de boîte et le voile, selon le territoire ET le mode. */
@Immutable
private data class Peinture(val fond: Color, val voile: List<Pair<Float, Color>>)

/**
 * ⚠️ LE CAS « MAILLAGE NUIT SUR TÉLÉPHONE EN MODE SOMBRE » N'EST TRANCHÉ PAR AUCUNE RÈGLE
 * DU KIT. Le CSS distingue `.m-nuit::after` (voile #0A0D11) et `.dk .mesh::after` (voile
 * #0B0E13) : deux voiles pour deux situations, qui diffèrent d'un point sur le premier
 * arrêt. Retenu ici : le TERRITOIRE gagne sur le mode, parce que c'est ce que fait la
 * cascade — `.m-nuit::after` est déclaré après `.mesh::after`. L'écart est invisible ; la
 * règle manque quand même, et elle est à demander au kit.
 */
private fun peinture(t: Territoire, sombre: Boolean): Peinture = when {
    t == Territoire.NUIT -> Peinture(Maillage.fondNuit, Maillage.voileNuit)
    sombre -> Peinture(Maillage.fondSombre, Maillage.voileSombre)
    else -> Peinture(Maillage.fondClair, Maillage.voileClair)
}

/**
 * Le maillage. Il se pose en PREMIER enfant du `Box` de l'écran, le contenu au-dessus.
 *
 * ⚠️ `clipToBounds` transcrit `overflow:hidden; contain:paint` du kit : sans lui, les lobes
 * débordent de l'écran et le rendu coûte au-delà de ce qui se voit.
 * ⚠️ `clearAndSetSemantics` : le maillage n'est jamais interactif ni annoncé. Trois formes
 * vides annoncées à chaque écran seraient du bruit pour qui écoute l'application.
 */
@Composable
fun Mesh(
    territoire: Territoire,
    modifier: Modifier = Modifier,
    taille: Dp = if (plateforme.estAndroid) Maillage.coteAndro else Maillage.coteIos,
) {
    val densite = LocalDensity.current
    val sombre = mode == Mode.SOMBRE
    val lobes = lobesDe(territoire)
    val p = peinture(territoire, sombre)

    val cotePx = with(densite) { taille.toPx() }
    /* ⛔ σ EST UNE LONGUEUR : il se convertit comme le rayon, sinon le rapport R/σ dépend
       de la densité de l'écran. À 420 dpi, un σ laissé en dp face à un rayon en pixels
       rendait des lobes 2,6 fois plus nets que le kit — beaux, mais pas les siens. */
    val sigmaPx = with(densite) { Maillage.sigmaFlou.toPx() }
    /* Le profil ne dépend que du côté : on le calcule une fois par taille, pas par image. */
    val (rTotal, arrets) = remember(cotePx, sigmaPx) { profilLobe(cotePx / 2f, sigmaPx) }

    Canvas(
        modifier
            .fillMaxSize()
            .clipToBounds()
            .clearAndSetSemantics { },
    ) {
        drawRect(p.fond)

        lobes.forEach { lobe ->
            val centre = Offset(
                x = lobe.x.centre(size.width, cotePx, densite),
                y = lobe.y.centre(size.height, cotePx, densite),
            )
            /* ⛔ UN CERCLE : même rayon sur les deux axes. C'est ce que dit le kit. */
            drawCircle(
                brush = Brush.radialGradient(
                    colorStops = arrets
                        .map { (position, alpha) ->
                            position to lobe.teinte.copy(alpha = alpha * lobe.opacite)
                        }
                        .toTypedArray(),
                    center = centre,
                    radius = rTotal,
                ),
                radius = rTotal,
                center = centre,
            )
        }

        /* Le voile de lisibilité. Sans lui, le maillage remonte sous le texte.
           ⛔ ET IL VIENT AVEC UN COROLLAIRE DE MISE EN PAGE CONTRAIGNANT : aucun texte de
           corps ne se place dans le premier tiers d'un écran à maillage. Le haut est
           réservé aux titres d'affichage — du grand texte, seuil 3:1, tenu à 4,28:1. Un
           écran qui pose du `Body` sous la barre haute est un défaut de conception. */
        drawRect(
            Brush.verticalGradient(
                colorStops = p.voile.toTypedArray(),
                startY = 0f,
                endY = size.height,
            ),
        )
    }
}

/**
 * ⛔ COMMENT ON OBTIENT UNE ELLIPSE, LE JOUR OÙ IL EN FAUDRA UNE.
 *
 * `Brush.radialGradient` NE FAIT QUE DES CERCLES : sa signature n'a qu'un `radius`. Pour
 * une ellipse de demi-axes rx et ry, on dessine un cercle du PLUS GRAND des deux et on
 * écrase l'autre axe par une transformation d'échelle centrée sur le lobe. La
 * transformation s'applique au shader COMME à la géométrie, donc le dégradé se déforme avec
 * le disque — c'est la différence avec un `drawOval`, où le shader resterait circulaire
 * dans un ovale rogné.
 *
 * ⛔ CE MÉCANISME NE DOIT PAS SERVIR AUX QUINZE LOBES DU KIT (rx == ry). Il est écrit ici
 * pour que personne ne le réinvente en pourcentages — c'est la voie par laquelle le port
 * React Native a produit des ellipses de 2,2:1 sans que rien ne le signale.
 */
fun DrawScope.lobeElliptique(
    centre: Offset,
    rx: Float,
    ry: Float,
    brosse: (Float) -> Brush,
) {
    val r = maxOf(rx, ry)
    withTransform({ scale(scaleX = rx / r, scaleY = ry / r, pivot = centre) }) {
        drawCircle(brush = brosse(r), radius = r, center = centre)
    }
}
