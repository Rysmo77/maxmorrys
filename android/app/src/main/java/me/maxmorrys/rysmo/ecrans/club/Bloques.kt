package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Blocages
import me.maxmorrys.rysmo.donnees.CompteBloque
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.TailleBouton
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES COMPTES BLOQUÉS — ⛔ LE KIT NE LES DESSINE PAS NON PLUS.
 *
 * La guideline App Store 1.2 demande de pouvoir BLOQUER. Elle n'exige pas de pouvoir
 * débloquer — et c'est pourtant la moitié qui compte ici : « un geste irréversible pris dans
 * un moment d'agacement, sur une plateforme où l'on se croise professionnellement, ne se
 * répare plus » (contrat de `Blocages`).
 *
 * ⚠️ UN PROFIL DISPARU EST OMIS, JAMAIS RENDU « Membre inconnu » : le serveur ne renvoie que
 * les comptes qu'il sait nommer, parce qu'une telle ligne dans une liste de blocage empêche de
 * comprendre ce qu'on regarde. Cette liste peut donc être plus COURTE que le nombre de gestes
 * de blocage, et ce n'est pas une panne.
 *
 * ⛔ CONTRADICTION MESURÉE, NON RÉSOLUE ICI. La spécification donne à cet écran la session
 * `Auth` et le parent `Profil` (§ D). Le contrat, lui, sert `appClubBlocages` en
 * `session: obligatoire+club`, avec `vueNulle: sansAcces`. Conséquence : quelqu'un dont
 * l'abonnement a expiré ne peut plus voir NI DÉFAIRE ses blocages — l'écran lui répondra
 * « réservé aux membres ». Le geste de modération survit à l'abonnement, sa réparation non.
 * Le correctif est côté serveur ; l'écran le rend visible plutôt que muet.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * @param onDebloquer ⛔ OBLIGATOIRE. Un écran de déblocage sans de quoi débloquer est une
 *   liste, pas une réparation. `bloquerMembre` périme cinq vues : c'est à l'appelant de
 *   relire, pas à l'écran de recharger.
 */
@Composable
fun EcranClubBloques(
    onRetour: () -> Unit,
    onDebloquer: (CompteBloque) -> Unit,
    modifier: Modifier = Modifier,
    etat: Etat<Blocages> = Etat.NonBranche,
) {
    val blocages = etat.valeurServie()
    val provenance = etat.provenanceOuNull()

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Profil",
        onRetour = onRetour,
        titre = "Comptes bloqués",
    ) {
        if (etat.estSansAcces()) {
            SansDonnees(
                etat = etat,
                quoi = "Les comptes que tu as bloqués",
                origine = "La vue « ${Vues.Noms.APP_CLUB_BLOCAGES} » est réservée aux membres",
                degat = "Un blocage survit à l'abonnement, sa réparation non : tant que la "
                    + "vue exige un abonnement actif, les gestes pris pendant l'abonnement ne "
                    + "se défont plus après.",
                modifier = Modifier.padding(top = 12.dp),
            )
            return@Screen
        }

        if (blocages == null || provenance == null) {
            SansDonnees(
                etat = etat,
                quoi = "Les comptes que tu as bloqués",
                origine = "La vue « ${Vues.Noms.APP_CLUB_BLOCAGES} »",
                degat = "Une liste d'exemple ferait croire à quelqu'un qu'il a bloqué des "
                    + "gens qu'il n'a jamais croisés.",
                modifier = Modifier.padding(top = 12.dp),
            )
            return@Screen
        }

        if (blocages.comptes.isEmpty()) {
            /* ⭐ UN ZÉRO DATÉ EST UNE INFORMATION ; UN ZÉRO SANS DATE N'EN EST PAS UNE. */
            Body(
                "Tu n'as bloqué personne.",
                Modifier.padding(top = 12.dp),
                grain = GrainCorps.CHAPO,
            )
            NoteFine("Relevé le ${provenance.asOf}.", Modifier.padding(top = 6.dp))
            return@Screen
        }

        Body(
            "Tu ne vois plus leurs publications ni leurs réponses, partout dans le Club. "
                + "Débloquer les fait revenir.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        Surface(Niveau.FLAT, Modifier.padding(top = 16.dp).fillMaxWidth(), rembourrage = 16.dp) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                blocages.comptes.forEach { compte ->
                    /* ⛔ LA CLÉ EST L'IDENTIFIANT, PAS LE NOM. Deux personnes bloquées peuvent
                       porter le même nom, et `key = auteur` a déjà fait s'effondrer des lignes
                       homonymes dans ce dépôt — ici, cela ferait disparaître un blocage de la
                       liste sans le lever. */
                    key(compte.id) {
                        EnteteMembre(
                            initiales = compte.initiales,
                            nom = compte.nom,
                            meta = null,
                            modifier = Modifier.padding(vertical = 8.dp),
                            taille = 38.dp,
                            queue = {
                                Button(
                                    "Débloquer",
                                    { onDebloquer(compte) },
                                    ton = TonBouton.QUIET,
                                    taille = TailleBouton.SM,
                                    pleineLargeur = false,
                                )
                            },
                        )
                    }
                }
            }
        }

        NoteFine(
            "Relevé le ${provenance.asOf}. Un compte supprimé depuis n'apparaît pas ici : le "
                + "serveur ne rend que ceux qu'il sait nommer.",
            Modifier.padding(top = 10.dp),
        )

        Surface(Niveau.TRUTH, Modifier.padding(top = 16.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Pourquoi le déblocage existe")
                Body(
                    "Bloquer est demandé par les magasins ; débloquer ne l'est pas. Un geste "
                        + "irréversible pris dans un moment d'agacement, sur une plateforme "
                        + "où l'on se croise professionnellement, ne se répare plus.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
            }
        }
    }
}
