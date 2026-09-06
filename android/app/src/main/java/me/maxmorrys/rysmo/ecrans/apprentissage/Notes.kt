package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.ChipRow
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.DispositionChips
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EmptyState
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonTag
import me.maxmorrys.rysmo.ecrans.LocalSession
import me.maxmorrys.rysmo.ecrans.vue
import me.maxmorrys.rysmo.donnees.Notes as VueNotes

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
 * (`appNotes`). Ce qui manque n'est pas la callable, et ce n'est PLUS l'identité — elle est
 * branchée depuis le 06/09, et cet écran LIT sa vue. Ce qui manque est le chemin d'ÉCRITURE :
 * `PorteeIdentifiee.appelOuNull` existe, aucun écran ne s'en sert encore, et rien ne périme
 * `appNotes` après coup. Un « Enregistrer » qui part sans que la liste se relise afficherait
 * pendant trente secondes une liste où la note qu'on vient d'écrire n'est pas.
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
    session: Session = LocalSession.current,
) {
    /*
     * ⛔ `leconId` NE FILTRE RIEN, ET LE CONTRAT L'EXPLIQUE. `appNotes` ne prend AUCUN
     * paramètre, et `Note` ne porte pas l'identifiant de sa leçon : le serveur compose une
     * chaîne « 04/09 · 21:14 · <leçon> » dans `date` et garde `lessonId` pour lui
     * (`notes.ts:47-63`). Filtrer sur ce libellé reviendrait à comparer des phrases mises en
     * forme — un tri qui se casserait au premier renommage de leçon, en silence.
     *
     * L'argument reste utile pour autre chose : il dit d'où l'on vient, donc quel retour
     * annoncer, et c'est ce que le sourcil en fait.
     */
    val lu = vue<VueNotes>(Vues.Noms.APP_NOTES, session)
    val etat = lu.etat
    val notes: VueNotes? = if (etat is Etat.Servie) etat.valeur else null

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
             * ⭐ LE COMPTE EST DEUX NOMBRES, ET LE SECOND EST L'INFORMATION.
             *
             * ⚠️ ET IL N'EST RENDU QUE SERVI. « 0 notes » affiché sans avoir compté se lirait
             * comme une PERTE — un zéro sans date n'est pas une information. Tant que la
             * réponse n'est pas là, la phrase qui remplace le compte n'affirme aucun nombre.
             *
             * « 14 notes · 6 leçons » ne dit pas la même chose que « 14 notes » : le second
             * compte les leçons DISTINCTES annotées, c'est-à-dire s'il s'agit de notes prises
             * partout ou d'un acharnement sur un seul chapitre. Le couple passe par `Num`,
             * donc daté par la réponse qui l'a rapporté.
             */
            if (notes != null && etat is Etat.Servie) {
                Num(
                    valeur = "${notes.total.notes} notes · ${notes.total.lecons} leçons",
                    source = Vues.Noms.APP_NOTES,
                    asOf = etat.provenance.asOf,
                    taille = 13.sp,
                )
            } else {
                Body(
                    "Elles te suivent d'un appareil à l'autre.",
                    grain = GrainCorps.CHAPO,
                )
            }
            /* Ce n'est pas une mesure mais une POLITIQUE, vraie dès aujourd'hui : les notes se
               rangent sur l'inscription de leur autrice, et aucune vue ne les expose ailleurs.
               Elle est placée là où quelqu'un se demande si ce qu'il écrit sera vu. */
            Tag("Toi seule les lis", TonTag.NEUTRAL)
        }

        /*
         * ⛔ CE QUI EST AFFICHÉ N'EST PAS FILTRÉ, ET IL FAUT LE DIRE À L'ENDROIT OÙ QUELQU'UN
         * S'ATTEND AU CONTRAIRE. On arrive ici depuis une leçon, on voit toutes ses notes : sans
         * cette phrase, la liste se lit comme les notes de CETTE leçon, et une note d'un autre
         * cours s'y lirait comme une note prise ici.
         */
        if (leconId != null) {
            Body(
                "Toutes tes notes, pas seulement celles de cette leçon : la vue du serveur ne "
                    + "sait pas les trier par leçon.",
                Modifier.padding(top = 10.dp),
                attenue = true,
            )
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

        if (notes == null || etat !is Etat.Servie) {
            SansDonnees(
                etat = etat,
                quoi = "Tes notes",
                origine = "La vue « ${Vues.Noms.APP_NOTES} » du serveur",
                degat = "Une note inventée met une phrase dans ta bouche. C'est le seul contenu du "
                    + "produit que personne d'autre que toi n'a écrit.",
                modifier = Modifier.padding(top = 16.dp),
                hauteur = 4,
                reprise = lu.reprendre,
            )
        } else if (notes.notes.isEmpty()) {
            /* ⭐ `appNotes` est déclarée `vueNulle: "jamais"` : une absence de notes arrive en
               `Servie` avec zéro élément, jamais en `Vide`. Le vide se lit donc sur la LISTE,
               et il est daté par la réponse qui l'a rapporté. */
            Surface(Niveau.FLAT, Modifier.padding(top = 16.dp).fillMaxWidth(), rembourrage = 6.dp) {
                EmptyState(
                    titre = "Tu n'as encore écrit aucune note.",
                    glyphe = "bookmark",
                    corps = "Relevé le ${etat.provenance.asOf}. Une note se prend pendant "
                        + "une leçon, et elle te survit à la formation.",
                )
            }
        } else {
            Surface(Niveau.FLAT, Modifier.padding(top = 16.dp).fillMaxWidth(), rembourrage = 18.dp) {
                Column {
                    notes.notes.forEach { note ->
                        /* ⛔ LA CLÉ EST L'IDENTIFIANT DE LA NOTE, JAMAIS SON TEXTE. Deux notes
                           peuvent porter la même phrase — « à revoir » —, et `key = texte` les
                           ferait s'effondrer l'une sur l'autre, exactement comme `key = auteur`
                           l'a déjà fait sur les publications de ce dépôt. */
                        key(note.id) { LigneDeNote(note.texte, note.date, etat.provenance.asOf) }
                    }
                }
            }
        }

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

/**
 * Une note, telle qu'elle a été écrite.
 *
 * ⚠️ `date` N'EST PAS TOUJOURS UNE DATE, ET LE CONTRAT LE DIT EN TOUTES LETTRES : `appNotes`
 * y compose « 04/09 · 21:14 · <leçon> » tandis que l'écriture `ecrireUneNote` y met le
 * LIBELLÉ DE LA LEÇON seul. La contradiction est côté serveur et le contrat la NOMME plutôt
 * que de la corriger. L'écran ne peut donc pas la traiter comme une date — il la rend telle
 * quelle, en méta, et n'en déduit rien.
 *
 * ⛔ ET QUAND ELLE MANQUE, C'EST LE RELEVÉ QUI DATE LA NOTE. Écrire une note sans repère
 * temporel obligerait à rouvrir chaque leçon pour retrouver de quoi elle parle ; inventer un
 * horodatage depuis l'horloge du téléphone serait pire — ce serait la présenter comme mesurée.
 */
@Composable
private fun LigneDeNote(texte: String, quand: String?, asOf: String) {
    Column(Modifier.padding(vertical = 10.dp)) {
        Num(
            valeur = quand,
            source = Vues.Noms.APP_NOTES,
            asOf = asOf,
            taille = 11.5.sp,
            repli = "sans repère de leçon",
        )
        Body(texte, Modifier.padding(top = 6.dp), grain = GrainCorps.PROSE)
    }
}
