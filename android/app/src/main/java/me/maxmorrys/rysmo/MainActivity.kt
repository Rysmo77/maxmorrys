package me.maxmorrys.rysmo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import me.maxmorrys.rysmo.ds.PALETTE_CLAIRE
import me.maxmorrys.rysmo.ds.PALETTE_SOMBRE

/**
 * ⚠️ ÉTAT DU LOT 1 — le socle, pas encore l'application.
 *
 * Cette activité ne peint qu'un fond. Les écrans arrivent au lot 4, et la première chose
 * qu'ils devront porter est la chaîne que le port React Native n'atteignait jamais :
 * `lancement → onboarding → permissions`. Elle était entièrement écrite et jamais exécutée,
 * faute d'un point d'entrée — un nouvel utilisateur tombait directement sur un écran vide.
 * Ici, c'est `MainActivity` qui décide, et ce choix devra être gardé par un test.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            val palette = if (isSystemInDarkTheme()) PALETTE_SOMBRE else PALETTE_CLAIRE
            androidx.compose.foundation.layout.Box(
                Modifier.fillMaxSize().background(palette.surfacePage),
            )
        }
    }
}
