package me.maxmorrys.rysmo.ds

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES ONZE COMPOSABLES DE DONNÉES.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

enum class TonTag { OK, WARN, STOP, NEUTRAL, ART }

/**
 * L'ÉTIQUETTE D'ÉTAT.
 *
 * ⛔ LE VOILE EST DÉRIVÉ DE L'ENCRE, JAMAIS UNE SECONDE VALEUR. Recopier
 * `rgba(15,123,82,.16)` créerait une valeur QUI NE BASCULERAIT PAS : en mode sombre `ok`
 * devient #4ADE9B et son voile doit suivre. Un rgba figé resterait le vert du mode clair.
 *
 * ⛔ LE TON `art` N'EST PAS DÉCORATIF. C'est l'étiquette posée SUR UN APLAT DE MARQUE — le
 * « Aperçu · 4 min gratuit » d'une vignette. Sa surface ne suit pas le mode : un aplat de
 * territoire est saturé dans les deux, donc l'étiquette reste papier fixe sur encre fixe.
 * Sans ce ton, `neutral` y écrivait du gris clair sur du blanc en mode sombre — 2,2:1, sur
 * le seul texte de la vignette.
 */
@Composable
fun Tag(libelle: String, ton: TonTag = TonTag.NEUTRAL, modifier: Modifier = Modifier) {
    val p = jetons
    val (fond, encre) = when (ton) {
        TonTag.OK -> p.ok.copy(alpha = 0.13f) to p.ok
        TonTag.WARN -> p.warn.copy(alpha = 0.18f) to p.warn
        TonTag.STOP -> p.stop.copy(alpha = 0.13f) to p.stop
        TonTag.NEUTRAL -> p.fillTag to p.textMuted
        TonTag.ART -> p.paperFixed to p.inkFixed
    }
    Box(
        modifier
            .height(27.dp)
            .clip(RoundedCornerShape(Metrique.rPill))
            .background(fond)
            .padding(horizontal = 11.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = libelle,
            style = Typo.corps.copy(fontSize = 11.sp, fontWeight = Metrique.weightSemi),
            color = encre,
            maxLines = 1,
        )
    }
}

enum class EtatLecon { DONE, CURRENT, TODO, PLAIN }

/**
 * LA LIGNE DE LISTE DENSE.
 *
 * ⚠️ `current` DÉBORDE LATÉRALEMENT DE −18 dp — la gouttière de l'écran. C'est ce qui fait
 * que la ligne courante se lit comme une bande, pas comme une carte : elle touche les deux
 * bords. Le débordement est passé par `padding` négatif sur le conteneur appelant, ou par
 * un `Modifier.layout` ; ici il est exposé en paramètre pour rester explicite.
 */
@Composable
fun LessonRow(
    titre: String,
    modifier: Modifier = Modifier,
    etat: EtatLecon = EtatLecon.TODO,
    glyphe: String? = null,
    fondGlyphe: Color = Color.Unspecified,
    meta: String? = null,
    queue: (@Composable () -> Unit)? = null,
    derniere: Boolean = false,
    onPress: (() -> Unit)? = null,
) {
    val p = jetons
    val courante = etat == EtatLecon.CURRENT
    Row(
        modifier
            .fillMaxWidth()
            .appui(onPress, encre = p.textBody, libelle = titre)
            .then(
                if (courante) {
                    Modifier
                        .fondDegrade(HorsTable.degradeLeconCourante, RoundedCornerShape(14.dp))
                        .padding(horizontal = 18.dp, vertical = 13.dp)
                } else {
                    Modifier
                        .then(
                            if (derniere) {
                                Modifier
                            } else {
                                Modifier.drawBehind {
                                    drawLine(
                                        color = p.borderHair,
                                        start = androidx.compose.ui.geometry.Offset(0f, size.height),
                                        end = androidx.compose.ui.geometry.Offset(size.width, size.height),
                                        strokeWidth = 1.dp.toPx(),
                                    )
                                }
                            },
                        )
                        .padding(vertical = 13.dp)
                },
            ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        when {
            glyphe != null -> Box(
                Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(11.dp))
                    .background(fondGlyphe.takeOrElse { p.fill1 }),
                contentAlignment = Alignment.Center,
            ) { Icon(glyphe, description = null, taille = 17.dp) }

            etat == EtatLecon.DONE -> Box(
                Modifier.size(25.dp).clip(CircleShape).background(HorsTable.voilePuceFaite),
                contentAlignment = Alignment.Center,
            ) { Icon("check", description = null, taille = 13.dp, couleur = p.ok, epaisseur = 3.4f) }

            etat == EtatLecon.TODO -> Box(
                Modifier.size(26.dp).border(2.5.dp, p.fill3, CircleShape),
            )
        }
        Column(Modifier.weight(1f)) {
            Text(
                text = titre,
                style = Typo.corps.copy(
                    fontSize = 14.sp,
                    fontWeight = Metrique.weightSemi,
                    letterSpacing = androidx.compose.ui.unit.TextUnit(
                        -0.01f,
                        androidx.compose.ui.unit.TextUnitType.Em,
                    ),
                ),
                color = p.textBody,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            /* ⛔ La méta est en MONOSPACE — c'est une durée, donc une donnée. */
            if (meta != null) {
                Text(meta, style = Typo.nombre(12.sp), color = p.textFaint, maxLines = 1)
            }
        }
        queue?.invoke()
    }
}

/**
 * LA PROGRESSION.
 *
 * ⚠️ SA BROSSE FAIT 220 % DE LA LARGEUR de la barre : c'est ce que le CSS déclare
 * (`background-size:220% 100%`), et c'est ce qui donne au remplissage sa coulée de quatre
 * teintes plutôt qu'un arc-en-ciel comprimé. Elle est rendue par une boîte VIRTUELLE, jamais
 * en étirant la vue.
 */
@Composable
fun ProgressBar(
    valeur: Float,
    modifier: Modifier = Modifier,
    hauteur: Dp = 8.dp,
) {
    val p = jetons
    /* Le remplissage s'anime À L'ENTRÉE, en `tScene` (700 ms) : une barre qui apparaît déjà
       pleine ne dit pas qu'il y a eu progression. */
    var cible by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(valeur) { cible = valeur.coerceIn(0f, 1f) }
    val part by animateFloatAsState(
        targetValue = cible,
        animationSpec = tween(Metrique.tScene, easing = Metrique.easeOut),
        label = "progression",
    )
    Box(
        modifier
            .fillMaxWidth()
            .height(hauteur)
            .clip(RoundedCornerShape(5.dp))
            .background(p.fill2),
    ) {
        Box(
            Modifier
                .fillMaxHeight()
                .fillMaxWidth(part)
                .fondDegradeEtire(HorsTable.degradeProgression, 2.2f, RoundedCornerShape(5.dp)),
        )
    }
}

/**
 * LE QUOTA DU RÉPÉTITEUR.
 *
 * Le plafond est un CHOIX DE MARGE ASSUMÉ, pas une limite honteuse : il s'affiche en clair,
 * barre par barre, plutôt que de surgir en message d'erreur au cinquième message.
 */
@Composable
fun QuotaMeter(
    consomme: Int,
    modifier: Modifier = Modifier,
    total: Int = 5,
    libelle: String? = null,
) {
    val p = jetons
    Row(
        modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(9.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            repeat(total) { i ->
                Box(
                    Modifier
                        .size(width = 15.dp, height = 5.dp)
                        .clip(RoundedCornerShape(3.dp))
                        .background(if (i < consomme) p.mmViolet else p.fill3),
                )
            }
        }
        Text(
            text = libelle ?: "$consomme / $total",
            style = Typo.nombre(11.5.sp),
            color = p.textMuted,
            maxLines = 1,
        )
    }
}

/**
 * LES INITIALES SUR DÉGRADÉ. ⚠️ AUCUNE PHOTOGRAPHIE N'EXISTE AU DÉPÔT.
 *
 * ⛔ Le liseré est `borderGlass`, PAS un blanc figé : il descend à 13 % en nuit. Un blanc à
 * 60 % écrit en dur ferait un anneau lumineux autour de chaque avatar sur fond sombre.
 */
@Composable
fun Avatar(
    initiales: String,
    modifier: Modifier = Modifier,
    taille: Dp = 42.dp,
    fond: Degrade? = null,
) {
    val p = jetons
    val degrade = fond ?: Degrade(
        angleDeg = 135f,
        arrets = listOf(0f to p.mmViolet, 1f to p.mmBleu),
    )
    Box(
        modifier
            .size(taille)
            .fondDegrade(degrade, CircleShape)
            .border(1.5.dp, p.borderGlass, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = initiales.uppercase(localeCourante()),
            style = Typo.display((taille.value / 3f).sp).copy(fontWeight = Metrique.weightBold),
            color = p.paperFixed,
            maxLines = 1,
        )
    }
}

enum class Locuteur { MOI, IA }

/**
 * LA BULLE DU RÉPÉTITEUR.
 *
 * ⛔ LA BULLE « MOI » EST UN DÉGRADÉ, pas un aplat violet. Le kit pose
 * `var(--action-transforme)` ; le port React Native l'avait aplati en `mmViolet` — même
 * défaut que sur l'interrupteur, et pour la même raison : le dégradé n'était pas parsé.
 */
@Composable
fun ChatBubble(
    de: Locuteur,
    modifier: Modifier = Modifier,
    saisie: Boolean = false,
    contenu: @Composable () -> Unit = {},
) {
    val p = jetons
    val moi = de == Locuteur.MOI
    /* Le coin de queue : 7 dp du côté du locuteur, 20 dp partout ailleurs. */
    val forme: Shape = if (moi) {
        RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp, bottomStart = 20.dp, bottomEnd = 7.dp)
    } else {
        RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp, bottomStart = 7.dp, bottomEnd = 20.dp)
    }

    if (saisie) {
        val transition = rememberInfiniteTransition(label = "saisie")
        Box(
            modifier
                .width(64.dp)
                .clip(forme)
                .background(p.bubbleBg)
                .border(1.dp, p.bubbleBrd, forme)
                .padding(horizontal = 16.dp, vertical = 14.dp),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                /* Trois points, décalés de 0,18 s : le décalage EST l'information — trois
                   points qui clignotent ensemble ressemblent à un défaut d'affichage. */
                listOf(0, 180, 360).forEach { retard ->
                    val a by transition.animateFloat(
                        initialValue = 0.35f,
                        targetValue = 1f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(durationMillis = 1250, delayMillis = 0, easing = Metrique.ease),
                            repeatMode = RepeatMode.Reverse,
                            initialStartOffset = androidx.compose.animation.core.StartOffset(retard),
                        ),
                        label = "point$retard",
                    )
                    Box(
                        Modifier
                            .size(6.dp)
                            .alpha(a * 0.35f + 0.15f)
                            .clip(CircleShape)
                            .background(p.mmViolet),
                    )
                }
            }
        }
        return
    }

    Box(
        modifier
            .widthIn(max = LARGEUR_BULLE)
            .then(
                if (moi) {
                    Modifier
                        .ombre(HorsTable.ombreBulleMoi, forme)
                        .fondDegrade(p.actionTransforme, forme)
                } else {
                    Modifier.clip(forme).background(p.bubbleBg).border(1.dp, p.bubbleBrd, forme)
                },
            )
            .padding(horizontal = 16.dp, vertical = 13.dp),
    ) {
        CompositionLocalProvider(LocalEncre provides if (moi) p.paperFixed else p.textBody) {
            contenu()
        }
    }
}

/**
 * ⚠️ 82 % EST UNE FRACTION DE LA COLONNE, pas une largeur. Compose n'a pas de `max-width`
 * en pourcentage ; la borne est donc posée par le conteneur du fil, qui connaît sa largeur.
 * La constante ici documente l'intention et sert de plafond dur sur téléphone.
 */
private val LARGEUR_BULLE = 300.dp

enum class TonCoche { VIOLET, OK, NEUTRE }

/**
 * CE QUI EST DÛ, UN ENGAGEMENT PAR LIGNE.
 *
 * ⛔ `tiret` EST UN RENVOI, JAMAIS UNE CROIX. Une croix dit « refusé » ; un tiret dit
 * « ailleurs, ou plus tard ». Sur une liste d'engagements, la différence est contractuelle.
 */
@Composable
fun CheckLine(
    modifier: Modifier = Modifier,
    ton: TonCoche = TonCoche.VIOLET,
    tiret: Boolean = false,
    taille: Dp = 12.dp,
    contenu: @Composable () -> Unit,
) {
    val p = jetons
    val (fond, trait) = when (ton) {
        TonCoche.VIOLET -> HorsTable.voileCocheViolet to p.mmVioletT
        TonCoche.OK -> HorsTable.voileCocheOk to p.ok
        TonCoche.NEUTRE -> p.fill2 to p.ink2
    }
    Row(
        modifier.padding(top = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(11.dp),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            Modifier.padding(top = 1.dp).size(22.dp).clip(CircleShape).background(fond),
            contentAlignment = Alignment.Center,
        ) {
            if (tiret) {
                /* ⚠️ LE TIRET N'EST PAS UN GLYPHE DU JEU. `icons.ts` n'en porte pas, et le
                   kit ne le prend pas non plus dans `Icon` : `CheckLine.jsx` dessine
                   `M6 12h12` en ligne. On fait pareil plutôt que d'ajouter un 110e glyphe
                   au jeu partagé pour un seul appelant — et surtout plutôt que de laisser
                   `vecteurGlyphe` retomber sur `check`, qui rendrait une COCHE là où le
                   sens est « ailleurs, ou plus tard ». */
                androidx.compose.foundation.Canvas(Modifier.size(taille)) {
                    val u = size.minDimension / 24f
                    drawLine(
                        color = trait,
                        start = androidx.compose.ui.geometry.Offset(6f * u, 12f * u),
                        end = androidx.compose.ui.geometry.Offset(18f * u, 12f * u),
                        strokeWidth = 3.0f * u,
                        cap = androidx.compose.ui.graphics.StrokeCap.Round,
                    )
                }
            } else {
                Icon(
                    nom = "check",
                    description = null,
                    taille = taille,
                    couleur = trait,
                    epaisseur = 3.4f,
                )
            }
        }
        CompositionLocalProvider(LocalEncre provides p.textBody) { contenu() }
    }
}

/**
 * LA LIGNE DE DOCUMENT.
 *
 * ⚠️ LE FILET EST PLEIN, PAS POINTILLÉ. Compose n'a pas de `border-style: dashed` fiable, et
 * un filet plein très clair rend le même service : séparer sans découper.
 */
@Composable
fun DocLine(
    libelle: String,
    valeur: String,
    modifier: Modifier = Modifier,
    derniere: Boolean = false,
) {
    val p = jetons
    Row(
        modifier
            .fillMaxWidth()
            .then(
                if (derniere) {
                    Modifier
                } else {
                    Modifier.drawBehind {
                        drawLine(
                            color = p.fill3,
                            start = androidx.compose.ui.geometry.Offset(0f, size.height),
                            end = androidx.compose.ui.geometry.Offset(size.width, size.height),
                            strokeWidth = 1.dp.toPx(),
                        )
                    }
                },
            )
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(libelle, style = Typo.corps.copy(fontSize = 13.5.sp), color = p.textMuted)
        Text(valeur, style = Typo.nombre(13.5.sp), color = p.textBody, maxLines = 1)
    }
}

/**
 * LE PRIX.
 *
 * ⛔ `source` ET `asOf` SONT OBLIGATOIRES, comme pour `Num` : un prix est un nombre
 * vérifiable, et « un nombre en monospace vient de la base ou d'une source citée ».
 *
 * ⚠️ Le prix barré est en `textMuted`, pas en `rgba(14,17,22,.42)` comme l'écrit le kit :
 * ce rgba figé disparaîtrait sur fond nuit. Le jeton dit la même intention et bascule.
 */
@Composable
fun PriceBlock(
    montant: String?,
    source: String,
    asOf: String,
    modifier: Modifier = Modifier,
    devise: String = "FCFA",
    barre: String? = null,
    note: String? = null,
    taille: TextUnit = 31.sp,
) {
    val p = jetons
    Column(modifier) {
        Row(
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(Metrique.sp8),
        ) {
            Num(
                valeur = montant,
                source = source,
                asOf = asOf,
                taille = taille,
                repli = "prix non publié",
            )
            if (montant != null) {
                Text(
                    text = devise,
                    style = Typo.corps.copy(fontSize = 14.sp, fontWeight = Metrique.weightSemi),
                    color = p.textBody,
                )
                if (barre != null) {
                    Text(
                        text = barre,
                        style = Typo.nombre(14.sp).copy(textDecoration = TextDecoration.LineThrough),
                        color = p.textMuted,
                    )
                }
            }
        }
        if (note != null) {
            Text(
                text = note,
                style = Typo.corps.copy(fontSize = 12.5.sp),
                color = p.textMuted,
                modifier = Modifier.padding(top = 4.dp),
            )
        }
    }
}

/**
 * LA CASE DE RELEVÉ.
 *
 * ⛔ UN ZÉRO DATÉ EST UNE VALEUR ; UNE ESTIMATION N'EN EST PAS UNE. D'où `source` et `asOf`
 * obligatoires jusqu'ici : la case délègue à `Num`, qui refuse un nombre sans provenance.
 */
@Composable
fun StatTile(
    libelle: String,
    valeur: String?,
    source: String,
    asOf: String,
    modifier: Modifier = Modifier,
    pied: String? = null,
    niveau: Niveau = Niveau.CHROME,
) {
    Surface(niveau, modifier, rembourrage = 16.dp) {
        Column {
            Text(libelle, style = Typo.corps.copy(fontSize = 11.sp), color = jetons.textMuted)
            Num(
                valeur = valeur,
                source = source,
                asOf = asOf,
                taille = 27.sp,
                modifier = Modifier.padding(top = 3.dp),
            )
            if (pied != null) {
                Text(pied, style = Typo.corps.copy(fontSize = 11.sp), color = jetons.textFaint)
            }
        }
    }
}

enum class FormatMedia { AUDIO, VIDEO }

/** Les seize barres de l'onde. Elles viennent du kit, dans cet ordre exact. */
private val ONDE = listOf(16, 30, 44, 24, 38, 14, 33, 44, 20, 36, 26, 42, 18, 30, 40, 22)

/**
 * LA CARTE DE MÉDIA — LA SILHOUETTE DIT LE FORMAT.
 *
 * ⚠️ AD-24 : LA VIGNETTE ACCEPTE UNE PHOTOGRAPHIE, et c'est un écart hors CSS. Le kit
 * l'interdisait ; `Video.thumbnailUrl` et `Podcast.coverImage` sont pourtant des champs
 * OBLIGATOIRES, remplis par les imports YouTube et Spotify. L'écart garde l'argument : la
 * photo remplit la vignette, l'onde et le cadre 16:9 se redessinent PAR-DESSUS, sur un
 * voile sombre. Le dégradé devient le REPLI — pochette absente, URL cassée, image en vol.
 *
 * ⚠️ Le `backdrop-filter: blur(8px)` de la maquette sur le badge N'EST PAS REPRIS : une
 * carte de média vit en grille, et une grille floutée coûte une recomposition par carte.
 */
@Composable
fun MediaCard(
    titre: String,
    modifier: Modifier = Modifier,
    format: FormatMedia = FormatMedia.AUDIO,
    sourcil: String? = null,
    corps: String? = null,
    couts: List<String> = emptyList(),
    badge: String? = null,
    hauteurArt: Dp = 150.dp,
    tailleTitre: TextUnit = 17.sp,
    vignette: (@Composable () -> Unit)? = null,
    onLecture: (() -> Unit)? = null,
    actions: (@Composable () -> Unit)? = null,
) {
    val p = jetons
    val art = if (format == FormatMedia.AUDIO) HorsTable.artMedia else HorsTable.artVideo
    val forme = RoundedCornerShape(Metrique.rL)

    Column(
        modifier
            .ombre(p.glassShFlat, forme)
            .clip(forme)
            .background(p.surfaceCardFlat)
            .border(1.dp, p.glassBrd, forme)
            .liseretHaut(p.glassHl, Metrique.rL),
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(hauteurArt)
                .fondDegrade(art),
        ) {
            /* La photographie, quand elle existe. Le dégradé reste dessous : c'est le repli. */
            vignette?.invoke()

            if (format == FormatMedia.AUDIO) {
                Row(
                    Modifier
                        .align(Alignment.CenterStart)
                        .padding(18.dp)
                        .height(46.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(3.dp),
                ) {
                    ONDE.forEach { h ->
                        Box(
                            Modifier
                                .size(width = 3.dp, height = h.dp)
                                .clip(RoundedCornerShape(2.dp))
                                .background(p.paperFixed.copy(alpha = 0.72f)),
                        )
                    }
                }
            } else {
                Box(
                    Modifier
                        .fillMaxSize()
                        .padding(14.dp)
                        .border(2.dp, p.paperFixed.copy(alpha = 0.28f), RoundedCornerShape(14.dp)),
                )
            }

            Box(
                Modifier
                    .align(if (format == FormatMedia.AUDIO) Alignment.CenterEnd else Alignment.Center)
                    .padding(18.dp)
                    .appui(onLecture, encre = p.inkFixed, petit = true, libelle = "Lire $titre")
                    .ombre(HorsTable.ombreBoutonLecture, CircleShape)
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(p.paperFixed.copy(alpha = 0.92f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon("play", description = null, taille = 19.dp, couleur = p.inkFixed)
            }

            if (badge != null) {
                Box(
                    Modifier
                        .align(Alignment.BottomStart)
                        .padding(14.dp)
                        .height(25.dp)
                        .clip(RoundedCornerShape(Metrique.rPill))
                        .background(HorsTable.voileBadgeMedia)
                        .padding(horizontal = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = badge,
                        style = Typo.corps.copy(fontSize = 10.5.sp, fontWeight = Metrique.weightSemi),
                        color = p.paperFixed,
                        maxLines = 1,
                    )
                }
            }
        }

        Column(Modifier.padding(18.dp)) {
            if (sourcil != null) Eyebrow(sourcil)
            Text(
                text = titre,
                style = Typo.display(tailleTitre).copy(lineHeight = (tailleTitre.value * 1.05f).sp),
                color = p.textBody,
                modifier = Modifier.padding(top = 7.dp),
            )
            if (corps != null) {
                Body(
                    corps,
                    attenue = true,
                    modifier = Modifier.padding(top = 9.dp),
                )
            }
            if (couts.isNotEmpty()) {
                FlowRow(
                    Modifier.padding(top = 13.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    couts.forEach { Text(it, style = Typo.nombre(11.sp), color = p.textMuted) }
                }
            }
            if (actions != null) {
                Row(
                    Modifier.padding(top = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(9.dp),
                ) { actions() }
            }
        }
    }
}
