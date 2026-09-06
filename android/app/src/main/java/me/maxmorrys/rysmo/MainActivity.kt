package me.maxmorrys.rysmo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import me.maxmorrys.rysmo.ds.RysmoTheme
import me.maxmorrys.rysmo.navigation.GrapheRysmo
import me.maxmorrys.rysmo.session.SourceDeSession

/**
 * ⛔ L'ACTIVITÉ N'A QU'UN RÔLE : POSER LE GRAPHE. Elle ne décide d'aucun écran.
 *
 * C'est ce point exact qui manquait au port React Native. Là-bas, le routeur par fichiers
 * servait « / » depuis le premier onglet faute d'`app/index.tsx`, et la chaîne
 * `lancement → onboarding → permissions` — écrite, complète — n'était atteinte par rien.
 * Un nouvel utilisateur tombait directement sur un écran vide.
 *
 * Ici, `GrapheRysmo` pose `startDestination = Lancement`, et c'est le seul endroit d'où
 * l'application peut commencer.
 */
class MainActivity : ComponentActivity() {

    private val session = SourceDeSession()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        session.demarrer()
        setContent {
            RysmoTheme {
                GrapheRysmo(session)
            }
        }
    }
}
