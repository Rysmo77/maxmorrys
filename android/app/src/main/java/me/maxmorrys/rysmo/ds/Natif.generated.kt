/*
 * GÉNÉRÉ PAR `npm run ds:tokens` — NE PAS ÉDITER.
 * Source : les feuilles de src/design-system/css/tokens et css/overrides (AD-8).
 *
 * Modifier ce fichier à la main le fait diverger du CSS sans que rien ne le signale, et
 * `npm run ds:check` échouera à la prochaine exécution.
 */
package me.maxmorrys.rysmo.ds

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * LE MAILLAGE — cinq territoires, quinze lobes, trois voiles.
 *
 * ⛔ Les teintes sont LITTÉRALES et ne basculent pas en mode sombre. Le kit les écrit
 * ainsi (`brand/mesh.css`), et c'est délibéré : un lobe est une peinture, pas un texte.
 * Les relire par `mmBleu` / `mmViolet` / `mmOrange` / `mmTeal` donnerait
 * #6FB1FF / #B98CFF / #FFB24D / #3FD9C6 la nuit — le maillage changerait de couleur.
 *
 * ⛔ Le maillage `nuit` n'est pas « le maillage clair en sombre » : c'est un CINQUIÈME
 * territoire, déclaré en valeur.
 */
@Immutable
object Maillage {

  /** Le côté de la boîte du lobe. Le kit en pose 340 sur iOS et 460 sur Android. */
  val coteIos: Dp = 340.dp
  val coteAndro: Dp = 460.dp

  /**
   * L'écart-type de la gaussienne du kit — `filter: blur(52px)`.
   *
   * ⛔ C'EST UNE LONGUEUR, PAS UN NOMBRE, et l'unité décide du rendu.
   * Émis en `Float` dans une première version, il se retrouvait comparé à un rayon
   * exprimé en PIXELS : sur un écran à 420 dpi, le rapport R/σ passait de 4,4 à 11,6 et
   * les lobes rendaient presque nets. Le maillage restait beau — il n'était simplement
   * plus celui du kit, et aucune porte ne pouvait le voir.
   */
  val sigmaFlou: Dp = 52.dp

  val fondClair: Color = Color(0xFFFBFCFE)
  val fondNuit: Color = Color(0xFF0A0D11)
  val fondSombre: Color = Color(0xFF0B0E13)

  /**
   * Les voiles de lisibilité, en valeurs AD-18 (0,60 / 0,78 / 0,90 en clair).
   * Le kit pose 0,42 en haut ; la mesure du produit le refuse — l'encre secondaire
   * #5A6472 y tient 3,93:1, et 4,51:1 à 0,60. Livrer 0,42 sur Android reproduirait un
   * défaut déjà corrigé au web.
   */
  val voileClair: List<Pair<Float, Color>> = listOf(0.0f to Color(0x99FFFFFF), 0.46f to Color(0xC7FFFFFF), 1.0f to Color(0xE6FFFFFF))
  val voileNuit: List<Pair<Float, Color>> = listOf(0.0f to Color(0x9E0A0D11), 0.48f to Color(0xDB0A0D11), 1.0f to Color(0xF00A0D11))
  val voileSombre: List<Pair<Float, Color>> = listOf(0.0f to Color(0x9E0B0E13), 0.48f to Color(0xDB0B0E13), 1.0f to Color(0xF00B0E13))

  val forme: List<Lobe> = listOf(
    Lobe(teinte = Color(0xFF0057BC), opacite = 0.9f, x = Gauche((-110).dp), y = Haut((-120).dp)),
    Lobe(teinte = Color(0xFF6C23DD), opacite = 0.65f, x = Droite((-120).dp), y = Haut((-160).dp)),
    Lobe(teinte = Color(0xFF02AC9C), opacite = 0.5f, x = Droite((-160).dp), y = Haut(120.dp)),
  )
  val informe: List<Lobe> = listOf(
    Lobe(teinte = Color(0xFFF38B0A), opacite = 0.9f, x = Gauche((-90).dp), y = Haut((-130).dp)),
    Lobe(teinte = Color(0xFFFF6E7F), opacite = 0.6f, x = Droite((-130).dp), y = Haut((-150).dp)),
    Lobe(teinte = Color(0xFF0057BC), opacite = 0.34f, x = Droite((-170).dp), y = Haut(150.dp)),
  )
  val transforme: List<Lobe> = listOf(
    Lobe(teinte = Color(0xFF6C23DD), opacite = 0.9f, x = Gauche((-120).dp), y = Haut((-120).dp)),
    Lobe(teinte = Color(0xFF0057BC), opacite = 0.7f, x = Droite((-110).dp), y = Haut((-150).dp)),
    Lobe(teinte = Color(0xFFF38B0A), opacite = 0.42f, x = Droite((-180).dp), y = Haut(140.dp)),
  )
  val digitalise: List<Lobe> = listOf(
    Lobe(teinte = Color(0xFF02AC9C), opacite = 0.9f, x = Gauche((-110).dp), y = Haut((-120).dp)),
    Lobe(teinte = Color(0xFF0057BC), opacite = 0.6f, x = Droite((-120).dp), y = Haut((-160).dp)),
    Lobe(teinte = Color(0xFFF38B0A), opacite = 0.4f, x = Droite((-170).dp), y = Haut(160.dp)),
  )
  val nuit: List<Lobe> = listOf(
    Lobe(teinte = Color(0xFF0057BC), opacite = 0.55f, x = Gauche((-130).dp), y = Haut((-140).dp)),
    Lobe(teinte = Color(0xFF6C23DD), opacite = 0.45f, x = Droite((-120).dp), y = Haut((-170).dp)),
    Lobe(teinte = Color(0xFFF38B0A), opacite = 0.3f, x = Droite((-160).dp), y = Bas((-180).dp)),
  )
}

/**
 * LE VERRE SOUS `.andro` — la table plateforme × mode.
 *
 * « Sur Android, le repli EST le cas normal — décision assumée, pas une dégradation.
 * RenderEffect demande API 31+, et le marché visé est bas de gamme. »
 * (`DS_Final/brand/native.css`)
 *
 * ⚠️ `.glass-flat` N'Y FIGURE PAS : le faux verre n'a jamais eu de flou, il garde
 * `surfaceCardFlat` sur les deux plateformes. Il n'y a rien à compenser.
 * ⚠️ `.andro.dk .glass-d` n'existe pas non plus : le verre nuit reste à sa valeur claire
 * dans les deux modes — c'est déjà une surface de nuit.
 */
@Immutable
object VerreAndro {
  val glass: Color = Color(0xDBFFFFFF)
  val glassHero: Color = Color(0xE6FFFFFF)
  val glassD: Color = Color(0xEB0D1117)
  val truth: Color = Color(0xE0FFFFFF)
  val dkGlass: Color = Color(0x21FFFFFF)
  val dkGlassHero: Color = Color(0x29FFFFFF)
  val dkTruth: Color = Color(0x1CFFFFFF)
}

/** Une recette de surface, telle que `brand/surfaces.css` la déclare pour un mode. */
@Immutable
data class RecetteVerre(
  val fond: Color,
  val liseret: Color,
  /** L'ombre INTÉRIEURE — un liseré de lumière de 1 dp en haut, jamais une ombre. */
  val lumiere: Ombre?,
  val ombre: Ombre?,
  val rayon: Dp,
  /** Seul `truth` en porte un : 15 dp, déclaré sur la classe. */
  val rembourrage: Dp,
)

/**
 * LES SIX NIVEAUX DE VERRE, LUS SUR LES CLASSES DU KIT.
 *
 * ⛔ LE KIT ET SES PROPRES JETONS SE CONTREDISENT EN MODE SOMBRE, ET C'EST LE KIT QUI REND.
 * `tokens/dark.css` déclare `--surface-card` à 0,075 et `--surface-hero` à 0,055 ;
 * `brand/surfaces.css` — que `GlassPanel` applique en CLASSE — écrit
 * `.dk .glass{background:rgba(255,255,255,.09)}` et `.dk .glass-hero{.08}`. Ce qui
 * s'affiche au web, c'est la classe.
 *
 * ⛔ ET LES LISERÉS NE SONT PAS TOUS `glassBrd`. Le héros pose 0,62, le faux verre 0,70,
 * l'encart de vérité 0,60, la carte d'encre 0,10 — et `glassBrd` NE BASCULE PAS, alors que
 * `.dk .glass` redéclare `border-color` à 0,13. Les lire par le jeton donnerait 0,55
 * partout, dans les deux modes.
 */
@Immutable
object Verre {
  val chromeClair: RecetteVerre = RecetteVerre(fond = Color(0x9EFFFFFF), liseret = Color(0x8CFFFFFF), lumiere = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0xBFFFFFFF)), ombre = Ombre(inset = false, dx = 0.dp, dy = 14.dp, flou = 38.dp, etale = 0.dp, couleur = Color(0x210E1116)), rayon = 24.dp, rembourrage = 0.dp)
  val chromeSombre: RecetteVerre = RecetteVerre(fond = Color(0x17FFFFFF), liseret = Color(0x21FFFFFF), lumiere = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x1AFFFFFF)), ombre = Ombre(inset = false, dx = 0.dp, dy = 14.dp, flou = 38.dp, etale = 0.dp, couleur = Color(0x75000000)), rayon = 24.dp, rembourrage = 0.dp)
  val heroClair: RecetteVerre = RecetteVerre(fond = Color(0x94FFFFFF), liseret = Color(0x9EFFFFFF), lumiere = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0xB8FFFFFF)), ombre = Ombre(inset = false, dx = 0.dp, dy = 18.dp, flou = 44.dp, etale = 0.dp, couleur = Color(0x240E1116)), rayon = 30.dp, rembourrage = 0.dp)
  val heroSombre: RecetteVerre = RecetteVerre(fond = Color(0x14FFFFFF), liseret = Color(0x29FFFFFF), lumiere = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x1FFFFFFF)), ombre = Ombre(inset = false, dx = 0.dp, dy = 18.dp, flou = 44.dp, etale = 0.dp, couleur = Color(0x80000000)), rayon = 30.dp, rembourrage = 0.dp)
  val flatClair: RecetteVerre = RecetteVerre(fond = Color(0xC7FFFFFF), liseret = Color(0xB3FFFFFF), lumiere = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0xBFFFFFFF)), ombre = Ombre(inset = false, dx = 0.dp, dy = 6.dp, flou = 18.dp, etale = 0.dp, couleur = Color(0x120E1116)), rayon = 24.dp, rembourrage = 0.dp)
  val flatSombre: RecetteVerre = RecetteVerre(fond = Color(0x12FFFFFF), liseret = Color(0x17FFFFFF), lumiere = null, ombre = null, rayon = 24.dp, rembourrage = 0.dp)
  val nightClair: RecetteVerre = RecetteVerre(fond = Color(0xB80E1116), liseret = Color(0x24FFFFFF), lumiere = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x1AFFFFFF)), ombre = Ombre(inset = false, dx = 0.dp, dy = 14.dp, flou = 38.dp, etale = 0.dp, couleur = Color(0x66000000)), rayon = 24.dp, rembourrage = 0.dp)
  val nightSombre: RecetteVerre = RecetteVerre(fond = Color(0xB80E1116), liseret = Color(0x24FFFFFF), lumiere = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x1AFFFFFF)), ombre = Ombre(inset = false, dx = 0.dp, dy = 14.dp, flou = 38.dp, etale = 0.dp, couleur = Color(0x66000000)), rayon = 24.dp, rembourrage = 0.dp)
  val inkClair: RecetteVerre = RecetteVerre(fond = Color(0xFF0E1116), liseret = Color(0x1AFFFFFF), lumiere = null, ombre = Ombre(inset = false, dx = 0.dp, dy = 16.dp, flou = 40.dp, etale = 0.dp, couleur = Color(0x470E1116)), rayon = 24.dp, rembourrage = 0.dp)
  val inkSombre: RecetteVerre = RecetteVerre(fond = Color(0xFF0E1116), liseret = Color(0x1AFFFFFF), lumiere = null, ombre = Ombre(inset = false, dx = 0.dp, dy = 16.dp, flou = 40.dp, etale = 0.dp, couleur = Color(0x470E1116)), rayon = 24.dp, rembourrage = 0.dp)
  val truthClair: RecetteVerre = RecetteVerre(fond = Color(0xB8FFFFFF), liseret = Color(0x99FFFFFF), lumiere = null, ombre = null, rayon = 16.dp, rembourrage = 15.dp)
  val truthSombre: RecetteVerre = RecetteVerre(fond = Color(0x0FFFFFFF), liseret = Color(0x1CFFFFFF), lumiere = null, ombre = null, rayon = 16.dp, rembourrage = 15.dp)
}

/**
 * LES MARQUES TIERCES — la seule famille de teintes qui ne bascule JAMAIS.
 *
 * ⛔ C'est la raison INVERSE de la règle générale. Partout ailleurs, une couleur figée est
 * un défaut de mode sombre garanti ; ici, Google impose ses quatre couleurs et Apple impose
 * son asset et son noir. Les faire basculer serait un motif de rejet en revue, sur l'écran
 * de connexion.
 *
 * ⚠️ La pomme n'est PAS ici : Apple interdit un dessin refait. L'asset officiel doit être
 * déposé avant toute soumission ; d'ici là, `AppleMark` rend un emplacement réservé.
 */
@Immutable
object MarqueTierce {
  val googleBleu: Color = Color(0xFF4285F4)
  val googleVert: Color = Color(0xFF34A853)
  val googleJaune: Color = Color(0xFFFBBC05)
  val googleRouge: Color = Color(0xFFEA4335)
}

/** Les hauteurs de chrome que le kit fixe par plateforme. */
@Immutable
object ChromeNatif {
  val navbarIos: Dp = 44.dp
  val navbarAndro: Dp = 64.dp
}

/**
 * CE QUE LE KIT ÉCRIT DANS SES COMPOSANTS, HORS TABLE DE JETONS.
 *
 * Onze ombres, quatre dégradés et quatre voiles qui ne vivent ni dans `tokens/` ni dans
 * `overrides/`. Ils sont extraits d'ici pour rester uniques et vérifiables — et cette
 * liste EST ce qu'il faut faire remonter au kit à la prochaine relivraison.
 */
@Immutable
object HorsTable {
  /** components/actions/Button.jsx */
  val ombreBoutonInforme: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 24.dp, etale = 0.dp, couleur = Color(0x52F38B0A))
  /** components/actions/IconButton.jsx */
  val ombreChromeRond: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 4.dp, flou = 14.dp, etale = 0.dp, couleur = Color(0x170E1116))
  /** components/data/ChatBubble.jsx */
  val ombreBulleMoi: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 6.dp, flou = 18.dp, etale = 0.dp, couleur = Color(0x476C23DD))
  /** components/data/MediaCard.jsx */
  val ombreBoutonLecture: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 22.dp, etale = 0.dp, couleur = Color(0x3D0E1116))
  /** components/forms/Switch.jsx */
  val ombreCurseurInterrupteur: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 2.dp, flou = 6.dp, etale = 0.dp, couleur = Color(0x3D0E1116))
  /** components/brand/LogoMark.jsx */
  val ombrePastilleLogo: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 4.dp, flou = 14.dp, etale = 0.dp, couleur = Color(0x1F0E1116))
  /** components/navigation/SubNav.jsx */
  val ombreSubNavActif: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 4.dp, flou = 14.dp, etale = 0.dp, couleur = Color(0x120E1116))
  /** brand/surfaces.css */
  val liseretHero: Ombre? = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0xB8FFFFFF))
  /** brand/surfaces.css */
  val liseretNuit: Ombre? = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x1AFFFFFF))
  /** brand/surfaces.css */
  val ombreNuit: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 14.dp, flou = 38.dp, etale = 0.dp, couleur = Color(0x66000000))
  /** brand/surfaces.css */
  val ombreCarteEncre: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 16.dp, flou = 40.dp, etale = 0.dp, couleur = Color(0x470E1116))
  /** ui_kits/native/ScreensNatifApp.js */
  val ombreFabBleu: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 10.dp, flou = 26.dp, etale = 0.dp, couleur = Color(0x610057BC))
  /** ui_kits/native/ScreensNatifClub.js */
  val ombreFabViolet: Ombre? = Ombre(inset = false, dx = 0.dp, dy = 10.dp, flou = 26.dp, etale = 0.dp, couleur = Color(0x666C23DD))
  /** components/data/MediaCard.jsx */
  val artMedia: Degrade = Degrade(angleDeg = 140.0f, arrets = listOf(0.0f to Color(0xFF6C23DD), 0.62f to Color(0xFF0057BC), 1.0f to Color(0xFF02AC9C)))
  /** components/data/MediaCard.jsx */
  val artVideo: Degrade = Degrade(angleDeg = 140.0f, arrets = listOf(0.0f to Color(0xFF0057BC), 1.0f to Color(0xFF6C23DD)))
  /** components/data/ProgressBar.jsx */
  val degradeProgression: Degrade = Degrade(angleDeg = 90.0f, arrets = listOf(0.0f to Color(0xFF0057BC), 0.3333f to Color(0xFF6C23DD), 0.6667f to Color(0xFFF38B0A), 1.0f to Color(0xFF02AC9C)))
  /** components/data/LessonRow.jsx */
  val degradeLeconCourante: Degrade = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0x1A0057BC), 1.0f to Color(0x1A6C23DD)))
  /** components/data/CheckLine.jsx */
  val voileCocheViolet: Color = Color(0x266C23DD)
  /** components/data/CheckLine.jsx */
  val voileCocheOk: Color = Color(0x260F7B52)
  /** components/data/LessonRow.jsx */
  val voilePuceFaite: Color = Color(0x290F7B52)
  /** components/data/MediaCard.jsx */
  val voileBadgeMedia: Color = Color(0x80000000)
}
