package me.maxmorrys.rysmo.systeme

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE VERROU BIOMÉTRIQUE — CE QUE LE SYSTÈME SAIT FAIRE, ET RIEN DE PLUS.
 *
 * Ce fichier ne décide rien : il traduit les réponses d'`androidx.biometric` en un
 * vocabulaire que les écrans peuvent lire, et il porte les quatre pièges qui ont un coût.
 *
 * ── ⛔ PIÈGE 1 · `BiometricPrompt` EXIGE UNE `FragmentActivity` ───────────────────────
 * Pas une `ComponentActivity`. `MainActivity` en était une, et le changement est écrit là-bas
 * avec sa raison. Le défaut ne se voit pas à la lecture : le code compile tant qu'on ne
 * demande pas l'activité, et c'est le transtypage qui rendrait `null` à l'exécution.
 *
 * ── ⛔ PIÈGE 2 · LE COUPLE « BOUTON NÉGATIF » / « CODE DE L'APPAREIL » S'EXCLUT ───────
 * `PromptInfo.Builder` LÈVE si `setNegativeButtonText` est posé en même temps que
 * `DEVICE_CREDENTIAL` — et il lève AUSSI si aucun des deux n'est là. Il n'y a donc pas de
 * réglage neutre : il faut choisir, et le choix est écrit dans `INVITE` ci-dessous.
 *
 * ── ⛔ PIÈGE 3 · « ÉCHOUÉ » ET « ERREUR » NE SONT PAS LA MÊME CHOSE ───────────────────
 * `onAuthenticationFailed` veut dire « ce doigt-là n'est pas le bon » : l'invite reste
 * OUVERTE, la personne réessaie, et le rappeler à l'écran ferait fermer un dialogue que le
 * système tient encore. Seul `onAuthenticationError` est terminal. Les confondre produit un
 * écran qui se réveille pendant que l'invite du système est encore devant.
 *
 * ── ⛔ PIÈGE 4 · UN CAPTEUR NE DOIT JAMAIS ENFERMER ───────────────────────────────────
 * C'est l'invariant de la spécification, et il gouverne les deux réglages ci-dessous : le
 * code de l'appareil est TOUJOURS accepté en repli, et l'écran verrouillé garde une sortie
 * qui ne passe pas par le capteur. Un capteur cassé, une empreinte retirée, un visage qui a
 * changé — chacun rendrait le compte inaccessible depuis ce téléphone.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Ce que ce téléphone peut faire, du point de vue de la question « peut-on proposer le
 * verrou ? ».
 *
 * ⛔ QUATRE RÉPONSES, PARCE QU'ELLES APPELLENT QUATRE PHRASES DIFFÉRENTES. « Pas de capteur »
 * et « aucune empreinte enregistrée » se ressemblent à l'écran et n'ont rien à voir : la
 * seconde se répare dans les réglages du téléphone, en une minute. Les confondre, c'est dire
 * à quelqu'un que son téléphone ne sait pas faire ce qu'il sait très bien faire.
 */
enum class MaterielBiometrique {
    /** Un capteur, et au moins une empreinte ou un visage enregistré. */
    PRET,

    /** L'appareil n'a pas de capteur. Le verrou ne sera jamais proposable ici. */
    AUCUN_MATERIEL,

    /** Un capteur, mais rien d'enrôlé. Cela se règle dans les paramètres du téléphone. */
    AUCUNE_EMPREINTE,

    /**
     * Le capteur existe et ne répond pas maintenant — occupé, en cours de mise à jour, ou
     * une réponse que cette version de la bibliothèque ne connaît pas.
     */
    INDISPONIBLE,
}

/**
 * ⛔ `BIOMETRIC_WEAK`, PAS `BIOMETRIC_STRONG`, ET C'EST UN CHOIX MESURÉ.
 *
 * `STRONG` sert à déverrouiller une clé cryptographique. Ici, rien n'est chiffré — le verrou
 * garde l'accès à l'écran, pas un secret — et exiger `STRONG` retirerait le déverrouillage
 * par le visage de la moitié du parc visé, qui est du bas de gamme. On demanderait une
 * garantie dont on ne se sert pas, en la payant par des appareils qui ne peuvent plus poser
 * de verrou du tout.
 *
 * ⚠️ ET C'EST `BIOMETRIC_WEAK` SEUL QUI RÉPOND À « PEUT-ON PROPOSER ? ». Ajouter
 * `DEVICE_CREDENTIAL` à cette question-là rendrait `PRET` sur tout téléphone qui a un code
 * de déverrouillage, c'est-à-dire presque tous : l'écran proposerait « Activer ton
 * empreinte » à quelqu'un qui n'a pas de capteur, et c'est exactement le réglage qui ment
 * que l'en-tête de cet écran reproche.
 */
private const val AUTHENTIFICATEURS_PROPOSABLES = BiometricManager.Authenticators.BIOMETRIC_WEAK

/**
 * ⛔ MAIS L'INVITE, ELLE, ACCEPTE AUSSI LE CODE DE L'APPAREIL — c'est le piège 4.
 *
 * Le capteur décide de la PROPOSITION ; il ne doit pas décider de la SORTIE. Quelqu'un dont
 * l'empreinte a cessé d'être reconnue — doigt coupé, écran fêlé, mise à jour du système —
 * garde son code, et le verrou ne devient donc jamais une porte close.
 *
 * ⚠️ Cette constante EST la raison pour laquelle aucun `setNegativeButtonText` n'apparaît
 * plus bas : les deux s'excluent, et `PromptInfo.Builder` lève si on pose les deux.
 */
private const val AUTHENTIFICATEURS_ACCEPTES =
    BiometricManager.Authenticators.BIOMETRIC_WEAK or BiometricManager.Authenticators.DEVICE_CREDENTIAL

/**
 * Ce que ce téléphone sait faire, maintenant.
 *
 * ⚠️ RELU À CHAQUE FOIS, JAMAIS MÉMORISÉ — même raison que pour l'état du réseau : quelqu'un
 * peut enrôler une empreinte pendant que l'application est en arrière-plan, et un « pas de
 * capteur » gardé en mémoire ferait mentir l'écran jusqu'au redémarrage.
 */
fun materielBiometrique(contexte: Context): MaterielBiometrique =
    when (BiometricManager.from(contexte).canAuthenticate(AUTHENTIFICATEURS_PROPOSABLES)) {
        BiometricManager.BIOMETRIC_SUCCESS -> MaterielBiometrique.PRET
        BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> MaterielBiometrique.AUCUNE_EMPREINTE
        BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE,
        BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED,
        -> MaterielBiometrique.AUCUN_MATERIEL
        /* ⚠️ `BIOMETRIC_STATUS_UNKNOWN` tombe ici, et c'est voulu : la bibliothèque le rend
           quand elle ne peut pas trancher sur une version d'Android donnée. On ne propose pas
           sur une réponse qu'on n'a pas comprise, et on ne dit pas non plus « pas de
           capteur » — ce serait affirmer une mesure qu'on n'a pas faite. */
        else -> MaterielBiometrique.INDISPONIBLE
    }

/** Ce qu'une invite système peut rendre. */
sealed interface ResultatBiometrique {

    /** L'identité a été reconnue — par le capteur ou par le code de l'appareil. */
    data object Reussie : ResultatBiometrique

    /**
     * L'invite s'est refermée sans reconnaître.
     *
     * @param motif ce que la personne lit. ⛔ Il vient du SYSTÈME quand le système en donne
     *   un : « Trop de tentatives. Réessayez dans 30 secondes. » dit quoi faire ; un motif
     *   maison ne saurait ni le délai ni la cause.
     * @param reprenable vrai quand refaire le geste a une chance d'aboutir. Faux après un
     *   verrouillage définitif du capteur : afficher « Réessayer » là serait le bouton mort
     *   que ce dépôt a déjà attrapé six fois.
     */
    data class Refusee(val motif: String, val reprenable: Boolean) : ResultatBiometrique
}

/**
 * Pose l'invite du système et rend son verdict UNE fois.
 *
 * ⚠️ LE RÉSULTAT REVIENT SUR LE FIL PRINCIPAL (`getMainExecutor`), parce que l'appelant écrit
 * dans un état Compose. Un rappel sur un fil de service ferait une écriture concurrente que
 * rien ne signale et que tout le monde finit par voir une fois, en production.
 */
fun demanderLIdentite(
    activite: FragmentActivity,
    titre: String,
    sousTitre: String,
    onResultat: (ResultatBiometrique) -> Unit,
) {
    val invite = BiometricPrompt(
        activite,
        ContextCompat.getMainExecutor(activite),
        object : BiometricPrompt.AuthenticationCallback() {

            override fun onAuthenticationSucceeded(resultat: BiometricPrompt.AuthenticationResult) {
                onResultat(ResultatBiometrique.Reussie)
            }

            override fun onAuthenticationError(code: Int, message: CharSequence) {
                onResultat(
                    ResultatBiometrique.Refusee(
                        motif = message.toString().ifBlank { "L'identification n'a pas abouti." },
                        reprenable = code !in ERREURS_DEFINITIVES,
                    ),
                )
            }

            /*
             * ⛔ VOLONTAIREMENT VIDE, ET CE N'EST PAS UN CONTRÔLE MORT — c'est le piège 3.
             * « Ce doigt n'est pas le bon » laisse l'invite OUVERTE : le système la tient
             * encore, il réessaie tout seul, et il compte les échecs pour décider du
             * verrouillage. Rappeler l'écran ici le ferait réagir devant un dialogue qui
             * n'est pas parti, et il n'y a rien à dire de plus que ce que l'invite affiche
             * déjà elle-même.
             */
            override fun onAuthenticationFailed() = Unit
        },
    )

    invite.authenticate(INVITE(titre, sousTitre))
}

/**
 * Les erreurs après lesquelles réessayer ne sert à rien.
 *
 * ⚠️ `ERROR_LOCKOUT` N'EN FAIT PAS PARTIE : il est TEMPORAIRE (trente secondes), et son
 * message le dit. C'est `ERROR_LOCKOUT_PERMANENT` qui exige le code de l'appareil, et les
 * confondre afficherait « Réessayer » sur un capteur qui ne répondra plus — ou le retirerait
 * sur un capteur qui répondra dans une demi-minute.
 */
private val ERREURS_DEFINITIVES = setOf(
    BiometricPrompt.ERROR_LOCKOUT_PERMANENT,
    BiometricPrompt.ERROR_NO_BIOMETRICS,
    BiometricPrompt.ERROR_HW_NOT_PRESENT,
    BiometricPrompt.ERROR_NO_DEVICE_CREDENTIAL,
)

/**
 * ⛔ AUCUN `setNegativeButtonText` — c'est le piège 2, et ce n'est pas une omission.
 *
 * `PromptInfo.Builder.build()` LÈVE une `IllegalArgumentException` si un bouton négatif est
 * posé en même temps que `DEVICE_CREDENTIAL`. Le bouton d'annulation est alors celui que le
 * système dessine lui-même, et il porte le libellé du code de l'appareil — ce qui est
 * exactement l'issue qu'on veut offrir.
 *
 * ⚠️ `setConfirmationRequired(false)` : sur le déverrouillage par le visage, la confirmation
 * ajoute un appui à un geste qui vient déjà de réussir. Elle a un sens pour un paiement, pas
 * pour rouvrir un écran qu'on regardait il y a dix secondes.
 */
private val INVITE: (String, String) -> BiometricPrompt.PromptInfo = { titre, sousTitre ->
    BiometricPrompt.PromptInfo.Builder()
        .setTitle(titre)
        .setSubtitle(sousTitre)
        .setAllowedAuthenticators(AUTHENTIFICATEURS_ACCEPTES)
        .setConfirmationRequired(false)
        .build()
}
