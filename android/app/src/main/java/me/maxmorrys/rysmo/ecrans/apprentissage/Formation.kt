package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.Mesh
import me.maxmorrys.rysmo.ds.Metrique
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.RoundedCornerShape

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
) {
    val contexte = LocalContext.current

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Cours",
        onRetour = onRetour,
        titre = titre ?: "Formation",
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
                    partagerUnLien(
                        contexte = contexte,
                        titre = titre ?: "Une formation Max-Morrys",
                        texte = titre ?: "Une formation Max-Morrys",
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

        Eyebrow("La fiche", Modifier.padding(top = 20.dp))
        Display(
            if (titre == null) listOf("UNE", "FORMATION.") else deuxLignes(titre),
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
         */
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Le programme de cette formation",
            origine = "La vue « ${Vues.Noms.APP_FORMATION} » du serveur, appelée avec le slug « $slug »",
            degat = "Un module inventé promet un contenu qui n'existe pas — et c'est justement "
                + "ce que le module d'ouverture, gratuit, sert à éviter : juger sur pièce.",
            modifier = Modifier.padding(top = 18.dp),
            hauteur = 3,
        )

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

/**
 * Un titre venu de la base, équilibré sur deux lignes.
 *
 * ⛔ UN TITRE D'AFFICHAGE NE SE REPLIE JAMAIS TOUT SEUL — `Display` rend une ligne par
 * élément, sans césure, et laisse DÉBORDER plutôt que tronquer. C'est voulu : un titre coupé
 * par des points de suspension est un défaut qu'on ne voit plus, un titre qui déborde est un
 * défaut qu'on voit. Mais un titre qui vient du serveur n'a pas de coupe écrite à la main :
 * on l'équilibre au mot le plus proche du milieu, ce qui est ce qu'un typographe ferait.
 */
private fun deuxLignes(titre: String): List<String> {
    val mots = titre.trim().split(" ").filter { it.isNotEmpty() }
    if (mots.size < 3) return listOf(titre)
    var meilleur = 1
    var ecart = Int.MAX_VALUE
    for (i in 1 until mots.size) {
        val gauche = mots.subList(0, i).joinToString(" ").length
        val droite = mots.subList(i, mots.size).joinToString(" ").length
        val delta = kotlin.math.abs(gauche - droite)
        if (delta < ecart) {
            ecart = delta
            meilleur = i
        }
    }
    return listOf(
        mots.subList(0, meilleur).joinToString(" "),
        mots.subList(meilleur, mots.size).joinToString(" "),
    )
}
