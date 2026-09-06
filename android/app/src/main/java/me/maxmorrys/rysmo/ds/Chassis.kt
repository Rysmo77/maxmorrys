package me.maxmorrys.rysmo.ds

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.TextUnitType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * DEUX CHÂSSIS, UN CORPS.
 *
 * « La marque d'abord » a une conséquence qu'il faut nommer, parce qu'elle décide tout le
 * reste : le CONTENU d'un écran est identique sur iOS et sur Android, et seul le CHÂSSIS
 * diffère. Un écran qui aurait besoin de deux corps différents serait un écran où la marque
 * a cédé aux conventions — c'est le signal qu'on s'est trompé, pas une exception à gérer.
 *
 * ⚠️ LA ZONE SÛRE SE DEMANDE, ELLE NE SE RECOPIE PAS. Le kit code 47/34 et 24/24 parce
 * qu'il simule deux appareils dans un cadre fixe. Ici, c'est `WindowInsets`. Recopier
 * 47 dp creuserait un trou sur un appareil sans encoche.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * LA BARRE HAUTE — le seul endroit du produit où le contenu est écrit deux fois.
 *
 * ⛔ 64 dp ET TITRE À GAUCHE SUR ANDROID, 44 dp ET TITRE CENTRÉ SUR iOS. Ce ne sont pas
 * deux styles d'un même composant, ce sont DEUX BARRES : Material n'a pas de titre centré,
 * et uniformiser ferait paraître l'application étrangère des deux côtés à la fois.
 *
 * ⛔ PAS DE LIBELLÉ DE RETOUR SUR ANDROID, MAIS LE LIBELLÉ RESTE DIT. Material ne l'écrit
 * pas à l'écran, « parce que le retour système peut venir d'ailleurs et qu'un libellé faux
 * est pire que pas de libellé ». Un lecteur d'écran, lui, a besoin de savoir où mène ce
 * bouton : `retour` survit et alimente le `contentDescription`, sans jamais être affiché.
 */
@Composable
fun NavBar(
    modifier: Modifier = Modifier,
    retour: String? = null,
    onRetour: (() -> Unit)? = null,
    titre: String? = null,
    droite: (@Composable RowScopeDroite.() -> Unit)? = null,
) {
    if (plateforme.estAndroid) {
        NavBarAndroid(modifier, retour, onRetour, titre, droite)
    } else {
        NavBarIos(modifier, retour, onRetour, titre, droite)
    }
}

/** Une portée vide : elle empêche seulement d'appeler `droite` hors d'une barre. */
object RowScopeDroite

@Composable
private fun NavBarAndroid(
    modifier: Modifier,
    retour: String?,
    onRetour: (() -> Unit)?,
    titre: String?,
    droite: (@Composable RowScopeDroite.() -> Unit)?,
) {
    val p = jetons
    Row(
        modifier
            .fillMaxWidth()
            .height(ChromeNatif.navbarAndro)
            .padding(start = 4.dp, end = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (retour != null) {
            Box(
                Modifier
                    .appui(onRetour, encre = p.textBody, petit = true, libelle = "Retour à $retour")
                    .size(48.dp)
                    .clip(CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon("back", description = "Retour à $retour", taille = 22.dp, epaisseur = 2.4f)
            }
        }
        if (titre != null) {
            Text(
                text = sansCrochets(titre),
                style = Typo.corps.copy(
                    fontSize = 19.sp,
                    fontWeight = Metrique.weightSemi,
                    letterSpacing = TextUnit(-0.015f, TextUnitType.Em),
                ),
                color = p.textBody,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .weight(1f)
                    .padding(start = if (retour != null) 4.dp else 12.dp),
            )
        } else {
            Spacer(Modifier.weight(1f))
        }
        if (droite != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { RowScopeDroite.droite() }
        }
    }
}

@Composable
private fun NavBarIos(
    modifier: Modifier,
    retour: String?,
    onRetour: (() -> Unit)?,
    titre: String?,
    droite: (@Composable RowScopeDroite.() -> Unit)?,
) {
    val p = jetons
    Row(
        modifier
            .fillMaxWidth()
            .height(ChromeNatif.navbarIos)
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(Modifier.width(88.dp), verticalAlignment = Alignment.CenterVertically) {
            if (retour != null) {
                Row(
                    Modifier
                        .appui(onRetour, encre = p.mmBleu, petit = true, libelle = "Retour à $retour")
                        .padding(horizontal = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    /* ⛔ SUR iOS, LE CHEVRON DIT OÙ L'ON REVIENT : le libellé s'affiche. */
                    Icon("back", description = null, taille = 19.dp, couleur = p.mmBleu, epaisseur = 2.6f)
                    Text(
                        text = retour,
                        style = Typo.corps.copy(fontSize = 16.sp, fontWeight = Metrique.weightMed),
                        color = p.mmBleu,
                        maxLines = 1,
                    )
                }
            }
        }
        if (titre != null) {
            Text(
                text = sansCrochets(titre),
                style = Typo.corps.copy(
                    fontSize = 16.sp,
                    fontWeight = Metrique.weightSemi,
                    letterSpacing = TextUnit(-0.01f, TextUnitType.Em),
                ),
                color = p.textBody,
                maxLines = 1,
            )
        }
        Row(
            Modifier.width(88.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End),
            verticalAlignment = Alignment.CenterVertically,
        ) { droite?.let { RowScopeDroite.it() } }
    }
}

/** Un onglet de la barre basse : un glyphe, un libellé. */
@Immutable
data class Onglet(val libelle: String, val glyphe: String)

/**
 * LA BARRE D'ONGLETS BASSE.
 *
 * ⛔ `zoneGeste` NE PEUT PAS VENIR D'UN REMBOURRAGE D'ANCÊTRE. `bottom:0` se résout au bas
 * de la boîte de rembourrage, donc aucun `padding` sur un parent ne remonte une barre
 * ancrée en bas. Sans lui, l'indicateur d'accueil se dessine par-dessus les onglets et LES
 * 34 px INFÉRIEURS DE CHAQUE CIBLE TOMBENT DANS LA ZONE OÙ L'OS INTERCEPTE LE GLISSEMENT :
 * la cible existe, le geste ne lui parvient pas.
 *
 * ⚠️ LA SATURATION EN LIGNE NE VAUT PAS LE JETON. Le kit écrit `saturate(180%)` en style
 * en ligne alors que `--glass-sat` vaut 170 %. Le jeton gagne — et de toute façon Compose
 * n'a pas de saturation de fond : `glassSat` reste une intention déclarée, pas un rendu.
 */
@Composable
fun TabBar(
    onglets: List<Onglet>,
    actif: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    zoneGeste: Dp = WindowInsets.navigationBars.asPaddingValues()
        .calculateBottomPadding(),
) {
    val p = jetons
    Column(
        modifier
            .fillMaxWidth()
            .padding(bottom = zoneGeste)
            .then(
                /* Le flou du chrome, et seulement s'il est permis. `glassBlurChrome` = 26 dp. */
                if (!plateforme.estAndroid || plateforme.flouOk) {
                    Modifier.blur(Metrique.glassBlurChrome)
                } else {
                    Modifier
                },
            )
            .background(p.tabbarBg)
            .drawBehind {
                drawLine(
                    color = p.tabbarBrd,
                    start = Offset(0f, 0f),
                    end = Offset(size.width, 0f),
                    strokeWidth = 1.dp.toPx(),
                )
            }
            .liseretHaut(p.tabbarHl, 0.dp)
            .height(Metrique.tabbarH),
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(start = 8.dp, end = 8.dp, top = 10.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
        ) {
            onglets.forEach { o ->
                val on = o.libelle == actif
                val encre = if (on) p.textBody else p.textFaint
                Column(
                    Modifier
                        .weight(1f)
                        .appui(
                            onPress = { onSelect(o.libelle) },
                            encre = encre,
                            petit = true,
                            libelle = o.libelle,
                            role = Role.Tab,
                        )
                        .height(48.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(3.dp, Alignment.CenterVertically),
                ) {
                    Icon(o.glyphe, description = null, taille = 22.dp, couleur = encre)
                    Text(
                        text = o.libelle,
                        style = Typo.corps.copy(fontSize = 10.sp, fontWeight = Metrique.weightSemi),
                        color = encre,
                        maxLines = 1,
                    )
                }
            }
        }
    }
}

/**
 * LE MINI-LECTEUR — la surface que le web n'a pas.
 *
 * ⚠️ LE KIT SE CONTREDIT AVEC SA PROPRE POLITIQUE ANDROID, ET LA POLITIQUE GAGNE.
 * `ScreensNatifMedia.js` pose `backdrop-filter: blur(...)` EN STYLE EN LIGNE, ce qu'aucune
 * règle `.andro` ne peut retirer — c'est exactement le mode de panne que le kit documente
 * lui-même pour `.mm-chrome` : « un flou déclaré en style inline échappe à `.lowfi` ».
 * Retenu : pas de flou sur Android par défaut, le voile `tabbarBg` seul, et l'élévation
 * pour détacher.
 */
@Composable
fun MiniPlayer(
    titre: String,
    position: String,
    duree: String,
    enLecture: Boolean,
    onPress: () -> Unit,
    onBascule: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val p = jetons
    Row(
        modifier
            .fillMaxWidth()
            .appui(onPress, encre = p.textBody, libelle = titre)
            .background(p.tabbarBg)
            .drawBehind {
                drawLine(
                    color = p.tabbarBrd,
                    start = Offset(0f, 0f),
                    end = Offset(size.width, 0f),
                    strokeWidth = 1.dp.toPx(),
                )
            }
            .padding(horizontal = 14.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(11.dp),
    ) {
        Box(
            Modifier
                .size(38.dp)
                .fondDegrade(HorsTable.artMedia, RoundedCornerShape(10.dp)),
        )
        Column(Modifier.weight(1f)) {
            Text(
                text = titre,
                style = Typo.corps.copy(fontSize = 13.sp, fontWeight = Metrique.weightSemi),
                color = p.textBody,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            /* ⛔ La position est un NOMBRE : monospace tabulaire. Sans le tabulaire, le
               compteur tressaute d'un dixième de seconde à l'autre. */
            Text(
                text = "$position / $duree",
                style = Typo.nombre(10.5.sp),
                color = p.textMuted,
                maxLines = 1,
            )
        }
        Box(
            Modifier
                .appui(
                    onBascule,
                    encre = p.textOnPrimary,
                    petit = true,
                    libelle = if (enLecture) "Pause" else "Lecture",
                )
                .size(40.dp)
                .clip(CircleShape)
                .background(p.ink),
            contentAlignment = Alignment.Center,
        ) {
            if (enLecture) {
                Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                    repeat(2) {
                        Box(
                            Modifier
                                .size(width = 3.dp, height = 13.dp)
                                .clip(RoundedCornerShape(1.dp))
                                .background(p.textOnPrimary),
                        )
                    }
                }
            } else {
                Icon("play", description = null, taille = 16.dp, couleur = p.textOnPrimary)
            }
        }
    }
}

/**
 * LES HUIT ONGLETS DU CLUB, EN UNE SEULE BANDE.
 *
 * ⛔ HUIT, PAS QUATRE. Le web posait des bandes de quatre, différentes d'un onglet à
 * l'autre, et cinq onglets sur huit n'étaient atteignables par aucun geste. En natif la
 * barre basse occupe déjà le bas de l'écran : cette bande n'a qu'un endroit possible, juste
 * sous la barre haute, et elle doit porter les huit noms.
 *
 * ⛔ 44 dp EST LE PLANCHER DE CIBLE TACTILE (`touchAa`), pas une valeur d'esthétique :
 * cette bande EST l'interaction principale de l'écran verrouillé.
 */
val CLUB_ORDRE = listOf(
    "Fil", "Discussions", "Membres", "Agenda",
    "Classement", "Opportunités", "Informations", "Parrainage",
)

@Composable
fun BandeClub(
    actif: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    verrou: Boolean = false,
) {
    ChipRow(
        options = CLUB_ORDRE,
        valeur = actif,
        onChange = onSelect,
        modifier = modifier,
        hauteur = Metrique.touchAa,
        disposition = DispositionChips.SCROLL,
        /* Le cadenas ne s'affiche que sur les onglets INACTIFS : un cadenas sur l'onglet
           ouvert serait faux — c'est celui qu'on est en train de regarder. */
        glyphe = if (verrou) "lock" else null,
    )
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * L'ÉCRAN — maillage, zone sûre, barre haute, corps défilant, calque flottant.
 *
 * ⛔ `sombre` OUVRE UNE PORTÉE DE THÈME, ce n'est pas une prop de style. La console et le
 * /403 sont sombres SUR UN TÉLÉPHONE EN MODE CLAIR. Comme pour `Surface(INK)`, le corps
 * doit vivre dans un composable SÉPARÉ : celui qui pose le fournisseur ne le voit pas.
 *
 * ⛔ AUCUN TEXTE DE CORPS NE SE PLACE DANS LE PREMIER TIERS D'UN ÉCRAN À MAILLAGE. Le haut
 * est réservé aux titres d'affichage — du grand texte, seuil 3:1, tenu à 4,28:1. C'est le
 * corollaire du voile, et il est CONTRAIGNANT.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun Screen(
    territoire: Territoire = Territoire.FORME,
    modifier: Modifier = Modifier,
    sombre: Boolean = false,
    retour: String? = null,
    onRetour: (() -> Unit)? = null,
    titre: String? = null,
    droite: (@Composable RowScopeDroite.() -> Unit)? = null,
    tabbar: (@Composable () -> Unit)? = null,
    defile: Boolean = true,
    gouttiere: Dp = Metrique.gutterScreen,
    flottant: (@Composable androidx.compose.foundation.layout.BoxScope.() -> Unit)? = null,
    contenu: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    if (sombre) {
        CompositionLocalProvider(
            LocalPalette provides PALETTE_SOMBRE,
            LocalMode provides Mode.SOMBRE,
            LocalEncre provides PALETTE_SOMBRE.textBody,
        ) {
            CorpsEcran(
                Territoire.NUIT, modifier, retour, onRetour, titre, droite,
                tabbar, defile, gouttiere, flottant, contenu,
            )
        }
        return
    }
    CorpsEcran(
        territoire, modifier, retour, onRetour, titre, droite,
        tabbar, defile, gouttiere, flottant, contenu,
    )
}

@Composable
private fun CorpsEcran(
    territoire: Territoire,
    modifier: Modifier,
    retour: String?,
    onRetour: (() -> Unit)?,
    titre: String?,
    droite: (@Composable RowScopeDroite.() -> Unit)?,
    tabbar: (@Composable () -> Unit)?,
    defile: Boolean,
    gouttiere: Dp,
    flottant: (@Composable androidx.compose.foundation.layout.BoxScope.() -> Unit)?,
    contenu: @Composable androidx.compose.foundation.layout.ColumnScope.() -> Unit,
) {
    val hautSysteme = WindowInsets.systemBars.asPaddingValues().calculateTopPadding()
    val basGeste = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
    val avecBarre = retour != null || titre != null || droite != null

    Box(modifier.fillMaxSize()) {
        Mesh(territoire)

        Column(Modifier.fillMaxSize().padding(top = hautSysteme)) {
            if (avecBarre) NavBar(retour = retour, onRetour = onRetour, titre = titre, droite = droite)
            Column(
                Modifier
                    .weight(1f)
                    .then(if (defile) Modifier.verticalScroll(rememberScrollState()) else Modifier)
                    .padding(
                        PaddingValues(
                            start = gouttiere,
                            end = gouttiere,
                            /* 6 dp sous la barre, 22 dp sans : sans barre, le titre a besoin
                               de son air ; avec barre, elle le lui a déjà donné. */
                            top = if (avecBarre) 6.dp else 22.dp,
                            bottom = (if (tabbar != null) Metrique.tabbarH else 0.dp) + basGeste + 24.dp,
                        ),
                    ),
                content = contenu,
            )
        }

        /* ⛔ La barre d'onglets N'A PAS D'ENVELOPPE : elle reçoit la zone sûre par sa propre
           prop, parce qu'un rembourrage d'ancêtre ne peut pas remonter un enfant ancré en
           bas. C'est le piège nommé dans `TabBar`. */
        if (tabbar != null) Box(Modifier.align(Alignment.BottomCenter)) { tabbar() }

        flottant?.invoke(this)
    }
}
