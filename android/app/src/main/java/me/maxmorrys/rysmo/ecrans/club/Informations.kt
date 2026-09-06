package me.maxmorrys.rysmo.ecrans.club

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Parrainage
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CheckLine
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.StatTile
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.TailleBouton
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.TonCoche
import me.maxmorrys.rysmo.ecrans.OngletPrincipal
import me.maxmorrys.rysmo.navigation.OngletClub

/**
 * ══ 7 · INFORMATIONS ══ — LE DIGEST HEBDOMADAIRE.
 *
 * ⛔ DEUX ÉCRANS DIFFÉRENTS ONT PORTÉ CE NOM D'ONGLET, ET AUCUN N'EXISTE ICI.
 *
 * Le kit dessine le digest (`ScreensNatifClub.js:282-333`) : trois sections dont « Ce que je
 * n'ai pas fait », quatre cases de relevé datées, les digests précédents. Le port React Native
 * a mis autre chose sous ce nom — `club/infos.tsx:33-34` rendait « Ce que l'abonnement te
 * donne » et ses tables d'engagement. Deux écrans, un seul nom d'onglet.
 *
 * Et le contrat de données ne sert NI L'UN NI L'AUTRE : aucune vue ne rend un digest, ses
 * sections, ses mesures ou ses éditions passées. L'onglet existe, porte la bande, et dit ce
 * qui manque.
 *
 * ⛔ LES DEUX PHRASES DE CANAL DU KIT SONT PÉRIMÉES, ET NE SONT PAS REPRISES.
 *   · « en notification sur ce téléphone — le seul canal que le site n'avait pas » : aucune
 *     notification n'est envoyée, la permission n'est même pas déclarée au manifeste, et le
 *     dispositif est explicitement différé (`deferred-work.md`).
 *   · « Pas par e-mail : la plateforme n'a aucun canal d'envoi » : elle en a un depuis le
 *     03/09/2026 — `worker/apps/api/src/lib/email.ts`, `brevo-send.ts`, `unsubscribe.ts`.
 * Les recopier promettrait un canal qui n'existe pas et en nierait un qui existe.
 */
@Composable
fun EcranClubInformations(
    onRetour: () -> Unit,
    onOngletClub: (OngletClub) -> Unit,
    onOngletPrincipal: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    ClubScaffold(
        onglet = OngletClub.Informations,
        etat = Etat.NonBranche,
        onRetour = onRetour,
        onOngletClub = onOngletClub,
        onOngletPrincipal = onOngletPrincipal,
        onAller = onAller,
        modifier = modifier,
    ) {
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Le digest de la semaine",
            origine = "Aucune vue du contrat ne sert un digest, ses mesures ni ses éditions "
                + "passées",
            degat = "Un digest d'exemple raconterait une semaine qui n'a pas eu lieu — y "
                + "compris sa section « ce que je n'ai pas fait », qui est précisément celle "
                + "qui ne se fabrique pas.",
            modifier = Modifier.padding(top = 16.dp),
        )

        Surface(Niveau.TRUTH, Modifier.padding(top = 16.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Où arrivera ce digest")
                Body(
                    "Ici, dans le Club. L'application n'envoie aucune notification à ce jour "
                        + "— la permission n'est pas demandée, et elle ne le sera pas tant "
                        + "que rien ne poussera d'envoi.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
                NoteFine(
                    "Le kit annonce ici une notification poussée et l'absence de tout canal "
                        + "e-mail. Les deux phrases sont périmées en sens contraire : rien ne "
                        + "pousse, et le serveur sait envoyer un e-mail depuis le 03/09/2026.",
                    Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

/**
 * ══ 8 · PARRAINAGE ══
 *
 * ⭐ LE SEUL ONGLET DONT L'APPLICATION CHANGE VRAIMENT LE GESTE : la feuille de partage
 * SYSTÈME. Le web copiait dans le presse-papier et espérait que la personne trouve WhatsApp.
 *
 * ⚠️ COPIER ET PARTAGER SONT BRANCHÉS POUR DE BON, ET SANS SERVEUR. Ils n'ont besoin que du
 * code et du lien, que la vue porte déjà. Ce sont les deux seuls gestes de tout ce lot qui
 * fonctionnent aujourd'hui de bout en bout — les autres attendent un producteur de jeton
 * d'identité, pas une implémentation.
 */
@Composable
fun EcranClubParrainage(
    etat: Etat<Parrainage>,
    onRetour: () -> Unit,
    onOngletClub: (OngletClub) -> Unit,
    onOngletPrincipal: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    ClubScaffold(
        onglet = OngletClub.Parrainage,
        etat = etat,
        onRetour = onRetour,
        onOngletClub = onOngletClub,
        onOngletPrincipal = onOngletPrincipal,
        onAller = onAller,
        modifier = modifier,
    ) {
        val parrainage = etat.valeurServie()
        val provenance = etat.provenanceOuNull()

        Body(
            "Ton code fait baisser le prix du Club de "
                + "${TermesDuClub.REMISE_FILLEUL_PCT} % pour la personne que tu parraines. "
                + "La remise est calculée côté serveur : elle ne dépend pas du lien sur "
                + "lequel elle a cliqué.",
            Modifier.padding(top = 18.dp),
            grain = GrainCorps.CHAPO,
        )

        if (parrainage == null || provenance == null) {
            SansDonnees(
                etat = etat,
                quoi = "Ton code de parrainage",
                origine = "La vue « ${Vues.Noms.APP_CLUB_PARRAINAGE} »",
                degat = "Un code inventé serait partagé à de vraies personnes, qui ne "
                    + "toucheraient aucune remise en s'inscrivant avec.",
                modifier = Modifier.padding(top = 18.dp),
            )
            return@ClubScaffold
        }

        BlocDuCode(parrainage, provenance.asOf)

        Row(
            Modifier.padding(top = 12.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            StatTile(
                "Inscrits",
                parrainage.filleuls.toString(),
                Vues.Noms.APP_CLUB_PARRAINAGE,
                provenance.asOf,
                Modifier.weight(1f),
                pied = if (parrainage.filleuls == 0) "aucun, pour l'instant" else null,
            )
        }
        /* ⚠️ UNE SEULE CASE, LÀ OÙ LE KIT EN POSE DEUX. Sa case « Partages » compterait les
           fois où le code a été partagé ; `Parrainage` porte `code`, `lien` et `filleuls`, et
           rien d'autre. Compter les partages côté téléphone ne compterait que CE téléphone. */
        NoteFine(
            "Le kit affiche aussi un compteur de partages. Rien ne le sert, et le compter "
                + "sur cet appareil ne compterait que cet appareil.",
            Modifier.padding(top = 8.dp),
        )

        Eyebrow("Ce que ton code donne, précisément", Modifier.padding(top = 22.dp))
        Surface(Niveau.CHROME, Modifier.padding(top = 10.dp).fillMaxWidth(), rembourrage = 18.dp) {
            Column {
                CheckLine {
                    Body("${TermesDuClub.REMISE_FILLEUL_PCT} % de remise, au filleul")
                }
                CheckLine {
                    Body("Son prix baisse d'autant, sur le site, pour douze mois")
                }
                /* Le tiret, pas la coche : ce n'est pas un avantage, c'est une absence. */
                CheckLine(ton = TonCoche.NEUTRE, tiret = true) {
                    Body("Aucune commission pour toi, jamais")
                }
                NoteFine(
                    "Termes annoncés, révisés le ${TermesDuClub.REVISE_LE} — pas un relevé.",
                    Modifier.padding(top = 10.dp),
                )
            }
        }

        Surface(Niveau.TRUTH, Modifier.padding(top = 16.dp).fillMaxWidth()) {
            Column {
                Eyebrow("Ce que tu gagnes, toi")
                Body(
                    "Rien en argent, et je ne vais pas te faire croire le contraire. La "
                        + "remise va au filleul. Ce que tu gagnes, c'est quelqu'un de plus "
                        + "dans le Club avec qui avancer.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
            }
        }
    }
}

@Composable
private fun ColumnScope.BlocDuCode(parrainage: Parrainage, asOf: String) {
    val contexte = LocalContext.current
    Surface(Niveau.HERO, Modifier.padding(top = 18.dp).fillMaxWidth(), rembourrage = 21.dp) {
        Column {
            Eyebrow("Ton code")
            /*
             * ⚠️ LE CODE PASSE PAR `Num`, ET IL EN A LE DROIT. La règle est qu'un caractère en
             * monospace vient de la base ou d'une source citée : celui-ci vient de
             * `appClubParrainage`, qui le CRÉE à la première lecture — une écriture dans une
             * vue, délibérée, pour que les deux plateformes délivrent le même code à la même
             * personne.
             */
            Num(
                parrainage.code,
                source = Vues.Noms.APP_CLUB_PARRAINAGE,
                asOf = asOf,
                modifier = Modifier.padding(top = 6.dp),
                taille = 30.sp,
            )
            Row(
                Modifier.padding(top = 15.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(
                    "Copier",
                    { copierLeCode(contexte, parrainage.code) },
                    modifier = Modifier.weight(1f),
                    ton = TonBouton.TRANSFORME,
                    taille = TailleBouton.SM,
                    pleineLargeur = false,
                )
                Button(
                    "Partager",
                    { partagerLeCode(contexte, parrainage.code, parrainage.lien) },
                    modifier = Modifier.weight(1f),
                    ton = TonBouton.GHOST,
                    taille = TailleBouton.SM,
                    glypheTete = "send",
                    pleineLargeur = false,
                )
            }
            NoteFine(
                "« Partager » ouvre la feuille de partage d'Android : WhatsApp, message, ce "
                    + "que tu veux. Le site ne pouvait que copier le code.",
                Modifier.padding(top = 11.dp),
            )
        }
    }
}

private fun copierLeCode(contexte: Context, code: String) {
    val presse = contexte.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
    presse?.setPrimaryClip(ClipData.newPlainText("Code de parrainage Rysmo", code))
}

/**
 * ⚠️ LE LIEN EST COMPOSÉ AU SERVEUR, ET C'EST TOUT LE POINT. `Parrainage.lien` existe pour
 * qu'un changement de domaine ne laisse pas une version installée partager des liens morts
 * pendant des mois. Le recomposer ici à partir du code annulerait exactement cette garantie.
 */
private fun partagerLeCode(contexte: Context, code: String, lien: String) {
    val envoi = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, "$code\n$lien")
    }
    contexte.startActivity(Intent.createChooser(envoi, "Partager ton code"))
}
