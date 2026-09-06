package me.maxmorrys.rysmo

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.fragment.app.FragmentActivity
import kotlinx.coroutines.flow.map
import me.maxmorrys.rysmo.ds.RysmoTheme
import me.maxmorrys.rysmo.ecrans.SasBiometrique
import me.maxmorrys.rysmo.navigation.GrapheRysmo
import me.maxmorrys.rysmo.session.Preferences
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
 *
 * ── ⛔ ET C'EST AUSSI LE SEUL ENDROIT OÙ LE SAS BIOMÉTRIQUE PEUT VIVRE ────────────────
 * Le sas n'est PAS une destination (`spec-ecrans-natif.md` § C.5) : une destination doit être
 * ATTEINTE, donc poussée par quelqu'un, donc composée APRÈS le contenu qu'elle prétend
 * protéger. Il est ici, au-dessus de `GrapheRysmo`, et le `NavHost` n'est pas composé tant
 * qu'il n'a pas rendu la main.
 */
class MainActivity : FragmentActivity() {

    /*
     * ⛔ `FragmentActivity`, PAS `ComponentActivity`, ET C'EST `BiometricPrompt` QUI L'EXIGE.
     *
     * `androidx.biometric.BiometricPrompt` n'accepte qu'une `FragmentActivity` — il monte un
     * fragment invisible pour survivre à la rotation et au retour d'arrière-plan. Le défaut
     * qu'on éviterait mal autrement : le code COMPILE avec une `ComponentActivity`, parce que
     * l'écran verrouillé fait `contexte as? FragmentActivity` ; il rendrait simplement `null`
     * à l'exécution, sur le seul appareil qui a un verrou armé.
     *
     * ⚠️ `FragmentActivity` étend `ComponentActivity` : `enableEdgeToEdge`, `setContent` et
     * l'écran de lancement continuent de fonctionner à l'identique. Elle n'impose PAS de thème
     * AppCompat — c'est `AppCompatActivity` qui l'impose, et ce n'est pas celle-là.
     */

    private val session = SourceDeSession()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        session.demarrer()
        setContent {
            RysmoTheme {
                val preferences = remember { Preferences(applicationContext) }
                val etatDeSession by session.etat.collectAsState()
                /*
                 * ⚠️ `null` TANT QUE LE DISQUE N'A PAS RÉPONDU, et c'est la même raison qu'à
                 * l'écran de lancement : partir du défaut `false` ouvrirait l'application une
                 * image avant que le verrou n'ait pu se poser, ce qui revient à ne pas l'avoir
                 * posé. Le sas rend l'écran de lancement pendant ce temps — pas un écran
                 * d'attente de plus, le même.
                 */
                val verrouArme by remember(preferences) {
                    preferences.verrouBiometrique.map<Boolean, Boolean?> { it }
                }.collectAsState(initial = null)

                SasBiometrique(
                    session = etatDeSession,
                    verrouArme = verrouArme,
                    /*
                     * ⛔ LA SORTIE QUI NE PASSE PAS PAR LE CAPTEUR. Sans elle, un capteur qui
                     * cesse de reconnaître rend le compte inaccessible depuis ce téléphone.
                     * Elle DÉCONNECTE — elle n'ouvre pas : « ouvrir sans le verrou » viderait
                     * le verrou de tout sens, puisque n'importe qui la toucherait.
                     */
                    onDeconnexion = session::deconnecter,
                ) {
                    GrapheRysmo(session)
                }
            }
        }
    }
}
