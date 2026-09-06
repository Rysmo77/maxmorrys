package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.ds.Avatar
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.Metrique
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.Typo
import me.maxmorrys.rysmo.ds.appui
import me.maxmorrys.rysmo.ds.jetons

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES QUATRE PIÈCES QUE PLUSIEURS ONGLETS DU CLUB PARTAGENT.
 *
 * Elles vivent ici, et pas recopiées d'un onglet à l'autre, pour la raison qui a fait
 * disparaître la bande des huit du port React Native : ce qui est recopié dérive, puis
 * manque. Aucune n'est un composant de design system — elles n'ont pas de portée hors du
 * Club, et les monter dans `ds/` inventerait une généralité que personne n'a demandée.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * L'en-tête d'une personne : ses initiales, son nom, sa ligne de méta.
 *
 * ⚠️ LA MÉTA EST EN MONOSPACE, ET ELLE EN A LE DROIT. « Entraide · il y a 2 h » porte un
 * nombre, et la règle du système est qu'un nombre en monospace vient de la base ou d'une
 * source citée : `ClubMessage.quand` arrive DÉJÀ MIS EN FORME par le serveur, qui est sa
 * source. Une durée recalculée sur l'horloge du téléphone n'aurait pas ce droit.
 */
@Composable
internal fun EnteteMembre(
    initiales: String,
    nom: String,
    meta: String?,
    modifier: Modifier = Modifier,
    taille: androidx.compose.ui.unit.Dp = 38.dp,
    onPress: (() -> Unit)? = null,
    queue: (@Composable () -> Unit)? = null,
) {
    val p = jetons
    Row(
        modifier
            .fillMaxWidth()
            .appui(onPress, encre = p.textBody, libelle = if (onPress != null) "Fiche de $nom" else null),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(11.dp),
    ) {
        Avatar(initiales, taille = taille)
        Column(Modifier.weight(1f)) {
            Text(
                text = nom,
                style = Typo.corps.copy(fontSize = 14.sp, fontWeight = Metrique.weightSemi),
                color = p.textBody,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            if (meta != null) {
                Text(meta, style = Typo.nombre(11.sp), color = p.textFaint, maxLines = 1)
            }
        }
        queue?.invoke()
    }
}

/**
 * Un compteur de réaction — glyphe, puis nombre daté.
 *
 * ⛔ LE NOMBRE PASSE PAR `Num`, QUI EXIGE SA PROVENANCE. Un « 12 » sous une publication est
 * un relevé : il vient de la vue qui a servi la publication, à la date que cette vue porte.
 */
@Composable
internal fun CompteurReaction(
    glyphe: String,
    valeur: Int,
    source: String,
    asOf: String,
    libelle: String,
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Icon(glyphe, description = libelle, taille = 16.dp, couleur = jetons.textMuted)
        Num(valeur.toString(), source = source, asOf = asOf, taille = 12.5.sp)
    }
}

/** La note fine de bas de section — 11,5 px du kit, encre effacée. */
@Composable
internal fun NoteFine(texte: String, modifier: Modifier = Modifier) {
    Text(texte, style = Typo.petit, color = jetons.textFaint, modifier = modifier)
}

/** Un titre de ligne, plus fort que le corps sans être un affichage. */
@Composable
internal fun TitreLigne(
    texte: String,
    modifier: Modifier = Modifier,
    taille: androidx.compose.ui.unit.TextUnit = 15.sp,
) {
    Text(
        text = texte,
        style = Typo.corps.copy(fontSize = taille, fontWeight = Metrique.weightBold),
        color = jetons.textBody,
        modifier = modifier,
    )
}
