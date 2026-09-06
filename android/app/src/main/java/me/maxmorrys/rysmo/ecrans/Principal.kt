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
    ESPACE("Espace", "home", Territoire.FORME),
    COURS("Cours", "book", Territoire.DIGITALISE),
    REPETITEUR("Répétiteur", "chat", Territoire.TRANSFORME),
    CLUB("Club", "users", Territoire.INFORME),
    PROFIL("Profil", "user", Territoire.FORME),
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
        CorpsOnglet(actif, onAller)
    }
}

/**
 * ⛔ CES CINQ CORPS SONT VIDES, ET ILS LE DISENT.
 *
 * Chacun devrait lire sa vue (`appEspace`, `appCours`, `appRepetiteur`, `appClub`, `appMoi`)
 * — la couche de données les sert déjà, le contrat les décrit, mais aucun producteur de
 * jeton d'identité n'est encore choisi : la session rend `NonConfiguree`, et une lecture
 * rendrait une panne non reprenable.
 *
 * ⚠️ LA TENTATION, ICI, EST DE GARNIR AVEC DES DONNÉES D'EXEMPLE en attendant. C'est ce que
 * le port React Native a fait, et le résultat a été un écran d'accueil qui affichait
 * « Série 3 j » et « Niveau 4 » à de vraies personnes connectées — des chiffres inventés,
 * restés en production jusqu'au 05/09/2026. `SansDonnees` existe pour rendre cette attente
 * VISIBLE plutôt que confortable.
 */
@Composable
private fun CorpsOnglet(onglet: OngletPrincipal, onAller: (Any) -> Unit) {
    val (titre, vue, degat) = when (onglet) {
        OngletPrincipal.ESPACE -> Triple(
            listOf("BONJOUR.", "REPRENDS", "OÙ TU T'ES ARRÊTÉE."),
            "appEspace",
            "Une progression inventée est pire qu'une progression absente : elle se croit, "
                + "puis elle se contredit au premier chargement réel.",
        )
        OngletPrincipal.COURS -> Triple(
            listOf("LE", "CATALOGUE."),
            "appCours",
            "Un catalogue d'exemple donne à croire que l'offre existe telle quelle.",
        )
        OngletPrincipal.REPETITEUR -> Triple(
            listOf("TON", "RÉPÉTITEUR."),
            "appRepetiteur",
            "Un échange simulé ferait passer pour une réponse ce qui n'en est pas une.",
        )
        OngletPrincipal.CLUB -> Triple(
            listOf("LE CLUB."),
            "appClub",
            "Un fil d'exemple mettrait dans la bouche de membres réels des mots qu'ils "
                + "n'ont pas écrits.",
        )
        OngletPrincipal.PROFIL -> Triple(
            listOf("TOI."),
            "appMoi",
            "Un profil d'exemple ferait croire à un compte qui n'existe pas.",
        )
    }

    Eyebrow(onglet.libelle, Modifier.padding(top = 6.dp))
    Display(titre, cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))
    SansDonnees(
        etat = Etat.NonBranche,
        quoi = "Le contenu de cet onglet",
        origine = "La vue « $vue » du serveur",
        degat = degat,
        modifier = Modifier.padding(top = 22.dp),
    )
    Body(
        "Le catalogue et le Club se parcourent sans compte. C'est l'identification qui "
            + "manque, pas le contenu.",
        Modifier.padding(top = 14.dp),
        grain = GrainCorps.CORPS,
        attenue = true,
    )
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
