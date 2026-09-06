package me.maxmorrys.rysmo.ecrans.apprentissage

import android.content.Context
import me.maxmorrys.rysmo.donnees.Appel
import me.maxmorrys.rysmo.donnees.CacheDesVues
import me.maxmorrys.rysmo.donnees.Configuration
import me.maxmorrys.rysmo.donnees.DiagnosticSysteme
import me.maxmorrys.rysmo.donnees.FournisseurDeJeton
import me.maxmorrys.rysmo.donnees.LectureDeVue

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE SEUL POINT DE MONTAGE DU PRODUIT, ET IL NE SERT QU'À CE QUI N'A PAS BESOIN DE COMPTE.
 *
 * ⚠️ CE FICHIER EST PROVISOIRE ET IL LE DIT. L'application n'a pas d'injection de
 * dépendances ; les écrans identifiés passent par `PorteeIdentifiee`, montée depuis le
 * 06/09. Le jour où la lecture se fournit d'en haut, ce fichier disparaît — il ne doit
 * surtout pas devenir l'endroit d'où l'application lit ses données.
 *
 * ⚠️ ET CE QUE DISAIT LA VERSION PRÉCÉDENTE N'EST PLUS VRAI : « les cinq onglets et les sept
 * autres écrans de ce lot rendent l'état honnête de leur vue sans jamais toucher le réseau,
 * parce qu'aucun producteur de jeton d'identité n'est choisi ». Le producteur existe, et ces
 * écrans lisent.
 *
 * ⭐ POURQUOI IL EXISTE MALGRÉ TOUT : `appVerifierCertificat` n'a besoin de RIEN de ce qui
 * manque. Elle est la seule vue du contrat déclarée `session: "aucune"`, elle ne pose pas
 * d'en-tête d'autorisation, et son seul besoin de construction est l'adresse de l'API.
 * Laisser cet unique chemin en attente d'une décision qui ne le concerne pas reviendrait à
 * ne rien vérifier pendant des semaines sur le seul écran que le produit promet à des gens
 * qui n'ont pas de compte.
 *
 * ⛔ ET LA CONFIGURATION EST DÉLIBÉRÉMENT DIFFÉRENTE DE CELLE DE L'APPLICATION.
 * `SourceDeSession` déclare une valeur de construction manquante — le producteur de jeton —
 * et `Appel.appelerBrut` refuse alors AVANT tout réseau, ce qui est juste pour un appel
 * authentifié. Un appel public n'a pas ce besoin : sa carte de valeurs est vide, donc
 * `motifManquant()` rend `null`, donc l'appel part. Ce n'est pas un contournement de la
 * garde : c'est la même garde, appliquée à ce que CET appel exige réellement.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
object PorteePublique {

    /**
     * ⛔ AUCUN JETON, JAMAIS — ET C'EST UNE DÉCISION DE SÉCURITÉ, PAS UNE COMMODITÉ.
     *
     * Le routeur du Worker n'exige pas de jeton : il en décode un s'il en trouve, et
     * `context.auth` vaut alors l'identité de l'appelant. Un handler public qui la lirait
     * servirait deux réponses selon la présence d'un en-tête ; `worker-vues-natives.test.ts`
     * l'interdit côté serveur. Ne rien envoyer le rend vrai des deux côtés : la vérification
     * d'un certificat ne peut pas savoir qui l'a demandée, donc elle ne peut pas le tracer.
     */
    private val SANS_JETON = FournisseurDeJeton { null }

    /* Une seule instance par processus : le cache des vues est dans la lecture, et deux
       lectures concurrentes en feraient deux, dont aucune ne servirait l'autre. */
    @Volatile
    private var lecture: LectureDeVue? = null

    @Synchronized
    fun lecture(contexte: Context): LectureDeVue = lecture ?: LectureDeVue(
        appel = Appel(
            /* Rien à déclarer : cet appel n'exige que l'adresse de l'API, qui a son défaut. */
            config = Configuration(),
            jetons = SANS_JETON,
            /* `applicationContext` : un contexte d'activité retenu par un objet de processus
               fuirait l'activité entière à chaque rotation. */
            reseau = DiagnosticSysteme(contexte.applicationContext),
        ),
        cache = CacheDesVues(),
    ).also { lecture = it }
}
