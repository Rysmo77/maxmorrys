package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Provenance
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.fondDegrade
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.navigation.OngletClub
import me.maxmorrys.rysmo.navigation.Media as DestinationMedia

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN VERROUILLÉ DU CLUB — UN CORPS, HUIT CONTENUS.
 *
 * ⛔ IL N'A JAMAIS ÉTÉ PORTÉ. Le kit y met 76 lignes (`ScreensNatifClub.js:534-609`) : les
 * compteurs réels de ce qu'il y a derrière, un élément COMPLET non flouté, le prix cadré des
 * deux façons, un bouton qui n'achète pas, et une bande d'onglets qui reste cliquable. Aucun
 * fichier de `mobile/app/` ne rendait cela ; le port avait substitué un hub ouvert
 * (`(tabs)/club.tsx:33-46`) puis, écran par écran, un état vide générique.
 *
 * ⚠️ CE N'EST PAS LE MUR D'ABONNEMENT. Le mur (`NatClubMur`) s'adresse à un visiteur du site.
 * Celui-ci s'adresse à quelqu'un qui a déjà un compte, qui est DANS l'application, et qui
 * vient de toucher un onglet précis. On sait donc QUEL onglet elle voulait — c'est la seule
 * information qu'on ait en plus, et l'écran est construit autour d'elle.
 *
 * ── ⛔ DEUX ÉCARTS AU KIT, ET AUCUN N'EST UN OUBLI ─────────────────────────────────────
 *
 * 1 · LE BLOC DE PRIX ET LE NOM DU MAGASIN NE SONT PAS RENDUS.
 *     Le kit affiche « 1 658 F / mois », « Facturé 19 900 F », nomme le magasin et pose un
 *     bouton sortant (`:577-593`). Le port React Native l'INTERDISAIT par test
 *     (« aucun écran ne nomme un magasin dans son texte »). Les deux sources sont
 *     incompatibles, et la contradiction est une DÉCISION HUMAINE ouverte :
 *     `spec-ecrans-natif.md` § F.1, reprise dans `deferred-work.md`, qui écrit la position
 *     retenue par DÉFAUT — l'application ne vend pas, le tunnel de paiement a déjà été
 *     supprimé pour cette raison — et sa conséquence assumée : « `/formation` et `/club`
 *     perdent leur bloc central sans remplacement dessiné ».
 *     Ce fichier tient cette position par défaut ET LA NOMME À L'ÉCRAN, plutôt que de laisser
 *     un trou là où le kit met le cœur de son argument. Trancher dans l'autre sens est un
 *     geste d'une ligne : remplacer le panneau ci-dessous par le bloc du kit.
 *
 * 2 · LES TROIS COMPTEURS N'ONT PAS DE VALEUR, ET AUCUN APERÇU N'EST RENDU.
 *     Le pari de l'écran est de ne RIEN flouter : à la place du flou, les compteurs RÉELS et
 *     un élément entier. Or aucune vue du contrat ne sert ces compteurs, et un aperçu
 *     fabriqué mettrait dans la bouche d'un membre réel des mots qu'il n'a pas écrits — c'est
 *     exactement le défaut qui a laissé « Série 3 j » et « Niveau 4 » en production jusqu'au
 *     05/09/2026. La forme du kit est tenue ; ses nombres attendent leur source.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * La table du kit (`ScreensNatifClub.js:407-456`), portée SANS ses nombres.
 *
 * ⚠️ CE QUI A ÉTÉ RETIRÉ, ET POURQUOI. Le kit écrit les comptes EN TOUTES LETTRES dans les
 * chapôs — « Sept publications et quarante-et-une réponses depuis lundi », « Quarante-et-un
 * sujets ouverts », « Six fiches remplies » — et dans deux titres (« DEUX SESSIONS CE
 * MOIS-CI. », « TROIS MISSIONS OUVERTES. »). Écrits en lettres, ce sont quand même des
 * données : des relevés présentés comme actuels à quelqu'un qu'on cherche à convaincre. Ils
 * périment en silence, et personne ne les relit. Ils sortent donc de la copie et redescendent
 * dans les compteurs, où ils porteront leur date le jour où une vue les servira.
 *
 * ⚠️ « GAGNER 15 % » RESTE, parce que ce n'est PAS un relevé : c'est un TERME DE L'OFFRE. Il
 * ne s'écrit pas ici non plus — il vient de `TermesDuClub`, qui cite sa source.
 */
@Immutable
internal data class Verrou(
    val titre: List<String>,
    val quoi: String,
    /** Les libellés des trois compteurs. Leurs VALEURS n'ont pas de producteur. */
    val compteurs: List<String>,
    val apercuTitre: String,
    /** Ce que l'aperçu montrerait — dit, tant qu'il ne peut pas être montré. */
    val apercuQuoi: String,
)

internal val VERROUS: Map<OngletClub, Verrou> = mapOf(
    OngletClub.Fil to Verrou(
        titre = listOf("CE QUI SE DIT", "CETTE SEMAINE."),
        quoi = "Des gens qui vendent vraiment quelque chose, et qui racontent ce qui a "
            + "marché. Le fil se lit dans l'ordre, sans algorithme.",
        compteurs = listOf("publications", "réponses", "catégories"),
        apercuTitre = "Une publication, en entier",
        apercuQuoi = "Une publication de membre : son avatar, son nom, sa catégorie, le "
            + "texte entier et ses trois compteurs de réaction.",
    ),
    OngletClub.Discussions to Verrou(
        titre = listOf("LES QUESTIONS", "QU'ON SE POSE."),
        quoi = "Des sujets ouverts, classés par catégorie. La question bête se pose ici, "
            + "et quelqu'un y répond.",
        compteurs = listOf("sujets", "catégories", "réponses au plus long"),
        apercuTitre = "Un sujet, en entier",
        apercuQuoi = "Un sujet avec sa catégorie, son nombre de réponses et sa question "
            + "telle qu'elle a été posée.",
    ),
    OngletClub.Membres to Verrou(
        titre = listOf("QUI FAIT QUOI,", "ET OÙ."),
        quoi = "Le métier et le quartier, parce qu'ils servent à se trouver. Jamais le "
            + "numéro de téléphone : on s'écrit dans le Club.",
        compteurs = listOf("fiches remplies", "dans ta vague", "quartiers"),
        apercuTitre = "Une fiche, en entier",
        apercuQuoi = "Une fiche de membre : le nom, le métier, le quartier, la vague "
            + "d'arrivée et le niveau.",
    ),
    OngletClub.Agenda to Verrou(
        titre = listOf("LES SESSIONS", "DU MOIS."),
        quoi = "Des directs en ligne et des ateliers à Dakar. L'agenda est publié un mois "
            + "à l'avance, et une session annoncée a lieu même si nous sommes quatre.",
        compteurs = listOf("sessions ce mois", "places restantes", "ateliers à Dakar"),
        apercuTitre = "Une session, en entier",
        apercuQuoi = "Une session avec son jour, son horaire, son lieu et ce qui s'y fait.",
    ),
    OngletClub.Classement to Verrou(
        titre = listOf("TA VAGUE,", "PAS UN PALMARÈS."),
        quoi = "Tu serais comparée aux personnes arrivées en même temps que toi. Pas à "
            + "celles qui ont deux ans d'avance — il n'y a aucun classement général, et il "
            + "n'y en aura pas.",
        compteurs = listOf("dans ta vague", "vues de progression", "classement absolu"),
        apercuTitre = "Ce que tu verrais",
        apercuQuoi = "Ta place dans ta vague d'arrivée, et une seconde vue qui ne te "
            + "compare qu'à toi-même, semaine après semaine.",
    ),
    OngletClub.Opportunites to Verrou(
        titre = listOf("LES MISSIONS", "OUVERTES."),
        quoi = "Des budgets annoncés par la personne qui publie. Ils ne sont pas vérifiés "
            + "par la plateforme, et c'est écrit sur l'écran plutôt que caché dans les CGV.",
        compteurs = listOf("ouvertes", "budget le plus bas", "le plus haut"),
        apercuTitre = "Une mission, en entier",
        apercuQuoi = "Une mission avec son lieu, sa date de publication et son budget "
            + "annoncé.",
    ),
    OngletClub.Informations to Verrou(
        titre = listOf("LE DIGEST", "DE LA SEMAINE."),
        quoi = "Ce qui s'est passé, ce qui arrive, et ce que je n'ai pas fait. Un par "
            + "semaine, quand il y a de quoi le remplir — pas un calendrier tenu à vide.",
        compteurs = listOf("digests publiés", "par semaine", "e-mail envoyé"),
        apercuTitre = "Un extrait, en entier",
        apercuQuoi = "Un extrait du digest de la semaine, section comprise.",
    ),
    OngletClub.Parrainage to Verrou(
        titre = listOf("FAIS-LUI", "GAGNER ${TermesDuClub.REMISE_FILLEUL_PCT} %."),
        quoi = "Un code à toi, qui fait baisser le prix du Club pour la personne que tu "
            + "parraines. Toi, tu ne gagnes rien en argent — et c'est écrit dans l'onglet, "
            + "pas en bas de page.",
        compteurs = listOf("partages", "inscrits", "commission pour toi"),
        apercuTitre = "Ce que tu aurais",
        apercuQuoi = "Ton code, et la phrase qui dit que la remise est calculée côté "
            + "serveur : elle ne dépend pas du lien sur lequel la personne a cliqué.",
    ),
)

/**
 * LE CORPS VERROUILLÉ, RENDU DANS L'ENVELOPPE DE L'ONGLET.
 *
 * ⛔ CE N'EST PAS UNE DESTINATION, ET C'EST TOUT LE POINT. `ClubScaffold` l'appelle à la place
 * du contenu quand la vue répond `SANS_ACCES` ; l'argument `onglet` est donc celui de la
 * destination déjà rendue, et il ne peut pas manquer.
 */
@Composable
internal fun ColumnScope.CorpsVerrouille(
    onglet: OngletClub,
    provenance: Provenance?,
    onAller: (Any) -> Unit,
) {
    val p = jetons
    val v = VERROUS.getValue(onglet)
    val releve = provenance?.asOf

    Box(
        Modifier
            .padding(top = 20.dp)
            .size(54.dp)
            .fondDegrade(p.actionTransforme, RoundedCornerShape(18.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Icon("lock", description = null, taille = 23.dp, couleur = p.textOnPrimary, epaisseur = 2.3f)
    }

    Display(v.titre, cran = CranDisplay.SM, modifier = Modifier.padding(top = 16.dp))
    Body(v.quoi, Modifier.padding(top = 12.dp), grain = GrainCorps.CHAPO)

    /* Les compteurs. C'est ce qui remplace le contenu flouté — quand ils auront une source. */
    Surface(Niveau.CHROME, Modifier.padding(top = 18.dp).fillMaxWidth(), rembourrage = 18.dp) {
        Column {
            Eyebrow("Derrière ce cadenas, en ce moment")
            Row(
                Modifier.padding(top = 12.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                v.compteurs.forEach { libelle ->
                    Column(Modifier.weight(1f)) {
                        Num(
                            valeur = null,
                            /* ⛔ `source` ET `asOf` SONT OBLIGATOIRES même quand la valeur
                               manque : c'est ce qui empêche un nombre d'apparaître un jour
                               sans provenance. Ici la source est l'aveu lui-même. */
                            source = "aucune vue du contrat ne sert ce compteur",
                            asOf = releve ?: "jamais relevé",
                            taille = 21.sp,
                            repli = "non relevé",
                        )
                        Body(libelle, Modifier.padding(top = 2.dp), attenue = true)
                    }
                }
            }
            Body(
                "Le kit affiche ici trois compteurs datés. Aucune vue ne les sert : les "
                    + "inventer ferait exactement ce que cet écran reproche au flou.",
                Modifier.padding(top = 12.dp),
                attenue = true,
            )
        }
    }

    /* ⛔ UN ÉLÉMENT COMPLET, NON FLOUTÉ — le pari de l'écran, et ce qu'il en reste. */
    Eyebrow(v.apercuTitre, Modifier.padding(top = 22.dp))
    Surface(Niveau.FLAT, Modifier.padding(top = 10.dp).fillMaxWidth(), rembourrage = 17.dp) {
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = v.apercuQuoi,
            origine = "L'aperçu vient du contenu réel du Club, jamais d'un exemple",
            degat = "Un aperçu fabriqué mettrait dans la bouche de membres réels des mots "
                + "qu'ils n'ont pas écrits — et la personne le vérifierait au premier écran "
                + "après avoir payé.",
        )
    }

    /* ⛔ LE BLOC CENTRAL DU KIT, ET LA DÉCISION QUI LE RETIENT. Voir l'en-tête du fichier. */
    SansDonnees(
        etat = Etat.NonBranche,
        quoi = "Le cadre de l'abonnement",
        origine = "Décision humaine ouverte — spec-ecrans-natif.md § F.1, deferred-work.md",
        degat = "Le kit met ici le prix cadré au mois et à l'année, le nom du magasin et un "
            + "bouton vers le site. Le port l'interdisait par test. La position retenue par "
            + "défaut est que l'application ne vend pas : le bloc est donc absent, et son "
            + "absence est écrite plutôt que passée sous silence.",
        modifier = Modifier.padding(top = 20.dp),
    )

    Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
        Column {
            Eyebrow("Pourquoi rien n'est flouté ici")
            Body(
                "Un contenu flouté dit « il y a foule là-dedans, fais-nous confiance ». Le "
                    + "Club a ouvert en ${TermesDuClub.OUVERT_EN} : il ne peut pas dire ça, et tu le "
                    + "vérifierais au premier écran après avoir payé.",
                Modifier.padding(top = 6.dp),
                attenue = true,
            )
        }
    }

    /*
     * ⚠️ « LE CLUB A OUVERT EN AOÛT 2026 », PAS « CETTE ANNÉE ». Le kit écrit le relatif
     * (`ScreensNatifClub.js:597`). Une phrase relative au temps ne casse pas : elle se met
     * simplement à mentir, quelques mois plus tard, sans que rien ne le signale. Le dépôt a
     * déjà tranché ce point côté web — `src/lib/club/pricing.ts` porte `CLUB_OPENED_AT` au
     * mois près, précisément pour les deux écrans dont le métier est d'expliquer pourquoi
     * aucun chiffre n'est annoncé. C'est le même écran, ici.
     */

    Button(
        "En attendant, le podcast est gratuit",
        { onAller(DestinationMedia) },
        modifier = Modifier.padding(top = 18.dp),
        ton = TonBouton.QUIET,
    )
}
