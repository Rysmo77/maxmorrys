package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Surface

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * CE QUE LES HUIT ÉCRANS DE L'APPRENTISSAGE PARTAGENT.
 *
 * ⛔ AUCUNE DONNÉE D'EXEMPLE N'ENTRE DANS CE PAQUET, ET C'EST LA RÈGLE QUI L'ORGANISE.
 *
 * Le port React Native affichait « Série 3 j » et « Niveau 4 » à de vraies personnes
 * connectées — des chiffres qu'aucun serveur n'avait rendus, restés en production jusqu'au
 * 05/09/2026. Le kit, lui, est une MAQUETTE : ses « 21 Mo », « 47 leçons », « 95 000 »,
 * « MM-C7K4-9RTX-2081 » et ses cinq lignes de mémoire sont là pour montrer une mise en page,
 * pas pour être recopiés. Les distinguer est tout le travail de ce lot.
 *
 * Trois conséquences se lisent dans chaque fichier d'ici :
 *
 *   1 · Ce qui vient d'une vue du serveur et n'est pas encore branché rend `SansDonnees`,
 *       qui NOMME la vue manquante et le dommage qu'une simulation causerait.
 *   2 · Ce que le kit dessine et qu'aucune callable ne peut faire n'est pas dessiné du tout :
 *       un bouton qui annonce une action doit en porter une. Le port en avait six d'éteints.
 *   3 · Ce qui marche vraiment est construit et branché — la feuille de partage système, et
 *       la vérification publique d'un certificat, seul chemin du produit qui n'a pas besoin
 *       de session.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * L'adresse publique du site.
 *
 * ⚠️ ELLE N'EST PAS DANS `Configuration`, qui ne connaît que l'API. Le site et l'API vivent
 * sur deux domaines (`maxmorrys.me` et `api.maxmorrys.me`) : les confondre ferait partager
 * des liens qui ouvrent du JSON.
 */
const val SITE_PUBLIC: String = "https://maxmorrys.me"

/**
 * L'encart de vérité du kit — sourcil plus paragraphe, sur `Niveau.TRUTH`.
 *
 * Il revient sur six des huit écrans, toujours pour la même raison : dire ce que l'écran NE
 * fait pas, à l'endroit où quelqu'un se pose la question.
 */
@Composable
fun EncartDeVerite(
    sourcil: String,
    texte: String,
    modifier: Modifier = Modifier,
) {
    Surface(Niveau.TRUTH, modifier.fillMaxWidth()) {
        Column {
            Eyebrow(sourcil)
            Body(texte, Modifier.padding(top = 6.dp), grain = GrainCorps.CHAPO)
        }
    }
}

/*
 * ⭐ LA FEUILLE DE PARTAGE ET L'OUVERTURE D'UNE ADRESSE ONT QUITTÉ CE FICHIER.
 *
 * Elles vivaient ici, dans `ecrans/media/Commun.kt`, dans `ecrans/compte/Legal.kt` et dans
 * `ecrans/club/Informations.kt` — quatre copies du même geste, dont trois seulement portaient
 * le garde des App Links. Elles sont maintenant dans `systeme/Sortie.kt`, et
 * `natif-capacites.test.ts` refuse qu'une cinquième réapparaisse.
 *
 * ⚠️ CE QUE DISAIT LE COMMENTAIRE D'ORIGINE ET QUI N'EST PLUS VRAI : « un bouton "voir la
 * page publique" demanderait un onglet personnalisé (`androidx.browser`, non déclaré) …
 * donc ce bouton n'existe pas ». `androidx.browser` EST déclaré depuis le lot 5. Un tel
 * bouton est désormais possible — il n'est pas ajouté ici pour autant, parce que le kit ne
 * le dessine pas et qu'une page publique de certificat s'atteint déjà par le lien partagé.
 *
 * ⛔ CE QUI RESTE VRAI, ET QUI EST LA RAISON DU GARDE : `/verifier` et `/formations` sont des
 * App Links que CETTE application vérifie. Un `ACTION_VIEW` nu s'y résoudrait sur nous.
 */

/**
 * Une date ISO rendue en `JJ/MM/AAAA`, sans jamais passer par une horloge.
 *
 * ⛔ ON DÉCOUPE LA CHAÎNE, ON NE LA REPARSE PAS. Passer par `Date` ou `SimpleDateFormat`
 * ferait traverser la date par le FUSEAU de l'appareil : un certificat émis le 12 à 00h30 UTC
 * s'afficherait « 11 » pour qui règle son téléphone à l'ouest. C'est le même principe que
 * `Provenance.asOf`, qui garde la chaîne du serveur telle qu'il l'a écrite — et `java.time`
 * n'existe de toute façon pas sous l'API 26 sans désucrage, que `build.gradle.kts` n'active
 * pas (`minSdk = 24`).
 *
 * ⚠️ Une chaîne qui n'a pas la forme attendue est rendue TELLE QUELLE. Inventer une mise en
 * forme sur une valeur qu'on n'a pas comprise produirait une date fausse et lisible.
 */
fun dateLisible(iso: String): String {
    if (iso.length < 10) return iso
    val jour = iso.substring(0, 10)
    val morceaux = jour.split("-")
    if (morceaux.size != 3 || morceaux[0].length != 4) return iso
    if (!morceaux.all { part -> part.all { it in '0'..'9' } }) return iso
    return "${morceaux[2]}/${morceaux[1]}/${morceaux[0]}"
}

/**
 * Normalise un code de certificat recopié à la main.
 *
 * ⚠️ LA MÊME NORMALISATION QUE LE SERVEUR ET QUE LE WEB, et c'est délibérément REDONDANT :
 * le serveur la refait de son côté (`verifierCertificat.ts`), parce qu'un client peut être
 * une version installée d'il y a six mois. Ici elle sert à ce que le champ montre à la
 * personne exactement ce qui va partir.
 */
fun codeNormalise(brut: String): String = brut.replace(Regex("\\s+"), "").uppercase()

/**
 * Un titre venu de la base, équilibré sur deux lignes.
 *
 * ⛔ UN TITRE D'AFFICHAGE NE SE REPLIE JAMAIS TOUT SEUL — `Display` rend une ligne par
 * élément, sans césure, et laisse DÉBORDER plutôt que tronquer. C'est voulu : un titre coupé
 * par des points de suspension est un défaut qu'on ne voit plus, un titre qui déborde est un
 * défaut qu'on voit. Mais un titre qui vient du serveur n'a pas de coupe écrite à la main :
 * on l'équilibre au mot le plus proche du milieu, ce qui est ce qu'un typographe ferait.
 */
internal fun deuxLignes(titre: String): List<String> {
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
