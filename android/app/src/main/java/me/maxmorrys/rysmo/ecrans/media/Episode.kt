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
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.donnees.Media as VueMedia
import me.maxmorrys.rysmo.navigation.Notes as DestinationNotes
import me.maxmorrys.rysmo.systeme.partagerUnTexte

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉPISODE — kit `NatMediaEpisode` (`ScreensNatifMedia.js:92-144`).
 *
 * ⛔ LE KIT MET AU CENTRE DE CET ÉCRAN CE QUE LE PRODUIT NE PEUT PAS FAIRE. Il y dessine un
 * bloc de lecture en dégradé (« −15 », un rond de pause de 62 px, « +15 », une piste), un
 * bouton « Télécharger · 31 Mo » et un bouton « 1× », en écrivant que ce sont « deux choses
 * qu'un navigateur ne garde pas ». Aucune n'est portée, et ce n'est pas une omission :
 *
 *   · il n'y a pas de lecteur — `media3` est au catalogue de versions, pas en dépendance ;
 *   · il n'y a pas de fichier — `Episode.lien` est l'adresse d'une plateforme d'écoute ;
 *   · il n'y a donc pas de poids : le handler ne compose `cout` qu'avec ce que la base
 *     porte, et il n'y a « ni fichier ni poids à annoncer » tant que l'audio n'est pas
 *     ré-hébergé. Le « 31 Mo » du kit est une valeur de maquette.
 *
 * Un rond de pause qui ne met rien en pause n'est pas une fonction dégradée, c'est un
 * contrôle mort. Il n'est pas dessiné.
 *
 * ── ⛔ LA TRANSCRIPTION N'EST PAS HORODATÉE, ET LE CONTRAT LE DIT ──────────────────────
 * Le kit rend quatre lignes « 00:42 · … », « 04:18 · … ». Le modèle ne porte qu'un texte,
 * éventuellement en markdown, et le handler écrit lui-même pourquoi : c'est « une forme que
 * le modèle ne porte pas et qui ne se déduit d'aucun champ ». Inventer des minutages ferait
 * pointer quelqu'un vers une seconde où l'invitée ne dit pas ce qu'on annonce.
 *
 * ⭐ EN REVANCHE LA TRANSCRIPTION EST LA PORTE D'ENTRÉE, ET ELLE, ELLE EST RÉELLE : elle se
 * lit sans charger l'audio. C'est la décision du web, et sur un forfait compté ce n'est pas
 * un complément.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranEpisode(
    episodeId: String,
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current

    /*
     * ⚠️ `Etat.NonBranche` EST UN ARGUMENT. Et pour cet écran-là, il recouvre DEUX manques
     * distincts, qu'il ne faut pas confondre : l'identification n'est pas branchée (comme
     * partout dans ce lot), ET le contrat n'a aucune vue par épisode (ce qui est propre à
     * cet écran). Le second ne se lèvera pas en choisissant un producteur de jeton.
     */
    val etat: Etat<VueMedia> = Etat.NonBranche

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Écouter",
        onRetour = onRetour,
        /*
         * ⛔ PAS DE « ÉPISODE 1 » ÉCRIT EN DUR. Le kit le fait, le port l'a recopié, et la
         * spécification le compte parmi ses infidélités mesurées : le titre était le même
         * quel que soit l'épisode ouvert. Tant qu'aucun épisode n'est lu, la barre porte le
         * nom de l'objet, pas un numéro qu'on n'a pas.
         */
        titre = (etat as? Etat.Servie<VueMedia>)?.valeur?.episode?.titreCourt ?: "L'épisode",
        droite = {
            /*
             * ⭐ LE PARTAGE EST LA SEULE ACTION NATIVE QUE CET ÉCRAN GAGNE VRAIMENT, et il
             * n'exige aucune dépendance. Il n'est proposé que s'il y a une adresse à
             * partager : partager le titre seul enverrait un message dont on ne peut rien
             * faire.
             */
            val lien = (etat as? Etat.Servie<VueMedia>)?.valeur?.episode?.lien
            if (lien != null) {
                IconButton(libelle = "Partager l'épisode", onPress = {
                    partagerUnTexte(
                        contexte,
                        "Un épisode du podcast Rysmo",
                        lien,
                    )
                }) {
                    Icon("share", description = null, taille = 17.dp, epaisseur = 2f)
                }
            }
        },
    ) {
        Eyebrow("Podcast", Modifier.padding(top = 6.dp))
        Display(
            listOf("CE QUI S'EST", "DIT AU MICRO."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )

        CorpsDeLEpisode(
            etat = etat,
            episodeId = episodeId,
            onAller = onAller,
            modifier = Modifier.padding(top = 20.dp),
        )

        EncartDeVerite(
            sourcil = "Pourquoi il n'y a pas de commandes de lecture",
            texte = "L'audio n'est pas hébergé par la plateforme : il est publié ailleurs, et "
                + "l'application n'embarque aucune bibliothèque de lecture. Des boutons de "
                + "lecture, de vitesse et de téléchargement seraient donc quatre promesses "
                + "qu'aucun code ne tient. Ils reviendront le jour où le fichier sera à nous.",
            modifier = Modifier.padding(top = 18.dp),
        )
    }
}

@Composable
private fun CorpsDeLEpisode(
    etat: Etat<VueMedia>,
    episodeId: String,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxWidth()) {
        val servie = etat as? Etat.Servie<VueMedia>
        val episode = servie?.valeur?.episode

        if (episode == null) {
            SansDonnees(
                etat = etat,
                quoi = "Cet épisode",
                /*
                 * ⛔ ON NOMME LA VUE QUI MANQUE, PAS CELLE QU'ON VOUDRAIT. Il n'existe AUCUNE
                 * vue par épisode au contrat : `appMedia` sert le DERNIER épisode publié, sans
                 * identifiant. C'est ce manque-là qu'il faut lire ici, sinon on ira chercher
                 * un défaut de branchement là où il y a un trou de contrat.
                 */
                origine = "La vue « ${Vues.Noms.APP_MEDIA} » du serveur, qui sert le dernier "
                    + "épisode publié — le contrat n'a aucune vue par épisode",
                degat = "Une transcription d'exemple attribuerait à une invitée réelle des "
                    + "propos qu'elle n'a pas tenus. C'est le pire mensonge possible sur un "
                    + "écran dont tout le contenu est la parole de quelqu'un d'autre.",
                hauteur = 4,
            )

            /*
             * ⚠️ UN IDENTIFIANT QU'ON NE SAIT PAS RÉSOUDRE SE DIT. `REFERENCE_DERNIER` est le
             * seul que cette application produise ; tout autre viendrait d'ailleurs — un lien
             * profond futur, une notification — et resterait sans destinataire. Le taire
             * ferait passer un trou de contrat pour un épisode introuvable.
             */
            if (episodeId != REFERENCE_DERNIER) {
                Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                    Column {
                        Eyebrow("Cet identifiant n'a pas de destinataire")
                        Body(
                            "L'application a reçu une référence d'épisode, et aucune vue du "
                                + "serveur n'accepte une référence d'épisode. Ce n'est pas "
                                + "que l'épisode est introuvable : c'est que personne ne sait "
                                + "le chercher.",
                            Modifier.padding(top = 6.dp),
                            attenue = true,
                        )
                        AdresseMono(episodeId, Modifier.padding(top = 8.dp))
                    }
                }
            }
        } else {
            Eyebrow(episode.eyebrow)
            Display(episode.titre, cran = CranDisplay.XS, modifier = Modifier.padding(top = 7.dp))

            /*
             * La ligne mono du kit — date, durée, invitée. Elle se compose de ce qui EXISTE :
             * ce qui manque est absent, jamais comblé. Le sourcil porte déjà la date.
             */
            val ligne = listOfNotNull(
                episode.duree,
                episode.invitee?.let { "avec $it" },
            )
            if (ligne.isNotEmpty()) {
                AdresseMono(ligne.joinToString(" · "), Modifier.padding(top = 10.dp))
            }

            episode.chapo?.let { chapo ->
                Body(chapo, Modifier.padding(top = 12.dp), grain = GrainCorps.CHAPO)
            }

            Transcription(episode.transcription, Modifier.padding(top = 18.dp))
        }

        /*
         * ⛔ SANS CE BOUTON, L'ÉCRAN DES NOTES N'EST ATTEINT QUE DEPUIS UNE LEÇON. La
         * spécification lui donne deux parents — la leçon ET l'épisode —, et une note prise
         * en écoutant est exactement le cas d'usage que le kit met dans son `Segmented`.
         *
         * ⚠️ MAIS PAS DANS UN `Segmented` : celui-ci change de VUE sur le même lieu, et les
         * notes sont un autre écran. Le kit y met trois onglets dont un — « Chapitres » — que
         * le modèle ne porte pas du tout.
         */
        Button(
            "Mes notes",
            { onAller(DestinationNotes()) },
            Modifier.padding(top = 16.dp),
            ton = TonBouton.QUIET,
        )
    }
}

/**
 * La transcription, en paragraphes.
 *
 * ⚠️ LE TEXTE EST RENDU TEL QUEL, MARKDOWN COMPRIS. Le modèle annonce « éventuellement en
 * markdown » ; l'interpréter demanderait un analyseur que ce paquet n'a pas, et le
 * caviarder retirerait du sens. Les lignes vides séparent les paragraphes, ce que tout
 * markdown respecte.
 */
@Composable
private fun Transcription(texte: String?, modifier: Modifier = Modifier) {
    if (texte.isNullOrBlank()) {
        Surface(Niveau.FLAT, modifier.fillMaxWidth(), rembourrage = 16.dp) {
            Column {
                Eyebrow("Pas de transcription")
                Body(
                    "Cet épisode n'a pas encore de transcription écrite. C'est un manque de "
                        + "contenu, pas une panne : rien n'a échoué en la demandant.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
            }
        }
        return
    }
    Column(modifier.fillMaxWidth()) {
        Eyebrow("La transcription")
        Body(
            "Elle se lit sans charger l'audio. Sur un forfait compté, ce n'est pas un "
                + "complément : c'est la porte d'entrée.",
            Modifier.padding(top = 6.dp),
            grain = GrainCorps.CHAPO,
            couleur = jetons.textFaint,
        )
        Surface(Niveau.FLAT, Modifier.padding(top = 10.dp).fillMaxWidth(), rembourrage = 16.dp) {
            Column {
                texte.split(Regex("\n{2,}")).filter { it.isNotBlank() }.forEachIndexed { i, para ->
                    Body(
                        para.trim(),
                        if (i == 0) Modifier else Modifier.padding(top = 12.dp),
                        grain = GrainCorps.PROSE,
                    )
                }
            }
        }
    }
}
