package me.maxmorrys.rysmo.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.map
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.ecrans.EcranLancement
import me.maxmorrys.rysmo.ecrans.EcranOnboarding
import me.maxmorrys.rysmo.ecrans.EcranPermissions
import me.maxmorrys.rysmo.ecrans.EnChantier
import me.maxmorrys.rysmo.ecrans.OngletPrincipal
import me.maxmorrys.rysmo.ecrans.SquelettePrincipal
import me.maxmorrys.rysmo.session.Preferences
import me.maxmorrys.rysmo.session.SourceDeSession

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE GRAPHE — un seul point d'entrée, et la règle qui l'impose.
 *
 * ⛔ `startDestination = Lancement`. SANS CELA, LE KIT PERD TROIS ÉCRANS D'UN COUP.
 *
 * C'est exactement ce qui s'est produit dans le port React Native : le routeur par fichiers
 * n'avait pas d'`app/index.tsx`, donc il servait « / » depuis le premier onglet. La chaîne
 * `lancement → onboarding → permissions` restait écrite, complète, et jamais exécutée.
 *
 * ⚠️ CE N'EST PAS UN DÉFAUT QUE LE COMPILATEUR PEUT ATTRAPER. Les destinations typées
 * garantissent le premier sens de la carte — « tout lien mène à un écran qui existe » — et
 * rien de plus. Le second sens — « tout écran est atteint » — se garde par un test, et c'est
 * précisément le sens qui manquait. `tests/unit/natif-navigation.test.ts` le tient.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

@Composable
fun GrapheRysmo(
    session: SourceDeSession,
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController(),
) {
    val contexte = LocalContext.current
    val preferences = remember(contexte) { Preferences(contexte) }

    NavHost(
        navController = navController,
        startDestination = Lancement,
        modifier = modifier,
    ) {
        /* ── La chaîne de première ouverture ─────────────────────────────────────────── */

        composable<Lancement> {
            val etat by session.etat.collectAsState()
            /*
             * ⚠️ `null` TANT QUE LE DISQUE N'A PAS RÉPONDU, et c'est ce qui rend la
             * bifurcation juste. Partir du défaut `false` ferait revoir l'accueil à chaque
             * démarrage — mais seulement sur les appareils lents, donc jamais sur celui de
             * qui écrit le code.
             */
            val accueilVu by remember(preferences) {
                preferences.accueilVu.map<Boolean, Boolean?> { it }
            }.collectAsState(initial = null)

            EcranLancement()

            LaunchedEffect(etat, accueilVu) {
                val vu = accueilVu ?: return@LaunchedEffect
                when (etat) {
                    /* On ne SAIT pas encore s'il y a quelqu'un : on attend. Décider ici
                       renverrait vers la connexion quelqu'un de déjà connecté. */
                    is Session.Restauration -> Unit
                    else -> navController.navigate(if (vu) Espace else Onboarding) {
                        popUpTo(Lancement) { inclusive = true }
                    }
                }
            }
        }

        composable<Onboarding> {
            val portee = rememberCoroutineScope()
            EcranOnboarding(
                onTermine = {
                    /* ⚠️ « Passer » compte autant que « Commencer » : dans les deux cas
                       l'accueil a été VU, et le reproposer punirait d'avoir passé. */
                    portee.launch { preferences.marquerAccueilVu() }
                    navController.navigate(Espace) { popUpTo(Lancement) { inclusive = true } }
                },
            )
        }

        composable<Permissions> {
            EcranPermissions(onSuite = { navController.popBackStack() })
        }

        /* ── Les cinq onglets ────────────────────────────────────────────────────────── */

        composable<Espace> { OngletHote(navController, OngletPrincipal.ESPACE) }
        composable<Catalogue> { OngletHote(navController, OngletPrincipal.COURS) }
        composable<Repetiteur> { OngletHote(navController, OngletPrincipal.REPETITEUR) }
        composable<ClubRoot> { OngletHote(navController, OngletPrincipal.CLUB) }
        composable<Profil> { OngletHote(navController, OngletPrincipal.PROFIL) }

        /* ── Le reste du graphe ──────────────────────────────────────────────────────── */

        composable<Biometrie> { EnChantier("Verrouillage biométrique", "lot 5", navController::popBackStack) }
        composable<Formation> { EnChantier("La fiche de formation", "lot 4", navController::popBackStack) }
        composable<Lecon> { EnChantier("Le lecteur de leçon", "lot 4", navController::popBackStack) }
        composable<PleinEcran> { EnChantier("Le lecteur en plein écran", "lot 5", navController::popBackStack) }
        composable<Notes> { EnChantier("Tes notes", "lot 4", navController::popBackStack) }
        composable<Certificats> { EnChantier("Tes certificats", "lot 4", navController::popBackStack) }
        composable<Certificat> { EnChantier("Un certificat", "lot 4", navController::popBackStack) }
        composable<Verification> { EnChantier("La vérification d'un certificat", "lot 4", navController::popBackStack) }
        composable<Memoire> { EnChantier("La mémoire du répétiteur", "lot 4", navController::popBackStack) }
        composable<Telechargements> { EnChantier("Tes téléchargements", "lot 5", navController::popBackStack) }
        composable<ClubOnglet> { EnChantier("Un onglet du Club", "lot 4", navController::popBackStack) }
        composable<ClubMembre> { EnChantier("La fiche d'un membre", "lot 4", navController::popBackStack) }
        composable<ClubBloques> { EnChantier("Les comptes que tu as bloqués", "lot 4", navController::popBackStack) }
        composable<Connexion> { EnChantier("La connexion", "lot 4", navController::popBackStack) }
        composable<Creation> { EnChantier("La création de compte", "lot 4", navController::popBackStack) }
        composable<MotDePasse> { EnChantier("Le mot de passe oublié", "lot 4", navController::popBackStack) }
        composable<Suppression> { EnChantier("La suppression du compte", "lot 4", navController::popBackStack) }
        composable<Legal> { EnChantier("Les textes légaux", "lot 4", navController::popBackStack) }
        composable<Media> { EnChantier("Le pôle médias", "lot 4", navController::popBackStack) }
        composable<Episode> { EnChantier("Un épisode", "lot 4", navController::popBackStack) }
        composable<Video> { EnChantier("Une vidéo", "lot 4", navController::popBackStack) }
        composable<Presence> { EnChantier("Présence digitale", "lot 4", navController::popBackStack) }
        composable<Devis> { EnChantier("Un devis", "lot 4", navController::popBackStack) }
        composable<Console> { EnChantier("La console du support", "lot 4", navController::popBackStack) }
        composable<ConsoleEcran> { EnChantier("Un écran du support", "lot 4", navController::popBackStack) }
        composable<Interdit> { EnChantier("Accès refusé", "lot 4", navController::popBackStack) }
        composable<Erreur> { EnChantier("Une erreur", "lot 4", navController::popBackStack) }
    }
}

/**
 * L'enveloppe des cinq onglets.
 *
 * ⚠️ Passer d'un onglet à l'autre REMPLACE, ne pousse pas : sans `popUpTo`, la pile
 * s'allonge à chaque aller-retour et le bouton retour du système remonte l'historique des
 * onglets au lieu de sortir de l'application.
 */
@Composable
private fun OngletHote(nav: NavHostController, actif: OngletPrincipal) {
    SquelettePrincipal(
        actif = actif,
        onOnglet = { cible ->
            if (cible != actif) {
                nav.navigate(cible.destination()) {
                    popUpTo(Espace) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            }
        },
        onAller = { nav.navigate(it) },
    )
}

private fun OngletPrincipal.destination(): Any = when (this) {
    OngletPrincipal.ESPACE -> Espace
    OngletPrincipal.COURS -> Catalogue
    OngletPrincipal.REPETITEUR -> Repetiteur
    OngletPrincipal.CLUB -> ClubRoot
    OngletPrincipal.PROFIL -> Profil
}
