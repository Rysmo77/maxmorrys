package me.maxmorrys.rysmo.ds

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES STYLES DE TEXTE — trois familles, treize corps, huit approches.
 *
 * ⛔ L'INTERLETTRAGE DU SYSTÈME EST RELATIF À LA TAILLE (`em`), pas une valeur fixe.
 * −1,2 px sur un titre de 74 sp ne serre rien ; sur un titre de 23 sp il écrase. Les jetons
 * `ls*` sont donc émis en `em`, et Compose fait le calcul.
 *
 * ⛔ LE TABULAIRE N'EST PAS OPTIONNEL SUR UN NOMBRE. Sans lui, une colonne de nombres qui
 * se met à jour tressaute. `fontFeatureSettings = "tnum"`.
 *
 * ⚠️ `includeFontPadding = false` partout : les interlignes du kit descendent à 0,90, et le
 * rembourrage de fonte hérité d'Android ajoute au-dessus et en dessous de quoi les annuler.
 * Sans ce réglage, un titre d'affichage à trois lignes gagne une demi-ligne d'air par ligne
 * et le bloc perd sa masse — c'est précisément ce que l'interligne serré existe pour créer.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⚠️ COMPOSE N'A PAS DE MULTIPLICATEUR D'INTERLIGNE : `lineHeight` y est ABSOLU.
 * Les jetons `lh*` sont des multiplicateurs (0,90 · 1,45 · 1,68). On les résout ici, une
 * fois, contre la taille — et jamais en écrivant « 37 sp » quelque part.
 */
private fun interligne(taille: TextUnit, facteur: Float): TextUnit = (taille.value * facteur).sp

private val PLAT = PlatformTextStyle(includeFontPadding = false)
private val LIGNE = LineHeightStyle(
    alignment = LineHeightStyle.Alignment.Center,
    trim = LineHeightStyle.Trim.None,
)

private fun style(
    famille: FontFamily,
    graisse: androidx.compose.ui.text.font.FontWeight,
    taille: TextUnit,
    approche: TextUnit = TextUnit.Unspecified,
    facteurLigne: Float? = null,
    tabulaire: Boolean = false,
) = TextStyle(
    fontFamily = famille,
    fontWeight = graisse,
    fontSize = taille,
    letterSpacing = approche,
    lineHeight = facteurLigne?.let { interligne(taille, it) } ?: TextUnit.Unspecified,
    fontFeatureSettings = if (tabulaire) "tnum" else null,
    platformStyle = PLAT,
    lineHeightStyle = LIGNE,
)

/** Les cinq crans d'affichage du kit, plus le titre de carte territoire. */
enum class CranDisplay { XXL, XL, MD, SM, XS }

/**
 * La table des styles. Elle n'invente rien : chaque valeur vient de `Metrique`, donc du CSS.
 *
 * ⚠️ Ce n'est PAS `MaterialTheme.typography`. Aucun écran ne lit Material pour peindre du
 * texte : les corps, les approches et les interlignes appartiennent au kit.
 */
@Immutable
object Typo {

    fun display(cran: CranDisplay): TextStyle = when (cran) {
        CranDisplay.XXL -> style(Fraunces, Metrique.weightBlack, Metrique.fsDspXxl, Metrique.lsDspXxl, Metrique.lhDspXxl)
        CranDisplay.XL -> style(Fraunces, Metrique.weightBlack, Metrique.fsDspXl, Metrique.lsDspXl, Metrique.lhDspXl)
        CranDisplay.MD -> style(Fraunces, Metrique.weightBlack, Metrique.fsDsp, Metrique.lsDsp, Metrique.lhDsp)
        CranDisplay.SM -> style(Fraunces, Metrique.weightBlack, Metrique.fsDspSm, Metrique.lsDspSm, Metrique.lhDspSm)
        CranDisplay.XS -> style(Fraunces, Metrique.weightBlack, Metrique.fsDspXs, Metrique.lsDspXs, Metrique.lhDspXs)
    }

    /**
     * Un affichage à taille libre. Les crans nommés couvrent le système ; celui-ci sert aux
     * titres d'écran natifs, que le kit dimensionne à la ligne (27, 30, 32…).
     *
     * L'approche et l'interligne se CALCULENT : −0,035 × taille et 0,98 × taille.
     * ⚠️ Le châssis natif du kit (`NativeShell.js`, `NTitre`) pose 0,94 plutôt que 0,98.
     * L'écart n'est pas tranché par le kit lui-même ; la valeur de la spécification est
     * retenue, et l'écart est signalé plutôt que dissous.
     */
    fun display(taille: TextUnit): TextStyle =
        style(Fraunces, Metrique.weightBlack, taille, (-0.035f).em, 0.98f)

    /** Le titre d'une carte territoire — Fraunces 900 à 26 sp. */
    val titreCarte: TextStyle =
        style(Fraunces, Metrique.weightBlack, Metrique.fsTtl, Metrique.lsTtl, 1.0f)

    val corps: TextStyle = style(SchibstedGrotesk, Metrique.weightBody, Metrique.fsBody, facteurLigne = Metrique.lhBody)
    val chapo: TextStyle = style(SchibstedGrotesk, Metrique.weightBody, Metrique.fsLede, facteurLigne = Metrique.lhLede)
    val prose: TextStyle = style(SchibstedGrotesk, Metrique.weightBody, Metrique.fsProse, facteurLigne = Metrique.lhProse)
    val meta: TextStyle = style(SchibstedGrotesk, Metrique.weightBody, Metrique.fsMeta)
    val meta2: TextStyle = style(SchibstedGrotesk, Metrique.weightSemi, Metrique.fsMeta2)
    val petit: TextStyle = style(SchibstedGrotesk, Metrique.weightBody, Metrique.fsSmall)

    /**
     * Le sourcil. JetBrains Mono, capitales, +0,14em.
     * ⚠️ Les capitales se posent sur la CHAÎNE (`uppercase(locale)`), jamais par un style :
     * Compose n'a pas de `text-transform`, et la casse est une décision de langue.
     */
    val sourcil: TextStyle =
        style(JetBrainsMono, Metrique.weightBody, Metrique.fsEyebrow, Metrique.lsEyebrow)

    /**
     * Le nombre vérifié. Monospace 700, tabulaire.
     * ⛔ C'est le SEUL chemin vers la monospace pour un chiffre — « un nombre en monospace
     * vient de la base ou d'une source citée. Sinon il ne s'affiche pas. »
     */
    fun nombre(taille: TextUnit): TextStyle =
        style(JetBrainsMono, Metrique.weightBold, taille, Metrique.lsNum, tabulaire = true)

    /** Le prix — 31 sp, approche propre à −0,04em (`PriceBlock.jsx`). */
    val prix: TextStyle =
        style(JetBrainsMono, Metrique.weightBold, 31.sp, (-0.04f).em, tabulaire = true)

    /** Le relevé d'une case de statistique — 27 sp. */
    val releve: TextStyle = nombre(27.sp)

    /** Le code de certificat — 19 sp, approche POSITIVE : on le lit caractère par caractère. */
    val code: TextStyle =
        style(JetBrainsMono, Metrique.weightBold, 19.sp, 0.06f.em, tabulaire = true)

    /** Le mot-symbole : Fraunces 900, approche −0,045em, interligne 1. */
    fun motSymbole(taille: TextUnit): TextStyle =
        style(Fraunces, Metrique.weightBlack, taille, (-0.045f).em, 1.0f)
}

/** Le style de corps, teinté de l'encre courante. Raccourci de lecture, pas un style de plus. */
val corpsCourant: TextStyle
    @Composable @ReadOnlyComposable get() = Typo.corps.copy(color = jetons.textBody)
