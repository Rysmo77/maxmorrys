package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Certificats
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EmptyState
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.LocalSession
import me.maxmorrys.rysmo.ecrans.vue
import me.maxmorrys.rysmo.navigation.Certificat as DestinationCertificat

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * TES CERTIFICATS — kit `NatVide` (`ScreensNatifEtats.js:206-225`).
 *
 * ⭐ L'ÉTAT VIDE EST ÉCRIT, ET IL NE PEUT PAS S'AFFICHER SANS SA DATE. C'est tout l'écran.
 *
 * Le kit rend « Aucun certificat pour l'instant. » puis, en pied, « **0** émis depuis
 * l'ouverture de ton compte, le 12 août. Un zéro daté est une information ; un tiret n'en est
 * pas une. » La phrase a raison, et elle se retourne contre l'écran qui l'affiche sans avoir
 * compté : un « 0 » écrit alors qu'on n'a rien lu est exactement le tiret qu'elle dénonce.
 *
 * ⛔ LE PORT A LIVRÉ LES DEUX FAUTES, L'UNE APRÈS L'AUTRE :
 *   1 · l'écran ne rendait QUE son état vide, même quand la liste arrivait pleine — « Aucun
 *       certificat pour l'instant. » s'affichait juste au-dessus de « 3 émis depuis
 *       l'ouverture de ton compte ». Deux phrases contradictoires dans le même écran, et pas
 *       un certificat lisible. C'est aussi ce qui rendait `/certificat` INATTEIGNABLE : on
 *       pouvait obtenir un certificat sans jamais pouvoir l'ouvrir ;
 *   2 · le « 0 » du pied était écrit en dur, juste sous la phrase qui explique qu'un zéro
 *       qu'on n'a pas compté n'est pas une information.
 *
 * La structure ci-dessous rend les deux impossibles : le vide N'EST QU'UNE BRANCHE de la
 * réponse SERVIE, il tire son compte de la liste reçue et sa date de `ouvertureCompte`. Tant
 * que la vue n'est pas branchée, c'est `SansDonnees` qui parle — et il ne prétend rien.
 *
 * ⚠️ PAS DE BARRE D'ONGLETS. Le kit en dessine une (`active="Profil"`). Elle appartient à
 * l'enveloppe des cinq onglets, et cet écran est une destination POUSSÉE : la rendre ici
 * poserait cinq cibles qu'aucun geste ne peut suivre, faute de pouvoir naviguer.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranCertificats(
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
    session: Session = LocalSession.current,
) {
    /*
     * ⭐ ET C'EST BIEN CETTE LIGNE — ET ELLE SEULE — QUI A CHANGÉ. Le corps ci-dessous
     * traitait déjà les huit phases ; il attendait une lecture au lieu de `Etat.NonBranche`.
     */
    val lu = vue<Certificats>(Vues.Noms.APP_CERTIFICATS, session)

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Espace",
        onRetour = onRetour,
        titre = "Mes certificats",
    ) {
        Eyebrow("Ce que tu as terminé", Modifier.padding(top = 6.dp))
        Display(listOf("TES", "CERTIFICATS."), cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))

        CorpsDesCertificats(
            etat = lu.etat,
            onAller = onAller,
            modifier = Modifier.padding(top = 20.dp),
            reprise = lu.reprendre,
        )
    }
}

@Composable
private fun CorpsDesCertificats(
    etat: Etat<Certificats>,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
    reprise: (() -> Unit)? = null,
) {
    /*
     * Seule la réponse SERVIE peut affirmer quelque chose. Les sept autres phases passent par
     * `SansDonnees`, qui distingue une porte fermée d'une panne et d'une attente — ce que le
     * port aplatissait en un seul écran vide.
     *
     * ⚠️ `appCertificats` est déclarée `vueNulle: "jamais"` au contrat : le serveur ne rend
     * pas `null` sur cette vue, une liste vide arrive donc en `Servie` avec zéro élément. Le
     * vide de contenu se lit sur la LISTE, pas sur la phase.
     */
    if (etat !is Etat.Servie<Certificats>) {
        SansDonnees(
            etat = etat,
            quoi = "Tes certificats",
            origine = "La vue « ${Vues.Noms.APP_CERTIFICATS} » du serveur",
            degat = "Écrire « 0 certificat » sans avoir compté est le défaut que cet écran "
                + "dénonce dans sa propre phrase de pied : un zéro daté est une information, "
                + "un zéro supposé n'en est pas une.",
            modifier = modifier,
            hauteur = 3,
            reprise = reprise,
        )
        return
    }

    val servie = etat.valeur
    val liste = servie.certificats

    Column(modifier.fillMaxWidth()) {
        if (liste.isEmpty()) {
            Surface(Niveau.FLAT, Modifier.fillMaxWidth(), rembourrage = 6.dp) {
                EmptyState(
                    titre = "Aucun certificat pour l'instant.",
                    glyphe = "doc",
                    corps = "Le premier arrive à la fin d'une formation. Son code se vérifie "
                        + "sans compte, et il reste valable même si tu supprimes le tien.",
                )
            }
        } else {
            Surface(Niveau.FLAT, Modifier.fillMaxWidth(), rembourrage = 6.dp) {
                Column {
                    liste.forEachIndexed { i, c ->
                        LessonRow(
                            titre = c.formation,
                            glyphe = "doc",
                            meta = "${c.code} · émis le ${dateLisible(c.emisLe)}",
                            derniere = i == liste.lastIndex,
                            /*
                             * ⛔ LES CINQ CHAMPS PARTENT ENSEMBLE. L'écran du certificat les
                             * exige tous les cinq : un document au nom de quelqu'un avec le
                             * code d'un autre n'est pas un document amputé, c'est un faux.
                             */
                            onPress = {
                                onAller(
                                    DestinationCertificat(
                                        code = c.code,
                                        titulaire = c.titulaire,
                                        formation = c.formation,
                                        emisLe = c.emisLe,
                                        lecons = c.lecons,
                                    ),
                                )
                            },
                        )
                    }
                }
            }
        }

        /*
         * ⭐ LE ZÉRO EST COMPTÉ, ET IL EST DATÉ DE DEUX FAÇONS.
         *
         * `Num` refuse un nombre sans provenance — c'est le compilateur qui l'impose, pas une
         * discipline. La source est la vue, et `asOf` est l'estampille que le SERVEUR a écrite
         * (`Provenance.asOf`), jamais l'horloge du téléphone. La date d'ouverture du compte,
         * elle, vient de la même réponse : l'écran n'a pas à faire un second appel pour dater
         * son zéro, et sans elle la phrase se raccourcit au lieu d'inventer.
         */
        val ouverture = servie.ouvertureCompte
        Column(Modifier.padding(top = 16.dp).fillMaxWidth()) {
            Num(
                valeur = liste.size.toString(),
                source = Vues.Noms.APP_CERTIFICATS,
                asOf = etat.provenance.asOf,
                unite = "émis",
                taille = 15.sp,
            )
            Body(
                if (ouverture == null) {
                    "Un zéro daté est une information ; un tiret n'en est pas une — et sans " +
                        "date d'ouverture de compte, celui-ci en dit déjà moins."
                } else {
                    "depuis l'ouverture de ton compte, le ${dateLisible(ouverture)}. Un zéro " +
                        "daté est une information ; un tiret n'en est pas une."
                },
                Modifier.padding(top = 6.dp).fillMaxWidth(),
                grain = GrainCorps.CHAPO,
                couleur = jetons.textFaint,
            )
        }
    }
}
