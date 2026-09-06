package me.maxmorrys.rysmo.ds

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA NAVIGATION SECONDAIRE — trois composables, trois usages qui ne se recouvrent pas.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Une entrée de `SubNav` : un libellé et, facultativement, la pastille d'un territoire. */
@Immutable
data class EntreeSubNav(val libelle: String, val teinte: Color = Color.Unspecified)

/**
 * LA BASCULE DE PÔLE — deux ou trois destinations de même rang.
 *
 * Elle se distingue de `Segmented` par la pastille de territoire : `SubNav` change de LIEU,
 * `Segmented` change de VUE sur le même lieu.
 */
@Composable
fun SubNav(
    entrees: List<EntreeSubNav>,
    actif: String?,
    onSelect: ((String) -> Unit)?,
    modifier: Modifier = Modifier,
) {
    val p = jetons
    val forme = RoundedCornerShape(Metrique.rPill)
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(Metrique.sp8)) {
        entrees.forEachIndexed { i, e ->
            val on = if (actif == null) i == 0 else actif == e.libelle
            Row(
                Modifier
                    .appui(
                        onPress = onSelect?.let { { it(e.libelle) } },
                        encre = p.textBody,
                        petit = true,
                        libelle = e.libelle,
                        role = Role.Tab,
                    )
                    .ombre(if (on) HorsTable.ombreSubNavActif else null, forme)
                    .height(Metrique.touchMin)
                    .clip(forme)
                    .background(if (on) p.surfaceCard else p.ctlOffBg)
                    .border(1.dp, if (on) p.glassBrd else p.ctlOffBrd, forme)
                    .then(if (on) Modifier.liseretHaut(p.glassHl, Metrique.rPill) else Modifier)
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(9.dp),
            ) {
                Box(
                    Modifier
                        .size(8.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(e.teinte.takeOrElse { p.fill5 }),
                )
                Text(
                    text = e.libelle,
                    style = Typo.corps.copy(fontSize = 13.5.sp, fontWeight = Metrique.weightSemi),
                    color = if (on) p.textBody else p.textMuted,
                    maxLines = 1,
                )
            }
        }
    }
}

/**
 * LE PIPELINE DE LA CONSOLE — les étapes d'un dossier, en une bande.
 *
 * ⚠️ IL VIT SUR UNE SURFACE NUIT. Le kit l'écrit en blanc et en gris littéraux
 * (`#fff` / `rgba(255,255,255,.08)` / `#0E1116` / `#8B95A3`), parce qu'il n'apparaît que
 * dans la console, toujours posé sur `glass-d`. Ici, ces quatre valeurs sont rendues par
 * `paperFixed`, `fill1`, `inkFixed` et `ink3` — la même intention, mais qui bascule si un
 * jour la console cesse d'être nocturne.
 *
 * ⛔ Il DOIT donc être posé dans une portée nuit — `Surface(INK)`, ou la console entière.
 * Sur une page claire, l'étape active serait du papier sur du papier.
 */
@Composable
fun Pipeline(
    etapes: List<String>,
    actif: String?,
    onSelect: ((String) -> Unit)?,
    modifier: Modifier = Modifier,
) {
    val p = jetons
    val forme = RoundedCornerShape(Metrique.rPill)
    Row(
        modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        etapes.forEach { e ->
            val on = e == actif
            Box(
                Modifier
                    .appui(
                        onPress = onSelect?.let { { it(e) } },
                        encre = if (on) p.inkFixed else p.paperFixed,
                        petit = true,
                        libelle = e,
                        role = Role.Tab,
                    )
                    .clip(forme)
                    .background(if (on) p.paperFixed else p.fill1)
                    .padding(horizontal = 10.dp, vertical = 5.dp),
            ) {
                Text(
                    text = e,
                    style = Typo.corps.copy(fontSize = 11.sp, fontWeight = Metrique.weightSemi),
                    color = if (on) p.inkFixed else p.ink3,
                    maxLines = 1,
                )
            }
        }
    }
}

/**
 * LE FIL D'ARIANE — la console support, et rien d'autre.
 *
 * ⚠️ Il n'apparaît dans AUCUN des 36 écrans natifs du kit. Il est porté parce que la
 * console support en a besoin ; il ne doit pas migrer vers l'application, où la barre haute
 * et le retour système disent déjà où l'on est.
 */
@Composable
fun Breadcrumb(elements: List<String>, modifier: Modifier = Modifier) {
    val p = jetons
    Row(
        modifier,
        horizontalArrangement = Arrangement.spacedBy(7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        elements.forEachIndexed { i, e ->
            if (i > 0) Text("/", style = Typo.nombre(11.5.sp), color = p.textFaint)
            Text(
                text = e,
                style = Typo.nombre(11.5.sp).copy(fontWeight = Metrique.weightBody),
                color = if (i == elements.lastIndex) p.textMuted else p.textFaint,
                maxLines = 1,
            )
        }
    }
}
