package me.maxmorrys.rysmo.ecrans.club

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Membre
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Avatar
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Field
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.TailleBouton
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.TonTag
import me.maxmorrys.rysmo.ecrans.LocalSession
import me.maxmorrys.rysmo.ecrans.vue
import me.maxmorrys.rysmo.navigation.ClubBloques

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA FICHE D'UN MEMBRE — ⛔ LE KIT NE LA DESSINE PAS, ET ELLE EST OBLIGATOIRE.
 *
 * C'est la seule porte du SIGNALEMENT, qu'exige la guideline App Store 1.2 sur le contenu
 * généré par les utilisateurs. Le port React Native l'avait (`club/membre.tsx`, 204 lignes),
 * et elle était pourtant INATTEIGNABLE : les écrans poussaient vers elle sans le paramètre
 * que la vue exige, la vue jetait `invalid-argument`, l'écran sortait par sa branche courte,
 * et le bouton « Signaler ce profil » n'était jamais rendu. Sur les quatre exigences de la
 * guideline, le signalement comptait pour zéro.
 *
 * Deux choses ferment ce défaut, et il en faut deux :
 *   1 · le discriminant `onglet=membre` est posé PAR LE CONTRAT (`LectureDeVue`), plus par
 *       l'écran qui appelle ;
 *   2 · `onSignaler` et `onBloquer` sont des paramètres OBLIGATOIRES de ce composable. La
 *       fiche ne se monte pas sans de quoi signaler — le compilateur le refuse, comme il
 *       refuse un nombre sans provenance.
 *
 * ⚠️ ELLE EST DESSINÉE DANS LA LANGUE DU KIT, PAS INVENTÉE : châssis `Screen`, sourcils, une
 * surface de vérité, les tons de bouton du système. Rien ici n'est une forme nouvelle.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/** Le serveur tronque le motif à 500 caractères ; l'écran ne l'envoie pas plus long. */
private const val MOTIF_MAX = 500

/**
 * @param membreId l'uid, quand on vient de l'annuaire. `null` quand on vient du fil.
 * @param messageId l'identifiant d'une publication, quand on vient du fil. ⛔ L'UN DES DEUX
 *   EST NÉCESSAIRE : sans aucun, la vue jette `invalid-argument`. `ClubMessage` ne porte pas
 *   d'uid — « l'uid ne circule pas depuis une liste » — donc le fil ne peut désigner l'auteur
 *   que par son message, et c'est le serveur qui remonte à la personne.
 * @param onSignaler reçoit l'uid de la personne et le motif. ⛔ OBLIGATOIRE.
 * @param onBloquer reçoit l'uid et le sens du geste. ⛔ OBLIGATOIRE. Bloquer PÉRIME CINQ VUES
 *   (le fil, les deux listes, la fiche, les blocages) : croiser le même nom la minute d'après
 *   annulerait le geste, et le cache de trente secondes le ferait. C'est à l'appelant de
 *   relire, pas à l'écran de recharger.
 */
@Composable
fun EcranClubMembre(
    membreId: String?,
    messageId: String?,
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    onSignaler: (String, String) -> Unit,
    onBloquer: (String, Boolean) -> Unit,
    modifier: Modifier = Modifier,
    session: Session = LocalSession.current,
) {
    /*
     * ⛔ LA VUE N'EST APPELÉE QUE SI ON PEUT LA DÉSIGNER. Sans `id` ni `message`, `appClubListe`
     * jette `invalid-argument` — c'est exactement le défaut qui a rendu cette fiche
     * INATTEIGNABLE dans le port, et il ne se répare pas en partant quand même : on paierait un
     * aller-retour pour recevoir une panne qu'on savait déjà. L'appel conditionnel est légal en
     * Compose ; chaque branche est son propre groupe de composition.
     *
     * ⚠️ `id` PASSE DEVANT `message`, comme au serveur (`clubListe.ts:133-137`) : l'uid désigne
     * la personne, le message ne fait que la faire résoudre. Poser les deux ne changerait rien
     * au verdict, mais ferait circuler un identifiant de contenu sans utilité.
     *
     * ⚠️ LE DISCRIMINANT `onglet=membre` N'EST PAS ÉCRIT ICI : `LectureDeVue` le pose depuis le
     * contrat. C'est la moitié structurelle du correctif — un écran ne peut plus l'oublier.
     */
    val lu = if (membreId != null || messageId != null) {
        vue<Membre>(
            Vues.Noms.APP_CLUB_LISTE_MEMBRE,
            session,
            buildJsonObject {
                if (membreId != null) {
                    put("id", JsonPrimitive(membreId))
                } else if (messageId != null) {
                    put("message", JsonPrimitive(messageId))
                }
            },
        )
    } else {
        null
    }
    val etat: Etat<Membre> = lu?.etat ?: Etat.NonBranche
    val membre = etat.valeurServie()
    val provenance = etat.provenanceOuNull()

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Le Club",
        onRetour = onRetour,
        titre = membre?.nom ?: "Fiche de membre",
    ) {
        if (membreId == null && messageId == null) {
            /* ⛔ LE DÉFAUT MESURÉ, RENDU VISIBLE. Une fiche ouverte sans identifiant ne peut
               rien afficher ET NE PEUT PAS SIGNALER. La branche courte du port était muette :
               celle-ci nomme ce qui manque. */
            SansDonnees(
                etat = Etat.NonBranche,
                quoi = "La fiche de ce membre",
                origine = "Aucun identifiant n'a été passé à cet écran",
                degat = "C'est exactement ce qui rendait la fiche inatteignable dans le port "
                    + "React Native : la vue jetait « invalid-argument », l'écran sortait sans "
                    + "rien dire, et le bouton de signalement n'était jamais rendu.",
                modifier = Modifier.padding(top = 12.dp),
            )
            return@Screen
        }

        /*
         * ═══════════════════════════════════════════════════════════════════════════════
         * ⛔ SUR CETTE VUE, `vue: null` PORTE DEUX SENS ET LE CONTRAT NE PEUT EN NOMMER QU'UN.
         *
         * `appClubListe` rend `vue: null` quand l'abonnement n'est pas actif
         * (`clubListe.ts:62`) ET quand le profil demandé n'existe pas ou n'a pas de nom
         * (`:141-142`). Le contrat déclare `vueNulle: "sansAcces"` pour les trois formes, donc
         * `Etat.Vide` arrive ici avec `SANS_ACCES` dans les deux cas.
         *
         * Écrire « le Club est réservé aux membres » serait donc faux une fois sur deux — et
         * faux pour quelqu'un QUI PAIE, ce qui est précisément la faute que la correction du
         * 06/09 a écartée ailleurs. Cet écran refuse donc de trancher : il nomme les deux
         * lectures possibles. Le correctif est côté serveur — il faudrait une erreur distincte
         * pour « profil introuvable » —, et l'écran le rend visible plutôt que muet.
         * ═══════════════════════════════════════════════════════════════════════════════
         */
        if (membre == null || provenance == null) {
            val deuxLectures = "La vue « ${Vues.Noms.APP_CLUB_LISTE_MEMBRE} » n'a rien rendu — " +
                "soit ton abonnement au Club n'est pas actif, soit cette personne n'a pas de " +
                "fiche. Le serveur répond la même chose dans les deux cas"
            SansDonnees(
                etat = etat,
                quoi = "La fiche de ce membre",
                origine = if (etat.estSansAcces()) {
                    deuxLectures
                } else {
                    "La vue « ${Vues.Noms.APP_CLUB_LISTE_MEMBRE} »"
                },
                degat = "Une fiche d'exemple donnerait un métier et un quartier à quelqu'un "
                    + "qui ne les a pas renseignés — et laisserait signaler la mauvaise "
                    + "personne.",
                modifier = Modifier.padding(top = 12.dp),
                reprise = lu?.reprendre,
            )
            return@Screen
        }

        Identite(membre)
        if (membre.presentation != null) {
            Body(membre.presentation, Modifier.padding(top = 16.dp), grain = GrainCorps.PROSE)
        }
        Formations(membre)

        Eyebrow("Ce que cette fiche montre", Modifier.padding(top = 22.dp))
        Surface(Niveau.FLAT, Modifier.padding(top = 10.dp).fillMaxWidth(), rembourrage = 16.dp) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Body("Contributions au Club", attenue = true)
                Num(
                    membre.contributions.toString(),
                    source = Vues.Noms.APP_CLUB_LISTE_MEMBRE,
                    asOf = provenance.asOf,
                    taille = 15.sp,
                )
            }
        }
        NoteFine(
            "Ni numéro de téléphone ni adresse : le serveur ne les sort pas de la base, "
                + "même s'il les a. Relevé le ${provenance.asOf}.",
            Modifier.padding(top = 10.dp),
        )

        Moderation(membre, onSignaler, onBloquer, onAller)
    }
}

@Composable
private fun ColumnScope.Identite(membre: Membre) {
    Row(
        Modifier.padding(top = 12.dp).fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Avatar(membre.initiales, taille = 64.dp)
        Column(Modifier.weight(1f)) {
            TitreLigne(membre.nom, taille = 20.sp)
            val quoi = listOfNotNull(membre.metier, membre.ville).joinToString(" · ")
            if (quoi.isNotEmpty()) {
                Body(quoi, Modifier.padding(top = 3.dp), attenue = true)
            }
        }
    }
    if (membre.depuis != null) {
        /* « membre il y a 3 j », déjà mis en forme par le serveur. */
        Eyebrow(membre.depuis, Modifier.padding(top = 12.dp))
    }
}

@Composable
private fun ColumnScope.Formations(membre: Membre) {
    if (membre.formations.isEmpty()) return
    FlowRow(
        Modifier.padding(top = 14.dp).fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        membre.formations.forEach { formation ->
            /* ⛔ LA CLÉ EST LE LIBELLÉ, ET DEUX LIBELLÉS IDENTIQUES SERAIENT UN DOUBLON DE
               DONNÉES, pas deux formations. `key = auteur` a déjà fait s'effondrer des lignes
               homonymes ici ; le titre d'une formation, lui, est unique par construction. */
            key(formation) { Tag(formation) }
        }
    }
}

/**
 * LES DEUX GESTES D'App Store 1.2, ET LEUR ASYMÉTRIE ASSUMÉE.
 *
 * ⚠️ SIGNALER DEMANDE UN MOTIF, BLOQUER N'EN DEMANDE PAS. Un signalement part vers quelqu'un
 * qui devra décider : sans motif, il ne peut rien décider. Un blocage ne regarde que la
 * personne qui bloque.
 *
 * ⚠️ ET BLOQUER SE DÉFAIT. La guideline n'exige pas de pouvoir débloquer — mais « un geste
 * irréversible pris dans un moment d'agacement, sur une plateforme où l'on se croise
 * professionnellement, ne se répare plus » (contrat de `Blocages`). Le libellé suit donc
 * `Membre.bloque` : un bouton qui rebloque quelqu'un de déjà bloqué ne dit rien de son effet.
 */
@Composable
private fun ColumnScope.Moderation(
    membre: Membre,
    onSignaler: (String, String) -> Unit,
    onBloquer: (String, Boolean) -> Unit,
    onAller: (Any) -> Unit,
) {
    var ouvert by rememberSaveable { mutableStateOf(false) }
    var motif by rememberSaveable { mutableStateOf("") }
    var transmis by rememberSaveable { mutableStateOf(false) }

    Eyebrow("Si quelque chose ne va pas", Modifier.padding(top = 24.dp))
    Surface(Niveau.CHROME, Modifier.padding(top = 10.dp).fillMaxWidth(), rembourrage = 18.dp) {
        Column {
            if (transmis) {
                Tag("Signalement transmis", TonTag.OK)
                NoteFine(
                    "La personne signalée n'en est pas informée. Ce que le serveur en fait "
                        + "ne s'affiche pas ici : cet écran a transmis, il n'a pas jugé.",
                    Modifier.padding(top = 8.dp),
                )
            } else if (ouvert) {
                Body("Qu'est-ce qui ne va pas ?", grain = GrainCorps.CORPS)
                Field(
                    libelle = "Motif",
                    valeur = motif,
                    onChange = { motif = it.take(MOTIF_MAX) },
                    modifier = Modifier.padding(top = 10.dp),
                    substitut = "Ce que tu as vu, et où",
                    aide = "${motif.length} / $MOTIF_MAX caractères. Au-delà, le serveur "
                        + "tronque.",
                    multiligne = true,
                )
                Row(
                    Modifier.padding(top = 12.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(
                        "Envoyer le signalement",
                        {
                            onSignaler(membre.id, motif)
                            transmis = true
                            ouvert = false
                        },
                        modifier = Modifier.weight(1f),
                        ton = TonBouton.INK,
                        taille = TailleBouton.SM,
                        pleineLargeur = false,
                    )
                    Button(
                        "Annuler",
                        { ouvert = false },
                        ton = TonBouton.QUIET,
                        taille = TailleBouton.SM,
                        pleineLargeur = false,
                    )
                }
            } else {
                Button(
                    "Signaler ce profil",
                    { ouvert = true },
                    ton = TonBouton.QUIET,
                    taille = TailleBouton.SM,
                    glypheTete = "flag",
                )
            }

            Button(
                if (membre.bloque) "Débloquer ${membre.nom}" else "Bloquer ${membre.nom}",
                { onBloquer(membre.id, !membre.bloque) },
                modifier = Modifier.padding(top = 10.dp),
                ton = if (membre.bloque) TonBouton.QUIET else TonBouton.INK,
                taille = TailleBouton.SM,
                glypheTete = "shield",
            )
            NoteFine(
                if (membre.bloque) {
                    "Tu ne vois plus ses publications ni ses réponses. Le débloquer les " +
                        "fait revenir."
                } else {
                    "Bloquer retire ses publications et ses réponses de tout le Club, " +
                        "pour toi. Ça se défait."
                },
                Modifier.padding(top = 8.dp),
            )
            Button(
                "Les comptes que tu as bloqués",
                { onAller(ClubBloques) },
                modifier = Modifier.padding(top = 12.dp),
                ton = TonBouton.GHOST,
                taille = TailleBouton.SM,
            )
        }
    }
}
