package me.maxmorrys.rysmo.ds

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text
import kotlin.math.roundToInt

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA MARQUE — et les deux marques qui ne sont pas la nôtre.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Les deux mots-symboles portés en natif.
 *
 * ⛔ `hello` N'EST PAS PORTÉ. Il repose sur `background-clip: text`, qui n'a pas
 * d'équivalent direct, et il ne sert qu'à la barre du SITE.
 *
 * ⛔ NE JAMAIS CONFONDRE *Rysmo* (le nom de l'application) et le *Répétiteur* (l'IA qui vit
 * dedans). Le second porte le nom que la personne lui a donné, lu dans les préférences,
 * jamais écrit en dur.
 */
enum class MotSymbole {
    /** L'APPLICATION. Le R prend le bleu, le o final le teal : la marque garde ses bornes. */
    RYSMO,

    /** LA PERSONNE — mentions légales, page « Je suis Max-Morrys », signature d'article. */
    SIGNATURE,
}

/**
 * Le mot-symbole, coloré lettre par lettre.
 *
 * `nuit` sélectionne les variantes nocturnes des quatre teintes de marque. Ce n'est pas le
 * mode : c'est le FOND SUR LEQUEL le mot est posé — un mot-symbole sur un aplat sombre en
 * plein jour a besoin des mêmes teintes qu'en pleine nuit.
 */
@Composable
fun Wordmark(
    marque: MotSymbole = MotSymbole.RYSMO,
    modifier: Modifier = Modifier,
    taille: TextUnit = 22.sp,
    queue: Color = Color.Unspecified,
    nuit: Boolean = false,
    court: Boolean = false,
) {
    val p = jetons
    val bleu = if (nuit) p.mmBleuN else p.mmBleu
    val orange = if (nuit) p.mmOrangeN else p.mmOrange
    val teal = if (nuit) p.mmTealN else p.mmTeal
    val violet = if (nuit) p.mmVioletN else p.mmViolet
    val fin = queue.takeOrElse { p.textBody }

    val texte: AnnotatedString = buildAnnotatedString {
        when (marque) {
            MotSymbole.RYSMO -> {
                withStyle(SpanStyle(color = bleu)) { append("R") }
                withStyle(SpanStyle(color = fin)) { append("ysm") }
                withStyle(SpanStyle(color = teal)) { append("o") }
            }
            MotSymbole.SIGNATURE -> {
                withStyle(SpanStyle(color = bleu)) { append("M") }
                withStyle(SpanStyle(color = orange)) { append("a") }
                withStyle(SpanStyle(color = teal)) { append("x") }
                if (!court) {
                    withStyle(SpanStyle(color = violet)) { append("-") }
                    withStyle(SpanStyle(color = fin)) { append("Morrys") }
                }
            }
        }
    }
    Text(text = texte, style = Typo.motSymbole(taille), modifier = modifier, maxLines = 1)
}

/**
 * L'ICÔNE DE MARQUE.
 *
 * ⛔ UN SEUL FICHIER EXISTE, EN PNG À FOND BLANC — pas de SVG, pas de monochrome, pas de
 * logotype horizontal. Le kit compense par une PASTILLE blanche. Sur un maillage nuit ou un
 * aplat de marque, la pastille est OBLIGATOIRE : sans elle, le carré blanc du PNG se
 * découpe sur le fond.
 *
 * ⚠️ Question ouverte pour l'humain : aucun asset transparent n'a été trouvé au dépôt.
 * En attendant, ce composable rend le VECTORIEL du lanceur — les quatre chevrons de
 * `ic_launcher_foreground`, dont les teintes viennent de `marque.generated.xml`. C'est le
 * seul dessin de marque qui existe au dépôt en forme vectorielle, et il est déjà généré.
 * Le PNG à 1 240 px du kit n'est pas dans l'arbre Android.
 */
@Composable
fun LogoMark(
    modifier: Modifier = Modifier,
    taille: Dp = 40.dp,
    pastille: Boolean = true,
    description: String? = "Max-Morrys",
) {
    val rayon = (taille.value * 0.28f).roundToInt().dp
    val image = (taille.value * 0.86f).roundToInt().dp
    Box(
        modifier
            .size(taille)
            .then(
                if (pastille) {
                    Modifier
                        .ombre(HorsTable.ombrePastilleLogo, RoundedCornerShape(rayon))
                        .clip(RoundedCornerShape(rayon))
                        .background(jetons.paperFixed)
                } else {
                    Modifier
                },
            ),
        contentAlignment = Alignment.Center,
    ) {
        androidx.compose.foundation.Image(
            painter = painterResource(me.maxmorrys.rysmo.R.drawable.ic_launcher_foreground),
            contentDescription = description,
            modifier = Modifier.size(if (pastille) image else taille),
        )
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES MARQUES TIERCES — la seule famille de teintes qui ne bascule JAMAIS.
 *
 * ⛔ C'EST LA RAISON INVERSE DE LA RÈGLE GÉNÉRALE. Partout ailleurs, une valeur figée est
 * un défaut de mode sombre garanti ; ici, Google impose ses quatre couleurs et Apple impose
 * son asset et son noir. Les faire basculer serait un motif de rejet en revue, sur l'écran
 * de connexion — celui que tout le monde voit.
 *
 * Les teintes viennent quand même du générateur (`MarqueTierce`) : le fichier de marques ne
 * doit pas être le seul endroit du produit où une couleur vit hors génération, sinon la
 * porte qui l'interdit doit s'ouvrir pour lui — et une porte à exception ne garde plus rien.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun GoogleMark(modifier: Modifier = Modifier, taille: Dp = 19.dp) {
    val bleu = MarqueTierce.googleBleu
    val vert = MarqueTierce.googleVert
    val jaune = MarqueTierce.googleJaune
    val rouge = MarqueTierce.googleRouge
    Canvas(modifier.size(taille).clearAndSetSemantics { }) {
        val c = size.minDimension / 24f
        /* Le « G » officiel, en quatre quartiers de tracé. Le dessin est ramené à la boîte
           de 24 du kit pour que le glyphe s'aligne sur les autres icônes de la ligne. */
        /* ⚠️ TRACÉ TRANSCRIT, PAS ASSET OFFICIEL. Les quatre TEINTES sont exactes et
           générées ; la géométrie, elle, est une transcription du « G » à quatre quartiers.
           Comme pour la pomme, l'asset officiel doit la remplacer avant toute soumission :
           une marque tierce approximative est un motif de rejet qui ne se voit qu'en revue. */
        val chemins = listOf(
            bleu to "M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z",
            vert to "M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.759-5.596-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z",
            jaune to "M6.404 13.9A5.99 5.99 0 0 1 6.09 12c0-.659.114-1.3.314-1.9V7.51H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.141 1.064 4.49l3.34-2.59z",
            rouge to "M12 5.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C16.959 2.99 14.695 2 12 2 8.09 2 4.71 4.24 3.064 7.51l3.34 2.59C7.19 7.736 9.395 5.977 12 5.977z",
        )
        chemins.forEach { (teinte, d) ->
            val chemin = androidx.compose.ui.graphics.vector.PathParser()
                .parsePathString(d).toPath()
            scale(c, c, androidx.compose.ui.geometry.Offset.Zero) {
                drawPath(chemin, teinte)
            }
        }
    }
}

/**
 * ⚠️ EMPLACEMENT RÉSERVÉ, ET IL DOIT LE RESTER JUSQU'À L'ASSET OFFICIEL.
 *
 * Apple interdit un dessin refait de sa pomme. Le port React Native en avait dessiné une :
 * elle DOIT être remplacée par l'asset officiel avant toute soumission. Un carré de papier
 * fixe est un manque visible ; une pomme approximative est un motif de rejet invisible
 * jusqu'à la revue.
 */
@Composable
fun AppleMark(modifier: Modifier = Modifier, taille: Dp = 19.dp) {
    Box(
        modifier
            .size(taille)
            .clip(CircleShape)
            .background(jetons.paperFixed)
            .clearAndSetSemantics { },
    )
}
