package me.maxmorrys.rysmo.ecrans

import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.compositionLocalOf
import me.maxmorrys.rysmo.donnees.Session

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * QUI REGARDE, POUR LES ÉCRANS QUE LE GRAPHE POUSSE.
 *
 * Les cinq onglets reçoivent la session en PARAMÈTRE : `OngletHote` la tient déjà, il la
 * passe à `SquelettePrincipal`. Les vingt destinations poussées, elles, n'ont rien — et
 * elles lisent pourtant des vues qui exigent un jeton.
 *
 * ⛔ POURQUOI PAS VINGT PARAMÈTRES DE PLUS DANS LE GRAPHE. Un paramètre oublié à un seul
 * appel n'échouerait PAS : la valeur par défaut la plus naturelle serait `Restauration`, et
 * l'écran resterait sur sa forme d'attente pour toujours — un défaut qui se lit comme un
 * réseau lent, sur l'appareil de quelqu'un d'autre. Vingt occasions d'oublier, aucune porte
 * pour le voir.
 *
 * ⛔ ET POURQUOI PAS UNE `SourceDeSession` PAR ÉCRAN. `donnees/Session.kt` l'écrit en tête :
 * « une seule souscription, pour toute l'application. Chaque écran qui s'abonnerait pour son
 * compte recevrait son premier verdict à un instant différent selon l'ordre de montage : deux
 * écrans afficheraient deux vérités. » Ce jeton DISTRIBUE la souscription unique montée par
 * `MainActivity` depuis `session/SessionDuProcessus.kt` ; il n'en crée pas une seconde.
 *
 * ⚠️ LE DÉFAUT PAR DÉFAUT EST `NonConfiguree`, PAS `Restauration`, et son motif nomme la
 * faute exacte : un arbre où personne n'a posé la session est une erreur de construction, et
 * elle doit se DIRE. `Restauration` en ferait une attente silencieuse et sans fin, ce qui est
 * précisément le mode de panne qu'on refuse ailleurs.
 *
 * ⚠️ `compositionLocalOf`, PAS `staticCompositionLocalOf`. Le second recompose TOUT le
 * sous-arbre à chaque changement de valeur ; ici elle change à la connexion et à la
 * déconnexion, c'est-à-dire au moment où l'application a déjà le plus à redessiner. Seuls les
 * lecteurs doivent repartir.
 *
 * ⭐ ET IL NE FERME PAS LA VOIE DROITE : les écrans le prennent en PARAMÈTRE, dont ceci n'est
 * que la valeur par défaut. Le jour où le graphe descend la session, l'appel la pose et rien
 * d'autre ne bouge.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
val LocalSession: ProvidableCompositionLocal<Session> = compositionLocalOf {
    Session.NonConfiguree(
        "Aucune session n'a été posée au-dessus de cet écran — `MainActivity` doit fournir "
            + "`LocalSession`. Rien ici ne peut savoir qui regarde, donc aucune vue ne peut "
            + "être demandée.",
    )
}
