package me.maxmorrys.rysmo.ds

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE THÈME — DEUX TABLES, JAMAIS UNE DÉRIVATION.
 *
 * ⛔ Le mode sombre n'est pas un filtre. 100 jetons sur 225 changent de VALEUR, et la
 * raison tient en une mesure : sur #0B0E13, le bleu #0057BC tombe à 2,84:1 et le violet
 * #6C23DD à 2,69:1 — les deux interdits en texte. C'est l'inverse exact du mode clair, où
 * ce sont l'orange (2,47:1) et le teal (2,84:1) qui le sont. Une palette ne se transpose
 * pas d'un fond à l'autre.
 *
 * ⛔ AUCUN COMPOSABLE NE PREND DE PARAMÈTRE DE THÈME. Le mode est une PORTÉE. « Une prop
 * `dark` est un piège — elle doit être passée à la main partout, personne ne le fait, et le
 * composant retombe silencieusement sur sa valeur claire » (`DS_Final/readme.md`).
 * Les deux seules exceptions sont celles qui OUVRENT une portée : `Surface(INK)` et
 * `Screen(sombre = true)`.
 *
 * ⛔ `MaterialTheme.colorScheme` N'EST JAMAIS LU. `material3` n'est là que pour ce que le
 * design system ne réimplémente pas — l'ondulation, la gestion du focus, l'échafaudage de
 * test. Le rendu appartient au kit.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

enum class Mode { CLAIR, SOMBRE }

/**
 * La plateforme, et ce qu'elle sait faire.
 *
 * `estAndroid` existe parce que le kit décrit DEUX châssis : 44 dp de barre haute et titre
 * centré d'un côté, 64 dp et titre à gauche de l'autre. Ce n'est pas une variante de style,
 * ce sont deux barres. Le drapeau reste porté par une portée pour que les aperçus puissent
 * rendre les deux, et pour que la traduction SwiftUI ait le même point d'entrée.
 */
@Immutable
data class Plateforme(
    val estAndroid: Boolean,
    /**
     * ⛔ JAMAIS UNE HYPOTHÈSE : UNE DÉCLARATION.
     *
     * `.andro.blur-ok` existe au kit (`brand/native.css`) mais le kit ne dit pas ce qui
     * l'active — seulement « quand l'appareil le déclare ». Le seuil retenu ici est le
     * miroir Android de la détection `.lowfi` du web (`src/design-system/lowfi.ts`,
     * `deviceMemory <= 2` ou `hardwareConcurrency <= 4`), plus le préalable `RenderEffect` :
     * API 31. Il est écrit ICI et nulle part ailleurs — voir `flouDisponible`.
     */
    val flouOk: Boolean,
)

val LocalPalette = staticCompositionLocalOf<Palette> { error("RysmoTheme manquant") }
val LocalMode = staticCompositionLocalOf { Mode.CLAIR }
val LocalPlateforme = staticCompositionLocalOf { Plateforme(estAndroid = true, flouOk = false) }

/**
 * L'ENCRE COURANTE.
 *
 * Un glyphe posé dans un bouton de marque doit prendre l'encre DU BOUTON, pas celle de la
 * page. Sans cette portée, chaque appelant devrait repasser la couleur à la main — et
 * `Icon` retomberait silencieusement sur `textBody`, c'est-à-dire du noir sur un aplat
 * bleu. `compositionLocalOf` et non `static` : elle change souvent, et seuls les lecteurs
 * doivent se recomposer.
 */
val LocalEncre = compositionLocalOf { Color.Unspecified }

/** Le seul accesseur. Un composable ne lit jamais `PALETTE_CLAIRE` en dur. */
val jetons: Palette
    @Composable @ReadOnlyComposable get() = LocalPalette.current

/** Le mode courant, lu depuis la portée — jamais depuis le réglage système directement. */
val mode: Mode
    @Composable @ReadOnlyComposable get() = LocalMode.current

/** La plateforme courante. */
val plateforme: Plateforme
    @Composable @ReadOnlyComposable get() = LocalPlateforme.current

/**
 * Le seuil `blur-ok`, écrit à un seul endroit.
 *
 * Trois conditions, toutes nécessaires :
 *  1. `RenderEffect` — API 31. En dessous, `Modifier.blur` ne fait RIEN, sans erreur.
 *  2. l'appareil ne se déclare pas modeste (`isLowRamDevice`) ;
 *  3. plus de 4 cœurs et plus de 2 Go — le miroir exact de `lowfi.ts`.
 *
 * « Construire le verre sur une capacité que la moitié du parc n'a pas, c'est concevoir
 * pour l'autre moitié. »
 */
fun flouDisponible(contexte: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return false
    val am = contexte.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager ?: return false
    if (am.isLowRamDevice) return false
    val info = ActivityManager.MemoryInfo().also { am.getMemoryInfo(it) }
    val deuxGo = 2L * 1024 * 1024 * 1024
    return info.totalMem > deuxGo && Runtime.getRuntime().availableProcessors() > 4
}

/**
 * Le thème. Il pose les deux tables, le mode, la plateforme et l'ondulation.
 *
 * ⚠️ `LocalIndication provides ripple()` fixe le DÉFAUT, pas la règle. L'ondulation d'un
 * bouton de marque doit être teintée de l'encre du bouton : une onde grise sur un fond bleu
 * se lit comme une salissure. Chaque action repasse donc sa propre teinte — voir
 * `Modifier.appui`.
 */
@Composable
fun RysmoTheme(
    mode: Mode = if (isSystemInDarkTheme()) Mode.SOMBRE else Mode.CLAIR,
    estAndroid: Boolean = true,
    contenu: @Composable () -> Unit,
) {
    val contexte = LocalContext.current
    val flouOk = remember(contexte) { flouDisponible(contexte) }
    RysmoThemeBrut(
        mode = mode,
        plateforme = Plateforme(estAndroid = estAndroid, flouOk = flouOk),
        contenu = contenu,
    )
}

/**
 * La version sans contexte Android, pour les aperçus et les planches d'atelier : elles
 * doivent pouvoir forcer `flouOk` sans dépendre de l'appareil qui les rend.
 */
@Composable
fun RysmoThemeBrut(
    mode: Mode,
    plateforme: Plateforme,
    contenu: @Composable () -> Unit,
) {
    val palette = if (mode == Mode.SOMBRE) PALETTE_SOMBRE else PALETTE_CLAIRE
    CompositionLocalProvider(
        LocalPalette provides palette,
        LocalMode provides mode,
        LocalPlateforme provides plateforme,
        LocalEncre provides palette.textBody,
        LocalIndication provides ripple(),
        content = contenu,
    )
}
