package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Repetiteur
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EmptyState
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ecrans.LocalSession
import me.maxmorrys.rysmo.ecrans.vue

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA MÉMOIRE DU RÉPÉTITEUR — kit `NatMemoire` (`ScreensNatifEtats.js:131-175`).
 *
 * C'est l'écran où se règle la RELATION : il existe parce que la conversation seule ne suffit
 * pas — quelqu'un doit pouvoir voir ce que le tuteur a retenu de lui, et le retirer.
 *
 * ⛔ TROIS CONTRÔLES DU KIT NE SONT PAS DESSINÉS, ET LES TROIS RAISONS SONT DIFFÉRENTES.
 *
 * 1 · LE RENOMMAGE — « DONNE-LUI UN NOM. », un `Field` et quatre propositions, en TÊTE de
 *     l'écran. ⭐ **Aucune écriture du contrat ne pose le nom du tuteur.** Les huit écritures
 *     sont `ecrireUneNote`, `marquerLecon`, `posterAuClub`, `reserverSession`,
 *     `signalerMembre`, `bloquerMembre`, `creerMonProfil` et `clearRysmoMemory` : pas une ne
 *     touche `users/<uid>.tutorName`, que `Moi.tuteur` ne fait que LIRE.
 *     ⚠️ Le port avait contourné avec un cache de session (`setTutorNom`), tout en écrivant
 *     dans le même fichier que « le nom ne se persiste pas localement, et il ne doit pas :
 *     un magasin local créerait une seconde source de vérité, et deux appareils afficheraient
 *     deux noms ». Un champ qu'on remplit et qui redevient « Répétiteur » au prochain
 *     lancement est pire qu'un champ absent : il fait douter du reste de l'écran.
 *
 * 2 · L'OUBLI LIGNE À LIGNE — une corbeille par fait retenu. Aucune callable ne retire UN
 *     fait ; `clearRysmoMemory` efface tout. Dans le port, ce bouton était `disabled` : il
 *     était donc rendu, rouge, à côté de chaque ligne, et ne faisait rien.
 *
 * 3 · « TOUT EFFACER » — la callable existe, elle. Ce qui manque n'est PLUS l'identité :
 *     elle est branchée depuis le 06/09 et cet écran lit sa vue. Ce qui manque est le chemin
 *     d'ÉCRITURE — `PorteeIdentifiee.appelOuNull` existe, aucun écran ne s'en sert, et rien
 *     ne relit `appRepetiteur` après coup alors que `clearRysmoMemory` la périme (`Perime`).
 *     Un effacement suivi d'une liste inchangée pendant trente secondes ferait croire qu'il
 *     n'a rien effacé. ⚠️ Sur une action DESTRUCTIVE, c'est la pire forme de contrôle
 *     mort — le port l'a livrée : l'alerte s'ouvrait, on touchait « Tout effacer », elle se
 *     fermait sans rien effacer, et la personne repartait en croyant que le produit ne savait
 *     plus rien d'elle. Ce bouton reviendra le jour où il efface.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranMemoire(
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
    session: Session = LocalSession.current,
) {
    /*
     * ⚠️ LA MÉMOIRE VIT DANS `appRepetiteur`, PAS DANS UNE VUE À ELLE. La même réponse porte le
     * quota, la mémoire et l'échange ; cet écran n'en lit qu'un tiers, et c'est le contrat qui
     * en décide. L'appel est donc le MÊME que celui de l'onglet Répétiteur — le cache des vues
     * le sert sans second aller-retour, tant que les trente secondes ne sont pas passées.
     */
    val lu = vue<Repetiteur>(Vues.Noms.APP_REPETITEUR, session)
    val etat = lu.etat
    val repetiteur: Repetiteur? = if (etat is Etat.Servie) etat.valeur else null

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Répétiteur",
        onRetour = onRetour,
        titre = "Mémoire de profil",
        droite = {
            /* Le kit pose une croix à droite en plus du retour. Les deux mènent au même
               endroit et les deux sont VIVES : ce n'est pas un doublon mort, c'est la
               convention d'un écran qu'on referme. */
            IconButton(libelle = "Fermer", onPress = onRetour) {
                Icon("close", description = null, taille = 17.dp, epaisseur = 2.4f)
            }
        },
    ) {
        Eyebrow("Ton répétiteur", Modifier.padding(top = 6.dp))
        Display(
            listOf("CE QU'IL", "A RETENU."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )

        if (repetiteur == null || etat !is Etat.Servie) {
            SansDonnees(
                etat = etat,
                quoi = "Ce que ton répétiteur a retenu de toi",
                origine = "La vue « ${Vues.Noms.APP_REPETITEUR} » du serveur",
                degat = "Chaque ligne est une chose qu'on affirme avoir retenue de quelqu'un — "
                    + "« tu vends des cosmétiques aux Almadies ». En inventer une seule, c'est "
                    + "dire à une personne qu'on a retenu d'elle une phrase qu'elle n'a jamais dite.",
                modifier = Modifier.padding(top = 20.dp),
                hauteur = 5,
                reprise = lu.reprendre,
            )
        } else if (repetiteur.memoire.isEmpty()) {
            /* ⭐ `appRepetiteur` est déclarée `vueNulle: "jamais"` : une mémoire vide arrive en
               `Servie`, jamais en `Vide`. Et le vide est ici une BONNE nouvelle qu'il faut
               dater — « il ne sait encore rien de toi » n'a de sens qu'à un instant donné. */
            Surface(Niveau.FLAT, Modifier.padding(top = 20.dp).fillMaxWidth(), rembourrage = 6.dp) {
                EmptyState(
                    titre = "Il n'a encore rien retenu de toi.",
                    glyphe = "brain",
                    corps = "Relevé le ${etat.provenance.asOf}. La mémoire se construit au fil "
                        + "des échanges, et elle ne sort jamais de ton compte.",
                )
            }
        } else {
            Surface(Niveau.FLAT, Modifier.padding(top = 20.dp).fillMaxWidth(), rembourrage = 18.dp) {
                Column {
                    repetiteur.memoire.forEach { fait ->
                        /* ⛔ LA CLÉ EST L'IDENTIFIANT DU FAIT, JAMAIS SA PHRASE. Le serveur peut
                           en retenir deux qui se ressemblent, et `key = fait` les ferait
                           s'effondrer l'un sur l'autre — le défaut qu'a déjà connu ce dépôt sur
                           les publications d'auteurs homonymes. */
                        key(fait.id) {
                            Column(Modifier.padding(vertical = 9.dp)) {
                                Body(fait.fait, grain = GrainCorps.PROSE)
                                /* ⛔ « depuis le 12 août » PASSE PAR `Num` : c'est une date, donc
                                   un relevé, et « un fait sans date ne se conteste pas ». */
                                Num(
                                    valeur = fait.depuis,
                                    source = Vues.Noms.APP_REPETITEUR,
                                    asOf = etat.provenance.asOf,
                                    modifier = Modifier.padding(top = 4.dp),
                                    taille = 11.5.sp,
                                    repli = "retenu sans date",
                                )
                            }
                        }
                    }
                }
            }
            Num(
                valeur = repetiteur.memoire.size.toString(),
                source = Vues.Noms.APP_REPETITEUR,
                asOf = etat.provenance.asOf,
                modifier = Modifier.padding(top = 12.dp),
                unite = "faits retenus",
                taille = 13.sp,
            )
        }

        EncartDeVerite(
            sourcil = "Ce que l'effacement fera",
            texte = "Immédiat, et sans passer par le support. La mémoire se reconstitue à "
                + "partir des seuls échanges suivants, et le nom que tu lui as donné ne "
                + "s'efface pas avec — effacer la mémoire retire des FAITS, le nom est un "
                + "réglage.",
            modifier = Modifier.padding(top = 18.dp),
        )

        EncartDeVerite(
            sourcil = "Pourquoi le renommage n'est pas ici",
            texte = "Le nom du répétiteur vit dans ton profil, pas sur l'appareil — sinon deux "
                + "téléphones afficheraient deux noms. Or aucune écriture du serveur ne le "
                + "pose aujourd'hui : le champ existerait, et son contenu disparaîtrait au "
                + "prochain lancement.",
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}
