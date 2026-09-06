package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Club
import me.maxmorrys.rysmo.donnees.ClubFil
import me.maxmorrys.rysmo.donnees.ClubMessage
import me.maxmorrys.rysmo.donnees.ClubMission
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Provenance
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.PoseCarte
import me.maxmorrys.rysmo.ds.PriceBlock
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.TerritoireCarte
import me.maxmorrys.rysmo.ds.TerritoryCard
import me.maxmorrys.rysmo.ds.TonTag
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.OngletPrincipal
import me.maxmorrys.rysmo.navigation.ClubMembre
import me.maxmorrys.rysmo.navigation.OngletClub

/**
 * ══ 1 · LE FIL ══
 *
 * Le bilan d'abonnement en tête, permanent, puis les publications, puis la mission mise en
 * avant. Deux vues pour un écran : `appClubFil` sert le fil et la mission, `appClub` sert le
 * bilan (`ScreensNatifCompte.js:287-354`).
 *
 * ⚠️ C'EST L'ÉCRAN DU PORT QUI PORTAIT LE PLUS DE CE QU'IL FALLAIT, ET QUI MANQUAIT LE PLUS.
 * `club/fil.tsx` gardait le bilan (`:61`) mais posait une bande de DEUX liens (`:70-71`) là
 * où il en faut huit. Ici la bande vient de l'enveloppe : cet écran ne peut pas l'oublier.
 */
@Composable
fun EcranClubFil(
    etat: Etat<ClubFil>,
    etatBilan: Etat<Club>,
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
    ClubScaffold(
        onglet = OngletClub.Fil,
        etat = etat,
        onRetour = onRetour,
        onOngletClub = onOngletClub,
        onOngletPrincipal = onOngletPrincipal,
        onAller = onAller,
        modifier = modifier,
        actions = actions,
        publierIci = true,
        /*
         * ⛔ NI CLOCHE NI AVATAR DANS LA BARRE HAUTE, LÀ OÙ LE KIT EN MET DEUX
         * (`ScreensNatifCompte.js:290-292`). Aucun centre de notifications n'existe dans le
         * graphe, et l'application n'envoie aucune notification (`ecrans/Demarrage.kt`). Une
         * cloche qui n'ouvre rien est un contrôle mort de plus, au même endroit que celui que
         * le port avait déjà.
         */
    ) {
        BilanAbonnement(etatBilan)

        when (etat) {
            is Etat.Servie -> ContenuDuFil(etat.valeur, etat.provenance, onAller)
            is Etat.Replique -> ContenuDuFil(etat.valeur, etat.provenance, onAller)
            else -> SansDonnees(
                etat = etat,
                quoi = "Le fil du Club",
                origine = "Les vues « ${Vues.Noms.APP_CLUB_FIL} » et « ${Vues.Noms.APP_CLUB} »",
                degat = "Un fil d'exemple mettrait dans la bouche de membres réels des mots "
                    + "qu'ils n'ont pas écrits.",
                modifier = Modifier.padding(top = 14.dp),
                reprise = reprise,
            )
        }
    }
}

/**
 * LE BILAN D'ABONNEMENT — carte d'encre OPAQUE sur une page claire.
 *
 * ⛔ `Surface(INK)` OUVRE UNE PORTÉE NUIT, ce n'est pas un fond foncé. Sans elle, chaque texte
 * à l'intérieur serait un gris écrit à la main sur un aplat sombre.
 *
 * ⚠️ IL N'EST RENDU QUE SERVI. Le kit le décrit « permanent » ; un bilan d'abonnement dont les
 * trois nombres manquent ne dit rien de plus que le vide qui suit, et une carte nuit portant
 * trois « non relevé » ferait passer une attente pour une réponse.
 */
@Composable
private fun ColumnScope.BilanAbonnement(etat: Etat<Club>) {
    if (etat !is Etat.Servie) return
    val club: Club = etat.valeur
    val asOf = etat.provenance.asOf
    Surface(Niveau.INK, Modifier.padding(top = 8.dp).fillMaxWidth(), rembourrage = 18.dp) {
        Column {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Column(Modifier.weight(1f)) {
                    Eyebrow(
                        if (club.depuis != null) {
                            "Ton abonnement, depuis ${club.depuis}"
                        } else {
                            "Ton abonnement"
                        },
                    )
                    TitreLigne("Ce qu'il t'a apporté", Modifier.padding(top = 5.dp), 19.sp)
                }
                Tag("Actif", TonTag.OK)
            }
            Row(
                Modifier.padding(top = 15.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                /* ⛔ LA CLÉ EST LE LIBELLÉ, PAS LA POSITION — et surtout jamais l'auteur d'une
                   ligne : `key = auteur` a déjà fait s'effondrer les publications d'auteurs
                   homonymes dans ce dépôt. Ici le libellé EST l'identité de la tuile. */
                club.bilan.forEach { tuile ->
                    key(tuile.l) {
                        Column(Modifier.weight(1f)) {
                            Num(
                                tuile.n.toString(),
                                source = Vues.Noms.APP_CLUB,
                                asOf = asOf,
                                taille = 23.sp,
                            )
                            Body(tuile.l, Modifier.padding(top = 2.dp), attenue = true)
                        }
                    }
                }
            }
            /* Le filet. `borderHair` est lu DANS la portée nuit ouverte par `Surface(INK)` :
               le lire dehors donnerait un filet noir sur une carte sombre. */
            Box(
                Modifier
                    .padding(vertical = 14.dp)
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(jetons.borderHair),
            )
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Body("Échéance", attenue = true)
                /*
                 * ⚠️ « RIEN N'EST PRÉLEVÉ » EST UN FAIT DE L'OFFRE, PAS UNE DÉCORATION :
                 * l'abonnement est facturé une fois pour douze mois, il ne se reconduit pas
                 * tout seul. Le kit l'accole à l'échéance parce qu'une date d'échéance seule
                 * se lit comme une date de prélèvement.
                 */
                Num(
                    club.echeance,
                    source = Vues.Noms.APP_CLUB,
                    asOf = asOf,
                    taille = 12.5.sp,
                    repli = "échéance non relevée",
                )
            }
            NoteFine("Rien n'est prélevé à cette date.", Modifier.padding(top = 4.dp))
        }
    }
}

@Composable
private fun ColumnScope.ContenuDuFil(
    fil: ClubFil,
    provenance: Provenance,
    onAller: (Any) -> Unit,
) {
    if (fil.fil.isEmpty()) {
        NoteFine(
            "Aucune publication dans ce relevé du ${provenance.asOf}. Le fil se remplit "
                + "quand quelqu'un écrit, pas quand une page se recharge.",
            Modifier.padding(top = 14.dp),
        )
    }

    fil.fil.forEach { message ->
        /* ⛔ LA CLÉ EST L'IDENTIFIANT, JAMAIS L'AUTEUR. `key = auteur` a déjà fait
           s'effondrer les publications d'auteurs homonymes dans ce dépôt : deux membres du
           même prénom voyaient leurs messages fusionner en un seul. */
        key(message.id) { Publication(message, provenance, onAller) }
    }

    fil.mission?.let { mission -> CarteMission(mission, provenance) }
}

@Composable
private fun Publication(
    message: ClubMessage,
    provenance: Provenance,
    onAller: (Any) -> Unit,
) {
    Surface(Niveau.FLAT, Modifier.padding(top = 14.dp).fillMaxWidth(), rembourrage = 18.dp) {
        Column {
            EnteteMembre(
                initiales = message.initiales,
                nom = message.auteur,
                meta = listOfNotNull(message.categorie, message.quand).joinToString(" · "),
                /*
                 * ⛔ LA SEULE PORTE DU SIGNALEMENT (App Store 1.2). Depuis le fil on ne
                 * connaît QUE l'identifiant du message : `ClubMessage` ne porte pas d'uid, et
                 * c'est délibéré — « l'uid ne circule pas depuis une liste ». La fiche se
                 * résout donc par `messageId`, et le serveur remonte à l'auteur.
                 */
                onPress = { onAller(ClubMembre(messageId = message.id)) },
                queue = { Tag(message.categorie) },
            )
            Body(message.texte, Modifier.padding(top = 12.dp))
            Row(
                Modifier.padding(top = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(18.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CompteurReaction("heart", message.aime, Vues.Noms.APP_CLUB_FIL, provenance.asOf, "J'aime")
                CompteurReaction("repeat", message.republie, Vues.Noms.APP_CLUB_FIL, provenance.asOf, "Republications")
                CompteurReaction("comment", message.commente, Vues.Noms.APP_CLUB_FIL, provenance.asOf, "Réponses")
            }
            /*
             * ⚠️ LES TROIS COMPTEURS SE LISENT, ILS NE SE TOUCHENT PAS. Aucune callable du
             * contrat ne pose ni ne retire une réaction : `posterAuClub` écrit un message,
             * et c'est tout ce que le Club sait écrire. Les rendre pressables donnerait trois
             * contrôles morts par publication — le défaut que le port avait dix-huit fois.
             */
        }
    }
}

/**
 * LA MISSION MISE EN AVANT, ET LE BOUTON QU'ELLE NE PEUT PAS PORTER.
 *
 * ⛔ « POSTULER » N'EXISTE PAS ICI, ET CE N'EST PAS UN OUBLI. `ClubMission` porte `meta`,
 * `titre`, `budget` et `note` — AUCUN IDENTIFIANT. Même si une callable de candidature
 * existait (elle n'existe pas), aucune valeur de cet objet ne permettrait de désigner la
 * mission à laquelle on postule. Le kit dessine le bouton (`ScreensNatifCompte.js:349`), le
 * port le rendait `disabled` ; ici il est ABSENT, et le manque est écrit.
 */
@Composable
private fun ColumnScope.CarteMission(mission: ClubMission, provenance: Provenance) {
    TerritoryCard(
        territoire = TerritoireCarte.TRANSFORME,
        modifier = Modifier.padding(top = 22.dp),
        pose = PoseCarte.STACK,
        premiere = true,
        meta = mission.meta,
        titre = mission.titre,
    ) {
        PriceBlock(
            montant = mission.budget?.let(::montantFcfa),
            source = Vues.Noms.APP_CLUB_FIL,
            asOf = provenance.asOf,
            modifier = Modifier.padding(top = 14.dp),
            /* ⛔ LA NOTE VIENT DU SERVEUR, L'ÉCRAN NE LA RÉÉCRIT PAS. C'est une constante de
               `ClubMission.note` — « Budget annoncé par la personne qui publie ». */
            note = mission.note,
            taille = 21.sp,
        )
    }
    NoteFine(
        "Aucune callable du contrat ne porte une candidature : le bouton « Postuler » du kit "
            + "n'a pas de destination, et cette mission n'a pas d'identifiant pour la viser.",
        Modifier.padding(top = 10.dp),
    )
}
