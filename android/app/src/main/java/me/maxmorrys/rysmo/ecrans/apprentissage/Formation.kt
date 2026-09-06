package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Mesh
import me.maxmorrys.rysmo.ds.Metrique
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ecrans.LocalSession
import me.maxmorrys.rysmo.ecrans.vue
import me.maxmorrys.rysmo.systeme.partagerUnTexte
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.RoundedCornerShape
import me.maxmorrys.rysmo.donnees.Formation as FicheFormation

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA FICHE D'UNE FORMATION — kit `MurPaiement` (`ScreensNatif.js:125-177`).
 *
 * ⛔ LE BLOC CENTRAL DU KIT N'EST PAS RENDU, ET C'EST UNE CONTRADICTION DE SOURCES, PAS UN
 * OUBLI. Elle est écrite au § F.1 de `spec-ecrans-natif.md` et la décision revient à l'humain.
 *
 *   · LE KIT rend un `GlassPanel level="hero"` qui NOMME LE MAGASIN — « L'App Store exige… »
 *     / « Google Play exige… » (`ScreensNatif.js:141`) —, affiche `PriceBlock 95 000`, un
 *     bouton « Ouvrir sur maxmorrys.me » et trois étiquettes Wave / Orange Money / Carte.
 *   · LE PORT l'avait retiré, sous une porte qui interdisait toute occurrence de
 *     `App Store|Google Play|achat intégré` dans les écrans, commentaires retirés avant
 *     examen, avec la raison écrite : « une revue lit les chaînes ». La porte
 *     (`mobile-store-achats.test.ts`) a disparu avec `mobile/` et figure dans
 *     `garanties-a-reconstruire.md` § 1 comme garantie à rebâtir.
 *
 * ⭐ ET UN TROISIÈME FAIT TRANCHE, LUI, SANS AMBIGUÏTÉ : `appFormation` NE REND AUCUN PRIX.
 * Le contrat le dit là où il compte — « ⛔ AUCUN PRIX N'EN SORT, et ce n'est pas un oubli :
 * un catalogue qui affiche des montants EST une vitrine. `formations` porte un `price` ; il
 * s'arrête au serveur. » Reproduire le mur exigerait donc d'écrire « 95 000 » à la main dans
 * l'application, c'est-à-dire exactement le geste que ce lot existe pour ne plus faire.
 *
 * Le bloc rendu ici ne parle donc pas d'argent du tout. Il dit ce que la fiche a de vrai : un
 * sujet, un programme, un accès qui ne se reprend pas. Le jour où la décision humaine tombe
 * côté « kit », le prix devra venir d'une vue — pas d'une constante.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranFormation(
    slug: String,
    titre: String?,
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
    session: Session = LocalSession.current,
) {
    val contexte = LocalContext.current

    /*
     * ⚠️ `slug` EST OBLIGATOIRE, ET LE SERVEUR LÈVE SANS LUI. Le contrat l'écrit à sa
     * définition : « Le hook du port passait `{}` quand le paramètre manquait : c'est le même
     * défaut que celui qui rendait la fiche de membre inatteignable. » Ici il vient de la
     * destination, qui ne se construit pas sans lui — le paramètre ne peut donc pas manquer.
     */
    val lu = vue<FicheFormation>(
        Vues.Noms.APP_FORMATION,
        session,
        buildJsonObject { put("slug", JsonPrimitive(slug)) },
    )
    val etat = lu.etat
    /*
     * ⭐ LE TITRE SERVI PASSE DEVANT CELUI DE LA NAVIGATION. L'argument de route est le
     * `titreCourt` que le CATALOGUE portait au moment où on a touché la ligne ; celui-ci vient
     * de la formation elle-même, à l'instant. Les deux se ressemblent tant que rien ne change,
     * et le second est le seul qui se corrige quand un titre est réécrit en base.
     */
    val fiche: FicheFormation? = if (etat is Etat.Servie) etat.valeur else null

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Cours",
        onRetour = onRetour,
        titre = fiche?.titreCourt ?: titre ?: "Formation",
        droite = {
            /*
             * ⚠️ CE BOUTON MENAIT À L'ÉCRAN DE PARTAGE D'UN CERTIFICAT dans le port. « Partager
             * cette formation » ouvrait donc un écran qui compose un lien de VÉRIFICATION DE
             * DIPLÔME et qui, faute de certificat, affichait « Rien à partager ». Deux objets
             * différents derrière un même verbe.
             *
             * Une formation se partage par son adresse publique, et la feuille système suffit :
             * elle connaît les applications installées, ce qu'un écran à nous ne saurait pas.
             */
            IconButton(
                libelle = "Partager cette formation",
                onPress = {
                    val quoi = fiche?.titre ?: titre ?: "Une formation Max-Morrys"
                    partagerUnTexte(
                        contexte = contexte,
                        titre = quoi,
                        texte = quoi,
                        lien = "$SITE_PUBLIC/formations/$slug",
                    )
                },
            ) { Icon("share", description = null, taille = 17.dp) }
        },
    ) {
        /*
         * La bande de tête est une SURFACE DE MARQUE, pas un lecteur : elle ne porte ni bouton
         * de lecture ni étiquette « Aperçu · 4 min gratuit ». Cette étiquette est une donnée —
         * elle affirme qu'un extrait existe et sa durée —, et `appFormation` ne la rend pas.
         * `ModuleFiche.ouvert` dit seulement qu'un module contient une leçon libre.
         */
        Box(
            Modifier
                .padding(top = 8.dp)
                .fillMaxWidth()
                .height(150.dp)
                .clip(RoundedCornerShape(Metrique.rMedia)),
        ) { Mesh(Territoire.FORME) }

        /* La méta du serveur — « Vente · 3 modules · 47 leçons · Débutant » — remplace le
           sourcil générique dès qu'elle arrive : elle dit la même chose en disant quelque
           chose. Tant qu'elle n'est pas là, le sourcil n'affirme rien de mesurable. */
        Eyebrow(fiche?.meta ?: "La fiche", Modifier.padding(top = 20.dp))
        Display(
            when {
                fiche != null -> deuxLignes(fiche.titre)
                titre != null -> deuxLignes(titre)
                else -> listOf("UNE", "FORMATION.")
            },
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )

        Surface(Niveau.HERO, Modifier.padding(top = 18.dp).fillMaxWidth(), rembourrage = 20.dp) {
            Column {
                Display("Ce que tu gardes.", cran = CranDisplay.XS)
                Body(
                    "L'accès est à vie : une fois la formation ouverte sur ton compte, elle le "
                        + "reste, ici comme sur le site. Tes notes et ta progression te suivent "
                        + "d'un appareil à l'autre.",
                    Modifier.padding(top = 9.dp),
                    grain = GrainCorps.CHAPO,
                )
            }
        }

        /*
         * ⛔ LE PROGRAMME NE S'INVENTE PAS. Le kit dessine trois modules — un ouvert, deux
         * cadenassés — avec leurs comptes de leçons et leurs durées. Ce sont des valeurs de
         * maquette : un module inventé promet un contenu qui n'existe pas, et son « 1 h 08 »
         * déciderait à la place de quelqu'un de commencer maintenant ou d'attendre.
         *
         * ⭐ IL VIENT MAINTENANT DE `appFormation`, et le kit lui-même n'aurait pas pu le
         * fournir : chaque `meta` de module — « module 2 · 5 leçons · 54 min » — est composée
         * AU SERVEUR, qui n'annonce un temps que si TOUTES les durées du module se sont
         * laissées lire. Un total amputé d'une leçon se lirait comme une mesure.
         */
        if (fiche != null && etat is Etat.Servie) {
            Eyebrow("Le programme", Modifier.padding(top = 22.dp))
            Surface(
                Niveau.FLAT,
                Modifier.padding(top = 10.dp).fillMaxWidth(),
                rembourrage = 16.dp,
            ) {
                Column {
                    fiche.modules.forEachIndexed { rang, module ->
                        /*
                         * ⛔ CETTE LISTE N'A PAS D'IDENTIFIANT, ET C'EST UN MANQUE DU CONTRAT.
                         * `ModuleFiche` porte `titre`, `meta` et `ouvert` — rien qui désigne.
                         * Le titre seul se répète (« Module 1 » est le repli du serveur quand
                         * la base n'en nomme pas), et deux modules homonymes s'effondreraient
                         * l'un sur l'autre : c'est le défaut mesuré sur les publications
                         * d'auteurs homonymes de ce dépôt. Le rang seul est une POSITION, pas
                         * une identité. La paire lève l'ambiguïté sans en inventer une ; le
                         * vrai correctif est un champ `id` dans `ModuleFiche`.
                         */
                        key(rang, module.titre) {
                            LessonRow(
                                titre = module.titre,
                                etat = EtatLecon.PLAIN,
                                meta = module.meta,
                                derniere = rang == fiche.modules.lastIndex,
                                /* ⛔ PAS DE CADENAS SUR LES AUTRES MODULES. Le kit en dessine
                                   deux ; ils affirmeraient un achat à faire, et cette
                                   application ne vend pas — elle ne saurait donc pas dire
                                   comment les ouvrir. `ouvert` dit une chose vraie et étroite :
                                   ce module contient au moins une leçon libre. */
                                queue = { if (module.ouvert) Tag("Leçon libre") },
                            )
                        }
                    }
                }
            }
            /* Le compte total est un RELEVÉ : il vient de la vue, à la date de la vue. */
            Num(
                valeur = fiche.lecons.toString(),
                source = Vues.Noms.APP_FORMATION,
                asOf = etat.provenance.asOf,
                modifier = Modifier.padding(top = 12.dp),
                unite = "leçons en tout",
                taille = 15.sp,
            )
        } else {
            SansDonnees(
                etat = etat,
                quoi = "Le programme de cette formation",
                origine = "La vue « ${Vues.Noms.APP_FORMATION} » du serveur, appelée avec le slug « $slug »",
                degat = "Un module inventé promet un contenu qui n'existe pas — et c'est justement "
                    + "ce que le module d'ouverture, gratuit, sert à éviter : juger sur pièce.",
                modifier = Modifier.padding(top = 18.dp),
                hauteur = 3,
                reprise = lu.reprendre,
            )
        }

        EncartDeVerite(
            sourcil = "Ce que cet écran ne fait pas",
            texte = "Il ne vend rien. Le kit place ici un prix, le nom du magasin et un bouton "
                + "qui sort de l'application ; la décision de les rétablir n'est pas prise, et "
                + "aucune vue du serveur ne rend de montant. Un prix écrit à la main dans "
                + "l'application dériverait du jour où il changerait sur le site.",
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}
