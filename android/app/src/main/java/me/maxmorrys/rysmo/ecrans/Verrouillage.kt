package me.maxmorrys.rysmo.ecrans

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.fragment.app.FragmentActivity
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CheckLine
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.TonCoche
import me.maxmorrys.rysmo.ds.fondDegrade
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.session.Preferences
import me.maxmorrys.rysmo.systeme.MaterielBiometrique
import me.maxmorrys.rysmo.systeme.ResultatBiometrique
import me.maxmorrys.rysmo.systeme.demanderLIdentite
import me.maxmorrys.rysmo.systeme.materielBiometrique

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE VERROU, DES DEUX CÔTÉS : CELUI QUI LE POSE, ET CELUI QUI LE TIENT.
 *
 * ⛔ LE DÉFAUT D'ORIGINE N'ÉTAIT PAS UN BOUTON MORT, C'ÉTAIT PIRE. `app/biometrie.tsx`
 * proposait « Activer Face ID » et son bouton appelait `router.replace('/(tabs)')` : il AVAIT
 * une action, ce n'était simplement pas celle qu'il annonçait. Quelqu'un croyait avoir posé un
 * verrou et n'en avait aucun. Un bouton inerte se remarque ; celui-là, non.
 *
 * ⛔ ET LE SAS N'EST PAS UNE DESTINATION. `spec-ecrans-natif.md` § C.5 le range avec le
 * widget et le partage : « une couche AU-DESSUS du graphe ». En faire une destination
 * l'obligerait à être ATTEINTE — donc à être poussée par quelqu'un, donc après que le contenu
 * a été composé au moins une fois. Un verrou qui s'affiche après le contenu n'a rien protégé.
 *
 * ── ⚠️ CE QUE LE KIT DESSINE, ET CE QU'IL NE DESSINE PAS ──────────────────────────────
 * Le kit dessine l'écran de PROPOSITION (`ScreensNatif.js:468`, « ENTRER AVEC TON
 * EMPREINTE ? »), repris ici ligne à ligne. Il ne dessine PAS l'écran verrouillé du sas.
 * ⛔ `NatEcranVerrouille` n'est pas cet écran-là : c'est l'écran de verrouillage DU TÉLÉPHONE,
 * avec la carte de notification média dessus — il appartient au chantier `MediaSession`, qui
 * n'est pas ouvert parce que les médias ne sont pas hébergés. Le sas ci-dessous est donc
 * composé des primitives du kit, sans modèle.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⛔ LA CONDITION DU VERROUILLAGE, ÉCRITE UNE FOIS ET NULLE PART AILLEURS.
 *
 * Deux termes, et le second est celui qu'on oublie : il faut que le verrou soit ARMÉ **et**
 * qu'il y ait quelque chose derrière. Verrouiller une session absente ferait payer un geste
 * biométrique pour ouvrir un catalogue public — de la friction qui ne protège rien — et, si
 * le capteur venait à ne plus reconnaître, cela fermerait l'application à quelqu'un qui n'y
 * avait même pas de compte.
 *
 * ⚠️ AUJOURD'HUI, CE SECOND TERME N'EST JAMAIS VRAI. `SourceDeSession` rend `NonConfiguree` :
 * aucun producteur de jeton d'identité n'est choisi. Le sas est donc construit, testé, et
 * INERTE — et c'est écrit ici plutôt que découvert plus tard. L'écran de proposition le dit
 * aussi, en clair, à qui arme le verrou.
 */
internal fun doitVerrouiller(verrouArme: Boolean, session: Session): Boolean =
    verrouArme && session is Session.Connectee

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE SAS — la couche au-dessus du graphe.
 *
 * @param verrouArme `null` tant que le disque n'a pas répondu.
 * @param onDeconnexion la sortie qui ne passe PAS par le capteur. Voir le piège 4 de
 *   `systeme/Biometrie.kt` : sans elle, un capteur cassé rend le compte inaccessible depuis
 *   ce téléphone, et il n'y a aucun autre geste pour en sortir.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun SasBiometrique(
    session: Session,
    verrouArme: Boolean?,
    onDeconnexion: () -> Unit,
    contenu: @Composable () -> Unit,
) {
    /*
     * ⛔ RIEN DU CONTENU N'EST COMPOSÉ TANT QU'ON NE SAIT PAS. C'est le seul ordre qui
     * protège : rendre le graphe puis le recouvrir laisserait ses écrans se monter, lire
     * leurs vues et paraître une image — et une image suffit à lire une notification ou un
     * solde. `EcranLancement` est justement ce que l'application montre déjà pendant qu'elle
     * ne sait pas encore : ce n'est pas un écran d'attente de plus, c'est le même.
     */
    if (verrouArme == null) {
        EcranLancement()
        return
    }

    if (!doitVerrouiller(verrouArme, session)) {
        contenu()
        return
    }

    /*
     * ⛔ `remember`, PAS `rememberSaveable`, ET C'EST LA DÉFINITION MÊME DU « DÉMARRAGE À
     * FROID ». Sauvegardé, l'état « déjà ouvert » survivrait à la mort du processus : le
     * système tue l'application en arrière-plan, quelqu'un la rouvre, et elle serait déjà
     * déverrouillée. Non sauvegardé, il meurt avec le processus — c'est-à-dire exactement
     * quand le verrou doit se refermer.
     *
     * ⚠️ ET IL NE SE REFERME PAS À CHAQUE RETOUR D'ARRIÈRE-PLAN, délibérément. La
     * spécification dit « au démarrage à froid » ; redemander l'empreinte à chaque bascule
     * d'application ferait payer le geste dix fois par heure pour une protection que
     * l'écran des tâches récentes contourne de toute façon.
     *
     * ⛔ LE RETOUR SYSTÈME NE CONTOURNE RIEN. Le `NavHost` n'est pas composé tant qu'on est
     * ici : il n'y a pas de pile à dépiler, et le retour ferme l'application. C'est la bonne
     * issue — sortir, jamais entrer.
     */
    var ouvert by remember { mutableStateOf(false) }
    if (ouvert) {
        contenu()
        return
    }

    EcranVerrouille(onOuvert = { ouvert = true }, onDeconnexion = onDeconnexion)
}

/**
 * L'écran que voit quelqu'un dont le verrou est armé, avant d'avoir été reconnu.
 *
 * ⛔ L'INVITE PART TOUTE SEULE, UNE FOIS. C'est ce que la personne attend : elle a armé un
 * verrou pour poser son doigt, pas pour toucher un bouton qui demande à poser son doigt.
 * Mais elle ne se relance PAS toute seule après un refus — une invite qui se rouvre
 * indéfiniment empêche de lire le motif et de toucher la sortie.
 */
@Composable
private fun EcranVerrouille(
    onOuvert: () -> Unit,
    onDeconnexion: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    /*
     * ⛔ `FragmentActivity`, PAS `ComponentActivity` — `BiometricPrompt` n'accepte que la
     * première. `MainActivity` en est une pour cette seule raison. Si ce transtypage rendait
     * `null`, le verrou ne pourrait pas s'ouvrir du tout : on ne se tait donc pas, on rend
     * l'écriteau qui NOMME le défaut et on laisse la sortie ouverte.
     */
    val activite = contexte as? FragmentActivity

    var motif by remember { mutableStateOf<String?>(null) }
    var reprenable by remember { mutableStateOf(true) }

    val ouvrir: () -> Unit = {
        if (activite != null) {
            demanderLIdentite(
                activite = activite,
                titre = "Ouvrir Rysmo",
                sousTitre = "Ton empreinte, ou le code de ce téléphone.",
            ) { resultat ->
                when (resultat) {
                    is ResultatBiometrique.Reussie -> onOuvert()
                    is ResultatBiometrique.Refusee -> {
                        motif = resultat.motif
                        reprenable = resultat.reprenable
                    }
                }
            }
        }
    }

    /* Une seule fois par montage : `Unit` en clé, jamais `motif`, sinon chaque refus
       relancerait l'invite par-dessus le message qui explique le refus. */
    LaunchedEffect(Unit) { ouvrir() }

    Screen(territoire = Territoire.TRANSFORME, modifier = modifier) {
        Box(
            Modifier
                .padding(top = 8.dp)
                .size(66.dp)
                .fondDegrade(jetons.actionDigitalise, RoundedCornerShape(21.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon("lock", description = null, taille = 27.dp, couleur = Color.White, epaisseur = 2.2f)
        }
        Display(
            listOf("RYSMO", "EST VERROUILLÉE."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 22.dp),
        )
        Body(
            "Tu as demandé qu'on te reconnaisse avant d'ouvrir. Pose ton doigt, ou entre le "
                + "code de ce téléphone.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        if (activite == null) {
            /* ⛔ Impossible en pratique — l'activité EST une `FragmentActivity`. Mais un
               écriteau vaut mieux qu'un écran sans issue le jour où quelqu'un change la
               classe de l'activité sans savoir ce qui en dépend. */
            SansDonnees(
                etat = Etat.NonBranche,
                quoi = "L'invite du système",
                origine = "L'écran hôte n'est pas une `FragmentActivity`",
                degat = "Sans elle, ce verrou ne peut plus s'ouvrir. La sortie ci-dessous "
                    + "reste le seul chemin, et elle ne doit jamais disparaître.",
                modifier = Modifier.padding(top = 20.dp),
            )
        }

        motif?.let { texte ->
            Surface(Niveau.TRUTH, Modifier.padding(top = 20.dp).fillMaxWidth()) {
                Column {
                    Eyebrow("L'identification n'a pas abouti")
                    /* Le motif vient du SYSTÈME : lui seul connaît le délai d'attente et la
                       cause exacte. Le remplacer par une phrase maison retirerait la seule
                       information utile — quoi faire, et quand. */
                    Body(texte, Modifier.padding(top = 6.dp))
                }
            }
        }

        if (activite != null && reprenable) {
            Button(
                "Réessayer",
                ouvrir,
                Modifier.padding(top = 18.dp),
                ton = TonBouton.DIGITALISE,
            )
        }

        /*
         * ⛔ LA SORTIE EST TOUJOURS RENDUE, MÊME QUAND TOUT VA BIEN. C'est l'invariant : « un
         * échec d'authentification ne doit JAMAIS enfermer ». La conditionner à un échec la
         * rendrait absente précisément au moment où l'invite se referme sans rien dire —
         * l'annulation système ne produit pas toujours de motif.
         *
         * ⚠️ ET C'EST « ME DÉCONNECTER », PAS « OUVRIR SANS LE VERROU ». La seconde formule
         * viderait le verrou de tout sens : n'importe qui la toucherait. Se déconnecter donne
         * une sortie sans donner l'accès — l'application se rouvre anonyme, sur le catalogue
         * public, et le compte reste fermé.
         */
        Button(
            "Me déconnecter",
            onDeconnexion,
            Modifier.padding(top = 10.dp),
            ton = TonBouton.QUIET,
        )
        Body(
            "Te déconnecter n'efface rien : ton compte, ta progression et tes notes restent "
                + "sur le serveur. C'est la sortie prévue quand le capteur ne te reconnaît "
                + "plus — un doigt coupé, un écran fêlé, une mise à jour du système.",
            Modifier.padding(top = 10.dp),
            couleur = jetons.textFaint,
        )
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN DE PROPOSITION — celui du kit, avec ce que le kit ne pouvait pas savoir.
 *
 * ⛔ IL NE PROPOSE RIEN QU'IL NE PUISSE TENIR. C'est le reproche que son propre en-tête fait
 * au produit : « proposer un verrou impossible à poser est un réglage qui ment ». Trois
 * situations, trois écrans différents — pas de capteur, aucune empreinte enrôlée, capteur
 * prêt — et la deuxième se répare en une minute dans les réglages du téléphone, ce qu'il faut
 * dire plutôt que de la confondre avec la première.
 *
 * ⛔ ET LE BOUTON N'ARME QU'APRÈS UNE RECONNAISSANCE RÉUSSIE. Poser le drapeau sur l'intention
 * armerait un verrou que la personne n'a jamais ouvert une seule fois ; le premier essai
 * serait au démarrage suivant, quand il est trop tard pour découvrir que le capteur ne la
 * reconnaît pas. C'est aussi ce qui rend ce bouton VÉRIFIABLE : on voit l'invite du système.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranBiometrie(
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    val activite = contexte as? FragmentActivity
    val preferences = remember(contexte) { Preferences(contexte) }
    val portee = rememberCoroutineScope()

    /*
     * ⚠️ RELU À CHAQUE COMPOSITION, JAMAIS `remember` : quelqu'un peut enrôler une empreinte
     * puis revenir sur cet écran sans que l'application ait été tuée. Un état matériel
     * mémorisé afficherait « ton téléphone n'a pas de capteur » sur un téléphone qui vient
     * d'en enrôler un.
     */
    val materiel = materielBiometrique(contexte)

    val arme by remember(preferences) {
        preferences.verrouBiometrique.map<Boolean, Boolean?> { it }
    }.collectAsState(initial = null)

    var motif by remember { mutableStateOf<String?>(null) }

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Retour",
        onRetour = onRetour,
        titre = "Verrouillage",
    ) {
        Box(
            Modifier
                .padding(top = 8.dp)
                .size(66.dp)
                .fondDegrade(jetons.actionDigitalise, RoundedCornerShape(21.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon("lock", description = null, taille = 27.dp, couleur = Color.White, epaisseur = 2.2f)
        }

        Display(
            listOf("ENTRER AVEC", "TON EMPREINTE ?"),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 22.dp),
        )
        Body(
            "Tu n'auras plus à retaper ton mot de passe. Il reste valable — c'est juste un "
                + "raccourci, pas un remplacement.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        Surface(Niveau.CHROME, Modifier.padding(top = 20.dp).fillMaxWidth(), rembourrage = 20.dp) {
            Column {
                CheckLine(ton = TonCoche.OK) { Body("Ton mot de passe continue de fonctionner") }
                CheckLine(ton = TonCoche.OK) {
                    Body("Ton empreinte reste dans le téléphone : je ne la reçois jamais")
                }
                CheckLine(ton = TonCoche.OK) { Body("Désactivable à tout moment, ici") }
                /* ⛔ Le tiret est un RENVOI, jamais une croix : « ailleurs, ou plus tard ».
                   Sur une liste d'engagements, la différence est contractuelle. */
                CheckLine(ton = TonCoche.NEUTRE, tiret = true) {
                    Body("Ça ne protège pas la vérification d'un certificat — elle est publique, à dessein")
                }
            }
        }

        when (materiel) {
            MaterielBiometrique.PRET -> Commande(
                arme = arme,
                actif = activite != null,
                onArmer = {
                    /* ⚠️ `activite` est déjà non nul ici : `Commande` ne rend le bouton
                       d'armement que si `actif` l'est. Le test reste, parce qu'une garde qui
                       dépend d'un paramètre d'un AUTRE composable se perd au premier
                       remaniement — et le compilateur ne peut pas le savoir. */
                    if (activite != null) {
                        demanderLIdentite(
                            activite = activite,
                            titre = "Activer le verrouillage",
                            sousTitre = "Une reconnaissance maintenant, pour être sûre que ça marche.",
                        ) { resultat ->
                            when (resultat) {
                                is ResultatBiometrique.Reussie -> {
                                    motif = null
                                    portee.launch { preferences.poserVerrouBiometrique(true) }
                                }
                                is ResultatBiometrique.Refusee -> motif = resultat.motif
                            }
                        }
                    }
                },
                onDesarmer = {
                    /* ⚠️ AUCUNE RECONNAISSANCE EXIGÉE POUR ÉTEINDRE, et c'est délibéré : ce
                       geste se fait DEPUIS L'INTÉRIEUR de l'application, donc après que le
                       sas a déjà été franchi. La redemander protégerait de rien et bloquerait
                       quelqu'un dont le capteur vient de cesser de fonctionner — c'est-à-dire
                       exactement la personne qui a besoin de l'éteindre. */
                    motif = null
                    portee.launch { preferences.poserVerrouBiometrique(false) }
                },
            )

            MaterielBiometrique.AUCUNE_EMPREINTE -> Impossible(
                sourcil = "Aucune empreinte enregistrée",
                texte = "Ce téléphone a bien un capteur, mais rien n'y est enrôlé. Ça se règle "
                    + "dans les réglages du téléphone, en une minute — et l'application ne "
                    + "peut pas le faire à ta place.",
            )

            MaterielBiometrique.AUCUN_MATERIEL -> Impossible(
                sourcil = "Pas de capteur sur ce téléphone",
                texte = "Il n'y a rien à activer ici. Ton mot de passe reste le seul chemin, "
                    + "et il suffit : le verrou n'aurait été qu'un raccourci.",
            )

            MaterielBiometrique.INDISPONIBLE -> Impossible(
                sourcil = "Le capteur ne répond pas",
                texte = "Le système ne dit pas si ce téléphone peut reconnaître une empreinte "
                    + "en ce moment — capteur occupé, mise à jour en cours. Rien n'est armé, "
                    + "et rien n'est perdu : reviens plus tard.",
            )
        }

        motif?.let { texte ->
            Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                Column {
                    Eyebrow("Rien n'a été activé")
                    Body(texte, Modifier.padding(top = 6.dp))
                    Body(
                        "Le verrou reste éteint : il ne s'arme qu'après une reconnaissance "
                            + "réussie, pour ne pas t'enfermer derrière un capteur qui ne te "
                            + "reconnaît pas.",
                        Modifier.padding(top = 8.dp),
                        couleur = jetons.textFaint,
                    )
                }
            }
        }

        Surface(Niveau.TRUTH, Modifier.padding(top = 16.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Ce que ce verrou garde aujourd'hui")
                /*
                 * ⛔ LA PHRASE QUI EMPÊCHE DE CROIRE À UNE PROTECTION QUI N'EXISTE PAS ENCORE.
                 * Le sas ne se ferme que sur une session ouverte, et aucun producteur de jeton
                 * d'identité n'est choisi : il n'y a donc rien derrière. Ne pas le dire ici
                 * reproduirait EXACTEMENT le défaut d'origine — quelqu'un qui croit avoir posé
                 * un verrou et n'en a aucun — avec la seule différence que le bouton, lui,
                 * fait bien ce qu'il annonce.
                 */
                Body(
                    "Rien, pour l'instant. Le verrou ne se ferme que sur une session ouverte, "
                        + "et l'identification n'est pas branchée : aucun compte ne peut "
                        + "encore être ouvert dans cette application. Ton choix est gardé et "
                        + "s'appliquera le jour où il y aura quelque chose derrière.",
                    Modifier.padding(top = 6.dp),
                    grain = GrainCorps.CHAPO,
                )
                Body(
                    "Il ne protège pas non plus ta session : elle n'est ni ici ni chiffrée. "
                        + "Il protège l'ACCÈS à l'écran sur un téléphone déverrouillé qu'on te "
                        + "prend des mains.",
                    Modifier.padding(top = 8.dp),
                    couleur = jetons.textFaint,
                )
            }
        }

        Surface(Niveau.TRUTH, Modifier.padding(top = 12.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Pourquoi cette question arrive maintenant")
                Body(
                    "Parce que c'est le seul moment où la proposition a un sens : après une "
                        + "connexion. La poser à l'ouverture de l'application, avant même un "
                        + "compte, c'est demander une empreinte pour rien.",
                    Modifier.padding(top = 6.dp),
                    grain = GrainCorps.CHAPO,
                )
            }
        }
    }
}

/**
 * Les deux gestes possibles quand le matériel suit — et un seul est rendu à la fois.
 *
 * ⚠️ TANT QUE LE DISQUE N'A PAS RÉPONDU (`arme == null`), AUCUN BOUTON N'EST DESSINÉ. Partir
 * du défaut `false` afficherait « Activer » une image, puis « Désactiver » : quelqu'un qui
 * touche vite éteindrait le verrou en croyant l'allumer.
 */
@Composable
private fun Commande(
    arme: Boolean?,
    actif: Boolean,
    onArmer: () -> Unit,
    onDesarmer: () -> Unit,
) {
    when {
        arme == null -> Body(
            "Lecture du réglage…",
            Modifier.padding(top = 18.dp),
            couleur = jetons.textFaint,
        )

        arme -> {
            Body(
                "Le verrou est armé sur ce téléphone.",
                Modifier.padding(top = 18.dp),
                grain = GrainCorps.CHAPO,
            )
            Button(
                "Désactiver le verrouillage",
                onDesarmer,
                Modifier.padding(top = 10.dp),
                ton = TonBouton.QUIET,
            )
        }

        /*
         * ⛔ SANS ACTIVITÉ HÔTE, PAS DE BOUTON — le design system refuserait de toute façon de
         * dessiner un contrôle sans action, et c'est la garde qui rend ce cas sûr : il ne peut
         * pas se transformer en bouton qui ne fait rien.
         */
        actif -> Button(
            "Activer l'empreinte",
            onArmer,
            Modifier.padding(top = 18.dp),
            ton = TonBouton.DIGITALISE,
        )

        else -> Body(
            "L'invite du système ne peut pas s'ouvrir depuis cet écran.",
            Modifier.padding(top = 18.dp),
            couleur = jetons.textFaint,
        )
    }
}

/** Ce qui remplace le bouton quand le matériel ne suit pas : la raison, et pas un bouton gris. */
@Composable
private fun Impossible(sourcil: String, texte: String) {
    Surface(Niveau.TRUTH, Modifier.padding(top = 18.dp).fillMaxWidth()) {
        Column {
            Eyebrow(sourcil)
            Body(texte, Modifier.padding(top = 6.dp), grain = GrainCorps.CHAPO)
        }
    }
}
