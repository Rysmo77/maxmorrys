package me.maxmorrys.rysmo.ds

import me.maxmorrys.rysmo.donnees.Etat
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES QUATRE SURFACES QUI NE SONT PAS DU VERRE.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Les cinq territoires de carte. `ROSE` n'a pas de maillage : c'est un aplat de carte seul. */
enum class TerritoireCarte { FORME, INFORME, TRANSFORME, DIGITALISE, ROSE }

/** Les quatre dispositions de `TerritoryCard`. */
enum class PoseCarte { STACK, GRID, ROW, PLAIN }

/**
 * ⛔ LE CHEVRON, EN FRACTIONS — c'est lui qui reconstruit le M du logo quand quatre cartes
 * s'empilent. Le kit le découpe par un tracé, pas par une image :
 * `polygon(0 100%, 22% 62%, 38% 18%, 50% 0, 62% 18%, 78% 62%, 100% 100%)`.
 *
 * ⚠️ Le CSS le laisse DÉBORDER de 1 px à gauche et à droite (`left:-1px;right:-1px`), ce qui
 * suppose un conteneur qui ne rogne pas. La silhouette obtenue n'a pas encore été comparée
 * à une capture du kit : à vérifier au premier écran qui empile quatre cartes.
 */
private val CHEVRON = listOf(
    0f to 1f, 0.22f to 0.62f, 0.38f to 0.18f, 0.5f to 0f,
    0.62f to 0.18f, 0.78f to 0.62f, 1f to 1f,
)

/**
 * LA SIGNATURE DU SYSTÈME.
 *
 * Quatre cartes empilées reconstruisent la silhouette du M du logo en défilant. Le
 * chevauchement de −14 dp (`stackOverlap`) et le chevron de 18 dp posé à −16 dp en sont les
 * deux moitiés : sans le chevauchement, les chevrons flottent ; sans les chevrons, la pile
 * n'est qu'une liste.
 */
@Composable
fun TerritoryCard(
    territoire: TerritoireCarte,
    modifier: Modifier = Modifier,
    pose: PoseCarte = PoseCarte.STACK,
    premiere: Boolean = false,
    meta: String? = null,
    titre: String? = null,
    tailleTitre: TextUnit = TextUnit.Unspecified,
    grand: String? = null,
    libelleGrand: String? = null,
    onPress: (() -> Unit)? = null,
    contenu: (@Composable () -> Unit)? = null,
) {
    val p = jetons
    val (t1, t2) = when (territoire) {
        TerritoireCarte.FORME -> p.gForme1 to p.gForme2
        TerritoireCarte.INFORME -> p.gInforme1 to p.gInforme2
        TerritoireCarte.TRANSFORME -> p.gTransforme1 to p.gTransforme2
        TerritoireCarte.DIGITALISE -> p.gDigitalise1 to p.gDigitalise2
        TerritoireCarte.ROSE -> p.gRose1 to p.gRose2
    }
    /* ⚠️ 150°, pas 135° : la carte n'est pas un bouton. Le kit distingue les deux angles. */
    val degrade = Degrade(angleDeg = 150f, arrets = listOf(0f to t1, 1f to t2))
    val forme = RoundedCornerShape(Metrique.rL)
    val chevron = pose != PoseCarte.PLAIN
    val rembourrage = when (pose) {
        PoseCarte.STACK -> androidx.compose.foundation.layout.PaddingValues(start = 20.dp, end = 20.dp, top = 24.dp, bottom = 36.dp)
        PoseCarte.GRID -> androidx.compose.foundation.layout.PaddingValues(start = 20.dp, end = 20.dp, top = 24.dp, bottom = 28.dp)
        PoseCarte.ROW -> androidx.compose.foundation.layout.PaddingValues(start = 20.dp, end = 20.dp, top = 26.dp, bottom = 30.dp)
        PoseCarte.PLAIN -> androidx.compose.foundation.layout.PaddingValues(20.dp)
    }

    Box(
        modifier
            .fillMaxWidth()
            /* L'appui est posé sur la BOÎTE, pas sur la carte : sinon le chevron, qui
               déborde au-dessus, ne s'enfoncerait pas avec elle. */
            .appui(onPress, encre = p.cardInk, libelle = titre)
            .then(
                if (pose == PoseCarte.STACK && !premiere) {
                    Modifier.offset(y = Metrique.stackOverlap)
                } else {
                    Modifier
                },
            ),
    ) {
        if (chevron) {
            /* Le chevron déborde AU-DESSUS de la carte : il est dessiné en premier, décalé
               de −16 dp, et peint du MÊME dégradé — c'est ce qui le soude à la carte. */
            Canvas(
                Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-16).dp)
                    .fillMaxWidth()
                    .height(18.dp)
                    .clearAndSetSemantics { },
            ) {
                val chemin = Path().apply {
                    moveTo(CHEVRON[0].first * size.width, CHEVRON[0].second * size.height)
                    CHEVRON.drop(1).forEach { (fx, fy) -> lineTo(fx * size.width, fy * size.height) }
                    close()
                }
                drawPath(chemin, degrade.brosse(size))
            }
            /* La poignée : 34 × 4 dp à −7 dp. Elle dit « ça s'empile », pas « ça se glisse ». */
            Box(
                Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-7).dp)
                    .size(width = 34.dp, height = 4.dp)
                    .clip(RoundedCornerShape(3.dp))
                    .background(p.cardGrip),
            )
        }

        Column(
            Modifier
                .ombre(p.cardSh, forme)
                .fondDegrade(degrade, forme)
                .border(1.dp, p.borderGlass, forme)
                .liseretHaut(p.cardHl, Metrique.rL)
                .padding(rembourrage),
        ) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Column(Modifier.weight(1f)) {
                    /* ⛔ L'ENCRE DE CARTE EST `cardInk`, PAS `ink`. Un aplat pastel de
                       territoire reste CLAIR dans les deux modes : y écrire l'encre de page
                       donnerait du blanc sur pastel la nuit. */
                    if (meta != null) {
                        Text(meta, style = Typo.nombre(11.sp), color = p.cardInk2, maxLines = 1)
                    }
                    if (titre != null) {
                        Text(
                            text = sansCrochets(titre),
                            style = if (tailleTitre != TextUnit.Unspecified) {
                                Typo.display(tailleTitre).copy(letterSpacing = Metrique.lsTtl)
                            } else {
                                Typo.titreCarte
                            },
                            color = p.cardInk,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                }
                if (grand != null) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text(grand, style = Typo.nombre(26.sp), color = p.cardInk, maxLines = 1)
                        if (libelleGrand != null) {
                            Text(
                                text = libelleGrand.uppercase(localeCourante()),
                                style = Typo.corps.copy(
                                    fontSize = 10.sp,
                                    fontWeight = Metrique.weightSemi,
                                    letterSpacing = androidx.compose.ui.unit.TextUnit(
                                        0.1f,
                                        androidx.compose.ui.unit.TextUnitType.Em,
                                    ),
                                ),
                                color = p.cardInk2,
                                modifier = Modifier.padding(top = 3.dp),
                            )
                        }
                    }
                }
            }
            if (contenu != null) {
                CompositionLocalProvider(LocalEncre provides p.cardInk) { contenu() }
            }
        }
    }
}

/**
 * LA FORME DU CONTENU AVANT LE CONTENU. ⛔ JAMAIS UN ROND QUI TOURNE.
 *
 * Un rond qui tourne dit « attends » ; un squelette dit « voilà ce qui arrive, et où ». Sur
 * une connexion lente — le cas normal du marché visé — la différence est celle entre une
 * attente et une promesse.
 *
 * ⚠️ La brosse fait 280 % de la largeur et GLISSE : c'est `background-position` que le CSS
 * anime, pas la vue. Étirer la vue déformerait le rayon des coins.
 */
@Composable
fun Skeleton(
    modifier: Modifier = Modifier,
    largeur: Dp? = null,
    hauteur: Dp = 16.dp,
    rayon: Dp = Metrique.rS,
) {
    val p = jetons
    val degrade = Degrade(
        angleDeg = 100f,
        arrets = listOf(0.30f to p.fill1, 0.48f to p.fill3, 0.62f to p.fill1),
    )
    val transition = rememberInfiniteTransition(label = "miroitement")
    /*
     * ⚠️ LES BORNES VIENNENT DU CSS, ET ELLES NE SONT NI −1 NI +1.
     * `@keyframes shim{from{background-position:180% 0}to{background-position:-80% 0}}`.
     * En CSS, un pourcentage de position sur une image PLUS LARGE que la boîte vaut
     * `p × (largeurBoîte − largeurImage)` : avec une image à 280 %, cela donne
     * 1,8 × (−1,8 W) = −3,24 W au départ, et −0,8 × (−1,8 W) = +1,44 W à l'arrivée.
     * Les recopier en −1 → +1 ferait passer la bande claire hors de la vue : le squelette
     * miroiterait sans qu'on voie jamais le miroitement.
     */
    val glissement by transition.animateFloat(
        initialValue = -3.24f,
        targetValue = 1.44f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "glissement",
    )
    Box(
        modifier
            .then(if (largeur != null) Modifier.width(largeur) else Modifier.fillMaxWidth())
            .height(hauteur)
            .clearAndSetSemantics { }
            .fondDegradeEtire(degrade, 2.8f, RoundedCornerShape(rayon)) { glissement },
    )
}

/**
 * UN ÉCRAN VIDE EST UNE INVITATION À AGIR.
 *
 * ⚠️ Le corps est borné à 34 CARACTÈRES de large. Ce n'est pas la mesure de prose (68) :
 * un texte centré sous un glyphe se lit en balayage, pas en lecture suivie, et au-delà de
 * trois ou quatre mots par ligne le regard perd le centre.
 */
@Composable
fun EmptyState(
    titre: String,
    modifier: Modifier = Modifier,
    glyphe: String? = null,
    fondGlyphe: Color = Color.Unspecified,
    corps: String? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val p = jetons
    Column(
        modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 34.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (glyphe != null) {
            Box(
                Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(fondGlyphe.takeOrElse { p.fill1 }),
                contentAlignment = Alignment.Center,
            ) { Icon(glyphe, description = null, taille = 26.dp) }
        }
        Text(
            text = sansCrochets(titre),
            style = Typo.display(22.sp).copy(lineHeight = 24.2f.sp),
            color = p.textBody,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = if (glyphe != null) 16.dp else 0.dp),
        )
        if (corps != null) {
            Text(
                text = corps,
                style = Typo.corps.copy(fontSize = 13.5.sp, lineHeight = 20.25.sp),
                color = p.textMuted,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .padding(top = 9.dp)
                    .widthIn(max = 240.dp),
            )
        }
        if (action != null) {
            Box(Modifier.padding(top = 18.dp).fillMaxWidth()) { action() }
        }
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE VIDE HONNÊTE DE LA PRODUCTION.
 *
 * Ce qui manque, d'où ça viendra, et le dommage qu'une simulation causerait. C'est le
 * composable qui empêche un écran de mentir pendant qu'on attend son serveur : il rend
 * VISIBLE l'absence de branchement, au lieu de la combler avec des données inventées que
 * personne ne retire ensuite.
 *
 * ⛔ Chacune des huit phases d'`Etat` a son rendu, et elles ne se confondent pas :
 * une porte fermée n'est pas une panne, un vide daté n'est pas un vide inconnu.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
/*
 * ⛔ POURQUOI CE COMPOSABLE LIT UN TYPE DE LA COUCHE DE DONNÉES, ET POURQUOI C'EST DÉLIBÉRÉ.
 *
 * Un design system qui dépend de la couche de données est une inversion, et la corriger
 * demanderait soit de déplacer `Etat` dans un paquet neutre — mais `SensDuVide` vit dans
 * `donnees/Vues.kt`, qui est GÉNÉRÉ, et le déplacement entraînerait le générateur — soit de
 * MIROITER ici une énumération des huit phases.
 *
 * Le miroir est le pire des trois. Ce dépôt s'est déjà fait mordre exactement là : des
 * listes recopiées d'un fichier à l'autre, qui se désynchronisent SANS QUE RIEN N'ÉCHOUE.
 * Une phase ajoutée à `Etat` et oubliée ici ne produirait aucune erreur — elle tomberait
 * dans la branche `else` et s'afficherait comme « contenu de transfert ».
 *
 * L'application est un seul module Gradle : la dépendance ne coûte rien au découpage, et
 * elle achète l'impossibilité de la dérive. ⚠️ Si `ds/` devient un module à part, c'est le
 * déplacement de `Etat` qu'il faudra faire — pas le miroir.
 */
@Composable
fun SansDonnees(
    etat: Etat<*>,
    quoi: String,
    origine: String,
    degat: String,
    modifier: Modifier = Modifier,
    hauteur: Int = 3,
    /**
     * ⛔ LA REPRISE EST UN PARAMÈTRE, PAS UN CHAMP DE L'ÉTAT — et les deux raisons sont
     * mesurées.
     *
     *   1 · Une fonction DANS l'état casse l'égalité structurelle : deux `Panne` identiques
     *       ne seraient jamais égales, `distinctUntilChanged` ne filtrerait rien, et toute
     *       recomposition deviendrait inconditionnelle.
     *   2 · Le port React Native posait `reessayer = {}` sur la panne de configuration.
     *       L'écran affichait « Réessayer » et le geste NE FAISAIT RIEN — la faute exacte
     *       que sa porte des contrôles morts existait pour attraper.
     *
     * Le bouton n'apparaît que si l'état dit la panne REPRENABLE **et** que l'appelant a
     * fourni de quoi reprendre. L'un sans l'autre ne suffit pas.
     */
    reprise: (() -> Unit)? = null,
    action: (@Composable () -> Unit)? = null,
) {
    val p = jetons
    when (etat) {
        /* Les deux attentes rendent la FORME du contenu, pas un message. */
        is Etat.Restauration, is Etat.Charge -> Column(
            modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(Metrique.sp10),
        ) {
            repeat(hauteur) { Skeleton() }
        }

        else -> Surface(Niveau.TRUTH, modifier.fillMaxWidth()) {
            Column {
                Eyebrow(
                    when (etat) {
                        is Etat.Anonyme -> "Porte fermée"
                        is Etat.NonBranche -> "Pas encore branché"
                        is Etat.Panne -> "Ça a échoué"
                        is Etat.Vide -> "Rien à afficher"
                        else -> "Contenu de transfert"
                    },
                )
                Text(
                    text = quoi,
                    style = Typo.corps.copy(fontSize = 14.sp, fontWeight = Metrique.weightSemi),
                    color = p.textBody,
                    modifier = Modifier.padding(top = 6.dp),
                )
                Text(
                    text = when (etat) {
                        is Etat.Panne -> etat.motif
                        is Etat.Vide -> "$origine — relevé le ${etat.provenance.asOf}"
                        else -> origine
                    },
                    style = Typo.corps.copy(fontSize = 12.5.sp),
                    color = p.textMuted,
                    modifier = Modifier.padding(top = 4.dp),
                )
                /* Le dommage d'une simulation : la phrase qui empêche de « juste mettre des
                   données d'exemple en attendant ». Elle reste à l'écran, en clair. */
                Text(
                    text = degat,
                    style = Typo.corps.copy(fontSize = 11.5.sp),
                    color = p.textFaint,
                    modifier = Modifier.padding(top = 6.dp),
                )
                val panne = etat as? Etat.Panne
                if (panne != null && panne.reprenable && reprise != null) {
                    Box(Modifier.padding(top = 12.dp)) {
                        Button("Réessayer", reprise, ton = TonBouton.QUIET, taille = TailleBouton.SM)
                    }
                }
                if (action != null) Box(Modifier.padding(top = 12.dp)) { action() }
            }
        }
    }
}
