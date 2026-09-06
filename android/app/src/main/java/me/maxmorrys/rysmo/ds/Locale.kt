package me.maxmorrys.rysmo.ds

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.text.intl.Locale as LocaleCompose
import java.util.Locale as LocaleJava

/**
 * ⛔ `Locale.getDefault()` DANS UN COMPOSABLE NE SE RECOMPOSE PAS, et le défaut ne se voit
 * qu'en changeant la langue du téléphone — geste que personne ne fait en relecture.
 *
 * La casse est une décision de LANGUE, pas de typographie : `« i ».uppercase()` rend `I` en
 * français et `İ` en turc. La mise en capitales des sourcils, des libellés de bouton et des
 * initiales d'avatar doit donc suivre la langue de l'appareil — et la SUIVRE, c'est-à-dire
 * se recalculer quand elle change.
 *
 * `java.util.Locale.getDefault()` est une variable globale : Compose ne l'observe pas, et
 * l'écran garde la casse de l'ancienne langue jusqu'à ce qu'autre chose le fasse recomposer.
 * `androidx.compose.ui.text.intl.Locale.current`, lui, est lu dans la composition.
 *
 * Un seul accesseur, pour que le prochain site de mise en capitales n'ait pas à retrouver
 * ce raisonnement — et pour qu'`androidx.compose.ui` puisse continuer à refuser l'autre
 * écriture par son contrôle `NonObservableLocale`.
 */
@Composable
@ReadOnlyComposable
fun localeCourante(): LocaleJava = LocaleJava.forLanguageTag(LocaleCompose.current.toLanguageTag())
