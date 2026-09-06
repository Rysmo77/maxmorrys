package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import me.maxmorrys.rysmo.donnees.CertificatPublic
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.DocLine
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Field
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.TonTag
import me.maxmorrys.rysmo.ds.Typo
import me.maxmorrys.rysmo.ds.jetons

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA VÉRIFICATION D'UN CERTIFICAT — LE SEUL ÉCRAN DU PRODUIT QUI N'EST PAS POUR L'APPRENANTE.
 *
 * ⛔ LE KIT NE DESSINE RIEN ICI, ET LE LIEN PROFOND EXISTE DEPUIS TOUJOURS.
 * `AndroidManifest.xml` et `public/.well-known/assetlinks.json` déclarent tous deux le
 * préfixe `/verifier`, avec `autoVerify="true"` — c'est-à-dire une vérification EN LIGNE par
 * Google. Un préfixe déclaré sans destination ne produit aucune erreur : le lien s'ouvre
 * simplement dans le navigateur, et l'application a l'air de ne pas gérer ses propres liens.
 *
 * ── CE QUI A DÛ ÊTRE CONSTRUIT SOUS CET ÉCRAN ───────────────────────────────────────────
 * Le web lit `certificate_lookups` DIRECTEMENT dans Firestore par le SDK, sous une règle
 * `allow read: if true`. L'application native n'a aucun SDK Firebase (AD-10), et les
 * dix-neuf vues du contrat exigeaient TOUTES une session — alors qu'un certificat se vérifie
 * par quelqu'un qui n'a pas de compte. Il a donc fallu : un niveau `aucune` au vocabulaire du
 * contrat, un handler public dans le Worker, son inscription au registre et dans les DEUX
 * listes `MIGRATED`, et une branche dans `LectureDeVue` pour que la lecture ne court-circuite
 * plus sur une session absente.
 *
 * ── ⭐ LE LECTEUR N'EST PAS L'APPRENANTE, ET C'EST CE QUI N'EST PAS AFFICHÉ QUI LE DIT ───
 * Ici, c'est un TIERS qui lit : un employeur, un client, un jury. Il ne connaît pas la
 * marque, ne lui doit rien, et cherche une réponse binaire. D'où l'absence de vente, de lien
 * vers le catalogue et d'invitation à créer un compte.
 *
 * ⚠️ MAIS LE TUTOIEMENT RESTE, ET C'EST UNE DÉCISION MESURÉE, PAS UN OUBLI. La page web
 * équivalente tutoie sur cette page comme sur les autres — « Colle le code figurant sur le
 * document », « Vérifie la saisie avant d'en conclure quoi que ce soit »
 * (`src/i18n/locales/fr/lms.json`, clé `verify`) — et `tests/unit/voix-tutoiement.test.ts`
 * refuse tout vouvoiement dans les catalogues français. Faire vouvoyer l'application ici
 * ferait DEUX voix pour une seule marque, sur les deux moitiés d'un même parcours.
 *
 * ── ⛔ LES TROIS RÉPONSES SONT DISTINCTES, ET C'EST LE CŒUR DE L'ÉCRAN ──────────────────
 * « authentique », « aucun certificat à ce code » et « la vérification n'a pas abouti » sont
 * TROIS choses. Les deux dernières se ressemblent à l'écran et n'ont rien à voir : une panne
 * réseau rendue en « certificat introuvable » fait conclure à un FAUX DOCUMENT. C'est le seul
 * défaut de ce chemin qui puisse coûter un emploi à quelqu'un, et c'est pour cela que l'échec
 * technique le dit en toutes lettres — ce n'est pas une réponse sur le certificat.
 *
 * Le protocole porte la distinction sans que l'écran ait à deviner : `Etat.Servie` pour le
 * document, `Etat.Vide` pour le code inconnu (`vueNulle: "sansDonnee"` au contrat),
 * `Etat.Panne` pour tout le reste.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranVerification(
    code: String?,
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    val portee = rememberCoroutineScope()
    val lecture = remember(contexte) { PorteePublique.lecture(contexte) }

    var saisie by rememberSaveable { mutableStateOf(code?.let(::codeNormalise).orEmpty()) }
    /*
     * ⚠️ `null` N'EST PAS UNE PHASE D'`Etat`, ET C'EST VOULU. Les huit phases décrivent une
     * LECTURE ; ici, tant qu'aucun code n'a été soumis, il n'y a pas de lecture du tout.
     * Écrire `Etat.NonBranche` mentirait — l'écran EST branché —, et `Etat.Vide` affirmerait
     * un verdict qu'on n'a pas demandé.
     */
    var etat by remember { mutableStateOf<Etat<CertificatPublic>?>(null) }
    var erreurDeSaisie by remember { mutableStateOf<String?>(null) }

    fun verifier(brut: String) {
        val propre = codeNormalise(brut)
        saisie = propre
        if (propre.isEmpty()) {
            /* Une saisie vide n'est pas un verdict sur un document : elle se dit sur le CHAMP,
               pas dans la zone de réponse, sinon « aucun certificat » s'afficherait pour
               quelqu'un qui n'a encore rien tapé. */
            erreurDeSaisie = "Entre le code imprimé sur le certificat."
            etat = null
            return
        }
        erreurDeSaisie = null
        etat = Etat.Charge
        portee.launch {
            /*
             * ⛔ `Appel` EST BLOQUANT, DÉLIBÉRÉMENT — la couche de données ne déclare pas
             * `kotlinx-coroutines`, qui n'arrive qu'en transitif, et « le choix du fil
             * d'exécution appartient à la couche au-dessus ». C'est ici, et c'est `IO` :
             * appelé depuis le fil principal, ce même code lèverait `NetworkOnMainThread`.
             */
            val resultat = withContext(Dispatchers.IO) {
                lecture.lire<CertificatPublic>(
                    nomDeVue = Vues.Noms.APP_VERIFIER_CERTIFICAT,
                    /*
                     * ⚠️ LA SESSION EST IGNORÉE PAR CONSTRUCTION SUR CETTE VUE : le contrat la
                     * déclare `aucune`, `Vues.SANS_SESSION` la porte, et `LectureDeVue` ne
                     * court-circuite donc pas. On passe `Anonyme` parce que c'est la vérité de
                     * cet appel — aucun jeton ne part avec lui.
                     */
                    session = Session.Anonyme,
                    params = buildJsonObject { put("code", JsonPrimitive(propre)) },
                    /* Une reprise explicite : sans `forcer`, le cache de trente secondes
                       rendrait la même réponse et le bouton « Réessayer » n'aurait rien fait. */
                    forcer = true,
                )
            }
            etat = resultat
        }
    }

    /*
     * ⭐ UN LIEN PROFOND VÉRIFIE TOUT DE SUITE. Quelqu'un qui ouvre `maxmorrys.me/verifier/MM-…`
     * a déjà fourni le code : lui redemander de toucher un bouton ajouterait un geste au seul
     * parcours du produit qui n'appartient pas à un client.
     */
    LaunchedEffect(code) {
        if (!code.isNullOrBlank()) verifier(code)
    }

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Retour",
        onRetour = onRetour,
        titre = "Vérifier un certificat",
    ) {
        Eyebrow("Contrôle public", Modifier.padding(top = 6.dp))
        Display(
            listOf("CE CERTIFICAT", "EST-IL RÉEL ?"),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )
        Body(
            "Colle le code figurant sur le document. Aucun compte n'est nécessaire, et rien "
                + "n'est enregistré sur la personne qui vérifie : la recherche interroge un "
                + "registre indexé par le code, qui ne porte ni identifiant ni adresse.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        Field(
            libelle = "Code du certificat",
            valeur = saisie,
            onChange = { brut ->
                saisie = codeNormalise(brut)
                erreurDeSaisie = null
            },
            modifier = Modifier.padding(top = 18.dp),
            /*
             * ⛔ TROIS FORMES DE CODE CIRCULENT DANS LE PRODUIT, ET UNE SEULE EST ÉMISE.
             *   · le serveur écrit « MM- » suivi de DIX caractères hexadécimaux en capitales,
             *     d'un seul tenant (`issueCertificate.ts:74`) ;
             *   · le kit dessine « MM-C7K4-9RTX-2081 » — trois groupes ;
             *   · la page web annonce « MM-0000-0000-0000 » et « Quatre groupes, séparés par
             *     des tirets » (`src/i18n/locales/fr/lms.json`, clés `codePlaceholder` et
             *     `codeHint`).
             * Les deux dernières sont fausses, et elles ne sont pas inoffensives : quelqu'un
             * qui recopie « comme indiqué » ajoute des tirets que la normalisation ne retire
             * pas, et lit « aucun certificat à ce code » sur un document authentique.
             */
            substitut = "MM-XXXXXXXXXX",
            /* La mise en capitales se fait à la FRAPPE (`codeNormalise`), pas par un réglage de
               clavier : le clavier propose, la normalisation dispose — et c'est elle qui doit
               montrer à la personne exactement la chaîne qui va partir. */
            aide = "Un seul groupe, en capitales et sans espace : « MM- » puis dix caractères.",
            erreur = erreurDeSaisie,
        )
        Button(
            libelle = if (etat is Etat.Charge) "Vérification…" else "Vérifier",
            onPress = { verifier(saisie) },
            modifier = Modifier.padding(top = 14.dp),
            ton = TonBouton.FORME,
            desactive = etat is Etat.Charge,
        )

        Reponse(
            etat = etat,
            onReprise = { verifier(saisie) },
            modifier = Modifier.padding(top = 20.dp),
        )

        EncartDeVerite(
            sourcil = "Ce que ce contrôle ne dit pas",
            texte = "Il confirme qu'un certificat a été émis sous ce code, à ce nom, pour "
                + "cette formation, à cette date. Il ne liste pas les certificats émis et ne "
                + "remonte à aucun compte : il répond à un code, et à un seul. C'est ce qui "
                + "le rend utilisable par un employeur sans exposer les titulaires.",
            modifier = Modifier.padding(top = 20.dp),
        )
    }
}

/**
 * Les cinq choses que cet écran peut avoir à dire, et pas une de plus.
 *
 * ⛔ L'ORDRE DES BRANCHES EST L'ORDRE DE LEUR GRAVITÉ, pas celui de l'énumération : la panne
 * passe avant le vide, parce que c'est elle qu'on risque de lire comme un verdict.
 */
@Composable
private fun Reponse(
    etat: Etat<CertificatPublic>?,
    onReprise: () -> Unit,
    modifier: Modifier = Modifier,
) {
    when (etat) {
        /* Rien n'a encore été demandé : l'écran n'affirme rien du tout. */
        null -> Unit

        is Etat.Servie<CertificatPublic> -> Authentique(etat.valeur, etat.provenance.asOf, modifier)

        is Etat.Panne -> Surface(Niveau.TRUTH, modifier.fillMaxWidth()) {
            Column {
                Eyebrow("La vérification n'a pas abouti")
                Body(
                    etat.motif,
                    Modifier.padding(top = 6.dp),
                    grain = GrainCorps.CHAPO,
                )
                /*
                 * ⛔ LA PHRASE QUI EMPÊCHE DE CONCLURE. Sans elle, un échec technique se lit
                 * comme « ce certificat n'existe pas » — et c'est la lecture qui coûte le plus
                 * cher de tout le produit.
                 */
                Body(
                    "Ce n'est PAS une réponse sur le certificat : rien n'a pu être contrôlé. "
                        + "Le document n'est ni confirmé ni infirmé.",
                    Modifier.padding(top = 8.dp),
                    couleur = jetons.textBody,
                )
                if (etat.reprenable) {
                    Button(
                        libelle = "Réessayer",
                        onPress = onReprise,
                        modifier = Modifier.padding(top = 12.dp),
                        ton = TonBouton.QUIET,
                    )
                }
            }
        }

        is Etat.Vide -> Surface(Niveau.FLAT, modifier.fillMaxWidth()) {
            Column {
                Eyebrow("Aucun certificat à ce code")
                Body(
                    "Ce code ne correspond à rien d'émis. Vérifie la saisie avant d'en "
                        + "conclure quoi que ce soit — un caractère de travers suffit.",
                    Modifier.padding(top = 6.dp),
                    grain = GrainCorps.CHAPO,
                )
                /* Le vide est DATÉ, comme tout ce que ce dispositif affirme : « rien sous ce
                   code » est un relevé, et un relevé porte son instant. */
                Body(
                    "Registre interrogé le ${dateLisible(etat.provenance.asOf)}.",
                    Modifier.padding(top = 8.dp),
                    couleur = jetons.textFaint,
                )
            }
        }

        /*
         * Les quatre phases restantes — attente, restauration, porte fermée, non branché — ne
         * peuvent pas survenir sur une vue publique. `SansDonnees` les rend toutes, et rendre
         * l'attente par sa FORME (des squelettes) plutôt que par un message est ce qui évite
         * que l'écran saute quand la réponse arrive.
         */
        else -> SansDonnees(
            etat = etat,
            quoi = "La vérification de ce code",
            origine = "La vue publique « ${Vues.Noms.APP_VERIFIER_CERTIFICAT} » du serveur",
            degat = "Un certificat inventé est un faux, et un faux se présente à un employeur.",
            modifier = modifier,
            hauteur = 3,
        )
    }
}

/** Le document confirmé. Les quatre champs, et rien d'autre : le registre ne porte rien d'autre. */
@Composable
private fun Authentique(
    certificat: CertificatPublic,
    releveA: String,
    modifier: Modifier = Modifier,
) {
    Surface(Niveau.HERO, modifier.fillMaxWidth(), rembourrage = 20.dp) {
        Column {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Eyebrow("Certificat authentique")
                Tag("Confirmé", TonTag.OK)
            }
            Display(
                certificat.formation,
                cran = CranDisplay.XS,
                modifier = Modifier.padding(top = 10.dp),
            )
            Text(
                text = certificat.code,
                style = Typo.code,
                color = jetons.textBody,
                modifier = Modifier.padding(top = 14.dp),
            )
            Column(Modifier.padding(top = 18.dp)) {
                DocLine("Titulaire", certificat.titulaire)
                DocLine("Émis le", dateLisible(certificat.emisLe), derniere = true)
            }
            /*
             * ⚠️ AUCUNE LIGNE « LEÇONS VALIDÉES » ICI, contrairement à l'écran du titulaire.
             * Le miroir public ne porte pas ce compte — l'émission ne l'y écrit pas — et le
             * « 47 / 47 » du kit est une valeur de maquette. La page web l'omet déjà pour
             * cette raison exacte.
             */
            Body(
                "Registre interrogé le ${dateLisible(releveA)}.",
                Modifier.padding(top = 14.dp),
                couleur = jetons.textFaint,
            )
        }
    }
}
