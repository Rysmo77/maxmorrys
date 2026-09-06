package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.ChipRow
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.DispositionChips
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.navigation.Notes

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE LECTEUR DE LEÇON — kit `NatLecteur` (`ScreensNatifApp.js:191-245`).
 *
 * ⛔ IL N'Y A PAS DE LECTEUR, ET L'ÉCRAN LE DIT AU LIEU D'EN DESSINER UN.
 *
 * Trois faits mesurés, qui vont dans le même sens :
 *
 *   1 · La vidéo de leçon N'EST PAS UN FICHIER. `Lesson.videoUrl` est rendue par le web dans
 *       un `<iframe>` hébergé ailleurs (`constat-hors-ligne.md` § 1). Il n'y a rien à lire, ni
 *       à télécharger, ni à mettre en cache.
 *   2 · `media3-exoplayer` et `media3-session` sont au catalogue de versions et ABSENTS des
 *       dépendances (`spec-ecrans-natif.md` § F.4). Aucun lecteur ne peut être instancié.
 *   3 · Le port React Native avait quand même dessiné le bloc : bouton de lecture `disabled`,
 *       ronds « −15 » et « +15 » sans action « par construction », téléchargement `disabled`,
 *       et deux horodatages de maquette qui passaient par `<Num>` — c'est-à-dire qui se
 *       présentaient comme des valeurs relevées. Quatre contrôles morts sur un seul écran.
 *
 * Un rectangle dégradé avec un rond de lecture au milieu qui ne lit rien n'est pas « la mise
 * en page en attendant » : c'est un bouton mort de 62 px, au centre de l'écran, sur le geste
 * principal du produit.
 *
 * ── LES QUATRE VUES DU KIT SONT CONSERVÉES, ET ELLES FONT QUELQUE CHOSE ─────────────────
 * `Vidéo · Transcription · Mes notes · Ressources`. « Mes notes » est un ÉCRAN et non un
 * panneau — les notes survivent à la leçon et se cherchent d'un cours à l'autre —, les trois
 * autres changent ce qui est rendu ici. Aucune n'est décorative.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
private val VUES_DE_LECON = listOf("Vidéo", "Transcription", "Mes notes", "Ressources")

@Composable
fun EcranLecon(
    slug: String,
    leconId: String?,
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    /* `rememberSaveable` : la vue choisie survit à une rotation ou à un retour en arrière du
       système, ce qu'un `remember` seul ne fait pas. */
    var vue by rememberSaveable { mutableStateOf(VUES_DE_LECON.first()) }

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Cours",
        onRetour = onRetour,
        titre = "Leçon",
        /*
         * ⛔ PAS DE BOUTON « TÉLÉCHARGER » DANS LA BARRE HAUTE. Le port en posait un, `disabled`.
         * Il n'y a rien à télécharger (§ 1 ci-dessus), et un bouton grisé sur le geste que
         * l'onboarding promet — « regarde-la dans le taxi » — est pire qu'aucun bouton : il
         * fait croire à une panne temporaire.
         */
    ) {
        Eyebrow("Ta leçon", Modifier.padding(top = 6.dp))
        Display(listOf("LA LEÇON."), cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))

        /*
         * ⛔ LE TITRE DE LA LEÇON ÉTAIT ÉCRIT EN DUR DANS LE PORT — `['Les mots que','tapent tes
         * clients']` (`lecon.tsx:82`), indépendant de la leçon ouverte. Toutes les leçons du
         * produit portaient donc le même titre. Il vient de `appLecon`, ou il ne vient pas.
         */
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Le titre et le contenu de cette leçon",
            origine = "La vue « ${Vues.Noms.APP_LECON} » du serveur"
                + (if (leconId != null) ", pour la leçon « $leconId »" else ""),
            degat = "Le port affichait « Les mots que tapent tes clients » sur TOUTES les "
                + "leçons : un titre écrit en dur ne se signale jamais comme faux.",
            modifier = Modifier.padding(top = 16.dp),
            hauteur = 2,
        )

        ChipRow(
            options = VUES_DE_LECON,
            valeur = vue,
            onChange = { choix ->
                /* « Mes notes » est un ÉCRAN, pas un panneau : une note prise en leçon 5 sert
                   encore six mois après, quand la formation est finie. */
                if (choix == "Mes notes") onAller(Notes(leconId)) else vue = choix
            },
            modifier = Modifier.padding(top = 16.dp),
            hauteur = 36.dp,
            disposition = DispositionChips.SCROLL,
        )

        when (vue) {
            "Transcription" -> Surface(
                Niveau.FLAT,
                Modifier.padding(top = 16.dp).fillMaxWidth(),
                rembourrage = 18.dp,
            ) {
                Column {
                    Eyebrow("La transcription")
                    Body(
                        "Elle se lit sans charger la vidéo, et elle reste lisible quand le "
                            + "réseau lâche au milieu. C'est elle qui rend une coupure "
                            + "supportable.",
                        Modifier.padding(top = 8.dp),
                        grain = GrainCorps.CHAPO,
                    )
                    /*
                     * ⛔ CETTE PHRASE DÉCRIT UNE INTENTION, PAS UN ÉTAT. La transcription
                     * n'arrive dans aucune vue du contrat : `Lecon` porte `moduleTitre` et
                     * `programme`, rien d'autre. Le dire ici plutôt que d'afficher un texte
                     * d'exemple est la différence entre une promesse et une maquette.
                     */
                    SansDonnees(
                        etat = Etat.NonBranche,
                        quoi = "Le texte de la transcription",
                        origine = "Aucune vue du contrat ne la rend — « ${Vues.Noms.APP_LECON} » "
                            + "porte le module et le programme, pas le texte",
                        degat = "Une transcription inventée mettrait dans la bouche du cours "
                            + "des phrases qu'il ne dit pas, et c'est le seul repli hors "
                            + "connexion que le produit promet.",
                        modifier = Modifier.padding(top = 14.dp),
                        hauteur = 4,
                    )
                }
            }

            "Ressources" -> SansDonnees(
                etat = Etat.NonBranche,
                quoi = "Les ressources de la leçon",
                origine = "La vue « ${Vues.Noms.APP_LECON} » marque une ligne `doc`, mais aucun "
                    + "fichier n'a d'adresse dans le contrat",
                degat = "Un PDF listé avec un poids qu'on n'a pas mesuré décide à la place de "
                    + "quelqu'un de charger maintenant ou d'attendre le Wi-Fi.",
                modifier = Modifier.padding(top = 16.dp),
                hauteur = 2,
            )

            else -> SansDonnees(
                etat = Etat.NonBranche,
                quoi = "La lecture de la vidéo",
                origine = "Aucun hébergeur de vidéo n'est choisi — le web la rend dans un "
                    + "`iframe` tiers, et ni `media3-exoplayer` ni `media3-session` ne sont "
                    + "en dépendance",
                degat = "Un bouton de lecture qui ne lit rien est le contrôle mort le plus "
                    + "cher du produit : il occupe le centre de l'écran, sur son geste "
                    + "principal. Le port en avait dessiné un, `disabled`.",
                modifier = Modifier.padding(top = 16.dp),
                hauteur = 4,
            )
        }

        /*
         * ⛔ NI BARRE DE PROGRESSION NI POURCENTAGE. Le kit en pose une à 34 %. Une barre à
         * zéro qu'on n'a pas mesurée se lit comme une progression PERDUE — c'est le constat
         * du port lui-même, qui ne rendait la barre que lorsque `appEspace` avait répondu.
         */
        Eyebrow("Le programme", Modifier.padding(top = 22.dp))
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Le programme du module et ta progression",
            origine = "Les vues « ${Vues.Noms.APP_LECON} » et « ${Vues.Noms.APP_ESPACE} » du "
                + "serveur, pour la formation « $slug »",
            degat = "Une leçon inventée est une leçon qu'on croit avoir à regarder, et son "
                + "poids en mégaoctets déciderait de charger ou pas, sur un forfait compté.",
            modifier = Modifier.padding(top = 10.dp),
            hauteur = 5,
        )

        EncartDeVerite(
            sourcil = "Ce que cet écran ne fait pas encore",
            texte = "Cocher une leçon s'écrit par « marquerLecon », qui existe côté serveur et "
                + "n'a pas encore de chemin depuis ici. Tant que la coche n'est pas branchée, "
                + "elle n'est pas dessinée : une coche qui revient en arrière au prochain "
                + "lancement fait douter de tout le reste.",
            modifier = Modifier.padding(top = 14.dp),
        )
    }
}
