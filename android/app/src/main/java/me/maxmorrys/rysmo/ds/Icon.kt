package me.maxmorrys.rysmo.ds

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import java.util.concurrent.ConcurrentHashMap

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES 109 GLYPHES.
 *
 * Les tracés viennent de `Icones.generated.kt`, qui vient de `src/design-system/icons.ts`.
 * Une seule source pour le web et pour le natif : c'est le raisonnement d'AD-8 appliqué
 * aux tracés, et c'est ce qui empêche un jeu d'icônes de dériver un glyphe à la fois.
 *
 * ⚠️ LE VECTEUR EST MÉMOÏSÉ PAR (NOM, ÉPAISSEUR), et pas par écran.
 * Reconstruire un `ImageVector` à chaque recomposition rejouerait l'analyse de la chaîne
 * SVG à chaque image — pour une barre d'onglets, cinq fois par frame. Le cache est un
 * `ConcurrentHashMap` parce que les aperçus et le fil principal peuvent y toucher ensemble.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** L'épaisseur par défaut du kit. Un glyphe qui s'en écarte porte la sienne. */
private const val EPAISSEUR_KIT = 2.2f

/** La boîte de dessin des glyphes : 24 × 24, comme le `viewBox` du kit. */
private const val BOITE = 24f

private val CACHE = ConcurrentHashMap<String, ImageVector>()

/**
 * Le vecteur d'un glyphe.
 *
 * ⚠️ LA COULEUR EST UN SENTINEL, PAS UNE VALEUR DE DESIGN. `ImageVector` fige la teinte de
 * ses tracés à la construction ; on la remplace intégralement au rendu par un
 * `ColorFilter.tint`. Écrire ici une teinte du système serait pire, pas mieux : elle serait
 * mémoïsée avec le vecteur et ne basculerait jamais en mode sombre.
 *
 * ⚠️ Un nom inconnu rend `check`, comme le kit (`Icon.jsx` : `MM_ICONS[name] || MM_ICONS.check`).
 * Il ne rend RIEN d'invisible : un glyphe manquant doit se voir.
 */
fun vecteurGlyphe(nom: String, epaisseur: Float? = null): ImageVector {
    val g = GLYPHES[nom] ?: GLYPHES.getValue("check")
    val e = epaisseur ?: g.epaisseur ?: EPAISSEUR_KIT
    return CACHE.getOrPut("$nom@$e") {
        ImageVector.Builder(
            name = nom,
            defaultWidth = BOITE.dp,
            defaultHeight = BOITE.dp,
            viewportWidth = BOITE,
            viewportHeight = BOITE,
        ).apply {
            g.plein?.let { addPath(addPathNodes(it), fill = SolidColor(Color.Black)) }
            g.traits.forEach {
                addPath(
                    pathData = addPathNodes(it),
                    stroke = SolidColor(Color.Black),
                    strokeLineWidth = e,
                    strokeLineCap = StrokeCap.Round,
                    strokeLineJoin = StrokeJoin.Round,
                )
            }
        }.build()
    }
}

/**
 * Un glyphe.
 *
 * ⛔ `description` EST OBLIGATOIRE DÈS QUE LE GLYPHE PORTE L'INFORMATION. Un `null`
 * explicite dit « ce glyphe est décoratif, le texte à côté dit déjà tout » — et ce cas
 * existe : un chevron dans une ligne cliquable dont le libellé est déjà lu. Mais il se
 * DÉCLARE ; il n'est pas le défaut par omission.
 *
 * L'épaisseur suit le glyphe (2,4 pour `search` et `lock`, 3,4 pour `check`…) et se force
 * pour les rares appels du kit qui l'ajustent.
 */
@Composable
fun Icon(
    nom: String,
    description: String?,
    modifier: Modifier = Modifier,
    taille: Dp = 22.dp,
    couleur: Color = Color.Unspecified,
    epaisseur: Float? = null,
) {
    val encre = couleur.takeOrElse { LocalEncre.current.takeOrElse { jetons.textBody } }
    Image(
        imageVector = vecteurGlyphe(nom, epaisseur),
        contentDescription = description,
        modifier = if (description == null) {
            modifier.size(taille).clearAndSetSemantics { }
        } else {
            modifier.size(taille)
        },
        colorFilter = ColorFilter.tint(encre),
    )
}
