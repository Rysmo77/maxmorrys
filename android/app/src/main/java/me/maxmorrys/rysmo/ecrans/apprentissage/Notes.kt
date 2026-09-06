package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
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
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonTag

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * MES NOTES — kit `NatNotes` (`ScreensNatifApp.js:250-297`).
 *
 * ⛔ PAS DE BOUTON FLOTTANT, ET C'EST LA DÉCISION LA PLUS COÛTEUSE DE CET ÉCRAN.
 *
 * Le kit en fait la signature de la page : c'est le SEUL écran du lot qui en a un, parce que
 * c'est le seul dont l'action principale est « en créer une de plus », à n'importe quel
 * endroit de la liste. Le retirer coûte de la fidélité, et il faut dire pourquoi.
 *
 * `ecrireUneNote` existe côté serveur et figure au contrat, avec ce qu'elle périme
 * (`appNotes`). Ce qui manque n'est pas la callable : c'est le chemin qui va d'un geste
 * d'écran à un appel authentifié — aucun producteur de jeton d'identité n'est choisi, la
 * session rend `NonConfiguree`, et un « Enregistrer » aboutirait à une panne de configuration.
 *
 * ⚠️ LE PORT A PARCOURU LES TROIS ÉTAGES DE CETTE FAUTE, ET ILS SONT INSTRUCTIFS :
 *   1 · un bouton flottant sans gestionnaire — il ne se passait rien ;
 *   2 · puis une alerte disant que l'écriture « arrive avec ton compte » — le compte était
 *       branché, la phrase était devenue fausse ;
 *   3 · puis un `Alert.prompt`, QUI N'EXISTE QUE SUR iOS : sur Android, l'appel optionnel ne
 *       faisait rien du tout. Le contrôle mort venait d'être supprimé et il était recréé sur
 *       une seule plateforme, donc invisible à qui relit sur l'autre.
 *
 * Un bouton rond de 56 px, ancré au-dessus de la barre d'onglets, qui ouvre un champ dont
 * « Enregistrer » ne peut pas enregistrer, est le quatrième étage. Il n'est pas construit.
 * Le jour où l'écriture a son chemin, ce fichier retrouve son `Fab` — le design system en
 * porte déjà un (`ds/Actions.kt`), avec sa forme par plateforme et sa hauteur d'ancrage.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
private val VUES_DE_LECON = listOf("Vidéo", "Transcription", "Mes notes", "Ressources")

@Composable
fun EcranNotes(
    leconId: String?,
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Leçon",
        onRetour = onRetour,
        titre = "Mes notes",
        /*
         * ⛔ PAS DE LOUPE DANS LA BARRE HAUTE. Le kit et le port en posent une ; celle du port
         * était `disabled`. Chercher dans ses notes suppose d'en avoir, et suppose surtout un
         * champ de recherche que rien ne peut alimenter tant que `appNotes` n'est pas lue.
         */
    ) {
        Eyebrow(
            if (leconId == null) "Tes notes" else "Depuis une leçon",
            Modifier.padding(top = 6.dp),
        )
        Display(listOf("MES NOTES."), cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))

        Row(
            Modifier.padding(top = 10.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            /*
             * ⛔ LE COMPTE N'EST PAS RENDU. Le kit écrit « 14 notes · 6 leçons ». Un compte
             * s'obtient de `Notes.total`, et « 0 notes » affiché sans avoir compté se lit
             * comme une PERTE — c'est la règle du dispositif : un zéro sans date n'est pas
             * une information. `SansDonnees`, plus bas, dit qu'on n'a pas compté.
             */
            Body(
                "Elles te suivent d'un appareil à l'autre.",
                grain = GrainCorps.CHAPO,
            )
            /* Ce n'est pas une mesure mais une POLITIQUE, vraie dès aujourd'hui : les notes se
               rangent sur l'inscription de leur autrice, et aucune vue ne les expose ailleurs.
               Elle est placée là où quelqu'un se demande si ce qu'il écrit sera vu. */
            Tag("Toi seule les lis", TonTag.NEUTRAL)
        }

        ChipRow(
            options = VUES_DE_LECON,
            valeur = "Mes notes",
            /* Les trois autres vues vivent dans l'écran de leçon : on y REVIENT, on ne les
               rouvre pas par-dessus — sinon la pile s'allonge d'un aller-retour à chaque
               changement d'onglet, et le retour système remonte l'historique au lieu de sortir. */
            onChange = { choix -> if (choix != "Mes notes") onRetour() },
            modifier = Modifier.padding(top = 16.dp),
            hauteur = 36.dp,
            disposition = DispositionChips.SCROLL,
        )

        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Tes notes",
            origine = "La vue « ${Vues.Noms.APP_NOTES} » du serveur",
            degat = "Une note inventée met une phrase dans ta bouche. C'est le seul contenu du "
                + "produit que personne d'autre que toi n'a écrit.",
            modifier = Modifier.padding(top = 16.dp),
            hauteur = 4,
        )

        EncartDeVerite(
            sourcil = "Ce qu'elles deviennent",
            texte = "Elles survivent à la fin du cours et te suivent d'un appareil à l'autre. "
                + "Écrire une note rapporte de l'expérience ; la rééditer n'en rapporte pas.",
            modifier = Modifier.padding(top = 16.dp),
        )

        EncartDeVerite(
            sourcil = "Pourquoi il n'y a pas de bouton d'ajout",
            texte = "L'écriture « ecrireUneNote » existe côté serveur, et le chemin qui y mène "
                + "depuis un écran n'existe pas encore. Un bouton flottant dont "
                + "« Enregistrer » ne peut pas enregistrer perdrait la note qu'on venait "
                + "d'écrire — et c'est la seule chose ici que personne d'autre ne peut réécrire.",
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}
