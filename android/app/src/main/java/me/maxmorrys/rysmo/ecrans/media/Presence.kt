package me.maxmorrys.rysmo.ecrans.media

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CheckLine
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Field
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.PriceBlock
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TerritoireCarte
import me.maxmorrys.rysmo.ds.TerritoryCard
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.ecrans.apprentissage.SITE_PUBLIC
import me.maxmorrys.rysmo.navigation.Devis as DestinationDevis

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * PRÉSENCE DIGITALE — kit `NatPresence` (`ScreensNatifMedia.js:253-293`).
 *
 * ⭐ LE SEUL ÉCRAN DE L'APPLICATION QUI A LE DROIT D'AFFICHER UN PRIX, et ce n'est pas une
 * tolérance : un pack d'agence est une prestation du MONDE RÉEL, contractée hors de
 * l'application. Il ne relève d'aucune règle de magasin sur le contenu numérique — le kit
 * l'écrit en pied, et la porte du port React Native l'écrivait aussi, en exemptant nommément
 * ses deux écrans d'agence de sa liste de mots interdits. Le Club et les formations, eux,
 * restent sans montant : ce sont deux situations différentes, pas une inconséquence.
 *
 * ── ⛔ TROIS CONTRADICTIONS ENTRE LE KIT ET LA GRILLE, TOUTES COMMERCIALES ──────────────
 *
 * 1 · LE NOM ET LE PRIX NE VONT PAS ENSEMBLE. Le kit dessine « Pack Visible » à 250 000,
 *     barré 295 000. La grille n'a pas de « Pack Visible » : elle a « Présence Locale »
 *     (295 000, promotion de lancement 250 000), « Commerce Visible » (495 000, sans
 *     promotion) et « Boutique Digitale » (895 000). La carte du kit porte le nom de l'un et
 *     le prix de l'autre — la reproduire afficherait 250 000 sous une offre facturée 495 000.
 *     ⭐ C'est le pack d'entrée qui est rendu ici, sous son vrai nom.
 *
 * 2 · LE PRIX BARRÉ EST DEVENU AMBIGU LE 03/09/2026, jour où l'article 5.1 des CGV est passé
 *     de « toutes taxes comprises » à « hors taxes ». La prestation d'agence est taxable à
 *     18 % : 250 000 hors taxes font exactement 295 000 toutes taxes comprises — c'est-à-dire
 *     le même nombre que le prix de liste barré, qui est un prix HORS TAXES. Afficher
 *     « 250 000 » barré « 295 000 » se lit donc aussi bien comme une remise que comme une
 *     ventilation de taxe, et les deux lectures sont vraies dans la grille. Le barré n'est
 *     PAS rendu ; la ventilation, elle, l'est, parce que l'article 5.1 exige que le montant
 *     toutes taxes comprises soit présenté.
 *
 * 3 · LE SÉLECTEUR N'EST PAS PORTÉ. Le kit dessine trois questions et une recommandation.
 *     La règle qui recommande vit dans `recommend()` côté web : la recopier en Kotlin ferait
 *     un miroir d'ALGORITHME, qui dériverait en silence et recommanderait un autre pack que
 *     le site pour les mêmes réponses. Et sa sortie — un devis — n'a de toute façon aucun
 *     producteur ici : aucune callable du contrat n'en crée un.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranPresence(
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    var adresseOrpheline by remember { mutableStateOf<String?>(null) }

    val sortir: (String) -> Unit = { adresse ->
        adresseOrpheline = if (ouvrirUneAdresse(contexte, adresse)) null else adresse
    }

    val prix = TermesDeLOffre.PACK_PRIX_PRATIQUE
    val prixTtc = TermesDeLOffre.ttc(prix)

    Screen(
        territoire = Territoire.DIGITALISE,
        modifier = modifier,
        retour = "Profil",
        onRetour = onRetour,
        titre = "Présence Digitale",
        droite = {
            IconButton(libelle = "En parler sur WhatsApp", onPress = {
                sortir(adresseWhatsApp(MESSAGE_WHATSAPP))
            }) {
                Icon("chat", description = null, taille = 17.dp, epaisseur = 2f)
            }
        },
    ) {
        Eyebrow("Je te digitalise", Modifier.padding(top = 6.dp))
        Display(
            listOf("TA BOUTIQUE,", "TROUVABLE", "SUR GOOGLE."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )
        Body(
            "Tu vends déjà sur WhatsApp. Je m'occupe de ce que tu ne peux pas faire depuis "
                + "ton téléphone.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        /*
         * ⭐ L'ANCRAGE EST DÉSAMORCÉ AVANT LE PRIX, ET L'ORDRE EST LA DÉCISION DE L'ÉCRAN.
         * La question que tout le monde pose arrive en premier, avec sa réponse chiffrée,
         * pour que le prix ne soit pas découvert après un argumentaire.
         */
        Surface(Niveau.HERO, Modifier.padding(top = 18.dp).fillMaxWidth(), rembourrage = 19.dp) {
            Column {
                Eyebrow("La question que tout le monde pose", couleur = jetons.mmTealT)
                Body(
                    "« Une agence me vend un site 400 000 F une fois. Toi c'est combien la "
                        + "première année ? »",
                    Modifier.padding(top = 7.dp),
                )
                Body(
                    "Réponse avant que tu remplisses quoi que ce soit : ${montantXof(prix)} F "
                        + "hors taxes pour le pack seul, une fois. L'accompagnement mensuel "
                        + "est une décision séparée, que tu prends après la mise en ligne — "
                        + "pas maintenant.",
                    Modifier.padding(top = 11.dp),
                    grain = GrainCorps.CHAPO,
                )
            }
        }

        /*
         * ⛔ `PriceBlock` EXIGE `source` ET `asOf`, ET C'EST LE COMPILATEUR QUI L'IMPOSE.
         * Ce prix ne vient pas d'une requête : il est écrit, dans une grille dont on connaît
         * la date de révision. C'est le seul relevé honnête qu'on puisse lui attacher —
         * l'instant d'affichage prétendrait qu'il vient d'être vérifié.
         */
        TerritoryCard(
            territoire = TerritoireCarte.DIGITALISE,
            modifier = Modifier.padding(top = 18.dp),
            premiere = true,
            meta = "Le pack d'entrée",
            titre = TermesDeLOffre.PACK_NOM,
        ) {
            Column {
                PriceBlock(
                    montant = montantXof(prix),
                    source = "src/lib/presence/offer.ts",
                    asOf = TermesDeLOffre.REVISE_LE,
                    modifier = Modifier.padding(top = 15.dp),
                    taille = 25.sp,
                    note = "Hors taxes · une fois · promotion de lancement",
                )
                Body(
                    "Soit ${montantXof(prixTtc)} F toutes taxes comprises, "
                        + "TVA ${TermesDeLOffre.TVA_TAUX_PCT} %.",
                    Modifier.padding(top = 8.dp),
                    grain = GrainCorps.CHAPO,
                    couleur = jetons.textFaint,
                )
                CheckLine(Modifier.padding(top = 14.dp)) {
                    Body(
                        "${TermesDeLOffre.ACOMPTE_PCT} % à la commande, le reste avant la mise "
                            + "en ligne. L'échéancier porte sur la mise en place, jamais sur "
                            + "un abonnement.",
                    )
                }
                CheckLine(Modifier.padding(top = 8.dp)) {
                    Body("${TermesDeLOffre.PACK_SUPPORT_JOURS} jours de support inclus.")
                }
                CheckLine(Modifier.padding(top = 8.dp), tiret = true) {
                    Body(
                        "Ni publicité, ni nom de domaine, ni abonnements tiers : ils ne sont "
                            + "pas dans le pack.",
                    )
                }
                Button(
                    "En parler sur WhatsApp",
                    { sortir(adresseWhatsApp(MESSAGE_WHATSAPP)) },
                    Modifier.padding(top = 16.dp),
                    ton = TonBouton.DIGITALISE,
                    glypheQueue = "external",
                )
            }
        }

        /*
         * ⛔ LE SÉLECTEUR DU KIT EST REMPLACÉ PAR UNE PHRASE ET UNE SORTIE, PAS PAR UN TROU.
         * Trois options existaient : recopier la règle de recommandation (un miroir
         * d'algorithme, qui dérive), dessiner le sélecteur sans le brancher (trois questions
         * qui ne recommandent rien), ou envoyer là où la règle vit. C'est la troisième.
         */
        Surface(Niveau.FLAT, Modifier.padding(top = 18.dp).fillMaxWidth(), rembourrage = 18.dp) {
            Column {
                Eyebrow("Les deux autres packs, et la recommandation")
                Body(
                    "Trois questions suffisent à savoir lequel des trois packs te va. Cette "
                        + "règle vit sur le site, à un seul endroit, et la recopier ici la "
                        + "ferait diverger sans que personne ne le voie : tu obtiendrais un "
                        + "pack de ton téléphone et un autre du site, pour les mêmes réponses.",
                    Modifier.padding(top = 6.dp),
                    grain = GrainCorps.CHAPO,
                )
                Button(
                    "Voir l'offre complète",
                    { sortir(SITE_PUBLIC + TermesDeLOffre.CHEMIN_OFFRE) },
                    Modifier.padding(top = 14.dp),
                    ton = TonBouton.QUIET,
                    glypheQueue = "external",
                )
            }
        }

        ChampDeDevis(onAller, Modifier.padding(top = 18.dp))

        adresseOrpheline?.let { adresse ->
            Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                Column {
                    Eyebrow("Aucune application n'a répondu")
                    Body(
                        "Ce téléphone n'a ni WhatsApp ni navigateur capable d'ouvrir cette "
                            + "adresse. Elle reste valable ailleurs :",
                        Modifier.padding(top = 6.dp),
                        attenue = true,
                    )
                    AdresseMono(adresse, Modifier.padding(top = 8.dp))
                }
            }
        }

        EncartDeVerite(
            sourcil = "Pourquoi les prix s'affichent ici, et nulle part ailleurs",
            texte = "Un pack se contracte hors de l'application : ce n'est pas du contenu "
                + "numérique consommé dedans, donc aucune règle de magasin ne s'y applique. "
                + "Les montants viennent de la grille du site et portent sa date de révision, "
                + "le ${TermesDeLOffre.REVISE_LE} — pas l'heure de ton téléphone.",
            modifier = Modifier.padding(top = 18.dp),
        )
    }
}

/**
 * ⭐ LA SEULE PORTE VERS UN DEVIS, ET ELLE EXISTE PARCE QU'IL N'Y EN A AUCUNE AUTRE.
 *
 * Un devis se consulte sans compte, à une adresse non devinable qu'on reçoit sur WhatsApp.
 * Cette adresse n'est PAS déclarée en lien applicatif — le manifeste ne déclare que
 * `/formations` et `/verifier` —, donc un lien de devis reçu sur le téléphone s'ouvre dans le
 * navigateur et n'entre jamais dans l'application. Sans ce champ, l'écran du devis serait
 * exactement ce que le port React Native produisait quatorze fois : une destination
 * construite, enregistrée, et atteinte par rien.
 *
 * ⚠️ LA FORME EST VÉRIFIÉE AVANT DE NAVIGUER, comme le web le fait avant toute lecture. Une
 * référence mal formée ouvrirait un écran qui dirait « ce devis n'existe pas » — le pire des
 * verdicts possibles, et le plus faux : c'est la SAISIE qui est en cause, pas le document.
 */
@Composable
private fun ChampDeDevis(
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    var saisie by rememberSaveable { mutableStateOf("") }
    var erreur by remember { mutableStateOf<String?>(null) }

    Surface(Niveau.FLAT, modifier.fillMaxWidth(), rembourrage = 18.dp) {
        Column {
            Eyebrow("Tu as déjà reçu un devis ?")
            Body(
                "Sa référence est imprimée en haut du document. Il se consulte sans compte, "
                    + "et il reste valable ${TermesDeLOffre.VALIDITE_JOURS} jours.",
                Modifier.padding(top = 6.dp),
                grain = GrainCorps.CHAPO,
            )
            Field(
                libelle = "Référence du devis",
                valeur = saisie,
                onChange = { brut ->
                    /* La normalisation est visible : le champ montre exactement ce qui
                       partira, plutôt que de corriger en silence à la validation. */
                    saisie = brut.replace(Regex("\\s+"), "").uppercase()
                    erreur = null
                },
                modifier = Modifier.padding(top = 12.dp),
                substitut = "DV-XXXXXXXXXXXX",
                erreur = erreur,
            )
            Button(
                "Ouvrir le devis",
                {
                    if (TermesDeLOffre.FORME_REFERENCE.matches(saisie)) {
                        onAller(DestinationDevis(saisie))
                    } else {
                        erreur = "Une référence commence par DV- et compte douze caractères " +
                            "ensuite, chiffres et lettres A à F."
                    }
                },
                Modifier.padding(top = 12.dp),
                ton = TonBouton.QUIET,
            )
        }
    }
}

/**
 * Le message qui ouvre la conversation.
 *
 * ⚠️ IL NE PORTE AUCUN MONTANT. Côté web, le message pré-rempli est composé par
 * `buildWhatsAppMessage`, qui tire tous ses chiffres de `computeTotals` — jamais recalculés,
 * « sous peine de diverger de la grille tarifaire ». Recomposer ce message ici en écrivant
 * des montants à la main serait précisément cette divergence. Le prix reste à l'écran, où il
 * est daté ; le message, lui, ne fait qu'ouvrir la porte.
 */
private const val MESSAGE_WHATSAPP: String =
    "Bonjour Max-Morrys, je viens de l'application Rysmo. " +
        "Je voudrais parler de la Présence Digitale pour mon commerce."
