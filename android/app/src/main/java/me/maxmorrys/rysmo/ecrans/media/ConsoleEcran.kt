package me.maxmorrys.rysmo.ecrans.media

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ecrans.apprentissage.SITE_PUBLIC
import me.maxmorrys.rysmo.navigation.PorteeSupport

/**
 * ⛔ LE CHEMIN DE BUREAU DE CHAQUE PORTÉE — CINQUIÈME ET DERNIER MIROIR DE CE LOT.
 *
 * Source : `src/lib/adminAccess.ts` → `SUPPORT_SCOPE`, qui est « la source unique du
 * périmètre support » et dont le fichier écrit lui-même la raison : « la liste est affichée
 * à deux endroits […] deux déclarations, c'est deux occasions de mentir à la personne sur ce
 * qu'elle a le droit de faire ». Trois occasions, maintenant — et la troisième est gardée
 * par `tests/unit/natif-miroirs.test.ts`.
 *
 * ⚠️ CES CHEMINS NE SONT PAS DÉCLARÉS EN LIENS APPLICATIFS (le manifeste ne déclare que
 * `/formations` et `/verifier`) : ils sortent donc vraiment vers le navigateur, au lieu de
 * rouvrir l'application sur elle-même.
 */
private val PorteeSupport.cheminDeBureau: String
    get() = when (this) {
        PorteeSupport.Messages -> "/admin/messages"
        PorteeSupport.Temoignages -> "/admin/temoignages"
        PorteeSupport.RendezVous -> "/admin/rendez-vous"
        PorteeSupport.Prospects -> "/admin/prospects-agence"
        PorteeSupport.Projets -> "/admin/projets"
    }

/**
 * Le titre d'affichage de chaque portée.
 *
 * ⚠️ ÉCRIT EN CAPITALES, PAS MIS EN CAPITALES. `Display` rend le texte tel quel, et
 * `uppercase()` sans locale est un piège connu de ce dépôt — la casse est une décision de
 * LANGUE, elle ne se calcule pas sur une chaîne d'interface.
 */
private val PorteeSupport.titreAffiche: List<String>
    get() = when (this) {
        PorteeSupport.Messages -> listOf("LES MESSAGES", "REÇUS.")
        PorteeSupport.Temoignages -> listOf("LES TÉMOIGNAGES", "À RELIRE.")
        PorteeSupport.RendezVous -> listOf("LES RENDEZ-VOUS", "DEMANDÉS.")
        PorteeSupport.Prospects -> listOf("LES DEMANDES", "D'AGENCE.")
        PorteeSupport.Projets -> listOf("LES PROJETS", "EN COURS.")
    }

/** Ce que chaque portée contient, dit sans compter : c'est une définition, pas un relevé. */
private val PorteeSupport.quoi: String
    get() = when (this) {
        PorteeSupport.Messages ->
            "Les messages envoyés depuis le formulaire de contact du site, et les " +
                "réponses qui leur ont été faites."
        PorteeSupport.Temoignages ->
            "Les témoignages déposés par des personnes formées, en attente de " +
                "publication. Publier ou refuser est une décision éditoriale, pas une " +
                "file d'attente."
        PorteeSupport.RendezVous ->
            "Les demandes de rendez-vous, avec leur créneau et leur état. Un accusé de " +
                "réception part déjà tout seul, côté serveur."
        PorteeSupport.Prospects ->
            "Les demandes venues de l'offre Présence Digitale : le commerce, son pack " +
                "pressenti, et le budget que la personne a annoncé elle-même."
        PorteeSupport.Projets ->
            "Les projets en cours et leur avancement — ce qui a été livré, ce qui attend " +
                "une réponse du client."
    }

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UNE PORTÉE DU RÔLE SUPPORT — ⛔ LE KIT NE DESSINE AUCUN DE CES CINQ ÉCRANS.
 *
 * `NatConsoleSupport` les LISTE — Messages, Témoignages, Rendez-vous, Prospects, Projets —
 * et ne dessine que le sien. Les cinq écrans du port React Native existaient et étaient
 * cent pour cent en dur : aucun ne portait de lecture. Ils ne documentent donc ni les
 * données ni le rendu attendus, et la spécification le compte parmi ce qu'elle n'a pas pu
 * déterminer.
 *
 * ⛔ ET LE CONTRAT NE LES SERT PAS NON PLUS. `appConsole` rend CINQ COMPTEURS et le plus
 * ancien prospect non traité — pas les listes. Aucune vue ne rend les messages, les
 * témoignages, les rendez-vous, les projets, ni même la liste des prospects. Il n'y a donc
 * rien à afficher, et surtout rien à inventer : ces cinq écrans portent du travail réel sur
 * des personnes réelles, avec leurs demandes et leurs budgets.
 *
 * ⭐ CE QUE CET ÉCRAN FAIT DONC, ET QUI EST VRAI : il nomme la portée, dit ce qu'elle
 * contient, et OUVRE l'écran de bureau correspondant. C'est le seul geste utile qu'un
 * support debout puisse tirer de son téléphone tant que la file n'est pas servie ici.
 *
 * ⚠️ AUCUN GARDE DE RÔLE, comme sur la console : il cacherait sans interdire. C'est le
 * serveur qui refuse, et l'écran de bureau applique la même règle de son côté.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranConsoleEcran(
    ecran: PorteeSupport,
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    var adresseOrpheline by remember { mutableStateOf<String?>(null) }
    val adresse = SITE_PUBLIC + ecran.cheminDeBureau

    Screen(
        territoire = Territoire.NUIT,
        modifier = modifier,
        sombre = true,
        retour = "Console",
        onRetour = onRetour,
        titre = ecran.libelle,
    ) {
        Eyebrow("Portée du rôle support", Modifier.padding(top = 6.dp))
        Display(
            ecran.titreAffiche,
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )
        Body(ecran.quoi, Modifier.padding(top = 12.dp))

        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "La file de « ${ecran.libelle} »",
            /*
             * ⛔ ON NOMME CE QUI MANQUE VRAIMENT. `appConsole` existe et sert des COMPTEURS ;
             * ce qui n'existe pas, c'est une vue qui rende la LISTE. Écrire « la vue
             * appConsole » tout court enverrait chercher un défaut de branchement là où il y
             * a un trou de contrat.
             */
            origine = "Aucune vue du contrat ne rend cette liste — « ${Vues.Noms.APP_CONSOLE} » "
                + "n'en sert que le compteur",
            degat = "Une file d'exemple ferait travailler quelqu'un sur des demandes qui "
                + "n'existent pas, et lui ferait manquer celles qui existent. Ce sont des "
                + "personnes qui attendent une réponse.",
            modifier = Modifier.padding(top = 20.dp),
            hauteur = 4,
        )

        /*
         * ⛔ HORS DE `SansDonnees` : ce composant rend des squelettes, sans emplacement
         * d'action, pendant les deux phases d'attente. C'est pourtant le seul geste utile de
         * l'écran, et un support debout ne doit pas le voir disparaître le temps d'un
         * chargement.
         */
        Button(
            "Ouvrir au tableau de bord",
            {
                adresseOrpheline = if (ouvrirUneAdresse(contexte, adresse)) null else adresse
            },
            Modifier.padding(top = 16.dp),
            ton = TonBouton.QUIET,
            glypheQueue = "external",
        )

        adresseOrpheline?.let { orpheline ->
            Surface(Niveau.NIGHT, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                Column {
                    Eyebrow("Aucun navigateur n'a répondu")
                    Body(
                        "Ce téléphone n'a pas d'application capable d'ouvrir une adresse web. "
                            + "L'écran reste accessible depuis un ordinateur, ici :",
                        Modifier.padding(top = 6.dp),
                        attenue = true,
                    )
                    AdresseMono(orpheline, Modifier.padding(top = 8.dp))
                }
            }
        }

        EncartDeNuit(
            sourcil = "Pourquoi cet écran est mince, et pourquoi il existe",
            texte = "Le tableau de bord de bureau fait ce travail sur deux ou trois colonnes, "
                + "au clavier. Le porter tel quel sur un téléphone serait une régression "
                + "déguisée en couverture — c'est la décision du kit, pas un raccourci. Ce "
                + "qui manque ici pour aller plus loin est nommé au-dessus : une vue qui "
                + "rende la liste, et une écriture qui permette de traiter une ligne.",
            modifier = Modifier.padding(top = 18.dp),
        )
    }
}
