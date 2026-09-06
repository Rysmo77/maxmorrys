package me.maxmorrys.rysmo.ds

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES QUATRE ACTIONS.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Les huit tons de `Button`. Quatre portent un territoire, quatre portent une intention. */
enum class TonBouton { PRIMARY, FORME, INFORME, TRANSFORME, DIGITALISE, GHOST, QUIET, INK }

enum class TailleBouton { MD, SM }

/** La recette d'un ton, une fois la palette connue. */
@Immutable
private data class RecetteTon(
    val aplat: Color? = null,
    val degrade: Degrade? = null,
    val encre: Color,
    val liseret: Bordure? = null,
    val ombre: Ombre? = null,
)

/**
 * LA TABLE DES TONS, RÉSOLUE.
 *
 * ⛔ `paperFixed`, ET SURTOUT PAS `textOnPrimary`. Les deux valent #FFFFFF en clair, ce qui
 * les rend interchangeables à l'œil — mais `textOnPrimary` BASCULE en #0B0E13 en mode
 * sombre, parce que le ton `primary` inverse son fond. Les tons de territoire, eux, gardent
 * leur teinte saturée dans les DEUX modes : leur encre doit rester du papier.
 *
 * ⛔ L'ENCRE DU TON ORANGE EST FIXE. `inkFixed`, jamais `ink`, qui deviendrait blanc la nuit
 * et donnerait du blanc sur orange clair.
 */
@Composable
private fun recetteTon(ton: TonBouton, eteint: Boolean): RecetteTon {
    val p = jetons
    if (eteint) return RecetteTon(aplat = p.btnOffBg, encre = p.ink3)
    return when (ton) {
        TonBouton.PRIMARY -> RecetteTon(aplat = p.actionPrimary, encre = p.textOnPrimary, ombre = p.shInk)
        TonBouton.FORME -> RecetteTon(degrade = p.actionForme, encre = p.paperFixed, ombre = p.shBleu)
        TonBouton.INFORME -> RecetteTon(
            degrade = p.actionInforme,
            encre = p.inkFixed,
            ombre = HorsTable.ombreBoutonInforme,
        )
        TonBouton.TRANSFORME -> RecetteTon(degrade = p.actionTransforme, encre = p.paperFixed, ombre = p.shViolet)
        TonBouton.DIGITALISE -> RecetteTon(degrade = p.actionDigitalise, encre = p.paperFixed, ombre = p.shTeal)
        TonBouton.GHOST -> RecetteTon(aplat = p.btnGhostBg, encre = p.ink, liseret = p.btnGhostBrd)
        TonBouton.QUIET -> RecetteTon(aplat = p.surfaceQuiet, encre = p.ink, liseret = p.btnQuietBrd)
        /* `surfaceInk` est INVARIANT : c'est un bouton sombre, dans les deux modes. */
        TonBouton.INK -> RecetteTon(aplat = p.surfaceInk, encre = p.paperFixed)
    }
}

/**
 * L'ACTION.
 *
 * ⛔ LA LARGEUR SUIT LA TAILLE. Un `md` remplit sa colonne — c'est L'action de l'écran ; un
 * `sm` se dimensionne sur son texte — c'est une action de ligne. `pleineLargeur` ne sert
 * qu'au cas particulier : deux `sm` côte à côte, chacun à `weight(1f)`.
 */
@Composable
fun Button(
    libelle: String,
    onPress: (() -> Unit)?,
    modifier: Modifier = Modifier,
    ton: TonBouton = TonBouton.PRIMARY,
    taille: TailleBouton = TailleBouton.MD,
    desactive: Boolean = false,
    glypheTete: String? = null,
    glypheQueue: String? = null,
    pleineLargeur: Boolean? = null,
) {
    /*
     * ⛔ UN CONTRÔLE SANS ACTION N'EST PAS DESSINÉ. C'est la règle, et elle est ici pour
     * qu'aucun appelant n'ait à y penser.
     *
     * Sans ce retour, `Button(…, onPress = null)` rendait un contrôle COMPLET — fond, libellé,
     * glyphes — simplement non cliquable, et sans même la sémantique « désactivé » (qui
     * n'est posée que si `desactive` est vrai). Un lecteur d'écran l'annonçait comme un
     * contrôle ordinaire ; un œil le voyait vivant. C'est la définition exacte du contrôle
     * mort, et `mobile-controles-morts.test.ts` en avait attrapé SIX dans le port React
     * Native : l'oubli unitaire de la mémoire, le téléchargement d'un épisode, la vitesse
     * de lecture, « Postuler », et deux réglages de téléchargement.
     *
     * ⚠️ `desactive = true` RESTE RENDU, et c'est une autre intention : montrer qu'un geste
     * existe mais n'est pas disponible maintenant. Le couple « pas d'action ET pas
     * désactivé » ne décrit rien d'autre qu'un oubli.
     *
     * Les écrans qui gardaient déjà leurs appels (`if (reserver != null) { Button(…) }`)
     * continuent de fonctionner — ils font simplement, en amont, ce que le contrôle refuse
     * désormais de laisser passer.
     */
    if (onPress == null && !desactive) return

    val petit = taille == TailleBouton.SM
    val r = recetteTon(ton, desactive)
    val forme: Shape = RoundedCornerShape(Metrique.rPill)
    val large = pleineLargeur ?: !petit

    val fond = Modifier
        .ombre(if (desactive) null else r.ombre, forme)
        .then(if (r.degrade != null) Modifier.fondDegrade(r.degrade, forme) else Modifier)
        .then(if (r.aplat != null) Modifier.clip(forme).background(r.aplat) else Modifier)
        .then(if (r.liseret != null) Modifier.border(r.liseret.epaisseur, r.liseret.couleur, forme) else Modifier)

    CompositionLocalProvider(LocalEncre provides r.encre) {
        Row(
            modifier
                .then(if (large) Modifier.fillMaxWidth() else Modifier)
                .appui(onPress, encre = r.encre, petit = false, desactive = desactive, libelle = libelle)
                .then(fond)
                .defaultMinSize(minHeight = if (petit) 42.dp else Metrique.touchBtn)
                .padding(horizontal = if (petit) 17.dp else 22.dp),
            horizontalArrangement = Arrangement.spacedBy(Metrique.sp8, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            /* Le glyphe est décoratif : le libellé du bouton porte déjà l'information, et
               l'annoncer deux fois ferait dire « flèche, Continuer » à un lecteur d'écran. */
            glypheTete?.let { Icon(it, description = null, taille = if (petit) 15.dp else 17.dp, couleur = r.encre) }
            Text(
                text = libelle,
                style = Typo.corps.copy(
                    fontSize = if (petit) 13.5.sp else 15.sp,
                    fontWeight = Metrique.weightBold,
                ),
                color = r.encre,
                maxLines = 1,
            )
            glypheQueue?.let { Icon(it, description = null, taille = if (petit) 15.dp else 16.dp, couleur = r.encre) }
        }
    }
}

/**
 * LE CHROME ROND DE LA BARRE HAUTE.
 *
 * ⛔ `libelle` EST OBLIGATOIRE, et il n'a pas de valeur par défaut : un bouton qui ne porte
 * qu'un glyphe est muet pour qui écoute l'application. Le compilateur le demande.
 */
@Composable
fun IconButton(
    libelle: String,
    onPress: (() -> Unit)?,
    modifier: Modifier = Modifier,
    desactive: Boolean = false,
    pastille: Boolean = false,
    contenu: @Composable () -> Unit,
) {
    /* ⛔ Un contrôle sans action n'est pas dessiné — la raison complète est sur `Button`.
       `desactive = true` reste rendu : montrer qu'un geste existe mais n'est pas disponible
       est une intention ; « pas d'action et pas désactivé » n'en est pas une. */
    if (onPress == null && !desactive) return

    val p = jetons
    Box(
        modifier
            .alpha(if (desactive) OPACITE_ETEINT else 1f)
            .appui(onPress, encre = p.textBody, petit = true, desactive = desactive, libelle = libelle)
            .ombre(HorsTable.ombreChromeRond, CircleShape)
            .size(Metrique.touchMin)
            .clip(CircleShape)
            .background(p.chromeBg)
            .border(1.dp, p.chromeBrd, CircleShape)
            .liseretHaut(p.chromeHl, Metrique.touchMin / 2),
        contentAlignment = Alignment.Center,
    ) {
        CompositionLocalProvider(LocalEncre provides p.textBody) { contenu() }
        if (pastille) {
            /* La pastille : 9 dp à `top 8 / end 9`, liseré de 1,5 dp de la couleur de la
               PAGE — c'est lui qui la détache du glyphe, pas une ombre. */
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = (-9).dp + 4.5.dp, y = 8.dp - 4.5.dp)
                    .size(9.dp)
                    .clip(CircleShape)
                    .background(p.mmOrange)
                    .border(1.5.dp, p.surfacePage, CircleShape),
            )
        }
    }
}

/**
 * LA PILULE D'ENCRE DU CHROME — « MENU », et rien d'autre.
 *
 * ⚠️ Son encre est `paperFixed` sur `pillBg`. En mode sombre, `pillBg` devient un voile de
 * BLANC à 13 % : le papier fixe y reste juste, parce que le voile est posé sur un fond
 * nuit. C'est le seul contrôle du système dont le fond et l'encre ne basculent pas ensemble.
 */
@Composable
fun PillButton(
    libelle: String,
    onPress: (() -> Unit)?,
    modifier: Modifier = Modifier,
) {
    /* ⛔ Un contrôle sans action n'est pas dessiné — la raison complète est sur `Button`.
       Celui-ci n'a pas d'état désactivé : sans action, il n'a aucune raison d'exister. */
    if (onPress == null) return

    val p = jetons
    val forme = RoundedCornerShape(Metrique.rPill)
    Box(
        modifier
            .appui(onPress, encre = p.paperFixed, petit = true, libelle = libelle)
            .defaultMinSize(minHeight = Metrique.touchMin)
            .clip(forme)
            .background(p.pillBg)
            .padding(horizontal = 17.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = libelle.uppercase(localeCourante()),
            style = Typo.corps.copy(
                fontSize = 12.sp,
                fontWeight = Metrique.weightBold,
                letterSpacing = 0.08f.em,
            ),
            color = p.paperFixed,
            maxLines = 1,
        )
    }
}

/**
 * LE BOUTON FLOTTANT — la seule concession de forme du portage.
 *
 * ⛔ 28 dp DE RAYON SUR iOS (rond), 18 dp SUR ANDROID (arrondi carré). Ce n'est pas une
 * variante décorative : c'est la forme que chaque plateforme reconnaît sans la nommer.
 *
 * ⚠️ SA POSITION : les deux appels du kit divergent — `right 18 / bottom = zone + 96` d'un
 * côté, `right 16 / bottom = tabbarH + 40` de l'autre. Retenu :
 * `end 18.dp`, `bottom = tabbarH + navigationBars + 18.dp`, la seule formule qui tienne les
 * deux réglages de navigation d'Android. Le 96 du premier appel est 24 + 80 − 8, la même
 * intention écrite en constante.
 *
 * ⚠️ SUR iOS, LE FAB DU CLUB N'EXISTE PAS : l'action « Publier » est dans la barre haute.
 * Ce n'est pas une variante de style, ce sont DEUX EMPLACEMENTS POUR UN GESTE — en poser
 * deux donnerait deux chemins pour la même action. C'est l'écran qui tranche, pas le Fab.
 */
@Composable
fun Fab(
    libelle: String,
    onPress: () -> Unit,
    territoire: Territoire,
    modifier: Modifier = Modifier,
    contenu: @Composable () -> Unit,
) {
    val p = jetons
    val rond = !plateforme.estAndroid
    val forme = RoundedCornerShape(if (rond) 28.dp else 18.dp)
    val degrade = when (territoire) {
        Territoire.FORME, Territoire.NUIT -> p.actionForme
        Territoire.INFORME -> p.actionInforme
        Territoire.TRANSFORME -> p.actionTransforme
        Territoire.DIGITALISE -> p.actionDigitalise
    }
    /* L'ombre est colorée du territoire : `0 10 26 rgba(<teinte>, .38–.40)`. Les deux
       valeurs du kit sont extraites ; on choisit celle qui correspond au territoire posé. */
    val ombre = if (territoire == Territoire.TRANSFORME) HorsTable.ombreFabViolet else HorsTable.ombreFabBleu

    Box(
        modifier
            .appui(onPress, encre = p.paperFixed, petit = true, libelle = libelle)
            .ombre(ombre, forme)
            .size(56.dp)
            .fondDegrade(degrade, forme),
        contentAlignment = Alignment.Center,
    ) {
        CompositionLocalProvider(LocalEncre provides p.paperFixed) { contenu() }
    }
}

/** Le décalage bas du Fab, écrit une fois. `zoneGeste` vient de `WindowInsets`. */
fun basDuFab(zoneGeste: Dp): Dp = Metrique.tabbarH + zoneGeste + 18.dp
