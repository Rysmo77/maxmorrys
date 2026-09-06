package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Classement
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Avatar
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.ChipRow
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Metrique
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.StatTile
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.fondDegrade
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.OngletPrincipal
import me.maxmorrys.rysmo.navigation.OngletClub

/**
 * ══ 5 · CLASSEMENT ══
 *
 * Ta vague d'arrivée, pas un palmarès. « Un classement absolu flatte les premiers et fait
 * décrocher les derniers » — et la règle est appliquée AU SERVEUR, pas devinée ici : le
 * contrat écrit que le classement est par vague, jamais absolu.
 *
 * ⚠️ UN RANG ABSENT N'EST PAS UN RANG ZÉRO. `Classement.rang` est nullable quand la personne
 * ne figure pas dans sa propre vague ; l'écran le DIT au lieu d'écrire « 0ᵉ ».
 */
@Composable
fun EcranClubClassement(
    etat: Etat<Classement>,
    onRetour: () -> Unit,
    onOngletClub: (OngletClub) -> Unit,
    onOngletPrincipal: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
    /**
     * De quoi redemander la vue. ⛔ PAS UN CHAMP DE L'ÉTAT : une fonction dans `Etat` casserait
     * son égalité structurelle, et deux `Panne` identiques ne seraient jamais égales. `Panne`
     * dit si la reprise a un SENS ; c'est `SansDonnees` qui décide de la proposer.
     */
    reprise: (() -> Unit)? = null,
) {
    var vue by rememberSaveable { mutableStateOf(VUE_COHORTE) }

    ClubScaffold(
        onglet = OngletClub.Classement,
        etat = etat,
        onRetour = onRetour,
        onOngletClub = onOngletClub,
        onOngletPrincipal = onOngletPrincipal,
        onAller = onAller,
        modifier = modifier,
    ) {
        val classement = etat.valeurServie()
        val provenance = etat.provenanceOuNull()

        if (classement == null || provenance == null) {
            SansDonnees(
                etat = etat,
                quoi = "Ta place dans ta vague",
                origine = "La vue « ${Vues.Noms.APP_CLUB_CLASSEMENT} »",
                degat = "Un rang inventé se compare à des personnes réelles : il dirait à "
                    + "quelqu'un qu'il est quatrième de gens qui n'ont rien fait de tel.",
                modifier = Modifier.padding(top = 16.dp),
                reprise = reprise,
            )
            return@ClubScaffold
        }

        ChipRow(
            options = listOf(VUE_COHORTE, VUE_PROGRESSION),
            valeur = vue,
            onChange = { vue = it },
            modifier = Modifier.padding(top = 14.dp),
        )

        CarteDeRang(classement, provenance.asOf)

        if (vue == VUE_COHORTE) {
            Eyebrow("Ta vague", Modifier.padding(top = 20.dp))
            Surface(
                Niveau.FLAT,
                Modifier.padding(top = 10.dp).fillMaxWidth(),
                rembourrage = 16.dp,
            ) {
                Column {
                    classement.lignes.forEach { ligne ->
                        /* ⛔ LA CLÉ EST LE RANG, PAS LE NOM. Le contrat rend « Toi » à la
                           place de son propre nom, et deux membres peuvent porter le même
                           prénom : `key = auteur` a déjà fait s'effondrer des lignes
                           homonymes dans ce dépôt. Le rang, lui, est unique par construction
                           dans une vague. */
                        key(ligne.rang) {
                            LigneDeClassement(
                                rang = ligne.rang,
                                nom = ligne.nom,
                                initiales = ligne.initiales,
                                points = ligne.points,
                                moi = ligne.moi,
                                asOf = provenance.asOf,
                            )
                        }
                    }
                }
            }
            NoteFine(
                "Les dix premiers de ta vague, relevés le ${provenance.asOf}.",
                Modifier.padding(top = 10.dp),
            )
        } else {
            /*
             * ⚠️ « MA PROGRESSION » NE TE COMPARE QU'À TOI-MÊME, et c'est ce que le contrat
             * porte : `points` est ton total, `semaine` ce que tu as gagné depuis lundi. Il
             * n'y a pas d'historique dans la vue — une courbe demanderait des semaines
             * passées que le serveur ne rend pas, et l'inventer dessinerait une pente.
             */
            Row(
                Modifier.padding(top = 14.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                StatTile(
                    "Tes points",
                    classement.points.toString(),
                    Vues.Noms.APP_CLUB_CLASSEMENT,
                    provenance.asOf,
                    Modifier.weight(1f),
                )
                StatTile(
                    "Cette semaine",
                    classement.semaine.toString(),
                    Vues.Noms.APP_CLUB_CLASSEMENT,
                    provenance.asOf,
                    Modifier.weight(1f),
                    pied = "depuis lundi",
                )
            }
            NoteFine(
                "Aucune semaine passée n'est servie par la vue : il n'y a donc pas de "
                    + "courbe, et pas de pente dessinée à partir de deux nombres.",
                Modifier.padding(top = 10.dp),
            )
        }

        Surface(Niveau.TRUTH, Modifier.padding(top = 16.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Pourquoi ce n'est pas un classement général")
                Body(
                    "Un classement absolu mesurerait l'ancienneté : quelqu'un qui arrive en "
                        + "novembre ne rattraperait jamais quelqu'un arrivé en février. "
                        + "Celui-ci te compare à ta vague d'arrivée, et « $VUE_PROGRESSION » "
                        + "ne te compare qu'à toi-même.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
            }
        }
    }
}

private const val VUE_COHORTE = "Ma cohorte"
private const val VUE_PROGRESSION = "Ma progression"

/**
 * LA CARTE DE RANG — un dégradé PLEIN, pas du verre.
 *
 * ⚠️ SON ENCRE EST `paperFixed`, PAS `textBody`. Le dégradé de territoire ne bascule pas avec
 * le mode : y écrire l'encre de page donnerait du noir sur violet la nuit. C'est la même règle
 * que celle qui sépare `cardInk` d'`ink` sur les cartes de territoire.
 */
@Composable
private fun ColumnScope.CarteDeRang(classement: Classement, asOf: String) {
    val p = jetons
    Box(
        Modifier
            .padding(top = 16.dp)
            .fillMaxWidth()
            .fondDegrade(p.actionTransforme, RoundedCornerShape(Metrique.rXl))
            .padding(22.dp),
    ) {
        Column {
            Eyebrow(
                "${classement.vague} · ${classement.surCombien} membres",
                couleur = p.paperFixed,
            )
            Display(
                texte = if (classement.rang != null) {
                    "Tu es ${classement.rang}e de ta vague"
                } else {
                    "Tu ne figures pas encore dans ta vague"
                },
                modifier = Modifier.padding(top = 7.dp),
                cran = CranDisplay.XS,
                couleur = p.paperFixed,
            )
            Body(
                if (classement.rang != null) {
                    "Comparé aux gens arrivés en même temps que toi. Pas à ceux qui ont " +
                        "deux ans d'avance."
                } else {
                    "Un rang absent n'est pas un rang zéro : le serveur ne t'a pas " +
                        "trouvée dans les lignes de ta vague à ce relevé du $asOf."
                },
                Modifier.padding(top = 9.dp),
                couleur = p.paperFixed,
            )
        }
    }
}

@Composable
private fun LigneDeClassement(
    rang: Int,
    nom: String,
    initiales: String,
    points: Int,
    moi: Boolean,
    asOf: String,
) {
    val p = jetons
    Row(
        Modifier
            .fillMaxWidth()
            .then(
                /* La ligne « Toi » est TEINTÉE, pas mise en gras : c'est celle que l'œil
                   cherche, et le gras la mettrait en compétition avec les trois premiers. */
                if (moi) {
                    Modifier
                        .padding(vertical = 4.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(p.surfaceQuiet)
                        .padding(horizontal = 12.dp, vertical = 9.dp)
                } else {
                    Modifier.padding(vertical = 13.dp)
                },
            ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Num(
            rang.toString(),
            source = Vues.Noms.APP_CLUB_CLASSEMENT,
            asOf = asOf,
            modifier = Modifier.width(16.dp),
            taille = 13.sp,
            couleur = p.textFaint,
        )
        Column(Modifier.weight(1f)) { TitreLigne(nom, taille = 14.sp) }
        /* ⚠️ SUR SA PROPRE LIGNE, LES INITIALES SONT UNE CHAÎNE VIDE — pas `null`. Le contrat
           le dit : l'écran n'a pas d'initiales à dessiner à côté de « Toi ». */
        if (initiales.isNotEmpty()) Avatar(initiales, taille = 30.dp)
        Num(
            points.toString(),
            source = Vues.Noms.APP_CLUB_CLASSEMENT,
            asOf = asOf,
            taille = 13.sp,
        )
    }
}
