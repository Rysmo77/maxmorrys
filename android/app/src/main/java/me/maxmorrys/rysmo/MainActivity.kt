package me.maxmorrys.rysmo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.RysmoTheme
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Territoire

/**
 * ⚠️ ÉTAT DU LOT 3 — le design system, pas encore l'application.
 *
 * Le thème est BRANCHÉ : `RysmoTheme` pose les deux tables, la typographie sur les trois
 * familles et la plateforme. Ce que cette activité rend n'est pas un écran de produit —
 * c'est le châssis, et l'aveu qu'il n'y a pas encore de source derrière.
 *
 * ⛔ C'EST `SansDonnees` QUI L'ÉCRIT, PAS UN TEXTE DE REMPLISSAGE. Un écran d'accueil garni
 * de données d'exemple « en attendant » n'est jamais retiré : il devient la démo, puis la
 * capture d'écran, puis la promesse. Le vide honnête, lui, disparaît tout seul le jour où
 * l'état devient `Servie`.
 *
 * Les écrans arrivent au lot 4, et la première chose qu'ils devront porter est la chaîne
 * que le port React Native n'atteignait jamais : `lancement → onboarding → permissions`.
 * Elle était entièrement écrite et jamais exécutée, faute d'un point d'entrée — un nouvel
 * utilisateur tombait directement sur un écran vide. Ici, c'est `MainActivity` qui décide,
 * et ce choix devra être gardé par un test.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            RysmoTheme { EcranSocle() }
        }
    }
}

@Composable
private fun EcranSocle() {
    Screen(territoire = Territoire.FORME) {
        Eyebrow("Socle · lot 3")
        /* Le titre est en cran nommé, sur deux lignes ÉCRITES : un titre d'affichage ne se
           replie jamais tout seul. */
        Display(
            lignes = listOf("LE SYSTÈME", "EST POSÉ."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 10.dp),
        )
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Les écrans de l'application",
            origine = "Lot 4 — le routage et les 52 destinations",
            degat = "Garnir cet écran de données d'exemple en ferait la démo, "
                + "puis la capture d'écran, puis la promesse.",
            modifier = Modifier.padding(top = 24.dp),
        )
    }
}
