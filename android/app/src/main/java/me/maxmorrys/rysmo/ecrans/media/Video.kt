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
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.donnees.Media as VueMedia

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA VIDÉO — ⛔ LE KIT NE DESSINE PAS CET ÉCRAN.
 *
 * `NatMediaPole` pose une `MediaCard` de format vidéo et ne lui donne AUCUNE destination :
 * la carte est décorative dans la maquette. Le port React Native, lui, avait une route
 * `/video` — et il y poussait **sans aucun de ses sept paramètres**, ce que la spécification
 * compte parmi ses infidélités mesurées. L'écran s'ouvrait donc toujours vide.
 *
 * ⚠️ CE QUI EST CONSTRUIT ICI EST DONC UNE DÉCISION, PAS UN PORTAGE. Elle tient en une
 * phrase : la vidéo n'est pas hébergée par la plateforme, l'application ne peut ni la lire
 * ni la télécharger, et la seule chose vraie qu'un écran puisse faire est de dire CE QU'ELLE
 * COÛTE À REGARDER, puis de l'ouvrir là où elle est publiée.
 *
 * ⭐ ET LE COÛT EST L'INFORMATION. Le handler compose « 18:04 », « 96 Mo en HD »,
 * « 24 Mo en 480p » à partir de ce que la base porte, et il écrit pourquoi : sur ce marché,
 * c'est ce qui décide de regarder maintenant ou d'attendre le Wi-Fi. Aucun de ces nombres
 * n'est estimé — ce qui manque est absent de la liste, jamais arrondi. L'écran n'en ajoute
 * aucun.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranVideo(
    videoId: String,
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    var adresseOrpheline by remember { mutableStateOf<String?>(null) }

    /* Même remarque que pour l'épisode : le contrat n'a pas de vue par vidéo. `appMedia`
       sert la DERNIÈRE vidéo publiée, et sa réponse ne porte pas d'identifiant. */
    val etat: Etat<VueMedia> = Etat.NonBranche
    val video = (etat as? Etat.Servie<VueMedia>)?.valeur?.video

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Écouter",
        onRetour = onRetour,
        titre = "La vidéo",
    ) {
        Eyebrow("Vidéo", Modifier.padding(top = 6.dp))
        Display(
            listOf("CE QUI SE VOIT", "MIEUX QU'IL NE", "S'EXPLIQUE."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )

        if (video == null) {
            SansDonnees(
                etat = etat,
                quoi = "Cette vidéo",
                origine = "La vue « ${Vues.Noms.APP_MEDIA} » du serveur, qui sert la dernière "
                    + "vidéo publiée — le contrat n'a aucune vue par vidéo",
                degat = "Annoncer un poids « en HD » et un poids « en 480p » qu'on n'a pas "
                    + "mesurés déciderait à la place de quelqu'un qui compte ses mégaoctets.",
                modifier = Modifier.padding(top = 20.dp),
                hauteur = 3,
            )
            if (videoId != REFERENCE_DERNIER) {
                Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                    Column {
                        Eyebrow("Cet identifiant n'a pas de destinataire")
                        Body(
                            "Aucune vue du serveur n'accepte une référence de vidéo. La vidéo "
                                + "n'est pas introuvable : personne ne sait la chercher.",
                            Modifier.padding(top = 6.dp),
                            attenue = true,
                        )
                        AdresseMono(videoId, Modifier.padding(top = 8.dp))
                    }
                }
            }
        } else {
            Eyebrow(video.eyebrow, Modifier.padding(top = 20.dp))
            Display(video.titre, cran = CranDisplay.XS, modifier = Modifier.padding(top = 7.dp))

            if (video.cout.isNotEmpty()) {
                Surface(
                    Niveau.FLAT,
                    Modifier.padding(top = 14.dp).fillMaxWidth(),
                    rembourrage = 16.dp,
                ) {
                    Column {
                        Eyebrow("Ce que ça coûte à regarder")
                        video.cout.forEach { cout ->
                            AdresseMono(cout, Modifier.padding(top = 6.dp))
                        }
                        Body(
                            "Ces valeurs viennent de la fiche de la vidéo. Celles qui manquent "
                                + "ne sont pas estimées : elles sont simplement absentes.",
                            Modifier.padding(top = 10.dp),
                            grain = GrainCorps.CHAPO,
                            couleur = jetons.textFaint,
                        )
                    }
                }
            }

            val lien = video.lien
            if (lien != null) {
                Button(
                    "Regarder sur la plateforme",
                    {
                        adresseOrpheline = if (ouvrirUneAdresse(contexte, lien)) null else lien
                    },
                    Modifier.padding(top = 16.dp),
                    ton = TonBouton.TRANSFORME,
                    glypheQueue = "external",
                )
            } else {
                Body(
                    "Cette vidéo n'a pas d'adresse publiée. Il n'y a donc rien à ouvrir.",
                    Modifier.padding(top = 16.dp),
                    attenue = true,
                )
            }

            adresseOrpheline?.let { adresse ->
                Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                    Column {
                        Eyebrow("Aucune application n'a répondu")
                        Body(
                            "Ce téléphone n'a rien qui sache ouvrir cette adresse. Elle reste "
                                + "valable depuis n'importe quel autre appareil :",
                            Modifier.padding(top = 6.dp),
                            attenue = true,
                        )
                        AdresseMono(adresse, Modifier.padding(top = 8.dp))
                    }
                }
            }
        }

        EncartDeVerite(
            sourcil = "Pourquoi la vidéo s'ouvre ailleurs",
            texte = "Elle est hébergée hors de la plateforme, et l'application n'embarque "
                + "aucun lecteur. Le geste QUITTE donc l'application — c'est ce que dit le "
                + "glyphe du bouton — et le retour du système te ramènera ici.",
            modifier = Modifier.padding(top = 18.dp),
        )
    }
}
