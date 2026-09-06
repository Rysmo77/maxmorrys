package me.maxmorrys.rysmo.ecrans.compte

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import me.maxmorrys.rysmo.donnees.CodeErreur
import me.maxmorrys.rysmo.donnees.ErreurAppel
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.Field
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ds.localeCourante
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.ecrans.media.AdresseMono
import me.maxmorrys.rysmo.identite.PorteeIdentifiee
import me.maxmorrys.rysmo.identite.authOuNull
import me.maxmorrys.rysmo.identite.configurationDIdentite
import me.maxmorrys.rysmo.identite.deconnexion
import me.maxmorrys.rysmo.systeme.aOuvert
import me.maxmorrys.rysmo.systeme.ouvrirUneAdresse

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA SUPPRESSION DE COMPTE — kit `NatSuppression` (`ScreensNatifCompte.js:206-237`).
 *
 * ⭐ CE QUE CET ÉCRAN DOIT TENIR AVANT D'ÊTRE BEAU : SA LISTE EST UN ENGAGEMENT.
 *
 * Le serveur écrit la consigne lui-même, dans le handler qui efface
 * (`worker/apps/api/src/handlers/gdpr.ts`) : « L'écran de suppression du compte ÉNUMÈRE ce
 * qui disparaît […] Le lien à tenir n'est pas le fichier, c'est la LISTE. Tant que le
 * balayage était plus court que cette liste, l'écran promettait ce que le serveur ne faisait
 * pas. » Le défaut mesuré ce jour-là n'était pas un chiffre mais un NOM : `club_posts` porte
 * `userName` en clair, et une personne supprimée gardait ses messages signés sur le mur.
 *
 * ⛔ LE LIEN EST DONC GARDÉ, PAS ESPÉRÉ. Chaque ligne ci-dessous DÉCLARE les collections du
 * balayage qu'elle couvre, et `tests/unit/natif-compte.test.ts` apparie l'union de ces
 * déclarations à ce que `deleteUserAccount` efface réellement. La porte mord dans les deux
 * sens : une collection ajoutée au serveur sans ligne d'écran échoue, une ligne qui promet
 * l'effacement de quelque chose que le serveur ne touche pas échoue aussi.
 *
 * ⛔ AUCUN CHIFFRE, ET LA RAISON A CHANGÉ DE NATURE SANS CHANGER DE CONCLUSION. Le kit écrit
 * « 2 inscriptions », « Tes 14 notes », « Les 21 Mo téléchargés », « échéance au 14/02/2027 ».
 * Ce sont des RELEVÉS, et cet écran n'en demande AUCUN : il ne lit pas de vue. Ce n'est plus
 * qu'il ne peut pas — l'identité est branchée — c'est qu'il ne doit pas. « Tes notes
 * personnelles » reste vrai sans savoir combien ; « Tes 14 notes » exigerait un compteur, sa
 * source et sa date, sur l'écran où un chiffre faux coûte le plus cher puisqu'on décide de
 * supprimer d'après lui. Ce qui compte ici est la LISTE, et elle est exacte.
 *
 * ⛔ ET LA LIGNE DES TÉLÉCHARGEMENTS N'EXISTE PAS ICI. Le kit la met en cinquième position ;
 * il n'y a aucun dispositif de téléchargement dans l'application, et il ne peut pas y en
 * avoir aujourd'hui (voir `ecrans/apprentissage/Telechargements.kt`). Promettre d'effacer
 * un stockage qui n'est pas occupé n'est pas une exagération inoffensive : c'est la seule
 * ligne de la liste qui parle du TÉLÉPHONE, donc celle qu'on vérifie.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Une ligne de ce qui part.
 *
 * @param balaye les noms EXACTS que `deleteUserAccount` efface et que cette ligne couvre.
 *   `users/notes` et `notifications/items` sont des sous-collections : le chemin est écrit
 *   avec son parent, le segment de l'identifiant retiré, exactement comme la porte le
 *   normalise avant de comparer.
 *   ⚠️ Ce champ n'est pas de la documentation. C'est la clef de l'appariement, et une ligne
 *   qui le laisserait vide sortirait sa promesse de la garde sans que rien ne le voie.
 */
internal data class LigneQuiPart(
    val balaye: List<String>,
    val titre: String,
    val meta: String,
)

/**
 * ⭐ CE QUI PART, GROUPÉ POUR ÊTRE LU — ET COMPLET POUR ÊTRE VRAI.
 *
 * Le groupement est un choix de lecture : dix-huit noms de collection ne se lisent pas, et
 * personne ne décide de supprimer son compte devant un schéma de base. Le groupement ne
 * retire rien, il rassemble — d'où `balaye`, qui garde le compte exact sous la phrase.
 */
internal val CE_QUI_PART: List<LigneQuiPart> = listOf(
    LigneQuiPart(
        balaye = listOf("enrollments", "gamification"),
        titre = "Tes inscriptions et ta progression",
        meta = "accès à vie perdu, sans remboursement",
    ),
    LigneQuiPart(
        balaye = listOf("users/notes"),
        titre = "Tes notes personnelles",
        meta = "elles ne sont nulle part ailleurs",
    ),
    LigneQuiPart(
        balaye = listOf("certificates"),
        titre = "Tes certificats, côté compte",
        meta = "le registre public de vérification, lui, n'est pas balayé — voir plus bas",
    ),
    LigneQuiPart(
        balaye = listOf("club_subscriptions", "club_posts", "club_profiles", "conversations"),
        titre = "Ton abonnement au Club et tout ce que tu y as publié",
        meta = "échéance non remboursée ; tes publications sont signées de ton nom",
    ),
    LigneQuiPart(
        balaye = listOf("messages", "testimonials"),
        titre = "Tes messages et tes témoignages",
        meta = "retirés du site avec le reste",
    ),
    LigneQuiPart(
        balaye = listOf("transactions"),
        titre = "L'historique de tes paiements",
        meta = "les reçus déjà reçus restent dans ta boîte, eux",
    ),
    LigneQuiPart(
        balaye = listOf("referrals"),
        titre = "Tes parrainages, des deux côtés",
        meta = "celui que tu as parrainé comme celui qui t'a parrainé",
    ),
    LigneQuiPart(
        balaye = listOf("notifications", "notifications/items"),
        titre = "Tes notifications",
        meta = "lues comme non lues",
    ),
    LigneQuiPart(
        balaye = listOf("avatars", "exports", "club_media"),
        titre = "Tes fichiers",
        meta = "photo de profil, exports que tu as demandés, images postées au Club",
    ),
    LigneQuiPart(
        balaye = listOf("users"),
        titre = "Ton compte lui-même",
        meta = "supprimé en dernier : tant qu'il existe, l'opération reste rejouable",
    ),
)

/** Le mot de confirmation. Le serveur le compare en capitales (`gdpr.ts`). */
internal const val MOT_DE_CONFIRMATION: String = "SUPPRIMER"

/**
 * Le geste en vol, s'il y en a un.
 *
 * ⛔ NOMMÉ, PAS UN BOOLÉEN PARTAGÉ. Un seul drapeau « en cours » ferait dire « Un instant… »
 * au bouton de SUPPRESSION pendant qu'un export se prépare — c'est-à-dire annoncer à
 * quelqu'un que son compte est en train d'être effacé alors qu'il a demandé le contraire.
 * Sur cet écran-là, un libellé qui se trompe de geste est un mensonge, pas une imprécision.
 *
 * ⚠️ Il sert AUSSI d'exclusion mutuelle : les deux appels partent avec le même jeton, et
 * lancer la suppression pendant que l'export lit les mêmes collections ferait exporter un
 * fichier à moitié vidé.
 */
private enum class GesteEnVol { EXPORT, SUPPRESSION }

/**
 * ⛔ CET ÉCRAN NE DEMANDE PAS `onAller` : IL N'A NULLE PART OÙ ENVOYER.
 *
 * La suppression aboutie déconnecte, et c'est la SESSION qui décide où l'on va — router
 * depuis les deux endroits produirait deux navigations pour un seul geste (défaut mesuré
 * dans le port : `connexion.tsx:50-53` s'en garde en commentaire et le fait quand même).
 */
@Composable
fun EcranSuppression(
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    val portee = rememberCoroutineScope()
    var saisie by remember { mutableStateOf("") }
    /*
     * ⛔ DEUX ÉCHECS, DEUX EMPLACEMENTS — ET CE N'EST PAS DU RANGEMENT. Un seul `erreur`
     * afficherait le refus de l'EXPORT sur le liseré du champ « SUPPRIMER » : la personne
     * lirait un échec rouge sur la case qu'elle vient de remplir, et corrigerait une saisie
     * qui n'a rien fait. Un message d'erreur mal attribué envoie chercher au mauvais endroit.
     */
    var erreurDExport by remember { mutableStateOf<String?>(null) }
    var erreur by remember { mutableStateOf<String?>(null) }
    var enVol by remember { mutableStateOf<GesteEnVol?>(null) }
    var lienDExport by remember { mutableStateOf<String?>(null) }
    var adresseOrpheline by remember { mutableStateOf<String?>(null) }

    /*
     * ⛔ LE MOT EST NORMALISÉ POUR ÊTRE COMPARÉ, JAMAIS POUR ÊTRE ENVOYÉ. Le serveur compare
     * `confirmation.toUpperCase()` à « SUPPRIMER » (`gdpr.ts`) ; un espace de fin ou un clavier
     * qui capitalise à sa façon ferait donc refuser un geste voulu. On compare ici la saisie
     * mise en forme, et on envoie la CONSTANTE — voir le bloc d'envoi plus bas.
     *
     * ⚠️ `uppercase(localeCourante())`, JAMAIS `uppercase()` NU : la casse est une décision de
     * LANGUE, et `« i »` devient `İ` en turc. Sur un téléphone en turc, un `uppercase()` sans
     * locale rendrait la confirmation impossible à écrire.
     */
    val confirme = saisie.trim().uppercase(localeCourante()) == MOT_DE_CONFIRMATION

    Screen(
        territoire = Territoire.TRANSFORME,
        modifier = modifier,
        retour = "Profil",
        onRetour = onRetour,
        titre = "Supprimer mon compte",
    ) {
        Display(
            listOf("Ce qui part", "avec ton compte."),
            taille = 27.sp,
            modifier = Modifier.padding(top = 10.dp),
        )

        Surface(Niveau.FLAT, Modifier.padding(top = 20.dp).fillMaxWidth(), rembourrage = 16.dp) {
            Column {
                CE_QUI_PART.forEachIndexed { index, ligne ->
                    /* La clef est le titre, unique par construction, et la porte le vérifie :
                       deux lignes homonymes s'effondreraient en une seule et retireraient
                       silencieusement une promesse de la liste. */
                    key(ligne.titre) {
                        LessonRow(
                            titre = ligne.titre,
                            etat = EtatLecon.PLAIN,
                            meta = ligne.meta,
                            derniere = index == CE_QUI_PART.lastIndex,
                        )
                    }
                }
            }
        }

        /*
         * ⭐ CE QUI RESTE — ET LA CORRECTION QUE LE KIT NE PORTE PAS.
         *
         * Le kit et le port écrivent : « Le miroir public ne porte aucun identifiant de
         * compte. » C'est vrai et c'est incomplet. `certificate_lookups/<code>` — la seule
         * collection que le balayage ne touche pas — garde le code, la formation, la DATE et
         * le NOM DU TITULAIRE (`worker/apps/api/src/handlers/app/verifierCertificat.ts`).
         *
         * ⚠️ Le taire serait exactement le défaut que le balayage a dû corriger pour
         * `club_posts` : une trace nominative qui survit à la suppression. La différence est
         * qu'ici elle est VOULUE — un certificat qu'on peut effacer ne prouve plus rien — et
         * une décision volontaire se dit à la personne qui décide, avant qu'elle décide.
         */
        Surface(Niveau.FLAT, Modifier.padding(top = 14.dp).fillMaxWidth()) {
            Column {
                Body(
                    "Ce qui reste",
                    grain = GrainCorps.CHAPO,
                    couleur = jetons.ok,
                )
                Body(
                    "Tes certificats déjà émis restent vérifiables par leur code — c'est le "
                        + "principe même d'un certificat, et le registre qui répond aux codes "
                        + "n'est pas balayé par la suppression.",
                    Modifier.padding(top = 6.dp),
                    attenue = true,
                )
                Body(
                    "Ce registre ne porte aucun identifiant de compte, mais il porte ton NOM, "
                        + "à côté du titre de la formation et de la date. Après suppression, "
                        + "quiconque a le code lit encore ces quatre informations.",
                    Modifier.padding(top = 8.dp),
                )
            }
        }

        /*
         * ═══════════════════════════════════════════════════════════════════════════════
         * LA CÉRÉMONIE EXISTE PARCE QUE LE GESTE PART VRAIMENT — ET PAS UNE LIGNE AVANT.
         *
         * ⛔ C'EST LA SEULE PAGE DU PRODUIT OÙ L'ILLUSION DU SUCCÈS EST PIRE QUE L'AVEU DE LA
         * PANNE. Un champ « SUPPRIMER » et un bouton qui n'effacent rien font repartir
         * quelqu'un en croyant avoir disparu. C'est ce que le port avait livré sur la MÉMOIRE
         * du répétiteur : l'alerte s'ouvrait, on touchait « Tout effacer », elle se fermait
         * sans rien effacer. Sur un compte entier, la même faute est irrattrapable, puisque
         * personne ne revient vérifier qu'il a bien disparu.
         *
         * `deleteUserAccount` et `exportUserData` sont servies par le Worker et exigent un
         * appelant identifié (`requireAuth`). Le producteur de jeton est branché
         * (`identite/JetonFirebase.kt`) : les deux appels partent, et l'écran affiche ce que
         * le serveur répond — y compris son refus.
         *
         * ⚠️ LA CONFIGURATION EST VÉRIFIÉE AVANT DE DESSINER QUOI QUE CE SOIT, comme sur la
         * connexion. Sans clés de construction, `appelOuNull` rend `null` : la cérémonie
         * récolterait un mot que rien ne peut envoyer. On retombe alors sur l'aveu, qui NOMME
         * les clés absentes.
         * ═══════════════════════════════════════════════════════════════════════════════
         */
        val auth = authOuNull(contexte)
        val appel = PorteeIdentifiee.appelOuNull(contexte)
        if (auth == null || appel == null) {
            SansDonnees(
                etat = Etat.Panne(
                    motif = configurationDIdentite().motifManquant()
                        ?: "L'identification n'est pas disponible.",
                    code = CodeErreur.FAILED_PRECONDITION,
                    reprenable = false,
                ),
                quoi = "Supprimer ton compte, et exporter tes données avant",
                origine = "Les clés de construction Firebase",
                degat = "Un champ « $MOT_DE_CONFIRMATION » et un bouton qui n'effacent rien "
                    + "font repartir quelqu'un en croyant avoir disparu. C'est la seule page "
                    + "du produit où l'illusion du succès est pire que l'aveu de la panne.",
                modifier = Modifier.padding(top = 16.dp),
            )
        } else {
            /*
             * ⭐ L'EXPORT EST AU-DESSUS DE LA SUPPRESSION, ET L'ORDRE EST LA DÉCISION.
             *
             * Sa ligne était un bouton MORT dans le port — glyphe, titre, méta, chevron,
             * aucune action — sur l'écran où l'on vient précisément récupérer ce qu'on a
             * écrit avant de tout perdre. Le proposer APRÈS le bouton rouge le proposerait à
             * quelqu'un qui n'a plus rien à exporter.
             */
            Surface(Niveau.FLAT, Modifier.padding(top = 16.dp).fillMaxWidth()) {
                Column {
                    Body("Avant de partir, emporte tes données", grain = GrainCorps.CHAPO)
                    Body(
                        "Le serveur prépare un fichier avec ton compte, tes inscriptions, "
                            + "tes notes, tes certificats, tes paiements et tes messages. Le "
                            + "lien est temporaire : ouvre-le tout de suite et garde le "
                            + "fichier.",
                        Modifier.padding(top = 6.dp),
                        attenue = true,
                    )
                    Button(
                        libelle = if (enVol == GesteEnVol.EXPORT) {
                            "Un instant…"
                        } else {
                            "Préparer mon export"
                        },
                        onPress = {
                            if (enVol == null) {
                                enVol = GesteEnVol.EXPORT
                                erreurDExport = null
                                portee.launch {
                                    /* ⛔ `Appel` EST BLOQUANT, délibérément : « le choix du
                                       fil appartient à la couche au-dessus ». C'est ici, et
                                       c'est `IO` — sur le fil principal, ce même code
                                       lèverait `NetworkOnMainThread`. */
                                    val issue = withContext(Dispatchers.IO) {
                                        runCatching {
                                            appel.appelerBrut("exportUserData")
                                        }
                                    }
                                    enVol = null
                                    issue.onSuccess { charge ->
                                        /*
                                         * ⚠️ UN LIEN ABSENT N'EST PAS UN SUCCÈS SILENCIEUX.
                                         * Le handler rend `downloadUrl` ; s'il manquait, un
                                         * bouton « Ouvrir » sans adresse serait un contrôle
                                         * mort de plus, et pire, il ferait croire l'export
                                         * prêt.
                                         */
                                        lienDExport = charge.jsonObject["downloadUrl"]
                                            ?.jsonPrimitive?.contentOrNull
                                        if (lienDExport == null) {
                                            /* ⚠️ UNE SEULE LIGNE, ET CE N'EST PAS DU STYLE :
                                               un « + » EN TÊTE DE LIGNE après une affectation
                                               COMPLÈTE est lu comme un plus unaire, pas comme
                                               une concaténation. Le compilateur le refuse ici,
                                               et il aurait pu ne pas le refuser ailleurs. */
                                            erreurDExport = "Le serveur a répondu sans lien."
                                        }
                                    }
                                    issue.onFailure { echec ->
                                        erreurDExport = (echec as? ErreurAppel)?.motif
                                            ?: "L'export n'a pas pu être préparé."
                                    }
                                }
                            }
                        },
                        modifier = Modifier.padding(top = 14.dp),
                        ton = TonBouton.QUIET,
                        desactive = enVol != null,
                    )
                    erreurDExport?.let { motif ->
                        Body(motif, Modifier.padding(top = 10.dp), couleur = jetons.stop)
                    }
                    lienDExport?.let { lien ->
                        Button(
                            "Ouvrir mon export",
                            {
                                adresseOrpheline =
                                    if (ouvrirUneAdresse(contexte, lien).aOuvert) null else lien
                            },
                            Modifier.padding(top = 10.dp),
                            ton = TonBouton.QUIET,
                            glypheQueue = "external",
                        )
                    }
                }
            }

            /*
             * ⛔ LA FRICTION N'EST PAS DÉCORATIVE. Le mot écrit distingue un geste voulu d'un
             * doigt qui a glissé dans un écran de réglages — c'est le seul endroit du produit
             * où un geste est irréversible et où personne ne revient vérifier.
             */
            Field(
                libelle = "Écris « $MOT_DE_CONFIRMATION » pour confirmer",
                valeur = saisie,
                onChange = { saisie = it; erreur = null },
                modifier = Modifier.padding(top = 18.dp),
                substitut = MOT_DE_CONFIRMATION,
                erreur = erreur,
            )

            /*
             * ⛔ CE QUI PART EST LA CONSTANTE, JAMAIS LA SAISIE — et ce n'est pas de la
             * coquetterie. Le serveur compare `confirmation.toUpperCase()` à « SUPPRIMER » ;
             * envoyer la frappe brute ferait refuser un geste voulu sur un espace de fin ou
             * un accent, et la personne recommencerait sans comprendre. La saisie sert à
             * décider si le geste part ; la constante est ce qui part.
             *
             * ⚠️ LA GARDE EST DOUBLE, ET LES DEUX SERVENT. `desactive` dit à l'œil que le
             * geste n'est pas disponible ; le `if (confirme…)` empêche l'envoi quoi qu'il
             * arrive — un bouton désactivé reste un composable, et une garde visuelle n'est
             * pas une garde.
             */
            Button(
                libelle = if (enVol == GesteEnVol.SUPPRESSION) {
                    "Un instant…"
                } else {
                    "Supprimer définitivement mon compte"
                },
                onPress = {
                    if (confirme && enVol == null) {
                        enVol = GesteEnVol.SUPPRESSION
                        erreur = null
                        portee.launch {
                            val issue = withContext(Dispatchers.IO) {
                                runCatching {
                                    appel.appelerBrut(
                                        "deleteUserAccount",
                                        buildJsonObject {
                                            put("confirmation", JsonPrimitive(MOT_DE_CONFIRMATION))
                                        },
                                    )
                                }
                            }
                            enVol = null
                            issue.onSuccess {
                                /*
                                 * ⛔ LE CACHE DES VUES EST OUBLIÉ AVANT LA DÉCONNEXION. Sa clé
                                 * porte l'uid, donc rien ne serait SERVI au compte suivant —
                                 * mais les entrées resteraient en mémoire, et sur un téléphone
                                 * partagé c'est une trace de quelqu'un que rien n'efface.
                                 * `PorteeIdentifiee.oublier()` existe pour ce moment précis.
                                 */
                                PorteeIdentifiee.oublier()
                                /*
                                 * ⚠️ ON DÉCONNECTE, ON NE NAVIGUE PAS. Le serveur a supprimé le
                                 * compte d'authentification, mais le SDK garde sa session
                                 * locale jusqu'au prochain rafraîchissement de jeton : sans ce
                                 * `signOut`, l'application resterait « connectée » à un compte
                                 * qui n'existe plus. Et c'est l'écouteur d'identité qui pose
                                 * `Anonyme` et décide où l'on va — router ici créerait un
                                 * second chemin pour une seule conclusion.
                                 */
                                deconnexion(auth)
                            }
                            issue.onFailure { echec ->
                                erreur = (echec as? ErreurAppel)?.motif
                                    ?: "La suppression n'a pas abouti."
                            }
                        }
                    }
                },
                modifier = Modifier.padding(top = 14.dp),
                /*
                 * ⚠️ `INK` PLUTÔT QU'UN ROUGE ÉCRIT À LA MAIN. Le kit dessine un bouton rouge ;
                 * `TonBouton` n'a pas de ton de danger, et en fabriquer un ici demanderait une
                 * couleur littérale — ce que `natif-socle.test.ts` refuse, et à raison : une
                 * teinte écrite dans un écran ne bascule pas la nuit. `INK` est invariant et
                 * pèse ce qu'il faut ; le rouge, lui, est déjà porté par le liseré du champ
                 * quand la confirmation échoue.
                 */
                ton = TonBouton.INK,
                desactive = !confirme || enVol != null,
            )
        }

        adresseOrpheline?.let { orpheline ->
            Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                Column {
                    Body("Aucun navigateur n'a répondu", grain = GrainCorps.CHAPO)
                    Body(
                        "Ce téléphone n'a pas d'application capable d'ouvrir une adresse web. "
                            + "Le lien reste valable quelques heures depuis un autre appareil :",
                        Modifier.padding(top = 6.dp),
                        attenue = true,
                    )
                    AdresseMono(orpheline, Modifier.padding(top = 8.dp))
                }
            }
        }

        EncartDeVerite(
            sourcil = "Pourquoi tout doit se passer ici",
            /*
             * ⚠️ CE TEXTE NOMMAIT UN MAGASIN ET L'ÉTAT DE SOUMISSION DU PROJET.
             *
             * « Cette version ne peut pas être soumise à l'App Store, dont la règle
             * 5.1.1(v) l'exige » — affiché à quelqu'un qui veut supprimer son compte, sur
             * un téléphone Android. Deux fautes en une phrase : c'est de l'état de
             * chantier interne, et ça cite un magasin qui n'est même pas celui de
             * l'appareil qu'on tient.
             *
             * La règle du dépôt vaut aussi dans l'autre sens : `natif-store-achats.test.ts`
             * refuse qu'un écran nomme un magasin dans son TEXTE, parce que citer une règle
             * de magasin est un signal aussi net qu'un lien d'achat — pour une revue comme
             * pour quelqu'un qui lit.
             *
             * Ce qui reste est ce qui LE concerne : où le geste se fait, et pourquoi il ne
             * part pas encore.
             */
            texte = "La suppression se fait dans l'application, sans lien vers le site et "
                + "sans écrire au support. C'était notre règle avant d'être celle de qui "
                + "que ce soit d'autre, et le geste part d'ici.",
            modifier = Modifier.padding(top = 16.dp),
        )

        EncartDeVerite(
            sourcil = "Ce que le mot à taper protège",
            texte = "Le geste demande d'écrire « $MOT_DE_CONFIRMATION » en toutes lettres, et "
                + "c'est cette constante-là qui part au serveur — jamais ta frappe, qu'un "
                + "espace ou un accent suffirait à faire refuser. La friction n'est pas "
                + "décorative : elle distingue un geste voulu d'un doigt qui a glissé dans un "
                + "écran de réglages.",
            modifier = Modifier.padding(top = 12.dp),
        )

        EncartDeVerite(
            sourcil = "Ce qui se passe quand tu confirmes",
            texte = "Le serveur efface la liste ci-dessus, puis ton compte d'identification "
                + "en dernier — tant qu'il existe, l'opération reste rejouable si une étape a "
                + "échoué. L'application te déconnecte alors. Si quelque chose échoue, tu le "
                + "liras ici : rien ne se referme en silence.",
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}
