package me.maxmorrys.rysmo.ds

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.semantics

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * « J'AI SENTI TON DOIGT » — 120 ms, transform seulement.
 *
 * L'appui est le retour PRINCIPAL, et il y en a toujours un : `scale(0.975)` sur un bouton,
 * `scale(0.94)` sur une pilule ou un rond, en `tTap` = 120 ms, courbe `ease`.
 *
 * ⛔ L'ONDULATION EST TEINTÉE DE L'ENCRE DU BOUTON. Une onde grise sur un fond de marque se
 * lit comme une salissure : ce n'est pas un détail de goût, c'est ce qui distingue un
 * bouton qu'on a touché d'un bouton qu'on a sali.
 *
 * ⛔ UN CONTRÔLE DÉSACTIVÉ N'A AUCUN RETOUR AU TOUCHER — ni échelle, ni ondulation
 * (`DS_Final/brand/interactions.css` : `.mm-press[aria-disabled="true"]:active{transform:none}`).
 * Et il porte l'état désactivé dans sa SÉMANTIQUE, pas seulement dans son opacité : une
 * opacité ne s'annonce pas.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun Modifier.appui(
    onPress: (() -> Unit)?,
    encre: Color = LocalEncre.current,
    petit: Boolean = false,
    desactive: Boolean = false,
    libelle: String? = null,
    role: Role = Role.Button,
): Modifier {
    val source = remember { MutableInteractionSource() }
    val presse by source.collectIsPressedAsState()
    val actif = onPress != null && !desactive
    val cible = if (presse && actif) {
        if (petit) Metrique.pressScaleSm else Metrique.pressScale
    } else {
        1f
    }
    val echelle by animateFloatAsState(
        targetValue = cible,
        animationSpec = tween(durationMillis = Metrique.tTap, easing = Metrique.ease),
        label = "appui",
    )
    return this
        .graphicsLayer { scaleX = echelle; scaleY = echelle }
        .then(
            if (onPress != null) {
                Modifier.clickable(
                    interactionSource = source,
                    indication = if (desactive) null else ripple(color = encre),
                    enabled = !desactive,
                    role = role,
                    onClickLabel = libelle,
                    onClick = onPress,
                )
            } else {
                Modifier
            },
        )
        .then(
            /* Un contrôle éteint qui n'est PAS cliquable (l'interrupteur, la ligne de leçon
               verrouillée) n'obtient pas sa sémantique de `clickable` : on la pose ici. */
            if (desactive && onPress == null) Modifier.semantics { disabled() } else Modifier,
        )
}

/** L'opacité d'un contrôle éteint. Une seule valeur, citée par `Switch` et `IconButton`. */
const val OPACITE_ETEINT = 0.4f
