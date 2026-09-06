package me.maxmorrys.rysmo.ecrans.compte

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.Degrade
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.Typo
import me.maxmorrys.rysmo.ds.fondDegrade
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.OngletPrincipal
import me.maxmorrys.rysmo.navigation.Catalogue
import me.maxmorrys.rysmo.navigation.ClubRoot
import me.maxmorrys.rysmo.navigation.Espace
import me.maxmorrys.rysmo.navigation.Profil
import me.maxmorrys.rysmo.navigation.Repetiteur

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ERREUR — kit `NatErreur` (`ScreensNatifEtats.js:230-258`).
 *
 * ⭐ MOTIF, CONSÉQUENCE, SORTIE. DANS CET ORDRE, ET JAMAIS D'EXCUSE. L'ordre n'est pas
 * rhétorique, il suit ce que la personne se demande :
 *
 *   1 · LE MOTIF        « pourquoi ça n'a pas marché » — un fait, pas « une erreur est survenue ».
 *   2 · LA CONSÉQUENCE  « qu'est-ce que j'ai perdu » — souvent : rien, et il faut le dire.
 *   3 · LA SORTIE       « qu'est-ce que je fais maintenant ».
 *
 * « Désolé » n'apporte rien : ça occupe la ligne où devrait être le motif.
 *
 * ⭐ C'EST LA SEULE DESTINATION D'ÉTAT DU GRAPHE, ET ELLE EST DÉJÀ UTILISÉE.
 * `navigation/Graphe.kt` y envoie les gestes de modération qui ne peuvent pas partir —
 * signaler, bloquer, débloquer — avec un titre, un motif, une conséquence et la référence de
 * la personne visée. Les six champs ne sont donc pas une page libre : ils sont un CONTRAT
 * qu'un appelant remplit déjà.
 *
 * ⛔ AUCUN DES SIX CHAMPS N'A DE VALEUR PAR DÉFAUT INVENTÉE, ET C'EST LA CORRECTION D'UNE
 * CONTRADICTION DU PORT. `erreur.tsx` écrivait, en commentaire : « Un écran d'erreur qui
 * affiche toujours le même motif est un écran qui n'en donne aucun » — puis posait en dur,
 * juste en dessous, « La vidéo a mis plus de 30 secondes à répondre » comme motif de repli.
 * Un geste de modération refusé affichait donc une panne de vidéo. Ici, un champ absent
 * retire sa section ; il n'en fabrique pas le contenu.
 *
 * ⛔ ET LA SORTIE DE SECOURS DU KIT N'EST PAS REPRISE. « Lire la transcription à la place ·
 * 0 Mo à charger » suppose une transcription DÉJÀ sur l'appareil : il n'existe aucun
 * dispositif de téléchargement, et la vidéo de leçon n'est même pas un fichier
 * (`_bmad-output/implementation-artifacts/constat-hors-ligne.md`). Le bouton le plus
 * rassurant de l'écran serait le seul à ne mener nulle part.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⛔ `sortie` NE PEUT PAS ÊTRE UN CHEMIN, ET C'EST UNE CONSÉQUENCE DES DESTINATIONS TYPÉES.
 *
 * Le port écrivait `router.replace(sortie as never)` : n'importe quelle chaîne y passait, et
 * `as never` disait tout haut que le typage avait été contourné. Ici, une destination est un
 * TYPE : aucune chaîne écrite par un appelant ne peut en désigner une, et c'est précisément
 * ce qui empêche un lien mort d'exister.
 *
 * `sortie` nomme donc l'un des cinq onglets — les seuls endroits où l'on peut toujours
 * repartir depuis n'importe quelle erreur. Un nom hors de ce vocabulaire ne fait pas
 * apparaître un bouton muet : l'écran le DIT.
 *
 * ⚠️ Cette table est le jumeau de celle, privée, de `navigation/Graphe.kt`. Deux exemplaires
 * de cinq lignes, c'est deux chances de dériver — à unifier quand le graphe sera câblé, en
 * exposant la conversion une seule fois.
 */
private fun destinationDeLOnglet(onglet: OngletPrincipal): Any = when (onglet) {
    OngletPrincipal.ESPACE -> Espace
    OngletPrincipal.COURS -> Catalogue
    OngletPrincipal.REPETITEUR -> Repetiteur
    OngletPrincipal.CLUB -> ClubRoot
    OngletPrincipal.PROFIL -> Profil
}

/**
 * L'onglet nommé par `sortie`, ou `null` si le nom ne désigne rien.
 *
 * ⚠️ La comparaison ignore la casse ET les accents, parce qu'un appelant qui écrit
 * « repetiteur » sans accent ne mérite pas un cul-de-sac. Elle ne devine rien de plus : une
 * correspondance approximative rendrait imprévisible ce que le bouton ouvre.
 */
private fun ongletNomme(sortie: String): OngletPrincipal? {
    val cible = sansAccents(sortie.trim())
    return OngletPrincipal.entries.firstOrNull { sansAccents(it.libelle) == cible }
}

/**
 * ⛔ `Normalizer` ET PAS UN `replace` PAR LETTRE. La table écrite à la main oublie toujours
 * une lettre — et sur ce produit ce serait « é », c'est-à-dire « Répétiteur », le seul des
 * cinq onglets qui en porte.
 */
private fun sansAccents(texte: String): String =
    java.text.Normalizer.normalize(texte, java.text.Normalizer.Form.NFD)
        .replace(Regex("\\p{Mn}+"), "")
        .lowercase()

/**
 * Le titre reçu, coupé en deux lignes.
 *
 * ⛔ UN TITRE D'AFFICHAGE NE SE REPLIE JAMAIS TOUT SEUL (`ds/Typo.kt` : une ligne de texte
 * par entrée, `maxLines = 1`, débordement VISIBLE). Un titre qui arrive par la route doit
 * donc être coupé ici, ou il déborde de l'écran sans être tronqué — le défaut se verrait,
 * mais il se verrait chez la personne.
 */
private fun lignesDuTitre(titre: String?): List<String> {
    val propre = titre?.trim().orEmpty()
    /* ⚠️ Le repli ne DIAGNOSTIQUE rien. Le port repliait sur « La leçon ne s'est pas
       chargée. » — un titre de leçon affiché sur un blocage de membre. */
    if (propre.isEmpty()) return listOf("Ça s'est", "arrêté ici.")
    val mots = propre.split(" ").filter { it.isNotBlank() }
    if (mots.size < 2) return listOf(propre)
    val milieu = (mots.size + 1) / 2
    return listOf(mots.take(milieu).joinToString(" "), mots.drop(milieu).joinToString(" "))
}

/**
 * @param titre coupé en deux lignes ; absent, un titre neutre qui ne diagnostique rien.
 * @param motif ce qui a échoué. Absent, la section n'est pas rendue.
 * @param consequence ce qui est perdu — presque toujours : rien. Absent, section non rendue.
 * @param reference la référence d'incident du serveur. ⛔ Elle ne s'invente pas : sans elle,
 *   la ligne n'existe pas, et le support n'a pas à croire qu'un numéro lui a été donné.
 * @param libelle le libellé du bouton de retour. Absent : « Revenir ».
 * @param sortie l'onglet où l'appelant veut qu'on reparte, parmi les cinq.
 * @param onAller appelé UNIQUEMENT quand `sortie` désigne un onglet connu.
 */
@Composable
fun EcranErreur(
    titre: String?,
    motif: String?,
    consequence: String?,
    reference: String?,
    libelle: String?,
    sortie: String?,
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val onglet = sortie?.takeIf { it.isNotBlank() }?.let(::ongletNomme)

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        /*
         * ⚠️ « Retour », pas « Cours ». Le kit pose `retour="Cours"` parce qu'il ne dessine
         * l'erreur que d'une leçon ; cette destination-ci est atteinte depuis N'IMPORTE
         * QUELLE autre, y compris un geste de modération dans le Club. Un libellé de retour
         * dit OÙ l'on revient : celui du kit mentirait cinq fois sur six.
         */
        retour = "Retour",
        onRetour = onRetour,
    ) {
        /*
         * Le losange d'alerte du kit : 66 px, rayon 21, dégradé à 135°. ⚠️ Le premier arrêt
         * du kit (#E4564F) n'a pas de jeton ; `mmCorail` est le plus proche du système et
         * c'est déjà la substitution qu'avait faite le port. Le second, lui, est exact.
         */
        Box(
            Modifier
                .padding(top = 6.dp)
                .size(66.dp)
                .fondDegrade(
                    Degrade(135f, listOf(0f to jetons.mmCorail, 1f to jetons.stop)),
                    RoundedCornerShape(21.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                "alert",
                description = null,
                taille = 28.dp,
                couleur = jetons.paperFixed,
                epaisseur = 2.4f,
            )
        }

        Display(
            lignesDuTitre(titre),
            taille = 28.sp,
            modifier = Modifier.padding(top = 22.dp),
        )

        Surface(Niveau.FLAT, Modifier.padding(top = 18.dp).fillMaxWidth()) {
            Column {
                if (motif != null) {
                    Eyebrow("Le motif")
                    Body(motif, Modifier.padding(top = 7.dp))
                }
                if (motif != null && consequence != null) {
                    Box(
                        Modifier
                            .padding(vertical = 14.dp)
                            .fillMaxWidth()
                            .height(1.dp)
                            .background(jetons.borderHair),
                    )
                }
                if (consequence != null) {
                    Eyebrow("La conséquence")
                    Body(consequence, Modifier.padding(top = 7.dp))
                }
                /*
                 * ⛔ LE CAS QUE LE PORT MASQUAIT. Quand l'erreur n'apporte NI motif NI
                 * conséquence, il n'y a rien d'honnête à écrire dans ces deux sections — et
                 * un panneau vide se lit comme un défaut d'affichage. On nomme donc le
                 * manque, qui est lui-même l'information utile : ce qui a échoué n'a pas dit
                 * pourquoi, et cet écran ne le devinera pas à sa place.
                 */
                if (motif == null && consequence == null) {
                    Eyebrow("Sans motif")
                    Body(
                        "Ce qui a échoué n'a pas dit pourquoi, et cet écran ne l'invente pas. "
                            + "Si ça recommence, la référence ci-dessous — quand il y en a "
                            + "une — est ce que le support demandera en premier.",
                        Modifier.padding(top = 7.dp),
                    )
                }
            }
        }

        Button(
            libelle ?: "Revenir",
            onRetour,
            Modifier.padding(top = 18.dp),
            ton = TonBouton.FORME,
        )

        /* La sortie nommée par l'appelant. Elle n'apparaît que si elle mène quelque part. */
        if (onglet != null) {
            Button(
                "Aller à ${onglet.libelle}",
                { onAller(destinationDeLOnglet(onglet)) },
                Modifier.padding(top = 9.dp),
                ton = TonBouton.QUIET,
            )
        }

        /*
         * ⛔ UNE SORTIE QUI NE MÈNE NULLE PART SE DIT. Le silence ferait de `sortie` un champ
         * qu'on peut remplir de travers sans jamais l'apprendre : l'appelant croirait avoir
         * offert une issue, et l'écran n'en montrerait aucune.
         */
        if (sortie != null && sortie.isNotBlank() && onglet == null) {
            Text(
                text = "La sortie annoncée par cette erreur — « $sortie » — ne désigne aucun "
                    + "des cinq onglets. Aucun bouton ne peut y mener.",
                style = Typo.petit,
                color = jetons.textFaint,
                modifier = Modifier.padding(top = 12.dp),
            )
        }

        /* La référence ne s'invente pas : sans elle, la ligne n'existe pas. */
        if (reference != null && reference.isNotBlank()) {
            Text(
                text = "Référence de l'incident : $reference",
                style = Typo.nombre(11.sp),
                color = jetons.textFaint,
                modifier = Modifier.padding(top = 10.dp),
            )
        }
    }
}
