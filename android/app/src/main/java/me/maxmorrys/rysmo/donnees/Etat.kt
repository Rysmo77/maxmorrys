package me.maxmorrys.rysmo.donnees

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LE VOCABULAIRE DE CE QU'ON SAIT — et de ce qu'on ne sait pas encore.
 *
 * Une branche BINAIRE — la valeur est là, ou elle est nulle — suffit tant que la seule
 * alternative au contenu est le vide. Dès qu'on interroge un serveur, cinq situations de
 * plus existent, et les confondre fait MENTIR l'écran :
 *
 *   • on RESTAURE la session — on ne sait pas encore qui regarde ;
 *   • on CHARGE — la réponse arrive ;
 *   • personne n'est CONNECTÉ — il n'y a rien à charger, et ce n'est pas une panne ;
 *   • ça a ÉCHOUÉ — et l'écran doit dire quoi ;
 *   • c'est arrivé et c'est VIDE — un zéro relevé est une information ;
 *   • c'est arrivé et c'est PLEIN.
 *
 * ⛔ UN ZÉRO SANS DATE N'EST PAS UNE INFORMATION. C'est la règle que tout ce dispositif
 * existe pour tenir : « tu n'as aucune note » écrit avec le même aplomb qu'on ait compté
 * ou pas est un mensonge. `Charge` et `Vide` les séparent, et `Vide` porte sa provenance.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * D'où vient la valeur.
 *
 * La couche de données ne produit que `SERVEUR` : c'est le seul cas que `useVue` posait
 * (`vue.ts:88, 111`). `REPLIQUE` est là pour le contenu de démonstration, qui vaut `null` en
 * production par construction — si ce dispositif ne survit pas à la réécriture, ce cas et la
 * phase `Replique` tombent ensemble.
 */
enum class Source { SERVEUR, REPLIQUE }

/**
 * D'où vient la valeur, et QUAND elle a été relevée.
 *
 * ⛔ `asOf` EST LA CHAÎNE DU SERVEUR, TELLE QU'IL L'A ÉCRITE — et c'est le correctif du
 * défaut le plus grave du port React Native. Là-bas, le chemin FRAIS posait `reponse.releveA`
 * (la date du serveur) et le chemin CACHÉ reconstruisait la date depuis `Date.now()` —
 * L'HORLOGE DU TÉLÉPHONE (`vue.ts:87` contre `:89, :111`). Le même écran produisait donc deux
 * provenances de nature différente selon qu'il avait touché le réseau, et sur un téléphone à
 * l'heure fausse — courant — un nombre servi du cache MENTAIT sur sa date.
 *
 * ⚠️ ET POURQUOI UNE CHAÎNE PLUTÔT QU'UN `Instant`. Deux raisons, dans cet ordre :
 *
 *   1 · Ce que le serveur a DIT est une chaîne. La reparser puis la réafficher fait passer
 *       la date par le fuseau et l'horloge de l'appareil — c'est-à-dire par exactement ce
 *       qu'on cherche à ne plus laisser décider.
 *   2 · `java.time.Instant` n'existe qu'à partir de l'API 26 SANS désucrage, et
 *       `app/build.gradle.kts` fixe `minSdk = 24` sans `isCoreLibraryDesugaringEnabled`.
 *       L'adopter demanderait une dépendance de plus (désucrage ou `kotlinx-datetime`) pour
 *       une valeur qu'on ne calcule jamais : on l'AFFICHE, on ne l'arithmétise pas.
 *
 * La péremption du cache, elle, se mesure sur une horloge monotone locale — c'est un autre
 * rôle, donc un autre champ, et c'est le sens de la correction (voir `Cache.kt`).
 */
data class Provenance(
    val source: Source,
    val asOf: String,
)

/**
 * Les huit phases.
 *
 * ⚠️ ELLES NE SONT PAS TOUTES ATTEIGNABLES DEPUIS LA LECTURE D'UNE VUE, et c'est mesuré :
 * `Replique` n'est produite que par la composition d'un état avec du contenu de
 * démonstration, et `NonBranche` par aucun chemin de cette couche — c'est la fabrique d'un
 * écran qui n'a pas encore de source serveur.
 */
sealed interface Etat<out T> {

    /** Avant le premier verdict de la session. On ne SAIT pas encore s'il y a quelqu'un. */
    data object Restauration : Etat<Nothing>

    /** La demande est partie. */
    data object Charge : Etat<Nothing>

    /** Personne n'est connecté. Ni une panne ni un vide : une porte fermée. */
    data object Anonyme : Etat<Nothing>

    /** L'écran n'a pas encore de source serveur. Honnête, et voué à disparaître. */
    data object NonBranche : Etat<Nothing>

    /**
     * Ça a échoué.
     *
     * ⚠️ `motif` SE LIT ; il ne se diagnostique pas. Un code ne dit à personne quoi faire.
     *
     * ⛔ `reprenable` REMPLACE LA LAMBDA `reessayer` DU PORT, et pour deux raisons distinctes.
     *
     *   1 · Une fonction dans l'état CASSE L'ÉGALITÉ STRUCTURELLE : deux `Panne` identiques
     *       ne seraient jamais égales, donc `distinctUntilChanged` d'un `StateFlow` ne
     *       filtrerait rien, donc toute recomposition Compose deviendrait inconditionnelle.
     *       La reprise est une méthode du ViewModel ; l'état dit seulement si elle a un sens.
     *
     *   2 · Le port posait `reessayer = {}` sur la panne de configuration (`vue.ts:71`). L'écran
     *       affichait « Réessayer » et le geste NE FAISAIT RIEN. C'est précisément la faute
     *       que `mobile-controles-morts.test.ts` avait été écrit pour attraper. Ici, une panne
     *       sans reprise possible ne PROPOSE pas de reprise, et le drapeau est dans l'état,
     *       pas dans l'écran.
     */
    data class Panne(
        val motif: String,
        val code: CodeErreur,
        val reprenable: Boolean,
    ) : Etat<Nothing>

    /**
     * Le serveur a répondu, et il n'y a rien. Daté, donc informatif.
     *
     * ⭐ `sens` EST LA CORRECTION DU QUATRIÈME DÉFAUT DU PORT. Là-bas, les trois sens de
     * `vue: null` étaient aplatis en une seule phase (`vue.ts:91-93`) : « le Club est réservé
     * aux membres », « tu n'as encore rien ici » et « cette liste est vide » s'affichaient
     * pareil. Le commentaire de `useClub` énonçait pourtant la nuance — « elle décide de ce
     * qu'on lit après avoir laissé expirer son accès » — mais rien dans le protocole ne la
     * portait. Elle est maintenant dans le contrat, générée, et elle arrive jusqu'ici.
     */
    data class Vide(
        val provenance: Provenance,
        val sens: SensDuVide,
    ) : Etat<Nothing>

    /** Le serveur a répondu. */
    data class Servie<T>(
        val valeur: T,
        val provenance: Provenance,
    ) : Etat<T>

    /** Contenu de transfert, en développement ou en revue. Jamais en production. */
    data class Replique<T>(
        val valeur: T,
        val provenance: Provenance,
    ) : Etat<T>
}

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES TRANSITIONS LÉGALES — quatre interdits, et ce ne sont pas des détails.
 *
 * ```
 *   Restauration ──session anonyme──► Anonyme            (terminal pour ce montage)
 *        │
 *        │ session connectée
 *        ├── succès de cache ─────────► Servie | Vide    (JAMAIS Charge : pas de clignotement)
 *        │
 *        └── échec de cache ──► Charge ──┬──► Servie
 *                                        ├──► Vide
 *                                        └──► Panne ──reprise──► Charge …
 *   (session non configurée) ───────────► Panne (sans reprise)
 * ```
 *
 * Cette fonction n'est pas une décoration : elle est APPELÉE par le cache et vérifiée par un
 * test. Les interdits qu'elle porte se sont tous produits ailleurs.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
fun Etat<*>.autorise(suivant: Etat<*>): Boolean = when {
    /* `Servie → Charge` sans demande explicite, c'est LE CLIGNOTEMENT : l'écran vide son
       contenu pour le remplir avec le même. Une relecture doit être demandée, pas subie. */
    this is Etat.Servie<*> && suivant is Etat.Charge -> false

    /* `Panne → Servie` sans passer par `Charge` : l'écran doit VOIR que quelque chose
       repart, sinon le bouton « Réessayer » se comporte comme s'il n'avait rien fait. */
    this is Etat.Panne && suivant is Etat.Servie<*> -> false
    this is Etat.Panne && suivant is Etat.Vide -> false

    /* ⛔ LA RÉPLIQUE NE REMPLACE JAMAIS UNE RÉPONSE ARRIVÉE, MÊME VIDE, NI UNE PANNE.
       « Masquer un échec par du contenu de démonstration ferait croire l'application en bon
       état alors qu'elle ne lit rien. » Combler un CATALOGUE vide avec un exemple est utile ;
       combler une réponse absente avec un exemple fait croire à une lecture. */
    suivant is Etat.Replique<*> && (this is Etat.Servie<*> || this is Etat.Vide || this is Etat.Panne) -> false

    /* `NonConfiguree` est terminale côté session ; la panne qu'elle produit l'est aussi. */
    this is Etat.Panne && !this.reprenable && suivant !is Etat.Panne -> false

    else -> true
}
