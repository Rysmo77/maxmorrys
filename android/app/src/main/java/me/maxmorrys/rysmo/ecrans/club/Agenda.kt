package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
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
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Seance
import me.maxmorrys.rysmo.donnees.SeanceTerritoire
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Segmented
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.TailleBouton
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.TonTag
import me.maxmorrys.rysmo.ds.fondDegrade
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.OngletPrincipal
import me.maxmorrys.rysmo.navigation.OngletClub

/**
 * ══ 4 · AGENDA ══
 *
 * ⛔ « AJOUTER À MON AGENDA » N'EST PAS RENDU, ET C'EST LE CONSTAT DE CET ÉCRAN.
 *
 * Le kit en fait la SEULE action que le portage natif GAGNE (`ScreensNatifCompte.js:399-401`)
 * : une session posée dans l'agenda système survit à la désinstallation de l'application et ne
 * dépend d'aucune permission de notification. Le port React Native, lui, ouvrait une `Alert`
 * (`club/agenda.tsx:82`) — un contrôle mort déguisé en fonction.
 *
 * Ici il est absent, pour une raison qui n'est pas d'implémentation : `Seance.jour` et
 * `Seance.horaire` arrivent DÉJÀ MIS EN FORME (« Mardi 9 septembre », « 20:00 → 21:00 ») et le
 * contrat ne porte aucun horodatage machine. Un `Intent` d'agenda exige un début et une fin en
 * millisecondes ; les reconstituer en analysant du français reviendrait à deviner l'année, le
 * fuseau et la durée. Il manque un champ au contrat, pas un bouton à cet écran.
 */
@Composable
fun EcranClubAgenda(
    etat: Etat<List<Seance>>,
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
    var vue by rememberSaveable { mutableStateOf(VUE_A_VENIR) }

    ClubScaffold(
        onglet = OngletClub.Agenda,
        etat = etat,
        onRetour = onRetour,
        onOngletClub = onOngletClub,
        onOngletPrincipal = onOngletPrincipal,
        onAller = onAller,
        modifier = modifier,
        actions = actions,
    ) {
        val seances = etat.valeurServie().orEmpty()
        val provenance = etat.provenanceOuNull()

        /*
         * ⛔ DEUX SEGMENTS, LÀ OÙ LE KIT EN POSE TROIS. « Passées » demande de savoir si une
         * séance a eu lieu ; `Seance` ne porte aucune date machine, seulement le libellé
         * français que le serveur a composé, et le serveur ne rend que ce qu'il a trié. Un
         * troisième segment qui rendrait la même liste serait un contrôle mort — celui que le
         * port avait, son `Segmented` n'étant branché sur aucun filtrage.
         */
        if (seances.any { it.inscrite }) {
            Segmented(
                options = listOf(VUE_A_VENIR, VUE_MES_INSCRIPTIONS),
                valeur = vue,
                onChange = { vue = it },
                modifier = Modifier.padding(top = 14.dp),
            )
        }

        if (provenance == null) {
            SansDonnees(
                etat = etat,
                quoi = "L'agenda du Club",
                origine = "La vue « ${Vues.Noms.APP_CLUB_AGENDA} »",
                degat = "Une session inventée ferait déplacer quelqu'un, un samedi, à Dakar.",
                modifier = Modifier.padding(top = 16.dp),
                reprise = reprise,
            )
            return@ClubScaffold
        }

        val visibles = if (vue == VUE_MES_INSCRIPTIONS) seances.filter { it.inscrite } else seances
        var jourPose: String? = null
        visibles.forEach { seance ->
            /* ⛔ LA CLÉ EST L'IDENTIFIANT DE LA SÉANCE. Deux ateliers peuvent porter le même
               titre à deux mois d'écart ; deux directs peuvent tomber le même jour. */
            key(seance.id) {
                if (seance.jour != null && seance.jour != jourPose) {
                    Eyebrow(seance.jour, Modifier.padding(top = 22.dp))
                }
                CarteSeance(seance, provenance.asOf, actions)
            }
            if (seance.jour != null) jourPose = seance.jour
        }

        if (visibles.isEmpty()) {
            NoteFine(
                if (seances.isEmpty()) {
                    "Aucune séance dans ce relevé du ${provenance.asOf}. L'agenda est " +
                        "publié un mois à l'avance ; un mois sans séance annoncée est un " +
                        "mois sans séance."
                } else {
                    "Tu n'es inscrite à aucune séance dans ce relevé du ${provenance.asOf}."
                },
                Modifier.padding(top = 16.dp),
            )
        }

        Surface(Niveau.TRUTH, Modifier.padding(top = 18.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Ce que l'agenda système apporterait")
                Body(
                    "Une session posée dans ton agenda survit à la désinstallation de "
                        + "l'application et ne dépend d'aucune permission de notification. "
                        + "C'est le meilleur rappel possible, et il ne coûte rien.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
                NoteFine(
                    "Le bouton n'est pas là : le serveur envoie le jour et l'horaire déjà "
                        + "écrits en français, sans horodatage. Aucun événement d'agenda ne "
                        + "se construit sur du texte.",
                    Modifier.padding(top = 8.dp),
                )
                Body(
                    "Te réinscrire ne crée pas de doublon, et personne ne peut t'inscrire à "
                        + "ta place.",
                    Modifier.padding(top = 10.dp),
                    attenue = true,
                )
            }
        }
    }
}

private const val VUE_A_VENIR = "À venir"
private const val VUE_MES_INSCRIPTIONS = "Mes inscriptions"

@Composable
private fun ColumnScope.CarteSeance(
    seance: Seance,
    asOf: String,
    actions: ActionsDuClub,
) {
    val p = jetons
    val reserver = actions.reserver
    /* ⚠️ `INCONNU` N'EST PAS UN CAS D'ERREUR : c'est le repli que le contrat pose pour qu'une
       valeur ajoutée côté serveur ne fasse pas tomber une version déjà installée. Une séance
       de territoire inconnu se peint donc du territoire de la formation, et son glyphe est
       celui d'un agenda — jamais rien, jamais un carré vide. */
    val degrade = when (seance.territoire) {
        SeanceTerritoire.DIGITALISE -> p.actionDigitalise
        SeanceTerritoire.TRANSFORME -> p.actionTransforme
        SeanceTerritoire.INCONNU -> p.actionForme
    }
    val glyphe = seance.glyphe.jeton.ifEmpty { "calendar" }

    Surface(Niveau.FLAT, Modifier.padding(top = 10.dp).fillMaxWidth(), rembourrage = 18.dp) {
        Column {
            Row(horizontalArrangement = Arrangement.spacedBy(13.dp)) {
                Box(
                    Modifier.size(44.dp).fondDegrade(degrade, RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(glyphe, description = null, taille = 20.dp, couleur = p.paperFixed)
                }
                Column(Modifier.weight(1f)) {
                    TitreLigne(seance.titre)
                    if (seance.horaire != null) {
                        Num(
                            seance.horaire,
                            source = Vues.Noms.APP_CLUB_AGENDA,
                            asOf = asOf,
                            modifier = Modifier.padding(top = 3.dp),
                            taille = 11.5.sp,
                        )
                    }
                }
            }
            Row(
                Modifier.padding(top = 14.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (seance.inscrite) {
                    Tag("Tu es inscrite", TonTag.OK)
                } else if (seance.places != null) {
                    /* « 8 / 12 places », ou RIEN : le contrat rend les deux nombres ou aucun,
                       parce qu'une jauge à moitié relevée décide à la place de quelqu'un. */
                    Num(
                        seance.places,
                        source = Vues.Noms.APP_CLUB_AGENDA,
                        asOf = asOf,
                        taille = 12.5.sp,
                    )
                }
                Spacer(Modifier.weight(1f))
                /* ⛔ LE BOUTON N'EXISTE QUE SI QUELQU'UN PEUT LE RECEVOIR. `reserverSession`
                   est au contrat et l'identité est branchée depuis le 06/09 ; ce qui manque
                   est le chemin d'ÉCRITURE, et l'appelant qui relira `appClubAgenda` après —
                   la réservation la périme. Un bouton `disabled` serait le défaut mesuré du
                   port ; ici il n'est pas rendu tant que `actions.reserver` est nul. */
                if (reserver != null) {
                    Button(
                        if (seance.inscrite) "Me désinscrire" else "Je réserve",
                        { reserver(seance, !seance.inscrite) },
                        ton = if (seance.inscrite) TonBouton.QUIET else TonBouton.TRANSFORME,
                        taille = TailleBouton.SM,
                        pleineLargeur = false,
                    )
                }
            }
        }
    }
}
