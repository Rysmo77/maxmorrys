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
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonObject
import me.maxmorrys.rysmo.donnees.Callables
import me.maxmorrys.rysmo.ecrans.ecrivain
import me.maxmorrys.rysmo.ecrans.motifDe
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.map
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.ecrans.EcranBiometrie
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
import me.maxmorrys.rysmo.ecrans.compte.EcranConnexion
import me.maxmorrys.rysmo.ecrans.media.EcranConsole
import me.maxmorrys.rysmo.ecrans.media.EcranConsoleEcran
import me.maxmorrys.rysmo.ecrans.media.EcranDevis
import me.maxmorrys.rysmo.ecrans.media.EcranEpisode
import me.maxmorrys.rysmo.ecrans.media.EcranMedia
import me.maxmorrys.rysmo.ecrans.media.EcranPresence
import me.maxmorrys.rysmo.ecrans.media.EcranVideo
import me.maxmorrys.rysmo.ecrans.compte.EcranCreation
import me.maxmorrys.rysmo.ecrans.compte.EcranErreur
import me.maxmorrys.rysmo.ecrans.compte.EcranInterdit
import me.maxmorrys.rysmo.ecrans.compte.EcranLegal
import me.maxmorrys.rysmo.ecrans.compte.EcranMotDePasse
import me.maxmorrys.rysmo.ecrans.compte.EcranSuppression
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

/*
 * ⚠️ TOUS LES APPELS D'ÉCRAN SONT EN ARGUMENTS NOMMÉS, ET CE N'EST PAS DU STYLE.
 *
 * Les composables du dépôt finissent par `modifier: Modifier = Modifier`. Une lambda
 * finale — `EcranX(onRetour) { … }` — se lie donc au DERNIER paramètre, c'est-à-dire au
 * modificateur, jamais à `onAller`. Le compilateur le refuse, mais avec un message qui
 * désigne le modificateur et non la cause : « Argument type mismatch: actual type is
 * '() -> Unit', but 'Modifier' was expected ».
 *
 * Je m'y suis repris à trois fois dans ce fichier. Les arguments nommés coûtent deux
 * lignes et suppriment la question.
 */
@Composable
fun GrapheRysmo(
    session: SourceDeSession,
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController(),
) {
    val contexte = LocalContext.current
    val preferences = remember(contexte) { Preferences(contexte) }
    /* Un seul écrivain pour tout le graphe : il porte l'invalidation des vues périmées,
       que le contrat déclare écriture par écriture. */
    val ecrire = ecrivain()
    /* ⚠️ COLLECTÉ UNE FOIS, ICI. Chaque onglet le relit ; le collecter dans chacun ferait
       autant d'abonnements au même flux, et rien ne garantirait qu'ils voient la même
       phase au même moment. */
    val etatDeSession by session.etat.collectAsState()

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

        composable<Espace> { OngletHote(navController, OngletPrincipal.ESPACE, etatDeSession) }
        composable<Catalogue> { OngletHote(navController, OngletPrincipal.COURS, etatDeSession) }
        composable<Repetiteur> { OngletHote(navController, OngletPrincipal.REPETITEUR, etatDeSession) }
        composable<ClubRoot> { OngletHote(navController, OngletPrincipal.CLUB, etatDeSession) }
        composable<Profil> { OngletHote(navController, OngletPrincipal.PROFIL, etatDeSession) }

        /* ── Le reste du graphe ──────────────────────────────────────────────────────── */

        composable<Biometrie> { EcranBiometrie(onRetour = navController::popBackStack) }
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
                /*
                 * ⛔ LES DEUX GESTES PARTENT VRAIMENT DEPUIS QUE L'IDENTITÉ EST BRANCHÉE.
                 * Ils menaient auparavant à un écran d'erreur qui nommait l'identité
                 * manquante — c'était honnête alors, et c'est faux maintenant.
                 *
                 * ⚠️ LE RETOUR EST LA SEULE CONFIRMATION QUE CET ÉCRAN SAIT DONNER : ses
                 * rappels ne rendent rien, donc il ne peut pas afficher l'issue lui-même.
                 * Refermer la fiche dit « c'est fait » sans le prétendre en toutes lettres ;
                 * un échec, lui, est NOMMÉ. Une confirmation en place reste due — elle
                 * demande de changer la signature de l'écran.
                 */
                onSignaler = { uid, motif ->
                    ecrire(
                        Callables.SIGNALER_MEMBRE,
                        buildJsonObject {
                            put("membreId", JsonPrimitive(uid))
                            if (motif.isNotBlank()) put("motif", JsonPrimitive(motif))
                        },
                    ) { echec -> apresLeGeste("Signaler", uid, echec, navController) }
                },
                onBloquer = { uid, bloquer ->
                    ecrire(Callables.BLOQUER_MEMBRE, cibleMembre(uid, bloquer)) { echec ->
                        apresLeGeste("Bloquer", uid, echec, navController)
                    }
                },
            )
        }
        composable<ClubBloques> {
            EcranClubBloques(
                onRetour = navController::popBackStack,
                /* ⚠️ `false` DÉBLOQUE : c'est la même écriture dans les deux sens, et elle
                   périme les mêmes cinq vues. */
                onDebloquer = { compte ->
                    ecrire(Callables.BLOQUER_MEMBRE, cibleMembre(compte.id, false)) { echec ->
                        apresLeGeste("Débloquer", compte.id, echec, navController)
                    }
                },
            )
        }
        composable<Connexion> {
            EcranConnexion(
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<Creation> {
            EcranCreation(
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<MotDePasse> { EcranMotDePasse(navController::popBackStack) }
        composable<Suppression> { EcranSuppression(navController::popBackStack) }
        composable<Legal> { EcranLegal(navController::popBackStack) }
        composable<Media> {
            EcranMedia(
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<Episode> { pile ->
            EcranEpisode(
                episodeId = pile.toRoute<Episode>().episodeId,
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<Video> { pile ->
            EcranVideo(
                videoId = pile.toRoute<Video>().videoId,
                onRetour = navController::popBackStack,
            )
        }
        composable<Presence> {
            EcranPresence(
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<Devis> { pile ->
            EcranDevis(
                code = pile.toRoute<Devis>().code,
                onRetour = navController::popBackStack,
            )
        }
        composable<Console> {
            EcranConsole(
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<ConsoleEcran> { pile ->
            EcranConsoleEcran(
                ecran = pile.toRoute<ConsoleEcran>().ecran,
                onRetour = navController::popBackStack,
            )
        }
        composable<Interdit> {
            EcranInterdit(
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
        composable<Erreur> { pile ->
            val a = pile.toRoute<Erreur>()
            EcranErreur(
                titre = a.titre,
                motif = a.motif,
                consequence = a.consequence,
                reference = a.reference,
                libelle = a.libelle,
                sortie = a.sortie,
                onRetour = navController::popBackStack,
                onAller = { navController.navigate(it) },
            )
        }
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
private fun OngletHote(
    nav: NavHostController,
    actif: OngletPrincipal,
    session: Session,
) {
    SquelettePrincipal(
        actif = actif,
        session = session,
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
/** La cible d'un blocage, telle que le contrat la décrit. */
private fun cibleMembre(uid: String, bloquer: Boolean) = buildJsonObject {
    putJsonObject("cible") {
        put("type", JsonPrimitive("membre"))
        put("id", JsonPrimitive(uid))
    }
    put("bloquer", JsonPrimitive(bloquer))
}

/**
 * Ce qui se passe après un geste de modération.
 *
 * ⛔ UN ÉCHEC EST NOMMÉ, JAMAIS AVALÉ. Le pire résultat possible ici n'est pas l'échec :
 * c'est le silence. Quelqu'un qui croit avoir signalé un harceleur et dont le geste n'est
 * pas parti ne réessaiera pas — il attendra.
 */
private fun apresLeGeste(
    geste: String,
    reference: String,
    echec: Throwable?,
    nav: NavHostController,
) {
    val motif = motifDe(echec)
    if (motif == null) {
        nav.popBackStack()
        return
    }
    nav.navigate(
        Erreur(
            titre = "$geste : le geste n'est pas parti",
            motif = motif,
            consequence = "Rien n'a été enregistré. La personne n'a été ni signalée ni "
                + "bloquée, et l'équipe n'a rien reçu. Tu peux réessayer.",
            reference = reference,
            libelle = "Revenir",
        ),
    )
}
