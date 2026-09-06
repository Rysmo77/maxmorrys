package me.maxmorrys.rysmo.session

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import me.maxmorrys.rysmo.donnees.Configuration
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.autorise

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * QUI REGARDE — et, aujourd'hui, l'aveu que personne ne peut le dire.
 *
 * ⛔ AUCUN PRODUCTEUR DE JETON D'IDENTITÉ N'EST ENCORE CHOISI. La couche de données déclare
 * `FournisseurDeJeton` et personne ne l'implémente : SDK Firebase Android ou client REST
 * maison contre Identity Toolkit, la décision n'est pas prise. Cette source rend donc
 * `NonConfiguree`, avec le motif exact.
 *
 * ⚠️ ET C'EST LA BONNE RÉPONSE, PAS UN PIS-ALLER. La tentation, ici, est de rendre
 * `Anonyme` — « personne n'est connecté », c'est vrai après tout, et tous les écrans
 * s'afficheraient proprement. Mais `Anonyme` est une réponse DÉFINITIVE, qui envoie vers la
 * connexion ; `NonConfiguree` dit que l'application ne SAIT pas, et le dit à l'écran. Les
 * confondre transformerait un chantier inachevé en un produit qui a l'air fini et refuse
 * l'accès à tout le monde.
 *
 * `NonConfiguree` est terminale et sa panne est NON REPRENABLE : aucun bouton « Réessayer »
 * n'apparaîtra, parce qu'aucune reprise ne changerait quoi que ce soit.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
class SourceDeSession(private val configuration: Configuration = CONFIGURATION_ACTUELLE) {

    /*
     * ⛔ L'ÉTAT DE DÉPART DÉPEND DE LA CONFIGURATION, ET CE N'EST PAS UN DÉTAIL DE STYLE.
     *
     * `NonConfiguree` est TERMINALE et ne s'atteint pas par transition : la couche de données
     * l'écrit noir sur blanc (`Session.autorise`), et une construction incomplète ne se répare
     * pas à chaud. Ma première version partait de `Restauration` puis y basculait — le
     * `require` de `poser()` a arrêté l'application au lancement, avec le nom des deux états.
     *
     * ⚠️ C'est la porte qui a mordu, pas un contretemps. Sans elle, l'application aurait
     * tourné dans un état que sa propre machine déclare impossible, et le défaut se serait
     * manifesté ailleurs, plus tard, sous une autre forme.
     */
    private val _etat = MutableStateFlow<Session>(
        configuration.motifManquant()?.let(Session::NonConfiguree) ?: Session.Restauration,
    )
    val etat: StateFlow<Session> = _etat.asStateFlow()

    /**
     * Rend le premier verdict — quand il y a quelqu'un pour le rendre.
     *
     * Aujourd'hui, il n'y a personne : la construction est incomplète, l'état de départ est
     * déjà `NonConfiguree`, et cette méthode n'a rien à faire. Elle existe pour que le jour
     * où un producteur de jeton sera branché, le point d'accroche soit ici et pas dans
     * l'activité.
     */
    fun demarrer() {
        if (_etat.value is Session.NonConfiguree) return
        /* ⚠️ Le producteur de jeton n'étant pas choisi, aucun verdict ne peut être rendu.
           Rendre `Anonyme` ici serait pire que ne rien rendre : `Anonyme` est une réponse
           DÉFINITIVE, qui envoie vers la connexion. Elle transformerait un chantier inachevé
           en un produit qui a l'air fini et refuse l'accès à tout le monde. */
    }

    /**
     * ⛔ LA SORTIE DU SAS BIOMÉTRIQUE, ET LA SEULE RAISON POUR LAQUELLE ELLE EXISTE DÉJÀ.
     *
     * L'écran verrouillé doit offrir un chemin qui ne passe PAS par le capteur — « un échec
     * d'authentification ne doit JAMAIS enfermer » (`spec-biometrie.md`). Ce chemin est « me
     * déconnecter », pas « ouvrir quand même » : le second viderait le verrou de tout sens,
     * puisque n'importe qui le toucherait. Sans cette méthode, le bouton du sas serait une
     * lambda vide — exactement le contrôle mort que ce dépôt attrape par test.
     *
     * ⚠️ ELLE NE FAIT RIEN AUJOURD'HUI, ET C'EST LA MACHINE À ÉTATS QUI LE DIT. `Anonyme` ne
     * s'atteint que depuis `Restauration` ou `Connectee` ; l'état courant est `NonConfiguree`,
     * qui est TERMINALE. Passer par `poser()` sans ce garde ferait échouer son `require` et
     * arrêterait l'application — c'est-à-dire que le geste de secours du verrou serait le seul
     * geste de l'application qui plante.
     */
    fun deconnecter() {
        if (_etat.value !is Session.Connectee) return
        poser(Session.Anonyme)
    }

    /**
     * Les transitions illégales sont refusées par la couche de données, pas ignorées ici.
     *
     * ⚠️ `deconnecter()` est son premier appelant réel ; elle reste le point d'accroche du
     * producteur de jeton à venir, qui posera `Connectee`.
     */
    private fun poser(suivante: Session) {
        require(_etat.value.autorise(suivante)) {
            "Transition de session interdite : ${_etat.value} -> $suivante"
        }
        _etat.value = suivante
    }
}

/**
 * ⛔ CE QUI MANQUE À LA CONSTRUCTION, NOMMÉ.
 *
 * `Configuration.motifManquant()` rend la phrase qui NOMME les valeurs absentes. En déclarer
 * une seule, à `null`, est la façon honnête de dire l'état du chantier : aucun producteur de
 * jeton d'identité n'est choisi — SDK Firebase Android ou client REST contre Identity
 * Toolkit — donc l'application ne peut identifier personne.
 *
 * ⚠️ Le jour où le choix sera fait, cette carte portera les vraies clés de construction, et
 * `motifManquant()` les nommera une par une si l'une venait à manquer d'un build. C'est ce
 * que gardait `mobile-app-config.test.ts` : « les six clés présentes à l'export », la porte
 * qui empêchait un binaire incomplet d'atteindre un magasin.
 */
private val CONFIGURATION_ACTUELLE = Configuration(
    valeursDeConstruction = mapOf("producteur de jeton d'identité" to null),
)
