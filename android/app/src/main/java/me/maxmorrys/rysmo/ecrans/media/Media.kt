package me.maxmorrys.rysmo.ecrans.media

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EntreeSubNav
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.FormatMedia
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.MediaCard
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.SubNav
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.donnees.Media as VueMedia
import me.maxmorrys.rysmo.navigation.ClubRoot
import me.maxmorrys.rysmo.navigation.Episode as DestinationEpisode
import me.maxmorrys.rysmo.navigation.Video as DestinationVideo

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE PÔLE MÉDIA — kit `NatMediaPole` (`ScreensNatifMedia.js:48-87`).
 *
 * ⛔ LE KIT APPELLE CET ÉCRAN « LE GAIN DÉCISIF DU VIRAGE NATIF », ET CE GAIN N'EXISTE PAS
 * ENCORE. Son argument tient en une phrase, qu'il écrit deux fois : « un podcast dans un
 * navigateur s'arrête quand on verrouille le téléphone ; en natif il continue ». Deux
 * surfaces en découlent — le mini-lecteur persistant et l'écran verrouillé — et AUCUNE des
 * deux n'est rendue ici. Trois faits mesurés, dans cet ordre :
 *
 *   1 · `media3-exoplayer` et `media3-session` sont au catalogue de versions et ne sont PAS
 *       déclarés en dépendance. Il n'y a pas de lecteur dans ce paquet.
 *   2 · L'audio d'un épisode n'est pas notre fichier : `Episode.lien` vaut l'adresse Spotify
 *       de l'épisode. Ce n'est ni notre média ni notre droit de le mettre en cache.
 *   3 · Il n'y a donc rien à jouer, et rien à télécharger.
 *
 * ⚠️ D'OÙ L'ÉCART DE RENDU, QUI EST UNE DÉCISION. Le kit dessine un mini-lecteur, deux
 * étiquettes vertes et un encart qui promet la lecture en fond. Les dessiner reviendrait à
 * poser des commandes de transport qui ne commandent rien — précisément les contrôles morts
 * que la porte du port React Native avait attrapés six fois. L'écran DIT ce qu'il ne fait pas
 * encore, et ne propose que le geste qui part vraiment : ouvrir l'épisode là où il est
 * publié.
 *
 * ── ⛔ ET LES DEUX ÉTIQUETTES DU KIT SONT FAUSSES, PAS SEULEMENT PRÉMATURÉES ────────────
 * `Tag ok` « Écoute gratuite, sans compte » : la vue `appMedia` appelle `requireAuth`, et son
 * en-tête l'écrit noir sur blanc — « pas d'abonnement à vérifier, seulement une session ».
 * Le pôle média est gratuit ; il n'est PAS accessible sans compte. La seconde étiquette,
 * « Continue écran verrouillé », annonce la fonction que le point 1 ci-dessus rend
 * impossible. Aucune des deux n'est portée.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranMedia(
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Profil",
        onRetour = onRetour,
        titre = "Écouter & regarder",
    ) {
        /*
         * ⭐ `SubNav` CHANGE DE LIEU, `Segmented` CHANGE DE VUE. Les deux entrées du kit sont
         * deux pôles de même rang : celui-ci, et le Club. La seconde est donc une vraie arête
         * de navigation, pas une bascule d'affichage.
         */
        SubNav(
            entrees = listOf(
                EntreeSubNav("Écouter & regarder"),
                EntreeSubNav("Le Club", jetons.mmViolet),
            ),
            actif = "Écouter & regarder",
            onSelect = { entree -> if (entree == "Le Club") onAller(ClubRoot) },
            modifier = Modifier.padding(top = 6.dp),
        )

        Eyebrow("Je te transforme · gratuit", Modifier.padding(top = 18.dp))
        Display(
            listOf("DES GENS D'ICI", "QUI RACONTENT"),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )
        Body(
            "Pas de méthode, pas de tutoriel — ça, c'est le blog. Ici, des gens qui vendent "
                + "vraiment quelque chose racontent ce qui a marché.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        /*
         * ⚠️ `Etat.NonBranche` EST UN ARGUMENT, PAS UNE CONSTANTE ENFOUIE. Le corps ci-dessous
         * traite les huit phases ; le jour où la lecture d'`appMedia` a son chemin — c'est-à-dire
         * le jour où un producteur de jeton d'identité est choisi —, c'est cette ligne, et elle
         * seule, qui change.
         */
        CorpsDuPole(
            etat = Etat.NonBranche,
            onAller = onAller,
            modifier = Modifier.padding(top = 20.dp),
        )

        EncartDeVerite(
            sourcil = "Ce que l'application ne change pas encore",
            texte = "Le kit promet ici qu'un épisode continue quand tu verrouilles ton "
                + "téléphone. Ce n'est pas vrai aujourd'hui : l'audio est publié sur une "
                + "plateforme d'écoute, aucune bibliothèque de lecture n'est embarquée, et "
                + "cet écran n'a donc pas de lecteur. Il t'ouvre l'épisode là où il est "
                + "publié, ce qui est la seule chose honnête qu'il puisse faire.",
            modifier = Modifier.padding(top = 18.dp),
        )
    }
}

@Composable
private fun CorpsDuPole(
    etat: Etat<VueMedia>,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxWidth()) {
        /*
         * ⚠️ `appMedia` est déclarée `vueNulle: "jamais"` au contrat : le serveur ne rend pas
         * `null` sur cette vue. Un pôle sans épisode et sans vidéo arrive donc en `Servie`
         * avec ses deux champs à `null` — le vide de contenu se lit sur les CHAMPS, pas sur
         * la phase.
         */
        if (etat is Etat.Servie<VueMedia>) {
            CartesDuPole(etat, onAller)
        } else {
            SansDonnees(
                etat = etat,
                quoi = "Le dernier épisode et la dernière vidéo",
                origine = "La vue « ${Vues.Noms.APP_MEDIA} » du serveur",
                degat = "Un épisode d'exemple mettrait dans la bouche d'un invité réel des "
                    + "propos qu'il n'a pas tenus, et annoncerait une durée et un poids que "
                    + "personne n'a mesurés — sur un forfait compté, un poids inventé décide "
                    + "à la place de quelqu'un.",
                hauteur = 3,
            )
        }

        /*
         * ⛔ CES DEUX LIGNES NE SONT PAS DÉCORATIVES : SANS ELLES, DEUX ÉCRANS CONSTRUITS NE
         * SONT ATTEINTS PAR RIEN.
         *
         * C'est le défaut du port React Native, à la lettre : 14 routes sur 51 existaient et
         * n'étaient ouvertes par aucun écran de production. La porte `natif-navigation` ne le
         * voit PAS — elle garde que toute destination déclarée est enregistrée au graphe, pas
         * qu'un écran l'ouvre. Elles sont donc rendues quelle que soit la phase : chacune mène
         * à un écran qui dit lui-même ce qu'il n'a pas.
         */
        Surface(Niveau.FLAT, Modifier.padding(top = 16.dp).fillMaxWidth(), rembourrage = 6.dp) {
            Column {
                LessonRow(
                    titre = "L'épisode du podcast",
                    etat = EtatLecon.PLAIN,
                    glyphe = "mic",
                    meta = "sa fiche, sa transcription et ce qu'elle coûte à charger",
                    onPress = { onAller(DestinationEpisode(REFERENCE_DERNIER)) },
                )
                LessonRow(
                    titre = "La vidéo",
                    etat = EtatLecon.PLAIN,
                    glyphe = "video",
                    meta = "sa fiche et son poids selon la qualité",
                    derniere = true,
                    onPress = { onAller(DestinationVideo(REFERENCE_DERNIER)) },
                )
            }
        }
    }
}

@Composable
private fun CartesDuPole(
    etat: Etat.Servie<VueMedia>,
    onAller: (Any) -> Unit,
) {
    val contexte = LocalContext.current
    var adresseOrpheline by remember { mutableStateOf<String?>(null) }
    val vue = etat.valeur

    /* Ouvre une adresse et retient celle qu'aucune application n'a su servir. */
    val sortir: (String) -> Unit = { adresse ->
        adresseOrpheline = if (ouvrirUneAdresse(contexte, adresse)) null else adresse
    }

    Column(Modifier.fillMaxWidth()) {
        val episode = vue.episode
        /* Une variable LOCALE, pour que la branche `else` puisse la donner à une lambda :
           une propriété d'un autre objet ne se transporte pas dans une fermeture. */
        val lienEpisode = episode?.lien
        when {
            episode == null -> Unit
            /*
             * ⛔ PAS DE CARTE SANS ADRESSE, ET LA RAISON EST DANS LE COMPOSANT. `MediaCard`
             * dessine TOUJOURS son disque de lecture ; passer `onLecture = null` le rend
             * inerte sans le retirer, c'est-à-dire exactement le contrôle mort que ce lot
             * existe pour ne plus produire. Un épisode sans adresse publiée se dit donc en
             * toutes lettres plutôt que sous un bouton qui ne fait rien.
             */
            lienEpisode == null -> SansAdresse(
                titre = episode.titre,
                sourcil = episode.eyebrow,
                quoi = "Cet épisode n'a pas d'adresse d'écoute publiée. Il n'y a donc rien à "
                    + "ouvrir, et rien à lire ici : l'application n'embarque pas de lecteur.",
                onFiche = { onAller(DestinationEpisode(REFERENCE_DERNIER)) },
                libelleFiche = "La transcription",
            )
            else -> MediaCard(
                titre = episode.titre,
                format = FormatMedia.AUDIO,
                sourcil = episode.eyebrow,
                corps = episode.chapo,
                /*
                 * ⛔ `cout` VIENT DU SERVEUR, ET IL EST SOUVENT PLUS COURT QUE LE KIT.
                 * Le kit écrit trois coûts (« 34:20 », « 31 Mo », « Transcription · 0 Mo ») ;
                 * la collection des épisodes ne porte aujourd'hui qu'une durée, parce que le
                 * fichier audio n'est pas le nôtre. Ce qui manque est ABSENT de la liste,
                 * jamais arrondi : le handler le dit, et l'écran n'y ajoute rien.
                 */
                couts = episode.cout,
                hauteurArt = 150.dp,
                /*
                 * ⚠️ LE DISQUE DE LECTURE OUVRE LA PLATEFORME D'ÉCOUTE, il ne lit pas. C'est
                 * le seul sens qu'il puisse avoir tant qu'aucune bibliothèque de lecture
                 * n'est déclarée — et il vaut mieux qu'il quitte l'application franchement
                 * que de tourner sur place.
                 */
                onLecture = { sortir(lienEpisode) },
                actions = {
                    Button(
                        "La transcription",
                        { onAller(DestinationEpisode(REFERENCE_DERNIER)) },
                        ton = TonBouton.QUIET,
                        pleineLargeur = false,
                    )
                },
            )
        }

        val video = vue.video
        val lienVideo = video?.lien
        when {
            video == null -> Unit
            lienVideo == null -> SansAdresse(
                titre = video.titre,
                sourcil = video.eyebrow,
                quoi = "Cette vidéo n'a pas d'adresse publiée. Elle est hébergée hors de la "
                    + "plateforme, et l'application ne la joue pas.",
                onFiche = { onAller(DestinationVideo(REFERENCE_DERNIER)) },
                libelleFiche = "La fiche de la vidéo",
                modifier = Modifier.padding(top = 12.dp),
            )
            else -> MediaCard(
                titre = video.titre,
                modifier = Modifier.padding(top = 12.dp),
                format = FormatMedia.VIDEO,
                sourcil = video.eyebrow,
                couts = video.cout,
                badge = "Vidéo",
                hauteurArt = 126.dp,
                onLecture = { sortir(lienVideo) },
                actions = {
                    Button(
                        "La fiche de la vidéo",
                        { onAller(DestinationVideo(REFERENCE_DERNIER)) },
                        ton = TonBouton.QUIET,
                        pleineLargeur = false,
                    )
                },
            )
        }

        if (episode == null && video == null) {
            /*
             * ⚠️ UN VIDE SERVI N'EST PAS UNE PANNE, et il est DATÉ. Le serveur a répondu :
             * rien n'est publié. La différence avec « on n'a pas pu lire » est toute
             * l'information, et `Provenance.asOf` est l'estampille que le SERVEUR a écrite.
             */
            Body(
                "Rien n'est publié pour l'instant — c'est une réponse du serveur, relevée "
                    + "le ${etat.provenance.asOf}, pas une lecture qui a échoué.",
                Modifier.fillMaxWidth(),
                grain = GrainCorps.CHAPO,
                couleur = jetons.textFaint,
            )
        }

        adresseOrpheline?.let { adresse ->
            Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                Column {
                    Eyebrow("Aucune application n'a répondu")
                    Body(
                        "Ce téléphone n'a ni navigateur ni application capable d'ouvrir cette "
                            + "adresse. L'épisode reste écoutable depuis n'importe quel autre "
                            + "appareil, ici :",
                        Modifier.padding(top = 6.dp),
                        attenue = true,
                    )
                    AdresseMono(adresse, Modifier.padding(top = 8.dp))
                }
            }
        }
    }
}

/**
 * Un média publié dont l'adresse manque.
 *
 * ⚠️ CE N'EST PAS UN ÉTAT VIDE : le serveur a répondu, la publication existe, c'est son
 * adresse qui manque. Le dire est une information — « rien n'est publié » en serait une
 * autre, et fausse.
 */
@Composable
private fun SansAdresse(
    titre: String,
    sourcil: String,
    quoi: String,
    onFiche: () -> Unit,
    libelleFiche: String,
    modifier: Modifier = Modifier,
) {
    Surface(Niveau.FLAT, modifier.fillMaxWidth(), rembourrage = 18.dp) {
        Column {
            Eyebrow(sourcil)
            Display(titre, cran = CranDisplay.XS, modifier = Modifier.padding(top = 7.dp))
            Body(quoi, Modifier.padding(top = 9.dp), attenue = true)
            Button(
                libelleFiche,
                onFiche,
                Modifier.padding(top = 14.dp),
                ton = TonBouton.QUIET,
                pleineLargeur = false,
            )
        }
    }
}

/**
 * ⛔ LE SEUL IDENTIFIANT QUE CETTE APPLICATION PEUT PRODUIRE, ET IL N'EN EST PAS UN.
 *
 * Les destinations `Episode` et `Video` portent un identifiant, comme le veut la
 * spécification. Le contrat, lui, n'a AUCUNE vue par épisode ni par vidéo : `appMedia` sert
 * le DERNIER épisode et la DERNIÈRE vidéo publiés, et sa réponse ne porte pas d'identifiant
 * du tout — ni `id`, ni `slug`. Il n'existe donc rien à passer.
 *
 * ⚠️ TROIS ISSUES ÉTAIENT POSSIBLES, ET CELLE-CI EST LA MOINS MENTEUSE. Rendre l'argument
 * nullable ferait croire qu'un identifiant existera un jour par ce chemin ; ne pas ouvrir
 * ces écrans les laisserait orphelins, qui est le défaut d'origine ; inventer un identifiant
 * en fabriquerait un que rien ne résout. Cette constante NOMME ce que l'application demande
 * réellement — « le dernier, celui qu'`appMedia` sert » — et se supprime le jour où une vue
 * par épisode existe. Elle n'est comparée à rien et ne part sur aucun réseau.
 */
internal const val REFERENCE_DERNIER: String = "dernier"
