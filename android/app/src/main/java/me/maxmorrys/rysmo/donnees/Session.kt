package me.maxmorrys.rysmo.donnees

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * QUI REGARDE — une seule souscription, pour toute l'application.
 *
 * L'écoute de l'état d'authentification est montée UNE fois. Chaque écran qui s'abonnerait
 * pour son compte recevrait son premier verdict à un instant différent selon l'ordre de
 * montage : deux écrans afficheraient deux vérités.
 *
 * ⚠️ POURQUOI `Restauration` EST UN ÉTAT À PART ENTIÈRE, ET LE DÉFAUT LE PLUS COURANT DE
 * TOUTE APPLICATION QUI BRANCHE FIREBASE. Au démarrage à froid, le SDK relit la session
 * depuis le stockage AVANT d'émettre son premier verdict. Pendant ce temps on ne SAIT pas
 * s'il y a quelqu'un — et confondre ce moment avec « personne » renvoie vers la connexion
 * quelqu'un de DÉJÀ connecté, le temps d'un battement. Le clignotement vient toujours d'ici.
 *
 * ── ET `NonConfiguree` ───────────────────────────────────────────────────────────────
 * Une construction sans sa configuration ne peut pas répondre à la question. Dire
 * « anonyme » serait faux : ce n'est pas que personne n'est connecté, c'est qu'on NE PEUT
 * PAS LE SAVOIR. Sur un téléphone, l'alternative — jeter au démarrage — donne un écran blanc
 * sans console, dans une application qu'il faut repasser en revue pour corriger. On retient
 * donc le défaut et on le DIT, avec le nom de ce qui manque.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
sealed interface Session {

    /** Avant le premier verdict. On ne SAIT pas s'il y a quelqu'un. */
    data object Restauration : Session

    /** Personne. Réponse définitive, pas un trou. */
    data object Anonyme : Session

    /**
     * La construction n'a pas reçu sa configuration. TERMINALE.
     *
     * L'écouteur n'est jamais monté : aucune transition n'en sort, et c'est ce qui rend la
     * panne qu'elle produit NON REPRENABLE (voir `Etat.Panne.reprenable`).
     */
    data class NonConfiguree(val motif: String) : Session

    data class Connectee(
        val uid: String,
        val email: String?,
        val nom: String?,
    ) : Session
}

/** L'identifiant, ou `null` — la seule chose dont le cache a besoin. */
val Session.uid: String? get() = (this as? Session.Connectee)?.uid

/**
 * Les transitions légales de la session.
 *
 * ```
 *                    config incomplète
 *      (départ) ─────────────────────────► NonConfiguree ──╳  (terminale)
 *         │
 *         │ config complète
 *         ▼
 *     Restauration ──── 1er verdict, quelqu'un ──► Connectee ◄──┐
 *         │                                             │       │
 *         └──── 1er verdict, personne ──► Anonyme ◄─────┘       │
 *                                            └──────────────────┘
 * ```
 *
 * Deux invariants, et ils ont chacun coûté quelque chose ailleurs :
 *
 *  · `Restauration` N'EST JAMAIS RÉATTEINTE. C'est l'état d'AVANT le premier verdict ;
 *    y revenir ferait re-clignoter l'application au milieu d'une session ouverte.
 *  · `NonConfiguree` est terminale. Une construction incomplète ne se répare pas à chaud.
 */
fun Session.autorise(suivante: Session): Boolean = when (this) {
    is Session.NonConfiguree -> suivante is Session.NonConfiguree
    else -> suivante !is Session.Restauration && suivante !is Session.NonConfiguree
}
