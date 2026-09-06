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
import androidx.navigation.toRoute
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.map
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.ecrans.EcranLancement
import me.maxmorrys.rysmo.ecrans.apprentissage.EcranCertificat
import me.maxmorrys.rysmo.ecrans.apprentissage.EcranCertificats
import me.maxmorrys.rysmo.ecrans.apprentissage.EcranFormation
import me.maxmorrys.rysmo.ecrans.apprentissage.EcranLecon
import me.maxmorrys.rysmo.ecrans.apprentissage.EcranMemoire
import me.maxmorrys.rysmo.ecrans.apprentissage.EcranNotes
import me.maxmorrys.rysmo.ecrans.apprentissage.EcranTelechargements
import me.maxmorrys.rysmo.ecrans.apprentissage.EcranVerification
import me.maxmorrys.rysmo.ecrans.club.EcranClubBloques
import me.maxmorrys.rysmo.ecrans.club.EcranClubMembre
import me.maxmorrys.rysmo.ecrans.club.EcranClubOnglet
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
        composable<Formation> { pile ->
            val a = pile.toRoute<Formation>()
            EcranFormation(a.slug, a.titre, navController::popBackStack)
        }
        composable<Lecon> { pile ->
            val a = pile.toRoute<Lecon>()
            EcranLecon(
                slug = a.slug,
                leconId = a.leconId,
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<PleinEcran> { EnChantier("Le lecteur en plein écran", "lot 5", navController::popBackStack) }
        composable<Notes> { pile ->
            EcranNotes(pile.toRoute<Notes>().leconId, navController::popBackStack)
        }
        composable<Certificats> {
            EcranCertificats(
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<Certificat> { pile ->
            val a = pile.toRoute<Certificat>()
            EcranCertificat(
                code = a.code,
                titulaire = a.titulaire,
                formation = a.formation,
                emisLe = a.emisLe,
                lecons = a.lecons,
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<Verification> { pile ->
            EcranVerification(pile.toRoute<Verification>().code, navController::popBackStack)
        }
        composable<Memoire> { EcranMemoire(navController::popBackStack) }
        composable<Telechargements> { EcranTelechargements(navController::popBackStack) }
        composable<ClubOnglet> { pile ->
            EcranClubOnglet(
                onglet = pile.toRoute<ClubOnglet>().onglet,
                onRetour = navController::popBackStack,
                /* ⚠️ LA BANDE REMPLACE, ELLE N'EMPILE PAS. Sans `popUpTo`, chaque passage
                   d'un onglet à l'autre allonge la pile, et le retour système remonte
                   l'historique des onglets au lieu de sortir du Club. C'est le graphe qui
                   en décide, pas l'écran — d'où ce bloc ici et pas dans `ClubScaffold`. */
                onOngletClub = { cible ->
                    navController.navigate(ClubOnglet(cible)) {
                        popUpTo(ClubRoot) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                onOngletPrincipal = { navController.navigate(it.destination()) },
                onAller = { navController.navigate(it) },
            )
        }
        composable<ClubMembre> { pile ->
            val a = pile.toRoute<ClubMembre>()
            EcranClubMembre(
                membreId = a.membreId,
                messageId = a.messageId,
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
                onSignaler = { uid, motif -> navController.navigate(gesteImpossible("Signaler", uid, motif)) },
                onBloquer = { uid, _ -> navController.navigate(gesteImpossible("Bloquer", uid, null)) },
            )
        }
        composable<ClubBloques> {
            EcranClubBloques(
                onRetour = navController::popBackStack,
                onDebloquer = { navController.navigate(gesteImpossible("Débloquer", it.id, null)) },
            )
        }
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

/**
 * ⛔ UN GESTE DE MODÉRATION QUI NE PEUT PAS PARTIR DOIT LE DIRE, PAS SE TAIRE.
 *
 * `signalerMembre` et `bloquerMembre` sont au contrat et le serveur les sert. Mais aucun
 * producteur de jeton d'identité n'est branché : l'appel ne peut pas être authentifié, donc
 * il ne peut pas partir.
 *
 * ⚠️ La tentation était de passer `{}` — le bouton s'affiche, le geste ne fait rien.
 * C'est exactement le défaut que la porte des contrôles morts du port RN avait attrapé six
 * fois, et ici il coûterait plus cher qu'ailleurs : la règle 1.2 de l'App Store exige un
 * signalement FONCTIONNEL sur du contenu généré par les utilisateurs, et un bouton muet la
 * remet à zéro tout en ayant l'air de la satisfaire.
 *
 * Le geste mène donc à l'écran d'erreur, qui NOMME ce qui manque et la conséquence.
 */
private fun gesteImpossible(geste: String, uid: String, motif: String?) = Erreur(
    titre = "$geste : pas encore possible",
    motif = "L'identification n'est pas branchée — aucun producteur de jeton n'est choisi — "
        + "donc cet appel ne peut pas être authentifié auprès du serveur.",
    consequence = "Ton geste n'a PAS été enregistré. La personne n'a été ni signalée ni "
        + "bloquée, et l'équipe n'a rien reçu."
        + (motif?.let { " Ton motif n'a pas été transmis." } ?: ""),
    reference = uid,
    libelle = "Revenir",
)
