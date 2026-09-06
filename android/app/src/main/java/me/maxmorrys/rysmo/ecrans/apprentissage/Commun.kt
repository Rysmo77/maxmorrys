package me.maxmorrys.rysmo.ecrans.apprentissage

import android.content.Context
import android.content.Intent
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

/**
 * ⭐ LA FEUILLE DE PARTAGE SYSTÈME — la seule action native que ce lot gagne réellement.
 *
 * `Intent.ACTION_SEND` n'exige aucune dépendance : `androidx.browser` est au catalogue de
 * versions mais PAS en dépendance (`app/build.gradle.kts`), et media3 non plus. Le partage,
 * lui, est du système pur.
 *
 * ⛔ CE QUI PART EST UN LIEN, JAMAIS UNE IMAGE. Une capture d'écran de certificat ne se
 * vérifie pas ; le lien, si. C'est la décision du kit (`ScreensNatifApp.js:335`) et elle
 * survit telle quelle.
 *
 * ⛔ ET ON N'OUVRE PAS `ACTION_VIEW` SUR CES ADRESSES. Les chemins `/verifier` et
 * `/formations` sont des App Links que CETTE application déclare et vérifie
 * (`AndroidManifest.xml`, `autoVerify="true"`). Un `ACTION_VIEW` s'y résoudrait sur nous —
 * l'écran rouvrirait l'écran. Un bouton « voir la page publique » demanderait donc soit un
 * onglet personnalisé (`androidx.browser`, non déclaré), soit une sélection explicite de
 * navigateur ; aucun des deux n'existe ici, donc ce bouton n'existe pas non plus.
 */
fun partagerUnLien(contexte: Context, titre: String, texte: String, lien: String) {
    val envoi = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, titre)
        putExtra(Intent.EXTRA_TEXT, "$texte\n$lien")
    }
    /* Le sélecteur est explicite : sans lui, Android peut mémoriser une cible par défaut et
       le geste cesse d'en proposer d'autres — ce qui n'est pas ce qu'un partage promet. */
    contexte.startActivity(Intent.createChooser(envoi, titre))
}

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
