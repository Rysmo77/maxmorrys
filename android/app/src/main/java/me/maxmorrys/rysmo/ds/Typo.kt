package me.maxmorrys.rysmo.ds

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES QUATRE COMPOSABLES DE TEXTE.
 *
 * Il n'y en a que quatre, et c'est le sujet : `Display`, `Body`, `Eyebrow`, `Num`. Tout ce
 * qui écrit du texte passe par l'un d'eux. Un `Text` brut quelque part, c'est une taille,
 * une graisse et une encre choisies à la main — donc trois valeurs qui dériveront.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⛔ LES CROCHETS DES TITRES i18n SONT PORTEURS, ET ILS NE S'AFFICHENT PAS.
 *
 * `"AU [DIGITAL]."` : le fragment entre crochets est celui que l'arc remplit au survol
 * côté web. En natif il n'y a pas de survol — mais LES RETIRER DE LA CHAÎNE CASSE LE WEB
 * EN SILENCE, et aucune porte ne le voit. Le natif les enlève donc À L'AFFICHAGE, jamais à
 * la source.
 */
fun sansCrochets(texte: String): String = texte.replace("[", "").replace("]", "")

/**
 * LE TITRE D'AFFICHAGE. Fraunces 900, jamais sous 22 sp.
 *
 * ⛔ IL NE SE REPLIE JAMAIS TOUT SEUL. Les titres sont ÉCRITS PAR LANGUE, ligne par ligne :
 * le français court ~18 % plus long, et un titre calé sur trois lignes en français en fait
 * deux en anglais — le bloc perd sa masse, qui EST le dessin. D'où `lignes: List<String>`,
 * rendu en une ligne de texte par entrée, `maxLines = 1`.
 *
 * ⚠️ `TextOverflow.Visible` est délibéré : si une ligne dépasse, elle doit DÉBORDER, pas se
 * faire couper par des points de suspension. Un titre tronqué est un défaut de traduction,
 * et il doit se voir comme tel.
 */
@Composable
fun Display(
    lignes: List<String>,
    modifier: Modifier = Modifier,
    cran: CranDisplay = CranDisplay.MD,
    taille: TextUnit = TextUnit.Unspecified,
    couleur: Color = Color.Unspecified,
) {
    val style = if (taille != TextUnit.Unspecified) Typo.display(taille) else Typo.display(cran)
    val encre = couleur.takeOrElse { jetons.textBody }
    Column(modifier) {
        lignes.forEach { ligne ->
            Text(
                text = sansCrochets(ligne),
                style = style,
                color = encre,
                maxLines = 1,
                overflow = TextOverflow.Visible,
            )
        }
    }
}

/** Le cas à une ligne, pour ne pas écrire `listOf(...)` partout. */
@Composable
fun Display(
    texte: String,
    modifier: Modifier = Modifier,
    cran: CranDisplay = CranDisplay.MD,
    taille: TextUnit = TextUnit.Unspecified,
    couleur: Color = Color.Unspecified,
) = Display(listOf(texte), modifier, cran, taille, couleur)

/** Le grain de corps : corps courant, chapô, ou prose bornée en largeur. */
enum class GrainCorps { CORPS, CHAPO, PROSE }

/**
 * LE CORPS DE TEXTE.
 *
 * ⛔ LA COLONNE DE LECTURE NE DÉPASSE JAMAIS 68 CARACTÈRES, quelle que soit la largeur
 * d'écran. C'est la seule règle de mise en page non négociable du système ; l'espace gagné
 * va à la marge. `measureProse` porte le chiffre, et `PROSE` l'applique.
 */
@Composable
fun Body(
    texte: String,
    modifier: Modifier = Modifier,
    grain: GrainCorps = GrainCorps.CORPS,
    attenue: Boolean = false,
    maxLignes: Int = Int.MAX_VALUE,
    couleur: Color = Color.Unspecified,
) {
    val style: TextStyle
    val defaut: Color
    when (grain) {
        GrainCorps.CORPS -> { style = Typo.corps; defaut = jetons.textBody }
        /* Le chapô est attenué PAR DÉFINITION : c'est ce qui le distingue du corps. */
        GrainCorps.CHAPO -> { style = Typo.chapo; defaut = jetons.textMuted }
        GrainCorps.PROSE -> { style = Typo.prose; defaut = jetons.textBody }
    }
    Text(
        text = texte,
        style = style,
        color = couleur.takeOrElse { if (attenue) jetons.textMuted else defaut },
        maxLines = maxLignes,
        overflow = if (maxLignes == Int.MAX_VALUE) TextOverflow.Clip else TextOverflow.Ellipsis,
        modifier = if (grain == GrainCorps.PROSE) {
            modifier.widthIn(max = (Metrique.measureProse * style.fontSize.value * 0.5f).dp)
        } else {
            modifier
        },
    )
}

/**
 * LE SOURCIL. JetBrains Mono, capitales, +0,14em.
 *
 * ⚠️ LES CAPITALES SE POSENT SUR LA CHAÎNE, PAS SUR LE STYLE. Compose n'a pas de
 * `text-transform`, et la casse est une décision de LANGUE : `localeCourante()` fait la
 * différence entre le « i » turc et le nôtre. Passer par le style l'ignorerait.
 */
@Composable
fun Eyebrow(
    texte: String,
    modifier: Modifier = Modifier,
    couleur: Color = Color.Unspecified,
) {
    Text(
        text = texte.uppercase(localeCourante()),
        style = Typo.sourcil,
        color = couleur.takeOrElse { jetons.textEyebrow },
        modifier = modifier,
    )
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * `Num` — LE SEUL CHEMIN VERS LA MONOSPACE POUR UN CHIFFRE.
 *
 * ⛔ « Un nombre en monospace vient de la base ou d'une source citée. Sinon il ne s'affiche
 * pas. » C'est une règle de CONTENU, et elle ne s'arrête pas à la frontière de la
 * plateforme. D'où `source` et `asOf` OBLIGATOIRES : pas de valeur par défaut, pas de
 * nullable — le compilateur refuse un nombre sans provenance.
 *
 * ⛔ `valeur = null` NE REND PAS UN TIRET. Il rend le repli, qui dit POURQUOI la valeur
 * manque. Un tiret cache la différence entre « c'est zéro » et « je ne sais pas », et cette
 * différence EST l'information.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun Num(
    valeur: String?,
    source: String,
    asOf: String,
    modifier: Modifier = Modifier,
    unite: String? = null,
    repli: String = "pas encore mesuré",
    taille: TextUnit = 19.sp,
    couleur: Color = Color.Unspecified,
) {
    if (valeur == null) {
        /* Le repli est du CORPS, pas de la monospace : ce n'est pas un nombre. */
        Text(
            text = repli,
            style = Typo.corps,
            color = couleur.takeOrElse { jetons.textFaint },
            modifier = modifier,
        )
        return
    }
    Text(
        text = if (unite != null) "$valeur $unite" else valeur,
        style = Typo.nombre(taille),
        color = couleur.takeOrElse { jetons.textNum },
        modifier = modifier,
    )
}
