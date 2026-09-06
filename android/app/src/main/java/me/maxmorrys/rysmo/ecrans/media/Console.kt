package me.maxmorrys.rysmo.ecrans.media

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.Pipeline
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.StatTile
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.donnees.Console as VueConsole
import me.maxmorrys.rysmo.navigation.ConsoleEcran as DestinationConsoleEcran
import me.maxmorrys.rysmo.navigation.PorteeSupport

/**
 * ⛔ COMBIEN D'ÉCRANS LA CONSOLE DE BUREAU PORTE — UN MIROIR DE PLUS, ET IL EST GARDÉ.
 *
 * Source : `src/lib/admin/consoleNav.ts` → `ADMIN_SCREEN_COUNT`, qui vaut `ADMIN_NAV.length`.
 * Le web a déjà retiré ce nombre de sa copie pour la même raison qu'ici : « la maquette
 * l'écrit 19, et ce nombre n'est vrai que le jour où on l'écrit ».
 *
 * ⛔ ET IL A DÉJÀ DÉRIVÉ. Le kit natif écrit « Rôle support · 5 écrans sur 19 » et « les
 * QUATORZE autres écrans d'administration ». La table en compte 21 : le reste fait donc 16,
 * pas 14. Recopier la phrase du kit afficherait deux nombres faux à la personne dont le
 * métier est de savoir ce qu'elle atteint.
 *
 * ⚠️ LE CINQ, LUI, N'EST PAS ÉCRIT : il est compté sur l'énumération `PorteeSupport`, qui est
 * la portée elle-même. Un nombre dérivé de ce qu'il décrit ne peut pas le contredire.
 *
 * La porte : `tests/unit/natif-miroirs.test.ts`.
 */
internal object PorteeDuRole {
    const val ECRANS_CONSOLE: Int = 21
}

/**
 * Le libellé d'une portée, tel que le rôle support le lit côté bureau.
 *
 * ⚠️ LES CINQ NOMS VIENNENT DE `SUPPORT_SCOPE` (`src/lib/adminAccess.ts`), et le kit les
 * reprend à l'identique. L'énumération, elle, ne peut pas les porter : « Témoignages » et
 * « Rendez-vous » ne sont pas des identifiants Kotlin. La correspondance est donc explicite,
 * et la porte de miroir la compare aux libellés du web.
 */
internal val PorteeSupport.libelle: String
    get() = when (this) {
        PorteeSupport.Messages -> "Messages"
        PorteeSupport.Temoignages -> "Témoignages"
        PorteeSupport.RendezVous -> "Rendez-vous"
        PorteeSupport.Prospects -> "Prospects"
        PorteeSupport.Projets -> "Projets"
    }

/** Le glyphe de chaque portée, repris de la table du menu de bureau. */
private val PorteeSupport.glyphe: String
    get() = when (this) {
        PorteeSupport.Messages -> "comment"
        PorteeSupport.Temoignages -> "star"
        PorteeSupport.RendezVous -> "calendar"
        PorteeSupport.Prospects -> "case"
        PorteeSupport.Projets -> "boxes"
    }

/** Le compteur d'une portée dans la réponse du serveur. */
private fun VueConsole.compte(portee: PorteeSupport): Int = when (portee) {
    PorteeSupport.Messages -> comptes.messages
    PorteeSupport.Temoignages -> comptes.temoignages
    PorteeSupport.RendezVous -> comptes.rendezVous
    PorteeSupport.Prospects -> comptes.prospects
    PorteeSupport.Projets -> comptes.projets
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CONSOLE DU SUPPORT — kit `NatConsoleSupport` (`ScreensNatifMedia.js:336-374`).
 *
 * ⛔ CET ÉCRAN NE PROTÈGE RIEN, ET IL NE DOIT JAMAIS LAISSER CROIRE LE CONTRAIRE.
 *
 * Le kit l'écrit lui-même, sur l'écran d'à côté : « un garde de route est du code client :
 * il CACHE, il n'interdit pas ». Le cloisonnement réel est ailleurs — la vue `appConsole`
 * relit le rôle dans la base à chaque appel et lève `permission-denied` hors des rôles
 * admis. C'est le SERVEUR qui refuse.
 *
 * ⚠️ IL N'Y A DONC AUCUN TEST DE RÔLE ICI, ET C'EST DÉLIBÉRÉ. Un `if (role != support)` avant
 * la lecture aurait deux défauts, et le second est le pire :
 *
 *   1 · il donnerait à croire qu'il protège, alors qu'il se contourne en modifiant le client ;
 *   2 · il dépendrait d'un rôle lu chez le client — c'est-à-dire d'une valeur que le serveur
 *       ne lui a pas encore confirmée. Un rôle périmé en cache fermerait la console à
 *       quelqu'un qui y a droit, ou l'ouvrirait à quelqu'un qui ne l'a plus.
 *
 * L'écran DEMANDE, et il affiche la réponse — y compris le refus. C'est ce que fait
 * `SansDonnees` avec `Etat.Panne` : le motif du serveur s'y lit tel qu'il l'a écrit.
 *
 * ── ⛔ CE QUI N'EST PAS DESSINÉ, ET POURQUOI ────────────────────────────────────────────
 * · LA CLOCHE de la barre haute : aucune destination de notifications n'existe dans le
 *   graphe. Une cloche à pastille qui n'ouvre rien est un contrôle mort, et à pastille elle
 *   annonce en plus quelque chose à voir.
 * · LE BOUTON « QUALIFIER » sur la ligne de prospect : aucune callable du contrat ne
 *   qualifie un prospect. Le kit le dessine ; le porter donnerait un bouton qui, au mieux,
 *   ne fait rien, et au pire fait croire qu'un dossier a été traité.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranConsole(
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val portees = PorteeSupport.entries
    val ailleurs = PorteeDuRole.ECRANS_CONSOLE - portees.size

    Screen(
        territoire = Territoire.NUIT,
        modifier = modifier,
        sombre = true,
        retour = "Profil",
        onRetour = onRetour,
        titre = "Console · support",
    ) {
        /*
         * ⭐ LES DEUX NOMBRES DE CE SOURCIL SONT COMPTÉS, PAS ÉCRITS. Le cinq vient de
         * l'énumération de la portée ; le total vient de la table du menu de bureau, par un
         * miroir gardé. Le kit, lui, écrit « 5 sur 19 » — un nombre qui a déjà dérivé.
         */
        Eyebrow("Rôle support · ${portees.size} écrans sur ${PorteeDuRole.ECRANS_CONSOLE}", Modifier.padding(top = 6.dp))
        Display(
            listOf("À TRAITER", "AUJOURD'HUI."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )

        /*
         * ⚠️ `Etat.NonBranche` EST UN ARGUMENT. Le jour où la lecture d'`appConsole` a son
         * chemin, c'est cette ligne qui change — et le refus de rôle arrivera alors par
         * `Etat.Panne`, avec le motif que le serveur aura écrit.
         */
        CorpsDeLaConsole(
            etat = Etat.NonBranche,
            onAller = onAller,
            modifier = Modifier.padding(top = 20.dp),
        )

        EncartDeNuit(
            sourcil = "Ce que cet écran ne couvre pas",
            texte = "Les $ailleurs autres écrans d'administration — publication, "
                + "transactions, contenu, réglages — restent au tableau de bord de bureau. "
                + "Ils se travaillent au clavier, sur deux ou trois colonnes ; les porter sur "
                + "un téléphone serait une régression déguisée en couverture.",
            modifier = Modifier.padding(top = 18.dp),
        )
    }
}

@Composable
private fun CorpsDeLaConsole(
    etat: Etat<VueConsole>,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val servie = etat as? Etat.Servie<VueConsole>
    val vue = servie?.valeur

    Column(modifier.fillMaxWidth()) {
        if (vue == null) {
            SansDonnees(
                etat = etat,
                quoi = "Ta file du jour",
                origine = "La vue « ${Vues.Noms.APP_CONSOLE} » du serveur",
                degat = "Un « 3 à traiter » inventé enverrait quelqu'un chercher un dossier "
                    + "qui n'existe pas — et un « 0 » inventé lui ferait fermer l'application "
                    + "alors que la file est pleine. Les deux se paient sur du travail réel.",
                hauteur = 3,
            )
        } else {
            /*
             * ⛔ `StatTile` EXIGE `source` ET `asOf` : un zéro daté est une information, une
             * estimation n'en est pas une. `asOf` est l'estampille du SERVEUR, pas l'horloge
             * du téléphone — c'est le défaut le plus grave que le port avait, et il se
             * lisait justement sur des compteurs.
             */
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatTile(
                    libelle = "Prospects",
                    valeur = vue.comptes.prospects.toString(),
                    source = Vues.Noms.APP_CONSOLE,
                    asOf = servie.provenance.asOf,
                    modifier = Modifier.weight(1f),
                    pied = "non qualifiés",
                    niveau = Niveau.NIGHT,
                )
                StatTile(
                    libelle = "Messages",
                    valeur = vue.comptes.messages.toString(),
                    source = Vues.Noms.APP_CONSOLE,
                    asOf = servie.provenance.asOf,
                    modifier = Modifier.weight(1f),
                    pied = "non lus",
                    niveau = Niveau.NIGHT,
                )
            }

            /*
             * ⚠️ LE PIPELINE EST UN RELEVÉ, PAS UN FILTRE. Le kit le dessine avec trois
             * étapes cliquables ; le port ne branchait le filtrage nulle part. `onSelect`
             * vaut donc `null` : la bande dit où en est la file, et ne prétend pas la
             * trier. C'est un affichage, comme une barre de progression.
             */
            val aTraiter = vue.comptes.prospects
            Pipeline(
                etapes = listOf("tout $aTraiter", "à traiter $aTraiter", "clos 0"),
                actif = "à traiter $aTraiter",
                onSelect = null,
                modifier = Modifier.padding(top = 14.dp),
            )

            vue.prospect?.let { prospect ->
                Surface(
                    Niveau.NIGHT,
                    Modifier.padding(top = 14.dp).fillMaxWidth(),
                    rembourrage = 4.dp,
                ) {
                    LessonRow(
                        titre = prospect.titre,
                        etat = EtatLecon.PLAIN,
                        glyphe = "case",
                        /* Le plus ANCIEN non traité, pas le plus récent : une file de support
                           se prend par le bout qui attend depuis le plus longtemps. */
                        meta = listOfNotNull(prospect.meta, prospect.statut).joinToString(" · "),
                        derniere = true,
                    )
                }
                Body(
                    "La qualification se fait au tableau de bord de bureau : aucune écriture "
                        + "de la console n'est au contrat, et un bouton « Qualifier » ferait "
                        + "croire ici qu'un dossier a été traité.",
                    Modifier.padding(top = 8.dp),
                    grain = GrainCorps.CHAPO,
                    couleur = jetons.textFaint,
                )
            }
        }

        /*
         * ⛔ LES CINQ PORTÉES SONT RENDUES QUELLE QUE SOIT LA PHASE, ET C'EST VOLONTAIRE.
         * Ce sont les cinq écrans que le rôle atteint — un TERME, pas un relevé : ils ne
         * dépendent d'aucune lecture. Ce qui en dépend, c'est leur COMPTEUR, et c'est lui
         * seul qui manque quand la vue n'est pas servie.
         *
         * ⚠️ Sans elles, les cinq destinations `ConsoleEcran` seraient atteintes par rien —
         * le défaut que le port React Native a livré quatorze fois.
         */
        Eyebrow("Ce que ton rôle atteint", Modifier.padding(top = 24.dp))
        Surface(Niveau.NIGHT, Modifier.padding(top = 10.dp).fillMaxWidth(), rembourrage = 4.dp) {
            Column {
                PorteeSupport.entries.forEachIndexed { i, portee ->
                    LessonRow(
                        titre = portee.libelle,
                        etat = EtatLecon.PLAIN,
                        glyphe = portee.glyphe,
                        derniere = i == PorteeSupport.entries.lastIndex,
                        queue = {
                            /*
                             * ⛔ `Num` REFUSE UN NOMBRE SANS PROVENANCE, et son repli DIT
                             * pourquoi la valeur manque au lieu d'afficher un tiret. Un tiret
                             * cache la différence entre « c'est zéro » et « je ne sais pas »,
                             * et cette différence EST l'information sur une file d'attente.
                             */
                            Num(
                                valeur = vue?.compte(portee)?.toString(),
                                source = Vues.Noms.APP_CONSOLE,
                                /* Vide quand rien n'a été lu — et alors `valeur` est nulle,
                                   donc aucune date n'est affichée : il n'y a pas de nombre à
                                   dater. La provenance ne sert que lorsqu'il y en a un. */
                                asOf = servie?.provenance?.asOf.orEmpty(),
                                repli = "non relevé",
                                taille = 12.5.sp,
                            )
                        },
                        onPress = { onAller(DestinationConsoleEcran(portee)) },
                    )
                }
            }
        }
    }
}
