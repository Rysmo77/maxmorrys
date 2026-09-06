package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Discussion
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Opportunite
import me.maxmorrys.rysmo.donnees.Provenance
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.ChipRow
import me.maxmorrys.rysmo.ds.DispositionChips
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.PoseCarte
import me.maxmorrys.rysmo.ds.PriceBlock
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.TailleBouton
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.TerritoireCarte
import me.maxmorrys.rysmo.ds.TerritoryCard
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.TonTag
import me.maxmorrys.rysmo.ecrans.OngletPrincipal
import me.maxmorrys.rysmo.navigation.OngletClub

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES TROIS ONGLETS DE LISTE — DISCUSSIONS, MEMBRES, OPPORTUNITÉS.
 *
 * ⛔ LE FILTRE SE DÉRIVE DE LA LISTE, IL NE SE RECOPIE PAS DU KIT. Le kit écrit ses pilules
 * en dur — « Toutes · Entraide · Outils · Clients » (`ScreensNatifClub.js:93`). Or
 * `Discussion.categorie` et `Opportunite.type` sont des VALEURS LIBRES de la base : le
 * contrat le dit noir sur blanc pour la catégorie (« en LECTURE le serveur rend
 * `asText(m.data.category) ?? 'Entraide'` — la valeur vient de la base, elle est libre »).
 * Des pilules écrites à la main filtreraient sur quatre valeurs pendant que la base en sert
 * cinq, et la cinquième deviendrait invisible sans que rien n'échoue.
 *
 * ⚠️ ET LE FILTRE NE S'AFFICHE PAS SUR UNE LISTE VIDE. Une rangée de pilules au-dessus de
 * rien est un contrôle mort qui a l'air vivant.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

private const val TOUTES = "Toutes"

/**
 * Les trois teintes de carte du kit, dans son ordre (`ScreensNatifClub.js:97, 106, 115`).
 * ⚠️ Elles cyclent par POSITION : rien dans le contrat ne rattache une catégorie à un
 * territoire, et en inventer un ferait dire à la couleur une chose que la donnée ne dit pas.
 */
private val TEINTES = listOf(
    TerritoireCarte.TRANSFORME, TerritoireCarte.FORME, TerritoireCarte.ROSE,
)

/** ══ 2 · DISCUSSIONS ══ */
@Composable
fun EcranClubDiscussions(
    etat: Etat<List<Discussion>>,
    onRetour: () -> Unit,
    onOngletClub: (OngletClub) -> Unit,
    onOngletPrincipal: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
    actions: ActionsDuClub = ActionsDuClub(),
    /**
     * De quoi redemander la vue. ⛔ PAS UN CHAMP DE L'ÉTAT : une fonction dans `Etat` casserait
     * son égalité structurelle, et deux `Panne` identiques ne seraient jamais égales. `Panne`
     * dit si la reprise a un SENS ; c'est `SansDonnees` qui décide de la proposer.
     */
    reprise: (() -> Unit)? = null,
) {
    var filtre by rememberSaveable { mutableStateOf(TOUTES) }

    ClubScaffold(
        onglet = OngletClub.Discussions,
        etat = etat,
        onRetour = onRetour,
        onOngletClub = onOngletClub,
        onOngletPrincipal = onOngletPrincipal,
        onAller = onAller,
        modifier = modifier,
        actions = actions,
        publierIci = true,
    ) {
        val sujets = etat.valeurServie().orEmpty()
        val provenance = etat.provenanceOuNull()

        RangeeDeFiltres(
            valeurs = sujets.map { it.categorie },
            actif = filtre,
            onChange = { filtre = it },
        )

        if (provenance == null) {
            SansDonnees(
                etat = etat,
                quoi = "Les sujets ouverts du Club",
                origine = "La vue « ${Vues.Noms.APP_CLUB_LISTE_DISCUSSIONS} »",
                degat = "Des sujets d'exemple feraient croire à des conversations que "
                    + "personne n'a eues, et à des réponses que personne n'a écrites.",
                modifier = Modifier.padding(top = 16.dp),
                reprise = reprise,
            )
            return@ClubScaffold
        }

        val visibles = sujets.filter { filtre == TOUTES || it.categorie == filtre }
        visibles.forEachIndexed { i, sujet ->
            /* ⛔ LA CLÉ EST L'IDENTIFIANT DU SUJET. `key = auteur` a déjà fait s'effondrer des
               lignes d'auteurs homonymes dans ce dépôt, et deux sujets peuvent partager un
               titre aussi bien qu'un auteur. */
            key(sujet.id) {
                TerritoryCard(
                    territoire = TEINTES[i % TEINTES.size],
                    modifier = Modifier.padding(top = if (i == 0) 16.dp else 0.dp),
                    pose = PoseCarte.STACK,
                    premiere = i == 0,
                    meta = "${sujet.categorie} · ${sujet.reponses} réponses",
                    titre = sujet.titre,
                ) {
                    Row(
                        Modifier.padding(top = 14.dp).fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        /*
                         * ⚠️ UN SEUL VISAGE, LÀ OÙ LE KIT EN EMPILE DEUX OU TROIS. Sa pile
                         * (`ScreensNatifClub.js:85-89`) montre CEUX QUI ONT RÉPONDU ;
                         * `Discussion` ne porte que l'auteur du sujet. Empiler trois avatars
                         * pris ailleurs dirait que ces personnes-là ont répondu.
                         */
                        EnteteMembre(
                            initiales = sujet.initiales,
                            nom = sujet.auteur,
                            meta = sujet.quand,
                            modifier = Modifier.weight(1f),
                            taille = 26.dp,
                        )
                        if (sujet.resolu) Tag("Résolu", TonTag.OK)
                    }
                }
            }
        }

        if (visibles.isEmpty()) {
            NoteFine(
                if (sujets.isEmpty()) {
                    "Aucun sujet dans ce relevé du ${provenance.asOf}."
                } else {
                    "Aucun sujet dans « $filtre » à ce relevé du ${provenance.asOf}."
                },
                Modifier.padding(top = 16.dp),
            )
        }

        /*
         * ⛔ UN SUJET NE S'OUVRE PAS, ET CE N'EST PAS UN OUBLI. Il n'existe aucune destination
         * de fil de discussion (`navigation/Destinations.kt`) ni aucune vue qui serve les
         * réponses d'un sujet. Le port avait le même trou et l'avait rendu invisible : sur
         * `/club/discussions`, « aucune arête sortante ». Le rendre pressable donnerait autant
         * de contrôles morts que de sujets.
         */
        NoteFine(
            "Le décompte de réponses dérive de la liste stockée : ce n'est pas un compteur "
                + "libre. Ouvrir un sujet demande une vue que le contrat n'a pas encore.",
            Modifier.padding(top = 14.dp),
        )
    }
}

/**
 * ══ 3 · MEMBRES ══
 *
 * ⛔ CET ONGLET N'A AUCUN PRODUCTEUR, ET C'EST LE CONSTAT LE PLUS LOURD DE CE LOT.
 *
 * Le kit dessine l'annuaire (`ScreensNatifClub.js:135-172`) : six lignes remplies sur neuf
 * arrivées, le manque écrit plutôt que comblé. Le port React Native ne l'a JAMAIS porté — le
 * hub du Club l'avait délibérément remplacé par « Comptes bloqués » (`(tabs)/club.tsx:37-41`).
 * Et le contrat de données ne le sert pas davantage : `appClubListe` s'ouvre en TROIS formes
 * — `discussions`, `opportunites`, `membre` — et `membre` rend UNE fiche, pas une liste.
 *
 * ⚠️ L'ONGLET RESTE, PARCE QUE L'ORDRE DES HUIT EST PORTEUR. Le retirer décalerait les cinq
 * onglets suivants, c'est-à-dire changerait la position que la personne a apprise. Il porte la
 * bande, il dit ce qui manque, et il ne fabrique rien.
 */
@Composable
fun EcranClubMembres(
    onRetour: () -> Unit,
    onOngletClub: (OngletClub) -> Unit,
    onOngletPrincipal: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    ClubScaffold(
        onglet = OngletClub.Membres,
        /* Aucune vue : impossible de savoir si l'accès manque ou si la donnée manque. On ne
           montre donc PAS le cadenas — il affirmerait quelque chose qu'on ne sait pas. */
        etat = Etat.NonBranche,
        onRetour = onRetour,
        onOngletClub = onOngletClub,
        onOngletPrincipal = onOngletPrincipal,
        onAller = onAller,
        modifier = modifier,
    ) {
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "L'annuaire des membres",
            origine = "Aucune vue du contrat ne rend cette liste — « "
                + "${Vues.Noms.APP_CLUB_LISTE_MEMBRE} » rend UNE fiche",
            degat = "Un annuaire d'exemple ferait croire à un Club plus grand qu'il n'est, "
                + "et donnerait un métier et un quartier à des gens qui ne les ont pas "
                + "renseignés.",
            modifier = Modifier.padding(top = 16.dp),
        )

        Surface(Niveau.TRUTH, Modifier.padding(top = 16.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Ce que la fiche montre, et ce qu'elle cache")
                Body(
                    "Le métier et le quartier, parce qu'ils servent à se trouver. Jamais le "
                        + "numéro de téléphone — on s'écrit dans le Club, et une personne "
                        + "signalée ne voit pas son signalement.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
                NoteFine(
                    "Ce n'est pas une promesse d'écran : `Membre` ne porte ni téléphone ni "
                        + "adresse, et le serveur ne les sort pas de la base.",
                    Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

/** ══ 6 · OPPORTUNITÉS ══ */
@Composable
fun EcranClubOpportunites(
    etat: Etat<List<Opportunite>>,
    onRetour: () -> Unit,
    onOngletClub: (OngletClub) -> Unit,
    onOngletPrincipal: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
    actions: ActionsDuClub = ActionsDuClub(),
    /**
     * De quoi redemander la vue. ⛔ PAS UN CHAMP DE L'ÉTAT : une fonction dans `Etat` casserait
     * son égalité structurelle, et deux `Panne` identiques ne seraient jamais égales. `Panne`
     * dit si la reprise a un SENS ; c'est `SansDonnees` qui décide de la proposer.
     */
    reprise: (() -> Unit)? = null,
) {
    var filtre by rememberSaveable { mutableStateOf(TOUTES) }

    ClubScaffold(
        onglet = OngletClub.Opportunites,
        etat = etat,
        onRetour = onRetour,
        onOngletClub = onOngletClub,
        onOngletPrincipal = onOngletPrincipal,
        onAller = onAller,
        modifier = modifier,
        actions = actions,
        publierIci = true,
    ) {
        val offres = etat.valeurServie().orEmpty()
        val provenance = etat.provenanceOuNull()

        RangeeDeFiltres(
            valeurs = offres.map { it.type },
            actif = filtre,
            onChange = { filtre = it },
        )

        if (provenance == null) {
            SansDonnees(
                etat = etat,
                quoi = "Les missions ouvertes du Club",
                origine = "La vue « ${Vues.Noms.APP_CLUB_LISTE_OPPORTUNITES} »",
                degat = "Un budget inventé fixe une attente de revenu chez quelqu'un qui "
                    + "organise son temps dessus.",
                modifier = Modifier.padding(top = 16.dp),
                reprise = reprise,
            )
            return@ClubScaffold
        }

        val visibles = offres.filter { filtre == TOUTES || it.type == filtre }
        visibles.forEachIndexed { i, offre ->
            key(offre.id) { CarteOpportunite(offre, i, provenance, actions) }
        }

        if (visibles.isEmpty()) {
            NoteFine(
                "Aucune mission ouverte dans ce relevé du ${provenance.asOf}.",
                Modifier.padding(top = 16.dp),
            )
        }

        NoteFine(
            "Les budgets affichés sont ceux annoncés par la personne qui publie. Ils ne sont "
                + "pas vérifiés par la plateforme, et c'est écrit ici plutôt que caché.",
            Modifier.padding(top = 14.dp),
        )
    }
}

@Composable
private fun ColumnScope.CarteOpportunite(
    offre: Opportunite,
    rang: Int,
    provenance: Provenance,
    actions: ActionsDuClub,
) {
    val postuler = actions.postuler
    TerritoryCard(
        territoire = TEINTES[rang % TEINTES.size],
        modifier = Modifier.padding(top = if (rang == 0) 16.dp else 0.dp),
        pose = PoseCarte.STACK,
        premiere = rang == 0,
        meta = listOfNotNull(offre.type, offre.lieu, offre.quand).joinToString(" · "),
        titre = offre.titre,
    ) {
        Row(
            Modifier.padding(top = 14.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Bottom,
        ) {
            PriceBlock(
                montant = offre.budget?.let(::montantFcfa),
                source = Vues.Noms.APP_CLUB_LISTE_OPPORTUNITES,
                asOf = provenance.asOf,
                modifier = Modifier.weight(1f),
                /* ⚠️ PAS DE NOTE ICI. `Opportunite` n'en porte pas — seule `ClubMission` a
                   un champ `note`, écrit par le serveur. La phrase de provenance des budgets
                   est posée UNE fois, en bas de l'écran, plutôt que réécrite sous chaque
                   carte. Un budget absent rend le repli de `PriceBlock`, jamais un tiret. */
                taille = 21.sp,
            )
            /* ⛔ LE BOUTON N'EXISTE QUE SI QUELQU'UN PEUT LE RECEVOIR. Le port le rendait
               `disabled` (`club/opportunites.tsx:90`) — un contrôle mort. Aucune callable du
               contrat ne porte une candidature à ce jour. */
            if (postuler != null) {
                Button(
                    "Postuler",
                    { postuler(offre) },
                    ton = TonBouton.TRANSFORME,
                    taille = TailleBouton.SM,
                    pleineLargeur = false,
                )
            }
        }
        if (offre.par != null) {
            NoteFine("Publiée par ${offre.par}", Modifier.padding(top = 8.dp))
        }
    }
}

/**
 * La rangée de filtres, DÉRIVÉE des valeurs servies.
 *
 * Rien n'est rendu tant qu'il n'y a pas au moins deux valeurs distinctes : un filtre à une
 * seule issue ne filtre rien, et une rangée de pilules au-dessus d'une liste vide est un
 * contrôle qui a l'air vivant.
 */
@Composable
private fun ColumnScope.RangeeDeFiltres(
    valeurs: List<String>,
    actif: String,
    onChange: (String) -> Unit,
) {
    val distinctes = valeurs.distinct()
    if (distinctes.size < 2) return
    ChipRow(
        options = listOf(TOUTES) + distinctes,
        valeur = actif,
        onChange = onChange,
        modifier = Modifier.padding(top = 14.dp),
        disposition = DispositionChips.SCROLL,
    )
}
