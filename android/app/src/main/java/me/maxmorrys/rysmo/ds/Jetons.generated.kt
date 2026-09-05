/*
 * GÉNÉRÉ PAR `npm run ds:tokens` — NE PAS ÉDITER.
 * Source : les feuilles de src/design-system/css/tokens et css/overrides (AD-8).
 *
 * Modifier ce fichier à la main le fait diverger du CSS sans que rien ne le signale, et
 * `npm run ds:check` échouera à la prochaine exécution.
 */
package me.maxmorrys.rysmo.ds

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * Les 132 jetons qui DÉPENDENT DU MODE.
 *
 * ⛔ Le mode sombre n'est pas un filtre appliqué au mode clair : le DS redéclare ses
 * teintes en valeur, et 100 jetons sur 225 y changent. Dériver le sombre du clair
 * rendrait faux, entre autres, les six dégradés d'arc — dont `arc`, qui part de
 * #0057BC en clair et de #6FB1FF en sombre.
 */
@Immutable
data class Palette(
  val actionDigitalise: Degrade,
  val actionForme: Degrade,
  val actionInforme: Degrade,
  val actionPrimary: Color,
  val actionStop: Color,
  val actionTransforme: Degrade,
  val arc: Degrade,
  val arcAgence: Degrade,
  val arcDigitalise: Degrade,
  val arcForme: Degrade,
  val arcInforme: Degrade,
  val arcTransforme: Degrade,
  val borderField: Color,
  val borderGlass: Color,
  val borderHair: Color,
  val btnGhostBg: Color,
  val btnGhostBrd: Bordure,
  val btnOffBg: Color,
  val btnQuietBrd: Bordure,
  val bubbleBg: Color,
  val bubbleBrd: Color,
  val cardGrip: Color,
  val cardHl: Ombre?,
  val cardInk: Color,
  val cardInk2: Color,
  val cardSh: Ombre?,
  val chromeBg: Color,
  val chromeBrd: Color,
  val chromeHl: Ombre?,
  val ctlOffBg: Color,
  val ctlOffBrd: Color,
  val ctlRadioBrd: Color,
  val ctlSelBrd: Color,
  val ctlSelRing: Ombre?,
  val errorRing: Ombre?,
  val fieldBg: Color,
  val fieldHl: Ombre?,
  val fill1: Color,
  val fill2: Color,
  val fill3: Color,
  val fill4: Color,
  val fill5: Color,
  val fillTag: Color,
  val focusRing: Ombre?,
  val gDigitalise1: Color,
  val gDigitalise2: Color,
  val gForme1: Color,
  val gForme2: Color,
  val gInforme1: Color,
  val gInforme2: Color,
  val gRose1: Color,
  val gRose2: Color,
  val gTransforme1: Color,
  val gTransforme2: Color,
  val glassBrd: Color,
  val glassHl: Ombre?,
  val glassSh: Ombre?,
  val glassShFlat: Ombre?,
  val glassShHero: Ombre?,
  val ink: Color,
  val ink2: Color,
  val ink3: Color,
  val inkFixed: Color,
  val line: Color,
  val menuBg: Color,
  val menuBrd: Color,
  val menuOffBg: Color,
  val menuOnBg: Color,
  val menuSh: Ombre?,
  val mmBleu: Color,
  val mmBleuC: Color,
  val mmBleuN: Color,
  val mmCorail: Color,
  val mmCorailT: Color,
  val mmOrange: Color,
  val mmOrangeC: Color,
  val mmOrangeN: Color,
  val mmOrangeT: Color,
  val mmRoseC: Color,
  val mmTeal: Color,
  val mmTealC: Color,
  val mmTealN: Color,
  val mmTealT: Color,
  val mmViolet: Color,
  val mmVioletC: Color,
  val mmVioletN: Color,
  val mmVioletT: Color,
  val navBrd: Color,
  val navOnBg: Color,
  val navOnSh: Ombre?,
  val night: Color,
  val night2: Color,
  val night3: Color,
  val ok: Color,
  val onActionStop: Color,
  val paper: Color,
  val paper2: Color,
  val paper3: Color,
  val paperFixed: Color,
  val pillBg: Color,
  val segOnBg: Color,
  val segOnSh: Ombre?,
  val shBleu: Ombre?,
  val shInk: Ombre?,
  val shTeal: Ombre?,
  val shViolet: Ombre?,
  val stateOk: Color,
  val stateStop: Color,
  val stateWarn: Color,
  val stop: Color,
  val surfaceBand: Color,
  val surfaceCard: Color,
  val surfaceCardFlat: Color,
  val surfaceHero: Color,
  val surfaceInk: Color,
  val surfaceNight: Color,
  val surfacePage: Color,
  val surfaceQuiet: Color,
  val surfaceSheet: Color,
  val tabbarBg: Color,
  val tabbarBrd: Color,
  val tabbarHl: Ombre?,
  val textBody: Color,
  val textEyebrow: Color,
  val textFaint: Color,
  val textInvert: Color,
  val textLink: Color,
  val textLinkHover: Color,
  val textMuted: Color,
  val textNum: Color,
  val textOnPrimary: Color,
  val warn: Color,
)

val PALETTE_CLAIRE = Palette(
  actionDigitalise = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0xFF02AC9C), 1.0f to Color(0xFF0057BC))),
  actionForme = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0xFF0057BC), 1.0f to Color(0xFF6C23DD))),
  actionInforme = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0xFFF38B0A), 1.0f to Color(0xFFFF6E7F))),
  actionPrimary = Color(0xFF0E1116),
  actionStop = Color(0xFFB4231F),
  actionTransforme = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0xFF6C23DD), 1.0f to Color(0xFF0057BC))),
  arc = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFF0057BC), 0.25f to Color(0xFF6C23DD), 0.5f to Color(0xFFFF6E7F), 0.75f to Color(0xFFF38B0A), 1.0f to Color(0xFF02AC9C))),
  arcAgence = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFFFF6E7F), 0.25f to Color(0xFFF38B0A), 0.5f to Color(0xFF02AC9C), 0.75f to Color(0xFF0057BC), 1.0f to Color(0xFF6C23DD))),
  arcDigitalise = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFF02AC9C), 0.25f to Color(0xFF0057BC), 0.5f to Color(0xFF6C23DD), 0.75f to Color(0xFFFF6E7F), 1.0f to Color(0xFFF38B0A))),
  arcForme = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFF0057BC), 0.25f to Color(0xFF6C23DD), 0.5f to Color(0xFFFF6E7F), 0.75f to Color(0xFFF38B0A), 1.0f to Color(0xFF02AC9C))),
  arcInforme = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFFF38B0A), 0.25f to Color(0xFF02AC9C), 0.5f to Color(0xFF0057BC), 0.75f to Color(0xFF6C23DD), 1.0f to Color(0xFFFF6E7F))),
  arcTransforme = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFF6C23DD), 0.25f to Color(0xFFFF6E7F), 0.5f to Color(0xFFF38B0A), 0.75f to Color(0xFF02AC9C), 1.0f to Color(0xFF0057BC))),
  borderField = Color(0x210E1116),
  borderGlass = Color(0x8CFFFFFF),
  borderHair = Color(0x120E1116),
  btnGhostBg = Color(0xBDFFFFFF),
  btnGhostBrd = Bordure(epaisseur = 1.5.dp, couleur = Color(0xE60E1116)),
  btnOffBg = Color(0x1A0E1116),
  btnQuietBrd = Bordure(epaisseur = 1.dp, couleur = Color(0x1C0E1116)),
  bubbleBg = Color(0xADFFFFFF),
  bubbleBrd = Color(0xB3FFFFFF),
  cardGrip = Color(0xBFFFFFFF),
  cardHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x99FFFFFF)),
  cardInk = Color(0xFF0E1116),
  cardInk2 = Color(0x9E0E1116),
  cardSh = Ombre(inset = false, dx = 0.dp, dy = 10.dp, flou = 28.dp, etale = 0.dp, couleur = Color(0x1A0E1116)),
  chromeBg = Color(0x99FFFFFF),
  chromeBrd = Color(0x99FFFFFF),
  chromeHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0xCCFFFFFF)),
  ctlOffBg = Color(0x8CFFFFFF),
  ctlOffBrd = Color(0x99FFFFFF),
  ctlRadioBrd = Color(0x2E0E1116),
  ctlSelBrd = Color(0xD90E1116),
  ctlSelRing = Ombre(inset = false, dx = 0.dp, dy = 0.dp, flou = 0.dp, etale = 3.dp, couleur = Color(0x120E1116)),
  errorRing = Ombre(inset = false, dx = 0.dp, dy = 0.dp, flou = 0.dp, etale = 3.dp, couleur = Color(0x21B4231F)),
  fieldBg = Color(0xB8FFFFFF),
  fieldHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0xBFFFFFFF)),
  fill1 = Color(0x0F0E1116),
  fill2 = Color(0x170E1116),
  fill3 = Color(0x1F0E1116),
  fill4 = Color(0x290E1116),
  fill5 = Color(0x330E1116),
  fillTag = Color(0x120E1116),
  focusRing = Ombre(inset = false, dx = 0.dp, dy = 0.dp, flou = 0.dp, etale = 3.dp, couleur = Color(0x290057BC)),
  gDigitalise1 = Color(0xFFBEF2EA),
  gDigitalise2 = Color(0xFFD8ECFF),
  gForme1 = Color(0xFFD6E8FF),
  gForme2 = Color(0xFFE4D8FF),
  gInforme1 = Color(0xFFFFE6BC),
  gInforme2 = Color(0xFFFFD2D6),
  gRose1 = Color(0xFFFFD5D9),
  gRose2 = Color(0xFFFFE7C7),
  gTransforme1 = Color(0xFFE5D8FF),
  gTransforme2 = Color(0xFFD2E4FF),
  glassBrd = Color(0x8CFFFFFF),
  glassHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0xBFFFFFFF)),
  glassSh = Ombre(inset = false, dx = 0.dp, dy = 14.dp, flou = 38.dp, etale = 0.dp, couleur = Color(0x210E1116)),
  glassShFlat = Ombre(inset = false, dx = 0.dp, dy = 6.dp, flou = 18.dp, etale = 0.dp, couleur = Color(0x120E1116)),
  glassShHero = Ombre(inset = false, dx = 0.dp, dy = 18.dp, flou = 44.dp, etale = 0.dp, couleur = Color(0x240E1116)),
  ink = Color(0xFF0E1116),
  ink2 = Color(0xFF5A6472),
  ink3 = Color(0xFF68727F),
  inkFixed = Color(0xFF0E1116),
  line = Color(0xFFE2E7EC),
  menuBg = Color(0xFFFFFFFF),
  menuBrd = Color(0xFFE2E7EC),
  menuOffBg = Color(0xFFF5F5F6),
  menuOnBg = Color(0xFFF1F1F1),
  menuSh = Ombre(inset = false, dx = 0.dp, dy = 6.dp, flou = 18.dp, etale = 0.dp, couleur = Color(0x120E1116)),
  mmBleu = Color(0xFF0057BC),
  mmBleuC = Color(0xFFC7E1FF),
  mmBleuN = Color(0xFF6FB1FF),
  mmCorail = Color(0xFFFF6E7F),
  mmCorailT = Color(0xFFC22A3C),
  mmOrange = Color(0xFFF38B0A),
  mmOrangeC = Color(0xFFFFDCA8),
  mmOrangeN = Color(0xFFFFB24D),
  mmOrangeT = Color(0xFF8A4B00),
  mmRoseC = Color(0xFFFFC9CE),
  mmTeal = Color(0xFF02AC9C),
  mmTealC = Color(0xFFA8EEE4),
  mmTealN = Color(0xFF3FD9C6),
  mmTealT = Color(0xFF00695E),
  mmViolet = Color(0xFF6C23DD),
  mmVioletC = Color(0xFFDFD0FF),
  mmVioletN = Color(0xFFB98CFF),
  mmVioletT = Color(0xFF5A17BE),
  navBrd = Color(0x80FFFFFF),
  navOnBg = Color(0xB3FFFFFF),
  navOnSh = Ombre(inset = false, dx = 0.dp, dy = 2.dp, flou = 10.dp, etale = 0.dp, couleur = Color(0x120E1116)),
  night = Color(0xFF0A0D11),
  night2 = Color(0xFF0B0E13),
  night3 = Color(0xFF0F151B),
  ok = Color(0xFF0F7B52),
  onActionStop = Color(0xFFFFFFFF),
  paper = Color(0xFFFFFFFF),
  paper2 = Color(0xFFF5F7F9),
  paper3 = Color(0xFFEDF0F4),
  paperFixed = Color(0xFFFFFFFF),
  pillBg = Color(0xE60E1116),
  segOnBg = Color(0xFFFFFFFF),
  segOnSh = Ombre(inset = false, dx = 0.dp, dy = 2.dp, flou = 8.dp, etale = 0.dp, couleur = Color(0x1A0E1116)),
  shBleu = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 24.dp, etale = 0.dp, couleur = Color(0x570057BC)),
  shInk = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 22.dp, etale = 0.dp, couleur = Color(0x3D0E1116)),
  shTeal = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 24.dp, etale = 0.dp, couleur = Color(0x5202AC9C)),
  shViolet = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 24.dp, etale = 0.dp, couleur = Color(0x576C23DD)),
  stateOk = Color(0xFF0F7B52),
  stateStop = Color(0xFFB4231F),
  stateWarn = Color(0xFF8A4B00),
  stop = Color(0xFFB4231F),
  surfaceBand = Color(0xFFF5F7F9),
  surfaceCard = Color(0x9EFFFFFF),
  surfaceCardFlat = Color(0xC7FFFFFF),
  surfaceHero = Color(0x94FFFFFF),
  surfaceInk = Color(0xFF0E1116),
  surfaceNight = Color(0xB80E1116),
  surfacePage = Color(0xFFFFFFFF),
  surfaceQuiet = Color(0x110E1116),
  surfaceSheet = Color(0xFFFFFFFF),
  tabbarBg = Color(0x9EFFFFFF),
  tabbarBrd = Color(0xB3FFFFFF),
  tabbarHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0xCCFFFFFF)),
  textBody = Color(0xFF0E1116),
  textEyebrow = Color(0xFF5A6472),
  textFaint = Color(0xFF68727F),
  textInvert = Color(0xFFFFFFFF),
  textLink = Color(0xFF0057BC),
  textLinkHover = Color(0xFF6C23DD),
  textMuted = Color(0xFF5A6472),
  textNum = Color(0xFF0E1116),
  textOnPrimary = Color(0xFFFFFFFF),
  warn = Color(0xFF8A4B00),
)

val PALETTE_SOMBRE = Palette(
  actionDigitalise = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0xFF02AC9C), 1.0f to Color(0xFF0057BC))),
  actionForme = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0xFF0057BC), 1.0f to Color(0xFF6C23DD))),
  actionInforme = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0xFFF38B0A), 1.0f to Color(0xFFFF6E7F))),
  actionPrimary = Color(0xFFECF0F5),
  actionStop = Color(0xFFFF8A80),
  actionTransforme = Degrade(angleDeg = 135.0f, arrets = listOf(0.0f to Color(0xFF6C23DD), 1.0f to Color(0xFF0057BC))),
  arc = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFF6FB1FF), 0.25f to Color(0xFFB98CFF), 0.5f to Color(0xFFFF6E7F), 0.75f to Color(0xFFFFB24D), 1.0f to Color(0xFF3FD9C6))),
  arcAgence = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFFFF6E7F), 0.25f to Color(0xFFFFB24D), 0.5f to Color(0xFF3FD9C6), 0.75f to Color(0xFF6FB1FF), 1.0f to Color(0xFFB98CFF))),
  arcDigitalise = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFF3FD9C6), 0.25f to Color(0xFF6FB1FF), 0.5f to Color(0xFFB98CFF), 0.75f to Color(0xFFFF6E7F), 1.0f to Color(0xFFFFB24D))),
  arcForme = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFF6FB1FF), 0.25f to Color(0xFFB98CFF), 0.5f to Color(0xFFFF6E7F), 0.75f to Color(0xFFFFB24D), 1.0f to Color(0xFF3FD9C6))),
  arcInforme = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFFFFB24D), 0.25f to Color(0xFF3FD9C6), 0.5f to Color(0xFF6FB1FF), 0.75f to Color(0xFFB98CFF), 1.0f to Color(0xFFFF6E7F))),
  arcTransforme = Degrade(angleDeg = 96.0f, arrets = listOf(0.0f to Color(0xFFB98CFF), 0.25f to Color(0xFFFF6E7F), 0.5f to Color(0xFFFFB24D), 0.75f to Color(0xFF3FD9C6), 1.0f to Color(0xFF6FB1FF))),
  borderField = Color(0x26FFFFFF),
  borderGlass = Color(0x21FFFFFF),
  borderHair = Color(0x17FFFFFF),
  btnGhostBg = Color(0x21FFFFFF),
  btnGhostBrd = Bordure(epaisseur = 1.5.dp, couleur = Color(0x52FFFFFF)),
  btnOffBg = Color(0x14FFFFFF),
  btnQuietBrd = Bordure(epaisseur = 1.dp, couleur = Color(0x24FFFFFF)),
  bubbleBg = Color(0x17FFFFFF),
  bubbleBrd = Color(0x24FFFFFF),
  cardGrip = Color(0x6BFFFFFF),
  cardHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x24FFFFFF)),
  cardInk = Color(0xFFECF0F5),
  cardInk2 = Color(0xB3ECF0F5),
  cardSh = Ombre(inset = false, dx = 0.dp, dy = 10.dp, flou = 28.dp, etale = 0.dp, couleur = Color(0x66000000)),
  chromeBg = Color(0x1AFFFFFF),
  chromeBrd = Color(0x26FFFFFF),
  chromeHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x1FFFFFFF)),
  ctlOffBg = Color(0x14FFFFFF),
  ctlOffBrd = Color(0x21FFFFFF),
  ctlRadioBrd = Color(0x42FFFFFF),
  ctlSelBrd = Color(0xFFECF0F5),
  ctlSelRing = Ombre(inset = false, dx = 0.dp, dy = 0.dp, flou = 0.dp, etale = 3.dp, couleur = Color(0x1AFFFFFF)),
  errorRing = Ombre(inset = false, dx = 0.dp, dy = 0.dp, flou = 0.dp, etale = 3.dp, couleur = Color(0x33FF8A80)),
  fieldBg = Color(0x12FFFFFF),
  fieldHl = null,
  fill1 = Color(0x12FFFFFF),
  fill2 = Color(0x1AFFFFFF),
  fill3 = Color(0x24FFFFFF),
  fill4 = Color(0x2EFFFFFF),
  fill5 = Color(0x3DFFFFFF),
  fillTag = Color(0x17FFFFFF),
  focusRing = Ombre(inset = false, dx = 0.dp, dy = 0.dp, flou = 0.dp, etale = 3.dp, couleur = Color(0x386FB1FF)),
  gDigitalise1 = Color(0xFF0B3B39),
  gDigitalise2 = Color(0xFF122B4A),
  gForme1 = Color(0xFF12294D),
  gForme2 = Color(0xFF241C4E),
  gInforme1 = Color(0xFF3A2510),
  gInforme2 = Color(0xFF3B1A24),
  gRose1 = Color(0xFF3B1A24),
  gRose2 = Color(0xFF3A2510),
  gTransforme1 = Color(0xFF241C4E),
  gTransforme2 = Color(0xFF132A4E),
  glassBrd = Color(0x8CFFFFFF),
  glassHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x1AFFFFFF)),
  glassSh = Ombre(inset = false, dx = 0.dp, dy = 14.dp, flou = 38.dp, etale = 0.dp, couleur = Color(0x75000000)),
  glassShFlat = Ombre(inset = false, dx = 0.dp, dy = 6.dp, flou = 18.dp, etale = 0.dp, couleur = Color(0x120E1116)),
  glassShHero = Ombre(inset = false, dx = 0.dp, dy = 18.dp, flou = 44.dp, etale = 0.dp, couleur = Color(0x240E1116)),
  ink = Color(0xFFECF0F5),
  ink2 = Color(0xFFA2ADBB),
  ink3 = Color(0xFF77828F),
  inkFixed = Color(0xFF0E1116),
  line = Color(0x1AFFFFFF),
  menuBg = Color(0xFF0F151B),
  menuBrd = Color(0x1AFFFFFF),
  menuOffBg = Color(0xFF181E24),
  menuOnBg = Color(0xFF1C2228),
  menuSh = Ombre(inset = false, dx = 0.dp, dy = 6.dp, flou = 18.dp, etale = 0.dp, couleur = Color(0x61000000)),
  mmBleu = Color(0xFF6FB1FF),
  mmBleuC = Color(0xFFC7E1FF),
  mmBleuN = Color(0xFF6FB1FF),
  mmCorail = Color(0xFFFF6E7F),
  mmCorailT = Color(0xFFFF6E7F),
  mmOrange = Color(0xFFFFB24D),
  mmOrangeC = Color(0xFFFFDCA8),
  mmOrangeN = Color(0xFFFFB24D),
  mmOrangeT = Color(0xFFFFB24D),
  mmRoseC = Color(0xFFFFC9CE),
  mmTeal = Color(0xFF3FD9C6),
  mmTealC = Color(0xFFA8EEE4),
  mmTealN = Color(0xFF3FD9C6),
  mmTealT = Color(0xFF3FD9C6),
  mmViolet = Color(0xFFB98CFF),
  mmVioletC = Color(0xFFDFD0FF),
  mmVioletN = Color(0xFFB98CFF),
  mmVioletT = Color(0xFFB98CFF),
  navBrd = Color(0x1AFFFFFF),
  navOnBg = Color(0x1AFFFFFF),
  navOnSh = Ombre(inset = false, dx = 0.dp, dy = 2.dp, flou = 10.dp, etale = 0.dp, couleur = Color(0x4D000000)),
  night = Color(0xFF0A0D11),
  night2 = Color(0xFF0B0E13),
  night3 = Color(0xFF0F151B),
  ok = Color(0xFF4ADE9B),
  onActionStop = Color(0xFF0E1116),
  paper = Color(0xFFFFFFFF),
  paper2 = Color(0xFFF5F7F9),
  paper3 = Color(0xFFEDF0F4),
  paperFixed = Color(0xFFFFFFFF),
  pillBg = Color(0x21FFFFFF),
  segOnBg = Color(0x29FFFFFF),
  segOnSh = Ombre(inset = false, dx = 0.dp, dy = 2.dp, flou = 8.dp, etale = 0.dp, couleur = Color(0x57000000)),
  shBleu = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 24.dp, etale = 0.dp, couleur = Color(0x570057BC)),
  shInk = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 22.dp, etale = 0.dp, couleur = Color(0x3D0E1116)),
  shTeal = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 24.dp, etale = 0.dp, couleur = Color(0x5202AC9C)),
  shViolet = Ombre(inset = false, dx = 0.dp, dy = 8.dp, flou = 24.dp, etale = 0.dp, couleur = Color(0x576C23DD)),
  stateOk = Color(0xFF4ADE9B),
  stateStop = Color(0xFFFF8A80),
  stateWarn = Color(0xFFFFB24D),
  stop = Color(0xFFFF8A80),
  surfaceBand = Color(0xFF0A0D11),
  surfaceCard = Color(0x13FFFFFF),
  surfaceCardFlat = Color(0x0EFFFFFF),
  surfaceHero = Color(0x0EFFFFFF),
  surfaceInk = Color(0xFF0E1116),
  surfaceNight = Color(0xB80E1116),
  surfacePage = Color(0xFF0B0E13),
  surfaceQuiet = Color(0x1AFFFFFF),
  surfaceSheet = Color(0xFF0F151B),
  tabbarBg = Color(0xB80D1117),
  tabbarBrd = Color(0x1AFFFFFF),
  tabbarHl = Ombre(inset = true, dx = 0.dp, dy = 1.dp, flou = 0.dp, etale = 0.dp, couleur = Color(0x17FFFFFF)),
  textBody = Color(0xFFECF0F5),
  textEyebrow = Color(0xFFA2ADBB),
  textFaint = Color(0xFF77828F),
  textInvert = Color(0xFFFFFFFF),
  textLink = Color(0xFF6FB1FF),
  textLinkHover = Color(0xFFB98CFF),
  textMuted = Color(0xFFA2ADBB),
  textNum = Color(0xFFECF0F5),
  textOnPrimary = Color(0xFF0B0E13),
  warn = Color(0xFFFFB24D),
)

/**
 * Les 93 jetons COMMUNS aux deux modes.
 *
 * Que cette séparation soit juste n'est pas une hypothèse : le générateur échoue si un
 * jeton listé ici prend deux valeurs, et si un jeton de la palette change de catégorie.
 */
@Immutable
object Metrique {

  /* ── Longueurs — marges, rayons, cibles tactiles ── */
  val bpStack: Dp = 700.dp
  val bpWide: Dp = 1080.dp
  val glassBlur: Dp = 24.dp
  val glassBlurChrome: Dp = 26.dp
  val gutterPane: Dp = 30.dp
  val gutterScreen: Dp = 18.dp
  val padPanel: Dp = 20.dp
  val padPanelHero: Dp = 22.dp
  val rL: Dp = 24.dp
  val rM: Dp = 16.dp
  val rMedia: Dp = 26.dp
  val rPhone: Dp = 46.dp
  val rPill: Dp = 999.dp
  val rS: Dp = 10.dp
  val rScreen: Dp = 38.dp
  val rXl: Dp = 30.dp
  val sp10: Dp = 10.dp
  val sp12: Dp = 12.dp
  val sp14: Dp = 14.dp
  val sp16: Dp = 16.dp
  val sp18: Dp = 18.dp
  val sp20: Dp = 20.dp
  val sp22: Dp = 22.dp
  val sp24: Dp = 24.dp
  val sp26: Dp = 26.dp
  val sp30: Dp = 30.dp
  val sp32: Dp = 32.dp
  val sp36: Dp = 36.dp
  val sp4: Dp = 4.dp
  val sp40: Dp = 40.dp
  val sp44: Dp = 44.dp
  val sp6: Dp = 6.dp
  val sp8: Dp = 8.dp
  val stackOverlap: Dp = (-14).dp
  val tabbarH: Dp = 80.dp
  val touchAa: Dp = 44.dp
  val touchBtn: Dp = 54.dp
  val touchGap: Dp = 8.dp
  val touchMin: Dp = 42.dp

  /* ── Typographie — corps, approches, interlignes, graisses ── */
  val fBody: String = "Schibsted Grotesk"
  val fDisplay: String = "Fraunces"
  val fMono: String = "JetBrains Mono"
  val fsBody: TextUnit = 15.sp
  val fsDsp: TextUnit = 41.sp
  val fsDspSm: TextUnit = 30.sp
  val fsDspXl: TextUnit = 64.sp
  val fsDspXs: TextUnit = 23.sp
  val fsDspXxl: TextUnit = 74.sp
  val fsEyebrow: TextUnit = 10.5.sp
  val fsLede: TextUnit = 14.sp
  val fsMeta: TextUnit = 13.sp
  val fsMeta2: TextUnit = 12.5.sp
  val fsProse: TextUnit = 15.5.sp
  val fsSmall: TextUnit = 11.5.sp
  val fsTtl: TextUnit = 26.sp
  val lhBody: Float = 1.45f
  val lhDsp: Float = 0.9f
  val lhDspSm: Float = 0.95f
  val lhDspXl: Float = 0.9f
  val lhDspXs: Float = 1.02f
  val lhDspXxl: Float = 0.92f
  val lhLede: Float = 1.5f
  val lhProse: Float = 1.68f
  val lsDsp: TextUnit = -0.038f.em
  val lsDspSm: TextUnit = -0.038f.em
  val lsDspXl: TextUnit = -0.038f.em
  val lsDspXs: TextUnit = -0.028f.em
  val lsDspXxl: TextUnit = -0.035f.em
  val lsEyebrow: TextUnit = 0.14f.em
  val lsNum: TextUnit = -0.02f.em
  val lsTtl: TextUnit = -0.032f.em
  val measureDoc: Int = 76
  val measureProse: Int = 68
  val weightBlack: FontWeight = FontWeight(900)
  val weightBody: FontWeight = FontWeight(400)
  val weightBold: FontWeight = FontWeight(700)
  val weightMed: FontWeight = FontWeight(500)
  val weightSemi: FontWeight = FontWeight(600)

  /* ── Mouvement — durées et courbes ── */
  val ease: Easing = CubicBezierEasing(0.2f, 0.7f, 0.2f, 1.0f)
  val easeOut: Easing = CubicBezierEasing(0.16f, 1.0f, 0.3f, 1.0f)
  val stagger: Int = 70
  val staggerLine: Int = 90
  val tEnter: Int = 380
  val tScene: Int = 700
  val tTap: Int = 120
  val tUi: Int = 220

  /* ── Verre — opacités, flou, saturation ── */
  val glassA: Float = 0.62f
  val glassAFlat: Float = 0.78f
  val glassAHero: Float = 0.58f
  val glassDA: Float = 0.72f
  val glassSat: Float = 1.7f

  /* ── Le reste ── */
  val pressScale: Float = 0.975f
  val pressScaleSm: Float = 0.94f
}
