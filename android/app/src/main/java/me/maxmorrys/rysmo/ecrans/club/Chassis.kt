package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Classement
import me.maxmorrys.rysmo.donnees.Club
import me.maxmorrys.rysmo.donnees.ClubFil
import me.maxmorrys.rysmo.donnees.Discussion
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Opportunite
import me.maxmorrys.rysmo.donnees.Parrainage
import me.maxmorrys.rysmo.donnees.Provenance
import me.maxmorrys.rysmo.donnees.Seance
import me.maxmorrys.rysmo.donnees.SensDuVide
import me.maxmorrys.rysmo.ds.BandeClub
import me.maxmorrys.rysmo.ds.CLUB_ORDRE
import me.maxmorrys.rysmo.ds.Fab
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.Onglet
import me.maxmorrys.rysmo.ds.RowScopeDroite
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.TabBar
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.basDuFab
import me.maxmorrys.rysmo.ds.plateforme
import me.maxmorrys.rysmo.ecrans.OngletPrincipal
import me.maxmorrys.rysmo.navigation.OngletClub

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE CLUB — UNE ENVELOPPE, HUIT ONGLETS, ET LES DEUX MANQUES QU'ELLE EXISTE POUR COMBLER.
 *
 * ⛔ 1 · LA BANDE DES HUIT ONGLETS N'A JAMAIS ÉTÉ PORTÉE. Mesuré dans le port React Native :
 * `club/_layout.tsx:33` rendait un `<Stack>` nu, et sur les neuf routes du dossier `club`
 * seules TROIS
 * importaient `ChipRow` — dans `fil.tsx` elle ne portait que DEUX liens (`:70-71`). Passer
 * d'un onglet à l'autre exigeait donc un retour au hub, et cinq onglets sur huit n'étaient
 * atteignables par aucun geste. La bande vit ici, dans UNE enveloppe, exactement comme
 * `EcranClub` du kit (`ScreensNatifClub.js:70-79`) : ce qui est recopié dérive, puis manque.
 *
 * ⛔ 2 · L'ÉCRAN VERROUILLÉ CONÇU N'A JAMAIS ÉTÉ PORTÉ NON PLUS — le port rendait un état
 * vide GÉNÉRIQUE à sa place (`mobile/ds/SansDonnees.tsx`, importé par 24 des 51 routes).
 * Ici c'est une BRANCHE de cette enveloppe, pas une destination : l'argument `onglet` est
 * donc toujours présent, parce qu'il est celui de la destination qu'on rend déjà.
 *
 * ⚠️ LE TERRITOIRE DU CLUB EST `TRANSFORME`, ET CE FICHIER LE CONTREDIT AILLEURS.
 * Les neuf écrans de Club du kit posent `territory="transforme"` (`ScreensNatifClub.js:72`,
 * `ScreensNatifCompte.js:244, 289, 361`). `ecrans/Principal.kt:35` donne pourtant
 * `CLUB -> Territoire.INFORME` à l'onglet racine. Le kit fait autorité sur le rendu : les
 * huit onglets sont en `TRANSFORME`. La racine n'est pas de ce lot — la divergence est
 * signalée, pas corrigée en passant.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⭐ LE LIBELLÉ EST DÉRIVÉ DE `CLUB_ORDRE`, IL N'EN EST PAS UN MIROIR.
 *
 * `OngletClub` est déclarée dans l'ordre du kit (`NativeShell.js:221`), et cet ordre est
 * PORTEUR : c'est celui que la personne apprend par la position. Recopier les huit libellés
 * ici en ferait une seconde liste — et ce dépôt s'est déjà fait mordre exactement là, par des
 * listes recopiées qui se désynchronisent SANS QUE RIEN N'ÉCHOUE. L'indice suffit.
 *
 * ⚠️ L'accent d'« Opportunités » ne peut pas vivre dans un nom d'énumération Kotlin ; il vit
 * dans `CLUB_ORDRE`, qui est aussi ce que la bande compare. Un libellé écrit à la main ici ne
 * s'apparierait à aucune pilule, et l'onglet actif n'aurait plus l'air actif.
 *
 * ⚠️ ET L'INDICE N'EST PAS PROTÉGÉ, VOLONTAIREMENT. Un neuvième onglet ajouté à l'énumération
 * sans être ajouté à `CLUB_ORDRE` lève ici, au premier rendu du Club. Un repli sur `name`
 * serait pire : il rendrait « Opportunites » sans accent, ne s'apparierait à aucune pilule, et
 * l'onglet aurait l'air d'être absent de sa propre bande — le mode de panne SILENCIEUX que ce
 * dépôt paie déjà partout où deux listes se recopient.
 */
val OngletClub.libelle: String get() = CLUB_ORDRE[ordinal]

/** L'onglet d'une pilule de la bande. `null` si la bande a été changée sans cette table. */
fun ongletDepuisLibelle(libelle: String): OngletClub? =
    CLUB_ORDRE.indexOf(libelle).takeIf { it >= 0 }?.let { OngletClub.entries[it] }

/**
 * CE QUE LES HUIT ONGLETS LISENT — et les DEUX qui n'ont rien à lire.
 *
 * ⛔ `Membres` ET `Informations` N'ONT AUCUN PRODUCTEUR, ET C'EST MESURÉ CONTRE LE CONTRAT.
 * `worker/apps/api/src/vues/vues.contrat.json` sert `appClubListe` en trois formes seulement
 * — `discussions`, `opportunites`, `membre` (UNE fiche) — et aucune vue ne rend l'annuaire ni
 * le digest hebdomadaire. Le kit dessine pourtant les deux (`ScreensNatifClub.js:135-172` et
 * `:282-333`). Les deux onglets existent donc, portent la bande, et DISENT ce qui manque.
 *
 * ⚠️ Aucun champ ici n'a de valeur d'exemple : `Etat.NonBranche` est l'état honnête tant
 * qu'aucun producteur de jeton d'identité n'est choisi (`session/SourceDeSession.kt`). Le
 * jour où il l'est, c'est le graphe — ou son modèle de vue — qui remplit cette structure.
 */
@Immutable
data class EtatsDuClub(
    /** `appClub` — le bilan d'abonnement, en tête du fil. Une vue de plus que le fil. */
    val bilan: Etat<Club> = Etat.NonBranche,
    val fil: Etat<ClubFil> = Etat.NonBranche,
    val discussions: Etat<List<Discussion>> = Etat.NonBranche,
    val agenda: Etat<List<Seance>> = Etat.NonBranche,
    val classement: Etat<Classement> = Etat.NonBranche,
    val opportunites: Etat<List<Opportunite>> = Etat.NonBranche,
    val parrainage: Etat<Parrainage> = Etat.NonBranche,
)

/**
 * LES GESTES QUI EXIGENT UN SERVEUR — nuls tant que rien ne les porte.
 *
 * ⛔ UN CONTRÔLE QUI NE FAIT RIEN EST PIRE QUE PAS DE CONTRÔLE. Le port React Native en avait
 * dix-huit : « Postuler » `disabled` (`club/opportunites.tsx:90`), l'oubli unitaire de mémoire
 * `disabled` (`memoire.tsx:153`), « Ajouter à mon agenda » qui ouvrait une `Alert`
 * (`club/agenda.tsx:82`). C'est le défaut que `mobile-controles-morts.test.ts` avait été écrit
 * pour attraper. Ici, un geste sans lambda n'est PAS RENDU — même règle que la reprise de
 * `SansDonnees`, et pour la même raison.
 *
 * ⚠️ « Ajouter à mon agenda » N'EST PAS DANS CETTE LISTE, ET C'EST UN CONSTAT, PAS UN OUBLI.
 * Le kit en fait la seule action native GAGNÉE par le portage (`ScreensNatifCompte.js:399`).
 * Elle demande une date machine ; or `Seance.jour` et `Seance.horaire` arrivent DÉJÀ MIS EN
 * FORME (« Mardi 9 septembre », « 20:00 → 21:00 ») et le contrat ne porte aucun horodatage.
 * Aucun `Intent` d'agenda ne se construit là-dessus. Il manque un champ au contrat, pas un
 * bouton à cet écran.
 */
@Immutable
data class ActionsDuClub(
    /** `posterAuClub`. Le bouton flottant d'Android, l'action haute d'iOS. */
    val publier: (() -> Unit)? = null,
    /** ⚠️ Aucune callable ne sert la candidature : voir `Opportunites.kt`. */
    val postuler: ((Opportunite) -> Unit)? = null,
    /** `reserverSession(collection, seanceId, inscrite)`. */
    val reserver: ((Seance, Boolean) -> Unit)? = null,
)

/** La provenance d'un état, quand il en a une. Sert à dater tout nombre affiché. */
internal fun Etat<*>.provenanceOuNull(): Provenance? = when (this) {
    is Etat.Servie<*> -> provenance
    is Etat.Vide -> provenance
    is Etat.Replique<*> -> provenance
    else -> null
}

/**
 * La valeur d'un état qui en porte une.
 *
 * ⚠️ `Replique` EST TRAITÉE COMME `Servie` À L'AFFICHAGE, et seulement là. C'est du contenu
 * de transfert, jamais produit en production (`donnees/Etat.kt`) ; un écran qui l'ignorerait
 * afficherait un vide en revue et masquerait ce qu'on cherche à regarder.
 */
internal fun <T> Etat<T>.valeurServie(): T? = when (this) {
    is Etat.Servie -> valeur
    is Etat.Replique -> valeur
    else -> null
}

/** Vrai quand le serveur a répondu « le Club est réservé aux membres ». */
internal fun Etat<*>.estSansAcces(): Boolean =
    this is Etat.Vide && sens == SensDuVide.SANS_ACCES

private val ONGLETS_BAS = OngletPrincipal.entries.map { Onglet(it.libelle, it.glyphe) }

/**
 * ⭐ L'ENVELOPPE UNIQUE DES NEUF ÉCRANS DU CLUB.
 *
 * Barre haute, barre basse, bande des huit, et — quand le serveur dit `SANS_ACCES` — le corps
 * verrouillé à la place du contenu. C'est `EcranClub` du kit (`ScreensNatifClub.js:70-79`),
 * plus la branche que la règle 5 de la spécification impose.
 *
 * ⚠️ LA BANDE RESTE CLIQUABLE SOUS LE CADENAS. « Masquer la navigation d'un espace
 * verrouillé, c'est vendre une boîte fermée » (`ScreensNatifClub.js:397-399`) : la personne
 * doit pouvoir regarder derrière chaque cadenas avant de décider.
 *
 * ⚠️ LA BANDE RESTE DANS LA GOUTTIÈRE, LÀ OÙ LE KIT LA FAIT DÉBORDER. Le kit pose
 * `margin: 0 -18px; padding: 0 18px` (`NativeShell.js:225-228`) : le conteneur va d'un bord à
 * l'autre, le contenu garde sa marge. `ChipRow` n'offre pas de rembourrage intérieur en
 * `SCROLL` ; l'élargir ici collerait la première pilule au bord de l'écran, ce qui est PIRE
 * que de perdre 18 dp de course. La bande défile, les huit noms restent atteignables — la
 * seule chose perdue est que les pilules s'effacent 18 dp avant le bord.
 *
 * @param onOngletClub passe d'un onglet à l'autre. ⛔ Le graphe décide si cela REMPLACE ou
 *   POUSSE, et la spécification dit remplace (`popUpTo(ClubRoot) { saveState = true }`) : huit
 *   onglets qui s'empilent feraient remonter le retour système à travers l'historique des
 *   onglets au lieu de sortir du Club. Cette décision n'appartient pas à l'écran.
 */
@Composable
fun ClubScaffold(
    onglet: OngletClub,
    etat: Etat<*>,
    onRetour: () -> Unit,
    onOngletClub: (OngletClub) -> Unit,
    onOngletPrincipal: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
    actions: ActionsDuClub = ActionsDuClub(),
    publierIci: Boolean = false,
    droite: (@Composable RowScopeDroite.() -> Unit)? = null,
    contenu: @Composable ColumnScope.() -> Unit,
) {
    val verrou = etat.estSansAcces()
    val zoneGeste = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()

    /*
       Publier : DEUX EMPLACEMENTS, UN GESTE (`ScreensNatifClub.js:60-66`). Android pose le
       bouton flottant, iOS met l'action en haut à droite. En poser deux donnerait deux
       chemins pour le même geste. Et sous le cadenas, on ne publie pas.

       ⚠️ IL N'APPARAÎT PAS SUR LES MÊMES ONGLETS QUE DANS LE KIT. Le kit le pose sur
       Discussions, Membres et Opportunités. `posterAuClub` écrit dans le FIL : le poser sur
       l'annuaire proposerait de publier depuis un écran où rien ne se publie, et l'omettre
       du fil le retirerait de l'écran qu'il alimente. Retenu : Fil, Discussions,
       Opportunités — c'est-à-dire les trois onglets où quelque chose se publie. */
    val publier = actions.publier.takeIf { publierIci && !verrou }
    val flottant: (@Composable BoxScope.() -> Unit)? =
        if (publier != null && plateforme.estAndroid) {
            {
                Box(
                    Modifier
                        .align(Alignment.BottomEnd)
                        .padding(end = 18.dp, bottom = basDuFab(zoneGeste)),
                ) {
                    Fab("Publier", publier, Territoire.TRANSFORME) {
                        Icon("send", description = null, taille = 22.dp, epaisseur = 2.5f)
                    }
                }
            }
        } else {
            null
        }

    /*
       ⛔ L'AUTRE MOITIÉ DU MÊME GESTE. Sur iOS, le bouton flottant n'est pas une convention :
       l'action « Publier » vit en haut à droite (`actionHaut`, `ScreensNatifClub.js:64-66`).
       Sans cette branche, publier serait ATTEIGNABLE SUR ANDROID ET NULLE PART AILLEURS —
       exactement le genre d'écart qu'un châssis à deux plateformes fabrique quand une seule
       est écrite.
    */
    val droiteEffective: (@Composable RowScopeDroite.() -> Unit)? = when {
        verrou -> null
        publier != null && !plateforme.estAndroid -> {
            {
                IconButton("Publier", publier) {
                    Icon("send", description = null, taille = 17.dp, epaisseur = 2.4f)
                }
                droite?.invoke(this)
            }
        }
        else -> droite
    }

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        /*
           ⛔ UN SEUL TRAITEMENT POUR LES NEUF ÉCRANS. Le kit en a trois (§ A.6) : `EcranClub`
           revient sur « Espace », `NatClubFil` n'a pas de retour du tout, `NatClubAgenda`
           revient sur « Club ». La spécification recommande celui d'`EcranClub` et la
           disparition des deux exceptions — c'est ce qui est appliqué aux neuf écrans, verrou
           compris.

           ⚠️ ET `EcranClub` NE POSE PAS DE RETOUR SUR ANDROID. Son ternaire est
           `os === 'ios' ? 'Espace' : undefined` (`ScreensNatifClub.js:72`), et ce n'est pas le
           ternaire dégénéré du titre juste en dessous : ici les deux branches diffèrent. Un
           onglet du Club est une racine d'onglet, pas une page poussée ; Material n'y met pas
           de flèche, et le geste système suffit. `onRetour` reste au paramètre parce que le
           châssis iOS l'utilisera, et parce que le graphe doit pouvoir le brancher une fois
           pour les deux plateformes. */
        retour = if (plateforme.estAndroid) null else "Espace",
        onRetour = onRetour,
        titre = onglet.libelle,
        droite = droiteEffective,
        tabbar = {
            TabBar(
                onglets = ONGLETS_BAS,
                actif = OngletPrincipal.CLUB.libelle,
                onSelect = { nom ->
                    OngletPrincipal.entries.firstOrNull { it.libelle == nom }
                        ?.let(onOngletPrincipal)
                },
            )
        },
        flottant = flottant,
    ) {
        BandeClub(
            actif = onglet.libelle,
            onSelect = { nom -> ongletDepuisLibelle(nom)?.let(onOngletClub) },
            modifier = Modifier.padding(top = 4.dp),
            verrou = verrou,
        )
        if (verrou) {
            CorpsVerrouille(onglet, etat.provenanceOuNull(), onAller)
        } else {
            contenu()
        }
    }
}

/**
 * LE POINT D'ENTRÉE DU GRAPHE — une destination, huit corps.
 *
 * ⛔ NE PAS EN FAIRE HUIT DESTINATIONS. `ClubOnglet(onglet)` porte déjà l'onglet ; huit
 * destinations obligeraient à repasser l'information et à espérer qu'on ne l'oublie pas.
 * C'est le mode de panne exact de la fiche de membre, restée INATTEIGNABLE parce que les
 * écrans poussaient vers elle sans le paramètre qu'elle exige.
 */
@Composable
fun EcranClubOnglet(
    onglet: OngletClub,
    onRetour: () -> Unit,
    onOngletClub: (OngletClub) -> Unit,
    onOngletPrincipal: (OngletPrincipal) -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
    etats: EtatsDuClub = EtatsDuClub(),
    actions: ActionsDuClub = ActionsDuClub(),
) {
    when (onglet) {
        OngletClub.Fil -> EcranClubFil(
            etats.fil, etats.bilan, onRetour, onOngletClub, onOngletPrincipal, onAller,
            modifier, actions,
        )
        OngletClub.Discussions -> EcranClubDiscussions(
            etats.discussions, onRetour, onOngletClub, onOngletPrincipal, onAller,
            modifier, actions,
        )
        OngletClub.Membres -> EcranClubMembres(
            onRetour, onOngletClub, onOngletPrincipal, onAller, modifier,
        )
        OngletClub.Agenda -> EcranClubAgenda(
            etats.agenda, onRetour, onOngletClub, onOngletPrincipal, onAller, modifier, actions,
        )
        OngletClub.Classement -> EcranClubClassement(
            etats.classement, onRetour, onOngletClub, onOngletPrincipal, onAller, modifier,
        )
        OngletClub.Opportunites -> EcranClubOpportunites(
            etats.opportunites, onRetour, onOngletClub, onOngletPrincipal, onAller,
            modifier, actions,
        )
        OngletClub.Informations -> EcranClubInformations(
            onRetour, onOngletClub, onOngletPrincipal, onAller, modifier,
        )
        OngletClub.Parrainage -> EcranClubParrainage(
            etats.parrainage, onRetour, onOngletClub, onOngletPrincipal, onAller, modifier,
        )
    }
}

/** L'espace insécable des milliers. Écrit par son point de code : à l'œil, c'est une espace. */
internal const val INSECABLE: Char = '\u00A0'

/**
 * Un montant en francs CFA, groupé par milliers.
 *
 * ⚠️ LE CONTRAT REND UN `Double`, ET AUCUN BUDGET N'A DE CENTIME. `Opportunite.budget` et
 * `ClubMission.budget` viennent d'un champ libre saisi par la personne qui publie ; la partie
 * décimale est tronquée à l'affichage plutôt qu'arrondie, parce qu'arrondir 180 000,6 en
 * 180 001 inventerait un franc que personne n'a annoncé.
 */
internal fun montantFcfa(valeur: Double): String {
    val negatif = valeur < 0
    val chiffres = kotlin.math.abs(valeur).toLong().toString()
    val groupe = StringBuilder()
    chiffres.forEachIndexed { i, c ->
        if (i > 0 && (chiffres.length - i) % 3 == 0) groupe.append(INSECABLE)
        groupe.append(c)
    }
    return if (negatif) "-$groupe" else groupe.toString()
}
