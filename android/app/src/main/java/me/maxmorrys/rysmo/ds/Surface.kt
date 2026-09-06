package me.maxmorrys.rysmo.ds

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES SIX NIVEAUX DE VERRE.
 *
 * ⛔ LA RÈGLE QUI DÉCIDE TOUT : le flou n'a droit qu'à une surface qui NE DÉFILE PAS avec
 * le contenu. « Sur mobile, tout défile — héros compris. Il ne reste donc qu'une famille
 * debout, et plus aucun quota à compter : le prédicat est binaire, donc vérifiable sans
 * jugement. » Mesuré au web : Club site 21 → 2 surfaces floutées, les huit onglets du Club
 * mobile 7 → 1 au total, console 0.
 *
 * ⛔ CE QUI FAIT QU'UN VERRE A L'AIR D'UN VERRE N'EST PAS LE FLOU : c'est le liseré de
 * lumière de 1 px en haut, la bordure blanche, et la saturation. C'est pour ça que quatre
 * niveaux sur cinq s'en passent sans rien perdre — et c'est ce qui permet à Android de
 * perdre le flou SANS PERDRE L'IDENTITÉ.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
enum class Niveau { CHROME, HERO, FLAT, NIGHT, INK, TRUTH }

/**
 * LA TABLE PLATEFORME × MODE.
 *
 * ⛔ ELLE EST À DEUX DIMENSIONS, PAS DEUX TABLES EMPILÉES. Le kit s'est fait avoir sur ce
 * point exact ailleurs : `brand/fallback.css` écrit `.lowfi .dk .glass`, un combinateur
 * DESCENDANT alors que les deux classes vivent sur le MÊME élément — le sélecteur ne peut
 * jamais s'apparier, et sur un téléphone modeste réglé en sombre la barre haute rendait
 * blanc à 90 %. En Compose ce mode de panne n'existe pas, mais il dit quel est le tableau
 * qui compte.
 *
 * Les recettes viennent de `Verre` (généré depuis `brand/surfaces.css`) ; Android n'en
 * remplace que le FOND, et seulement pour les quatre niveaux que `.andro` cite.
 *
 * ⚠️ `flat` NE FIGURE PAS dans le bloc `.andro` : le faux verre n'a jamais eu de flou, il
 * garde sa recette sur les deux plateformes. Il n'y a rien à compenser.
 * ⚠️ `.andro.dk .glass-d` n'existe pas non plus : le verre nuit prend la valeur `.andro`
 * dans les DEUX modes — c'est déjà une surface de nuit.
 * ⚠️ `ink` est absent du bloc `.andro` par construction : il est OPAQUE, il n'a jamais rien
 * eu à flouter.
 */
@Composable
fun recette(niveau: Niveau): RecetteVerre {
    val sombre = mode == Mode.SOMBRE
    /* Le repli Android est le cas NORMAL. Le flou ne revient que si l'appareil l'a déclaré. */
    val replie = plateforme.estAndroid && !plateforme.flouOk
    val base = when (niveau) {
        Niveau.CHROME -> if (sombre) Verre.chromeSombre else Verre.chromeClair
        Niveau.HERO -> if (sombre) Verre.heroSombre else Verre.heroClair
        Niveau.FLAT -> if (sombre) Verre.flatSombre else Verre.flatClair
        Niveau.NIGHT -> if (sombre) Verre.nightSombre else Verre.nightClair
        Niveau.INK -> if (sombre) Verre.inkSombre else Verre.inkClair
        Niveau.TRUTH -> if (sombre) Verre.truthSombre else Verre.truthClair
    }
    if (!replie) return base
    val fond = when (niveau) {
        Niveau.CHROME -> if (sombre) VerreAndro.dkGlass else VerreAndro.glass
        Niveau.HERO -> if (sombre) VerreAndro.dkGlassHero else VerreAndro.glassHero
        Niveau.NIGHT -> VerreAndro.glassD
        Niveau.TRUTH -> if (sombre) VerreAndro.dkTruth else VerreAndro.truth
        Niveau.FLAT, Niveau.INK -> return base
    }
    return base.copy(fond = fond)
}

/**
 * Le flou d'un niveau, en dp. Zéro partout sauf sur `chrome`, et seulement là où il est
 * permis : `Modifier.blur` s'appuie sur `RenderEffect`, API 31+.
 *
 * ⛔ `chrome` est LA SEULE SURFACE FLOUTÉE DU SYSTÈME — le chrome qui ne défile pas. Sur
 * mobile, tout défile, héros compris : « il ne reste donc qu'une famille debout, et plus
 * aucun quota à compter — le prédicat est binaire, donc vérifiable sans jugement. »
 */
@Composable
fun flouDe(niveau: Niveau): Dp =
    if (niveau == Niveau.CHROME && (!plateforme.estAndroid || plateforme.flouOk)) {
        Metrique.glassBlur
    } else {
        0.dp
    }

/**
 * Une surface de verre.
 *
 * ⛔ `INK` OUVRE SA PROPRE PORTÉE DE THÈME, et ça ne se déduit d'aucun nom de prop.
 * Une carte SOMBRE posée sur une page CLAIRE — le bilan d'abonnement du Club. Deux
 * propriétés la distinguent d'un simple fond foncé :
 *
 *  1. elle est OPAQUE : un voile composerait avec le fond clair et remonterait à
 *     rgb(80,81,86), soit 2,61:1 sous un gris nuit ;
 *  2. elle ouvre une portée nuit — sans elle, chaque texte à l'intérieur serait un gris
 *     écrit à la main, et c'est précisément l'erreur que ce niveau existe pour empêcher.
 */
@Composable
fun Surface(
    niveau: Niveau = Niveau.FLAT,
    modifier: Modifier = Modifier,
    rembourrage: Dp? = null,
    contenu: @Composable () -> Unit,
) {
    if (niveau == Niveau.INK) {
        CompositionLocalProvider(
            LocalPalette provides PALETTE_SOMBRE,
            LocalMode provides Mode.SOMBRE,
            LocalEncre provides PALETTE_SOMBRE.textBody,
        ) {
            CarteEncre(modifier, rembourrage, contenu)
        }
        return
    }
    val r = recette(niveau)
    Boite(r, modifier, rembourrage ?: r.rembourrage, contenu)
}

/**
 * ⛔ SÉPARÉ DE `Surface`, ET CE N'EST PAS DE LA COQUETTERIE.
 *
 * Un `LocalPalette.current` lu dans le composable qui POSE le fournisseur ne le voit pas :
 * il lit la valeur d'avant. Écrit dans `Surface`, le liseré aurait donc pris l'encre du
 * mode clair — un filet noir sur une carte nuit. Le port React Native avait déjà payé cette
 * leçon.
 *
 * ⛔ ET LE FOND EST `surfaceInk`, PAS `ink`. Les deux valent une teinte d'encre en clair, ce
 * qui les rend interchangeables à l'œil. Mais le fond et la portée vivent sur le MÊME
 * élément : si le fond lisait `ink`, il basculerait avec les textes et la carte se
 * peindrait en blanc cassé — titre à 1,00:1. `surfaceInk` est déclaré à l'identique dans
 * `:root` et dans `.dk`, et c'est le sujet.
 */
@Composable
private fun CarteEncre(modifier: Modifier, rembourrage: Dp?, contenu: @Composable () -> Unit) {
    val r = recette(Niveau.INK)
    Boite(r, modifier, rembourrage ?: r.rembourrage, contenu)
}

@Composable
private fun Boite(
    r: RecetteVerre,
    modifier: Modifier,
    rembourrage: Dp,
    contenu: @Composable () -> Unit,
) {
    val forme = androidx.compose.foundation.shape.RoundedCornerShape(r.rayon)
    Box(
        modifier
            .ombre(r.ombre, forme)
            .clip(forme)
            .background(r.fond)
            .border(1.dp, r.liseret, forme)
            .liseretHaut(r.lumiere, r.rayon)
            .padding(rembourrage),
    ) { contenu() }
}
