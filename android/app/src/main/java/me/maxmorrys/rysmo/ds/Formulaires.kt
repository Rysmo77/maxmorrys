package me.maxmorrys.rysmo.ds

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES SIX CONTRÔLES DE FORMULAIRE.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * LE CHAMP DE SAISIE.
 *
 * ⛔ TROIS ÉTATS SEULEMENT : repos, focus, erreur. Pas de « valide », pas de « rempli ». Un
 * quatrième état demanderait une quatrième couleur de liseré, et la personne devrait
 * apprendre ce qu'elle veut dire.
 *
 * ⚠️ L'ERREUR GAGNE SUR LE FOCUS. Un champ en erreur qu'on reprend reste en erreur tant
 * qu'il n'est pas revalidé : faire virer le liseré au bleu dès le premier appui effacerait
 * l'information au moment exact où la personne en a besoin.
 */
@Composable
fun Field(
    libelle: String,
    valeur: String,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    substitut: String = "",
    aide: String? = null,
    erreur: String? = null,
    multiligne: Boolean = false,
    clavier: KeyboardType = KeyboardType.Text,
    secret: Boolean = false,
    queue: (@Composable () -> Unit)? = null,
) {
    val p = jetons
    val source = remember { MutableInteractionSource() }
    val focus by source.collectIsFocusedAsState()
    val forme = RoundedCornerShape(Metrique.rM)

    val liseret by animateColorAsState(
        targetValue = when {
            erreur != null -> p.stop
            focus -> p.mmBleu
            else -> p.borderField
        },
        animationSpec = tween(Metrique.tUi, easing = Metrique.ease),
        label = "liseretChamp",
    )
    val anneau = when {
        erreur != null -> p.errorRing
        focus -> p.focusRing
        else -> null
    }

    Column(modifier.padding(top = Metrique.sp14)) {
        Text(
            text = libelle,
            style = Typo.corps.copy(fontSize = 12.5.sp, fontWeight = Metrique.weightSemi),
            color = p.textMuted,
            modifier = Modifier.padding(bottom = Metrique.sp6),
        )
        Row(
            Modifier
                .fillMaxWidth()
                .ombre(anneau, forme)
                .clip(forme)
                .background(p.fieldBg)
                .border(1.5.dp, liseret, forme)
                /* ⚠️ `fieldHl` vaut `none` en mode sombre — le seul jeton d'ombre qui change
                   de FORME entre les modes. Le type est nullable pour ça. */
                .liseretHaut(p.fieldHl, Metrique.rM)
                .defaultMinSize(minHeight = if (multiligne) 96.dp else 54.dp)
                .padding(
                    start = 16.dp,
                    end = 16.dp,
                    top = if (multiligne) 14.dp else 0.dp,
                ),
            verticalAlignment = if (multiligne) Alignment.Top else Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Metrique.sp10),
        ) {
            BasicTextField(
                value = valeur,
                onValueChange = onChange,
                modifier = Modifier.weight(1f),
                interactionSource = source,
                singleLine = !multiligne,
                textStyle = Typo.corps.copy(color = p.textBody),
                cursorBrush = SolidColor(p.mmBleu),
                visualTransformation = if (secret) PasswordVisualTransformation() else VisualTransformation.None,
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = clavier),
                decorationBox = { interieur ->
                    Box(contentAlignment = if (multiligne) Alignment.TopStart else Alignment.CenterStart) {
                        if (valeur.isEmpty()) {
                            Text(substitut, style = Typo.corps, color = p.textFaint, maxLines = 1)
                        }
                        interieur()
                    }
                },
            )
            queue?.invoke()
        }
        val bas = erreur ?: aide
        if (bas != null) {
            Text(
                text = bas,
                style = Typo.corps.copy(fontSize = 11.5.sp),
                color = if (erreur != null) p.stop else p.textFaint,
                modifier = Modifier.padding(top = Metrique.sp6),
            )
        }
    }
}

/**
 * L'INTERRUPTEUR.
 *
 * ⛔ SON FOND ACTIF EST UN DÉGRADÉ, pas un aplat. Le kit pose `var(--action-forme)` ; le
 * port React Native l'avait aplati en `mmBleu`, ce qui supprimait la moitié violette et
 * faisait de l'interrupteur le seul contrôle bleu uni du système.
 *
 * ⛔ L'ÉTAT DÉSACTIVÉ EST PORTEUR DE SENS : opacité 0,4 ET AUCUN RETOUR au toucher — un
 * interrupteur qui s'enfonce sans changer d'état dit qu'il a marché.
 */
@Composable
fun Switch(
    actif: Boolean,
    onPress: (() -> Unit)?,
    modifier: Modifier = Modifier,
    desactive: Boolean = false,
    libelle: String? = null,
) {
    val p = jetons
    val course by animateDpAsState(
        targetValue = if (actif) 19.dp else 0.dp,
        animationSpec = tween(Metrique.tUi, easing = Metrique.ease),
        label = "curseur",
    )
    val piste = RoundedCornerShape(16.dp)
    Box(
        modifier
            .alpha(if (desactive) OPACITE_ETEINT else 1f)
            .appui(
                onPress = if (desactive) null else onPress,
                encre = p.paperFixed,
                petit = true,
                desactive = desactive,
                libelle = libelle,
                role = Role.Switch,
            )
            .size(width = 48.dp, height = 29.dp)
            .then(
                if (actif) {
                    Modifier.fondDegrade(p.actionForme, piste)
                } else {
                    Modifier.clip(piste).background(p.fill4)
                },
            ),
    ) {
        Box(
            Modifier
                .offset(x = 3.dp + course, y = 3.dp)
                .ombre(HorsTable.ombreCurseurInterrupteur, CircleShape)
                .size(23.dp)
                .clip(CircleShape)
                .background(p.paperFixed),
        )
    }
}

/**
 * DEUX À TROIS OPTIONS COURTES. Au-delà, `ChipRow`.
 *
 * La limite n'est pas arbitraire : à quatre, les segments deviennent trop étroits pour leur
 * libellé et la piste cesse de se lire comme un choix unique.
 */
@Composable
fun Segmented(
    options: List<String>,
    valeur: String?,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val p = jetons
    val forme = RoundedCornerShape(Metrique.rPill)
    Row(
        modifier
            .clip(forme)
            .background(p.surfaceQuiet)
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        options.forEachIndexed { i, o ->
            val actif = if (valeur == null) i == 0 else valeur == o
            Box(
                Modifier
                    .weight(1f)
                    .appui(
                        onPress = { onChange(o) },
                        encre = p.ink,
                        petit = true,
                        libelle = o,
                        role = Role.Tab,
                    )
                    .ombre(if (actif) p.segOnSh else null, forme)
                    .clip(forme)
                    .background(if (actif) p.segOnBg else Color.Transparent)
                    .padding(vertical = 9.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = o,
                    style = Typo.corps.copy(fontSize = 13.sp, fontWeight = Metrique.weightSemi),
                    color = if (actif) p.ink else p.textMuted,
                    maxLines = 1,
                )
            }
        }
    }
}

/** Les trois dispositions d'une rangée de pilules. Un seul choix à trois issues NOMMÉES. */
enum class DispositionChips { CLIP, SCROLL, WRAP }

/**
 * LA RANGÉE DE FILTRES EN PILULES.
 *
 * ⛔ L'ÉCART EST `touchGap` (8 dp) ET IL N'EST PAS PARAMÉTRABLE. Deux cibles tactiles
 * voisines ont besoin d'un couloir entre elles ; le rendre réglable, c'est le voir passer à
 * 4 dp le jour où une bande de huit onglets ne tient pas.
 *
 * ⛔ `glyphe` NE S'AFFICHE QUE SUR LES PILULES INACTIVES. Sur l'active il répéterait une
 * information que l'état donne déjà — et sur une bande d'onglets verrouillés, un cadenas
 * sur l'onglet OUVERT serait faux.
 *
 * ⚠️ En `SCROLL`, les pilules ne se compriment pas (`0 0 auto` du kit) : sinon il n'y a plus
 * rien à faire défiler. En `CLIP`, elles doivent au contraire se comprimer — figées, les
 * dernières sont rognées, donc invisibles ET inatteignables.
 */
@Composable
fun ChipRow(
    options: List<String>,
    valeur: String?,
    onChange: ((String) -> Unit)?,
    modifier: Modifier = Modifier,
    hauteur: Dp = 40.dp,
    disposition: DispositionChips = DispositionChips.CLIP,
    glyphe: String? = null,
) {
    val contenu: @Composable () -> Unit = {
        options.forEachIndexed { i, o ->
            Chip(
                libelle = o,
                actif = if (valeur == null) i == 0 else valeur == o,
                onPress = onChange?.let { { it(o) } },
                hauteur = hauteur,
                glyphe = glyphe,
            )
        }
    }
    when (disposition) {
        DispositionChips.SCROLL -> Row(
            modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(Metrique.touchGap),
        ) { contenu() }
        DispositionChips.WRAP -> FlowRow(
            modifier,
            horizontalArrangement = Arrangement.spacedBy(Metrique.touchGap),
            verticalArrangement = Arrangement.spacedBy(Metrique.touchGap),
        ) { contenu() }
        DispositionChips.CLIP -> Row(
            modifier,
            horizontalArrangement = Arrangement.spacedBy(Metrique.touchGap),
        ) { contenu() }
    }
}

@Composable
private fun Chip(
    libelle: String,
    actif: Boolean,
    onPress: (() -> Unit)?,
    hauteur: Dp,
    glyphe: String?,
) {
    val p = jetons
    val forme = RoundedCornerShape(Metrique.rPill)
    val encre = if (actif) p.textOnPrimary else p.textMuted
    val fond by animateColorAsState(
        targetValue = if (actif) p.ink else p.ctlOffBg,
        animationSpec = tween(Metrique.tUi, easing = Metrique.ease),
        label = "fondPilule",
    )
    Row(
        Modifier
            .appui(onPress, encre = encre, petit = true, libelle = libelle, role = Role.Tab)
            .height(hauteur)
            .clip(forme)
            .background(fond)
            .border(1.dp, if (actif) p.ink else p.ctlOffBrd, forme)
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(if (glyphe != null && !actif) 6.dp else 0.dp),
    ) {
        if (!actif && glyphe != null) {
            Icon(glyphe, description = null, taille = 11.dp, couleur = encre, epaisseur = 2.6f)
        }
        Text(
            text = libelle,
            style = Typo.corps.copy(
                fontSize = 13.sp,
                fontWeight = if (actif) Metrique.weightSemi else Metrique.weightMed,
            ),
            color = encre,
            maxLines = 1,
        )
    }
}

/**
 * LA LIGNE DE CHOIX EXCLUSIF À RADIO.
 *
 * ⛔ L'ÉPAISSEUR DU LISERÉ RADIO NE S'ANIME PAS. Le kit transitionne `border-width`, mais
 * c'est une propriété de MISE EN PAGE : elle déclenche un calcul de disposition à chaque
 * changement d'état, sur une pastille qui vit par trois ou par cinq. Le passage 2 → 7 dp
 * reste INSTANTANÉ ; seule la COULEUR s'interpole. Le dessin final est identique au kit.
 */
@Composable
fun PayOption(
    titre: String,
    actif: Boolean,
    onPress: () -> Unit,
    modifier: Modifier = Modifier,
    logo: String? = null,
    fondLogo: Color = Color.Unspecified,
    note: String? = null,
) {
    val p = jetons
    val forme = RoundedCornerShape(Metrique.rM)
    val liseretRadio by animateColorAsState(
        targetValue = if (actif) p.ink else p.ctlRadioBrd,
        animationSpec = tween(Metrique.tUi, easing = Metrique.ease),
        label = "radio",
    )
    Row(
        modifier
            .fillMaxWidth()
            .appui(onPress, encre = p.ink, libelle = titre, role = Role.RadioButton)
            .ombre(if (actif) p.ctlSelRing else null, forme)
            .clip(forme)
            .background(p.ctlOffBg)
            .border(1.5.dp, if (actif) p.ctlSelBrd else p.ctlOffBrd, forme)
            .defaultMinSize(minHeight = 68.dp)
            .padding(15.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(13.dp),
    ) {
        if (logo != null) {
            Box(
                Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(13.dp))
                    .background(if (fondLogo == Color.Unspecified) p.fill1 else fondLogo),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = logo,
                    style = Typo.display(16.sp),
                    color = p.paperFixed,
                    maxLines = 1,
                )
            }
        }
        Column(Modifier.weight(1f)) {
            Text(
                text = titre,
                style = Typo.corps.copy(fontSize = 14.5.sp, fontWeight = Metrique.weightSemi),
                color = p.textBody,
            )
            if (note != null) {
                Text(note, style = Typo.corps.copy(fontSize = 12.sp), color = p.textFaint)
            }
        }
        /* La pastille : 22 dp, liseré 2 dp au repos, 7 dp sélectionnée — instantané. */
        Box(
            Modifier
                .size(22.dp)
                .border(if (actif) 7.dp else 2.dp, liseretRadio, CircleShape),
        )
    }
}

/** L'AVANCEMENT D'UN TUNNEL COURT. Des barres à poids égal, pas des points. */
@Composable
fun StepDots(
    total: Int = 3,
    courant: Int = 1,
    modifier: Modifier = Modifier,
) {
    val p = jetons
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        repeat(total) { i ->
            Box(
                Modifier
                    .weight(1f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(if (i < courant) p.ink else p.fill3),
            )
        }
    }
}
