package me.maxmorrys.rysmo.ecrans

import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Onglet
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.TabBar
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.navigation.Biometrie
import me.maxmorrys.rysmo.navigation.Certificats
import me.maxmorrys.rysmo.navigation.ClubBloques
import me.maxmorrys.rysmo.navigation.ClubOnglet
import me.maxmorrys.rysmo.navigation.Console
import me.maxmorrys.rysmo.navigation.Media
import me.maxmorrys.rysmo.navigation.Presence
import me.maxmorrys.rysmo.navigation.Legal
import me.maxmorrys.rysmo.navigation.Memoire
import me.maxmorrys.rysmo.navigation.OngletClub
import me.maxmorrys.rysmo.navigation.Telechargements
import me.maxmorrys.rysmo.navigation.Verification
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Club
import me.maxmorrys.rysmo.donnees.Cours
import me.maxmorrys.rysmo.donnees.Espace
import me.maxmorrys.rysmo.donnees.Moi
import me.maxmorrys.rysmo.donnees.Repetiteur
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Avatar
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.ProgressBar
import me.maxmorrys.rysmo.ds.QuotaMeter
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.navigation.Formation
import me.maxmorrys.rysmo.navigation.Lecon

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES CINQ ONGLETS — l'ordre et les libellés viennent du kit, pas d'une habitude.
 *
 * `TABS_NAT` (`ScreensNatif.js:23`) : Espace, Cours, Répétiteur, Club, Profil. ⚠️ La planche
 * d'atelier en montre d'autres (« Accueil, Cours, Club, Médias, Moi ») — c'est un exemple de
 * composant, pas la navigation de l'application. Si les deux devaient un jour se ressembler,
 * c'est la planche qui doit changer.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
enum class OngletPrincipal(val libelle: String, val glyphe: String, val territoire: Territoire) {
    /*
     * ⛔ LES TERRITOIRES SONT RELEVÉS DANS LE KIT, PAS RÉPARTIS POUR FAIRE JOLI.
     *
     * Ma première version en donnait un différent à chaque onglet — c'était une supposition,
     * et elle était fausse sur quatre des cinq. Le kit met QUATRE écrans sur cinq en
     * `transforme` et n'en distingue qu'un :
     *
     *   NatEspace       transforme   (ScreensNatifApp.js)
     *   NatCatalogue    forme        (ScreensNatif.js — le seul qui change)
     *   NatRepetiteur   transforme   (ScreensNatifEtats.js)
     *   NatClubMur      transforme   (ScreensNatifCompte.js:244)
     *   NatPreferences  transforme   (ScreensNatifCompte.js)
     *
     * ⚠️ Le maillage n'est pas une décoration par onglet : c'est ce qui dit à quel
     * territoire de marque on se trouve. Le faire tourner à chaque bascule d'onglet
     * transforme un repère en clignotement.
     */
    ESPACE("Espace", "home", Territoire.TRANSFORME),
    COURS("Cours", "book", Territoire.FORME),
    REPETITEUR("Répétiteur", "chat", Territoire.TRANSFORME),
    CLUB("Club", "users", Territoire.TRANSFORME),
    PROFIL("Profil", "user", Territoire.TRANSFORME),
}

private val ONGLETS = OngletPrincipal.entries.map { Onglet(it.libelle, it.glyphe) }

/**
 * L'enveloppe commune aux cinq onglets : le maillage du territoire, la barre basse, et le
 * corps de l'onglet actif.
 *
 * ⚠️ UNE SEULE ENVELOPPE, PAS CINQ. Le port React Native recopiait sa coquille dans chaque
 * écran de Club, et la bande d'onglets a fini par n'exister dans aucun : ce qui est recopié
 * dérive, puis manque. Ici, l'ajout d'un onglet se fait dans l'énumération ci-dessus, et la
 * barre le voit sans qu'on y touche.
 */
@Composable
fun SquelettePrincipal(
    actif: OngletPrincipal,
    session: Session,
    onOnglet: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    Screen(
        territoire = actif.territoire,
        modifier = modifier,
        tabbar = {
            TabBar(
                onglets = ONGLETS,
                actif = actif.libelle,
                onSelect = { libelle ->
                    OngletPrincipal.entries.firstOrNull { it.libelle == libelle }?.let(onOnglet)
                },
            )
        },
    ) {
        CorpsOnglet(actif, session, onAller)
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES CINQ ONGLETS LISENT LEUR VUE.
 *
 * ⛔ ET AUCUN N'INVENTE RIEN QUAND IL N'A PAS LA RÉPONSE. C'est ce que le port React Native
 * a fait, et le résultat a été un écran d'accueil affichant « Série 3 j » et « Niveau 4 » à
 * de vraies personnes connectées — des chiffres fabriqués, restés en production jusqu'au
 * 05/09/2026. `SansDonnees` rend l'attente VISIBLE plutôt que confortable, et `Num` refuse
 * d'afficher un nombre sans sa provenance.
 *
 * ⚠️ Chaque corps traite `Servie` À PART et laisse tout le reste à `SansDonnees` : les huit
 * phases y ont chacune leur rendu, et les fondre afficherait une porte fermée comme une
 * panne, ou une panne comme un vide.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
private fun CorpsOnglet(onglet: OngletPrincipal, session: Session, onAller: (Any) -> Unit) {
    Eyebrow(onglet.libelle, Modifier.padding(top = 6.dp))
    when (onglet) {
        OngletPrincipal.ESPACE -> OngletEspace(session, onAller)
        OngletPrincipal.COURS -> OngletCours(session, onAller)
        OngletPrincipal.REPETITEUR -> OngletRepetiteur(session)
        OngletPrincipal.CLUB -> OngletClubRacine(session, onAller)
        OngletPrincipal.PROFIL -> OngletProfil(session, onAller)
    }
    Portes(onglet, onAller)
}

/** Ce que la formation en cours dit, et le geste pour la reprendre. */
@Composable
private fun OngletEspace(session: Session, onAller: (Any) -> Unit) {
    val lu = vue<Espace>(Vues.Noms.APP_ESPACE, session)
    val e = lu.etat
    Display(listOf("BONJOUR.", "REPRENDS", "OÙ TU T'ES ARRÊTÉE."), cran = CranDisplay.SM,
        modifier = Modifier.padding(top = 8.dp))
    if (e is Etat.Servie) {
        val v = e.valeur
        Surface(Niveau.CHROME, Modifier.padding(top = 20.dp)) {
            Column {
                Eyebrow(v.meta)
                Body(v.titre, Modifier.padding(top = 6.dp), grain = GrainCorps.CHAPO)
                ProgressBar(
                    valeur = v.progression.coerceIn(0, 100) / 100f,
                    modifier = Modifier.padding(top = 14.dp),
                )
                Num(
                    valeur = "${v.leconsFaites} / ${v.lecons}",
                    source = "Ta progression",
                    asOf = e.provenance.asOf,
                    modifier = Modifier.padding(top = 8.dp),
                    unite = "leçons",
                )
                /* ⚠️ Le bouton n'existe QUE si le serveur a nommé la leçon en cours : sans
                   elle, « Reprendre » n'aurait aucune destination et serait un contrôle mort. */
                v.leconEnCours?.let { lecon ->
                    Button(
                        libelle = "Reprendre",
                        onPress = { onAller(Lecon(slug = v.slug, leconId = lecon)) },
                        modifier = Modifier.padding(top = 14.dp),
                        ton = TonBouton.TRANSFORME,
                    )
                }
            }
        }
        v.arret?.let { Body(it, Modifier.padding(top = 12.dp), attenue = true) }
    } else {
        SansDonnees(
            etat = e,
            quoi = "Ta formation en cours",
            origine = "La vue « appEspace » du serveur",
            degat = "Une progression inventée est pire qu'une progression absente : elle se "
                + "croit, puis elle se contredit au premier chargement réel.",
            modifier = Modifier.padding(top = 22.dp),
            reprise = lu.reprendre,
        )
    }
}

/** Le catalogue. ⚠️ Il se parcourt sans compte — quand le serveur l'acceptera. */
@Composable
private fun OngletCours(session: Session, onAller: (Any) -> Unit) {
    val lu = vue<List<Cours>>(Vues.Noms.APP_COURS, session)
    val e = lu.etat
    Display(listOf("LE", "CATALOGUE."), cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))
    if (e is Etat.Servie) {
        Surface(Niveau.CHROME, Modifier.padding(top = 20.dp)) {
            Column {
                e.valeur.forEachIndexed { rang, cours ->
                    /* ⚠️ La clé est l'IDENTIFIANT, jamais le titre : deux formations
                       homonymes se sont déjà effondrées l'une sur l'autre dans ce dépôt. */
                    key(cours.id) {
                        LessonRow(
                            titre = cours.titre,
                            etat = if (cours.acquise) EtatLecon.DONE else EtatLecon.TODO,
                            meta = cours.meta,
                            derniere = rang == e.valeur.lastIndex,
                            onPress = { onAller(Formation(slug = cours.slug, titre = cours.titreCourt)) },
                        )
                    }
                }
            }
        }
    } else {
        SansDonnees(
            etat = e,
            quoi = "Le catalogue",
            origine = "La vue « appCours » du serveur",
            degat = "Un catalogue d'exemple donne à croire que l'offre existe telle quelle.",
            modifier = Modifier.padding(top = 22.dp),
            reprise = lu.reprendre,
        )
    }
}

/** Le quota du jour, et ce que le répétiteur retient. */
@Composable
private fun OngletRepetiteur(session: Session) {
    val lu = vue<Repetiteur>(Vues.Noms.APP_REPETITEUR, session)
    val e = lu.etat
    Display(listOf("TON", "RÉPÉTITEUR."), cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))
    if (e is Etat.Servie) {
        QuotaMeter(
            consomme = e.valeur.quota.utilise,
            modifier = Modifier.padding(top = 20.dp),
            total = e.valeur.quota.total,
            libelle = "questions aujourd'hui",
        )
    } else {
        SansDonnees(
            etat = e,
            quoi = "Ton répétiteur",
            origine = "La vue « appRepetiteur » du serveur",
            degat = "Un échange simulé ferait passer pour une réponse ce qui n'en est pas une.",
            modifier = Modifier.padding(top = 22.dp),
            reprise = lu.reprendre,
        )
    }
}

/**
 * La racine du Club.
 *
 * ⚠️ SON VIDE A TROIS SENS, et `SansDonnees` les distingue : « le Club est réservé aux
 * membres » n'est pas « tu n'as encore rien ici ». C'est la correction du 06/09 — un membre
 * dont une liste est vide recevait l'écran verrouillé.
 */
@Composable
private fun OngletClubRacine(session: Session, onAller: (Any) -> Unit) {
    val lu = vue<Club>(Vues.Noms.APP_CLUB, session)
    val e = lu.etat
    Display(listOf("LE CLUB."), cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))
    if (e is Etat.Servie) {
        Surface(Niveau.CHROME, Modifier.padding(top = 20.dp)) {
            Column {
                e.valeur.bilan.forEachIndexed { rang, tuile ->
                    key(tuile.l) {
                        LessonRow(
                            titre = tuile.l,
                            etat = EtatLecon.PLAIN,
                            derniere = rang == e.valeur.bilan.lastIndex,
                            queue = {
                                Num(
                                    valeur = tuile.n.toString(),
                                    source = "Le Club",
                                    asOf = e.provenance.asOf,
                                    taille = 13.sp,
                                )
                            },
                        )
                    }
                }
            }
        }
        e.valeur.echeance?.let {
            Body("Ton abonnement court jusqu'au $it.", Modifier.padding(top = 12.dp), attenue = true)
        }
    } else {
        SansDonnees(
            etat = e,
            quoi = "Le Club",
            origine = "La vue « appClub » du serveur",
            degat = "Un fil d'exemple mettrait dans la bouche de membres réels des mots "
                + "qu'ils n'ont pas écrits.",
            modifier = Modifier.padding(top = 22.dp),
            reprise = lu.reprendre,
        )
    }
}

/** Le profil. ⚠️ Le nom vient du serveur, jamais d'un cache local — AD-11. */
@Composable
private fun OngletProfil(session: Session, onAller: (Any) -> Unit) {
    val lu = vue<Moi>(Vues.Noms.APP_MOI, session)
    val e = lu.etat
    Display(listOf("TOI."), cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))
    if (e is Etat.Servie) {
        val v = e.valeur
        Surface(Niveau.CHROME, Modifier.padding(top = 20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(v.initiale)
                Column(Modifier.padding(start = 12.dp)) {
                    Body("${v.prenom} ${v.nom}".trim(), grain = GrainCorps.CHAPO)
                    v.email?.let { Body(it, attenue = true) }
                }
            }
        }
        Num(
            valeur = v.xp.toString(),
            source = "Ta progression",
            asOf = e.provenance.asOf,
            modifier = Modifier.padding(top = 14.dp),
            unite = "XP",
        )
    } else {
        SansDonnees(
            etat = e,
            quoi = "Ton profil",
            origine = "La vue « appMoi » du serveur",
            degat = "Un profil d'exemple ferait croire à un compte qui n'existe pas.",
            modifier = Modifier.padding(top = 22.dp),
            reprise = lu.reprendre,
        )
    }
}

/**
 * ⛔ CES LIENS NE SONT PAS DÉCORATIFS : SANS EUX, DES ÉCRANS CONSTRUITS NE SONT ATTEINTS
 * PAR RIEN.
 *
 * C'est le défaut du port React Native, à la lettre : 14 routes sur 51 existaient,
 * fonctionnaient, et n'étaient ouvertes par aucun écran de production.
 *
 * ⚠️ La porte `natif-navigation.test.ts` ne voit PAS ce défaut : elle garde que toute
 * destination déclarée est enregistrée au graphe, pas qu'un écran l'ouvre. C'est la limite
 * connue de cette porte, et la raison pour laquelle ces liens sont écrits plutôt que remis
 * à plus tard.
 */
@Composable
private fun Portes(onglet: OngletPrincipal, onAller: (Any) -> Unit) {
    val portes: List<Pair<String, Any>> = when (onglet) {
        OngletPrincipal.ESPACE -> listOf(
            "Mes certificats" to Certificats,
            "Mes téléchargements" to Telechargements,
        )
        OngletPrincipal.REPETITEUR -> listOf("Ce que le répétiteur retient" to Memoire)
        OngletPrincipal.CLUB -> listOf("Entrer dans le Club" to ClubOnglet(OngletClub.Fil))
        OngletPrincipal.PROFIL -> listOf(
            "Verrouillage biométrique" to Biometrie,
            "Le pôle médias" to Media,
            "Présence digitale" to Presence,
            "Comptes bloqués" to ClubBloques,
            "Vérifier un certificat" to Verification(),
            "Mentions légales" to Legal,
            /*
             * ⚠️ LA CONSOLE EST MONTRÉE À TOUT LE MONDE, ET C'EST CE QUE LE KIT VEUT.
             * « Un garde de route est du code client : il cache, il n'interdit pas. » C'est
             * le SERVEUR qui refuse — `appConsole` est servie sous `obligatoire+role` — et
             * l'écran d'accès refusé existe pour ce moment-là. Masquer le lien donnerait
             * l'illusion d'une protection que le client ne peut pas fournir.
             */
            "Console du support" to Console,
        )
        OngletPrincipal.COURS -> emptyList()
    }
    portes.forEach { (libelle, cible) ->
        Button(libelle, { onAller(cible) }, Modifier.padding(top = 10.dp), ton = TonBouton.QUIET)
    }
}

/**
 * L'écran d'une destination déclarée et pas encore construite.
 *
 * ⚠️ IL EXISTE POUR QUE LA CARTE SOIT FERMÉE, pas pour faire nombre. Une destination sans
 * écran ferait planter la navigation ; une destination qui rend une page blanche ferait
 * croire à un défaut de chargement. Celle-ci NOMME ce qui manque et le lot qui l'apporte.
 *
 * ⛔ Elle ne doit pas survivre au lot 6 : une porte comptera les destinations qui la
 * rendent encore, et ce compte doit tomber à zéro.
 */
@Composable
fun EnChantier(
    quoi: String,
    lot: String,
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Retour",
        onRetour = onRetour,
        titre = quoi,
    ) {
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = quoi,
            origine = "Prévu au $lot de la réécriture",
            degat = "Cette destination est déclarée pour que la carte de navigation soit "
                + "fermée dans les deux sens. Y mettre une imitation la sortirait du compte "
                + "des écrans restants.",
            modifier = Modifier.padding(top = 10.dp),
            action = { Button("Revenir", onRetour, ton = TonBouton.QUIET) },
        )
    }
}
