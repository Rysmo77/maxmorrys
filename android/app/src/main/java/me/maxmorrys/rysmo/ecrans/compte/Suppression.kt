package me.maxmorrys.rysmo.ecrans.compte

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite

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
 * ⛔ AUCUN CHIFFRE. Le kit écrit « 2 inscriptions », « Tes 14 notes », « Les 21 Mo
 * téléchargés », « échéance au 14/02/2027 ». Ce sont des RELEVÉS, et rien n'a été relevé :
 * la session rend `NonConfiguree`, aucune vue n'a répondu. « Tes notes personnelles » reste
 * vrai sans savoir combien ; « Tes 14 notes » ne l'est que si on a compté. C'est l'écran où
 * un chiffre faux coûte le plus cher, puisqu'on décide de supprimer d'après lui.
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
         * ⛔ NI CHAMP DE CONFIRMATION NI BOUTON ROUGE, ET C'EST LA DÉCISION DE CET ÉCRAN.
         *
         * `deleteUserAccount` et `exportUserData` sont au contrat, le Worker les sert, et
         * elles exigent toutes deux un appelant identifié (`requireAuth`). Or aucun
         * producteur de jeton d'identité n'est branché : ni SDK Firebase Android ni client
         * REST contre Identity Toolkit n'est en dépendance, et `SourceDeSession` rend
         * `NonConfiguree`. L'appel ne peut pas être authentifié, donc il ne peut pas partir.
         *
         * ⚠️ LA TENTATION EST DE DESSINER LA CÉRÉMONIE QUAND MÊME — le champ, le mot à
         * taper, le bouton rouge — parce qu'elle est écrite et qu'elle est belle. C'est ce
         * que le port a livré sur la MÉMOIRE du répétiteur : l'alerte s'ouvrait, on touchait
         * « Tout effacer », elle se fermait sans rien effacer, et la personne repartait en
         * croyant que le produit ne savait plus rien d'elle. Sur un compte entier, la même
         * faute fait repartir quelqu'un en croyant avoir disparu.
         *
         * ⛔ ET L'EXPORT EST LE PIRE DES DEUX. Sa ligne était déjà un bouton mort dans le
         * port — glyphe, titre, méta, chevron, aucune action — sur l'écran où l'on vient
         * précisément récupérer ce qu'on a écrit avant de tout perdre. `mobile-legal.test.ts`
         * gardait ce point ; il est perdu avec le port, et il est rendu ici par une ABSENCE
         * qui se voit, pas par un contrôle qui se tait.
         */
        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Supprimer ton compte, et exporter tes données avant",
            origine = "Les deux gestes existent côté serveur — `deleteUserAccount` et "
                + "`exportUserData` — et exigent un appelant identifié. Aucun producteur de "
                + "jeton d'identité n'est branché dans l'application",
            degat = "Un champ « SUPPRIMER » et un bouton rouge qui n'effacent rien font "
                + "repartir quelqu'un en croyant avoir disparu. C'est la seule page du "
                + "produit où l'illusion du succès est pire que l'aveu de la panne.",
            modifier = Modifier.padding(top = 16.dp),
        )

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
                + "que ce soit d'autre — et elle n'est pas encore branchée.",
            modifier = Modifier.padding(top = 16.dp),
        )

        EncartDeVerite(
            sourcil = "Ce que le mot à taper protège",
            texte = "Quand le geste partira, il demandera d'écrire « $MOT_DE_CONFIRMATION » "
                + "en toutes lettres, et c'est cette constante-là qui partira au serveur — "
                + "jamais la saisie, qu'un espace ou un accent suffirait à faire refuser. La "
                + "friction n'est pas décorative : elle distingue un geste voulu d'un doigt "
                + "qui a glissé dans un écran de réglages.",
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}
