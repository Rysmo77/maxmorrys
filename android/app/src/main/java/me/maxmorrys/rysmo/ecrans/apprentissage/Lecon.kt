package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.LeconLigneEtat
import me.maxmorrys.rysmo.donnees.Session
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.ChipRow
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.DispositionChips
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ecrans.LocalSession
import me.maxmorrys.rysmo.ecrans.vue
import me.maxmorrys.rysmo.navigation.Notes
import me.maxmorrys.rysmo.donnees.Lecon as VueLecon

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE LECTEUR DE LEÇON — kit `NatLecteur` (`ScreensNatifApp.js:191-245`).
 *
 * ⛔ IL N'Y A PAS DE LECTEUR, ET L'ÉCRAN LE DIT AU LIEU D'EN DESSINER UN.
 *
 * Trois faits mesurés, qui vont dans le même sens :
 *
 *   1 · La vidéo de leçon N'EST PAS UN FICHIER. `Lesson.videoUrl` est rendue par le web dans
 *       un `<iframe>` hébergé ailleurs (`constat-hors-ligne.md` § 1). Il n'y a rien à lire, ni
 *       à télécharger, ni à mettre en cache.
 *   2 · `media3-exoplayer` et `media3-session` sont au catalogue de versions et ABSENTS des
 *       dépendances (`spec-ecrans-natif.md` § F.4). Aucun lecteur ne peut être instancié.
 *   3 · Le port React Native avait quand même dessiné le bloc : bouton de lecture `disabled`,
 *       ronds « −15 » et « +15 » sans action « par construction », téléchargement `disabled`,
 *       et deux horodatages de maquette qui passaient par `<Num>` — c'est-à-dire qui se
 *       présentaient comme des valeurs relevées. Quatre contrôles morts sur un seul écran.
 *
 * Un rectangle dégradé avec un rond de lecture au milieu qui ne lit rien n'est pas « la mise
 * en page en attendant » : c'est un bouton mort de 62 px, au centre de l'écran, sur le geste
 * principal du produit.
 *
 * ── LES QUATRE VUES DU KIT SONT CONSERVÉES, ET ELLES FONT QUELQUE CHOSE ─────────────────
 * `Vidéo · Transcription · Mes notes · Ressources`. « Mes notes » est un ÉCRAN et non un
 * panneau — les notes survivent à la leçon et se cherchent d'un cours à l'autre —, les trois
 * autres changent ce qui est rendu ici. Aucune n'est décorative.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
private val VUES_DE_LECON = listOf("Vidéo", "Transcription", "Mes notes", "Ressources")

@Composable
fun EcranLecon(
    slug: String,
    leconId: String?,
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
    session: Session = LocalSession.current,
) {
    /* `rememberSaveable` : la vue choisie survit à une rotation ou à un retour en arrière du
       système, ce qu'un `remember` seul ne fait pas. */
    var vueChoisie by rememberSaveable { mutableStateOf(VUES_DE_LECON.first()) }

    /*
     * ═══════════════════════════════════════════════════════════════════════════════════
     * ⛔ `formationId` N'EST PAS PASSÉ, ET C'EST UNE CONTRADICTION MESURÉE ENTRE LA
     * NAVIGATION ET LE CONTRAT — pas une négligence.
     *
     * `appLecon` accepte un `formationId` OPTIONNEL, et c'est l'IDENTIFIANT DE DOCUMENT de la
     * formation : le serveur cherche `inscriptions.find { it.formationId == <param> }`
     * (`lecon.ts:38-39`), et `enrollments.formationId` désigne `formations/<id>`. Or cet écran
     * ne tient qu'un `slug` — `Espace.slug` et `Cours.slug` rendent tous deux le CHAMP `slug`
     * de la formation, jamais son id (`espace.ts:71`, `cours.ts:54`).
     *
     * Passer le slug ici serait le pire des trois choix : aucune inscription ne
     * correspondrait, le serveur rendrait `vue: null`, et `appLecon` étant déclarée
     * `vueNulle: "sansDonnee"`, l'écran dirait « tu n'as encore rien ici » À QUELQU'UN
     * D'INSCRIT. Un verdict faux, présenté comme une réponse.
     *
     * L'omettre laisse le serveur prendre LA DERNIÈRE INSCRIPTION TOUCHÉE. Aujourd'hui c'est
     * exactement juste : le seul geste du produit qui pousse cette destination est
     * « Reprendre » depuis l'Espace (`ecrans/Principal.kt`), et `appEspace` désigne par
     * construction cette même inscription — la plus récemment touchée. Les deux vues
     * s'accordent parce qu'elles trient sur le même champ.
     *
     * ⚠️ CE QUI RENDRAIT CECI FAUX : un second chemin vers `Lecon(slug = …)`, depuis le
     * catalogue par exemple. Il faudrait alors que la destination porte l'id — c'est-à-dire
     * que `Cours.id`, que la vue rend déjà, voyage jusqu'ici.
     * ═══════════════════════════════════════════════════════════════════════════════════
     */
    val lu = vue<VueLecon>(Vues.Noms.APP_LECON, session)
    val etat = lu.etat
    val lecon: VueLecon? = if (etat is Etat.Servie) etat.valeur else null

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Cours",
        onRetour = onRetour,
        titre = "Leçon",
        /*
         * ⛔ PAS DE BOUTON « TÉLÉCHARGER » DANS LA BARRE HAUTE. Le port en posait un, `disabled`.
         * Il n'y a rien à télécharger (§ 1 ci-dessus), et un bouton grisé sur le geste que
         * l'onboarding promet — « regarde-la dans le taxi » — est pire qu'aucun bouton : il
         * fait croire à une panne temporaire.
         */
    ) {
        Eyebrow("Ta leçon", Modifier.padding(top = 6.dp))

        /*
         * ⛔ LE TITRE ÉTAIT ÉCRIT EN DUR DANS LE PORT — `['Les mots que','tapent tes clients']`
         * (`lecon.tsx:82`), indépendant de la leçon ouverte. Toutes les leçons du produit
         * portaient donc le même titre. Il vient de `appLecon`, ou il ne vient pas.
         *
         * ⚠️ CE QUE LA VUE NOMME EST LE MODULE, PAS LA LEÇON. `Lecon` porte `moduleTitre` et
         * `programme` : le titre de la leçon ouverte vit dans SA ligne du programme, marquée
         * `current` par le serveur. On n'affiche donc pas le titre du module comme s'il était
         * celui de la leçon — ce sont deux objets, et les confondre ferait annoncer « Vendre
         * en ligne » là où on regarde « Écrire une fiche produit ».
         */
        val ligneCourante = lecon?.programme?.firstOrNull { it.etat == LeconLigneEtat.CURRENT }
        Display(
            if (ligneCourante != null) deuxLignes(ligneCourante.titre) else listOf("LA LEÇON."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )
        if (lecon?.moduleTitre != null) {
            Eyebrow(lecon.moduleTitre, Modifier.padding(top = 10.dp))
        }

        ChipRow(
            options = VUES_DE_LECON,
            valeur = vueChoisie,
            onChange = { choix ->
                /* « Mes notes » est un ÉCRAN, pas un panneau : une note prise en leçon 5 sert
                   encore six mois après, quand la formation est finie. */
                if (choix == "Mes notes") onAller(Notes(leconId)) else vueChoisie = choix
            },
            modifier = Modifier.padding(top = 16.dp),
            hauteur = 36.dp,
            disposition = DispositionChips.SCROLL,
        )

        when (vueChoisie) {
            "Transcription" -> Surface(
                Niveau.FLAT,
                Modifier.padding(top = 16.dp).fillMaxWidth(),
                rembourrage = 18.dp,
            ) {
                Column {
                    Eyebrow("La transcription")
                    Body(
                        "Elle se lit sans charger la vidéo, et elle reste lisible quand le "
                            + "réseau lâche au milieu. C'est elle qui rend une coupure "
                            + "supportable.",
                        Modifier.padding(top = 8.dp),
                        grain = GrainCorps.CHAPO,
                    )
                    /*
                     * ⛔ CETTE PHRASE DÉCRIT UNE INTENTION, PAS UN ÉTAT. La transcription
                     * n'arrive dans aucune vue du contrat : `Lecon` porte `moduleTitre` et
                     * `programme`, rien d'autre. Le dire ici plutôt que d'afficher un texte
                     * d'exemple est la différence entre une promesse et une maquette.
                     */
                    SansDonnees(
                        etat = Etat.NonBranche,
                        quoi = "Le texte de la transcription",
                        origine = "Aucune vue du contrat ne la rend — « ${Vues.Noms.APP_LECON} » "
                            + "porte le module et le programme, pas le texte",
                        degat = "Une transcription inventée mettrait dans la bouche du cours "
                            + "des phrases qu'il ne dit pas, et c'est le seul repli hors "
                            + "connexion que le produit promet.",
                        modifier = Modifier.padding(top = 14.dp),
                        hauteur = 4,
                    )
                }
            }

            "Ressources" -> SansDonnees(
                etat = Etat.NonBranche,
                quoi = "Les ressources de la leçon",
                origine = "La vue « ${Vues.Noms.APP_LECON} » marque une ligne `doc`, mais aucun "
                    + "fichier n'a d'adresse dans le contrat",
                degat = "Un PDF listé avec un poids qu'on n'a pas mesuré décide à la place de "
                    + "quelqu'un de charger maintenant ou d'attendre le Wi-Fi.",
                modifier = Modifier.padding(top = 16.dp),
                hauteur = 2,
            )

            else -> SansDonnees(
                etat = Etat.NonBranche,
                quoi = "La lecture de la vidéo",
                origine = "Aucun hébergeur de vidéo n'est choisi — le web la rend dans un "
                    + "`iframe` tiers, et ni `media3-exoplayer` ni `media3-session` ne sont "
                    + "en dépendance",
                degat = "Un bouton de lecture qui ne lit rien est le contrôle mort le plus "
                    + "cher du produit : il occupe le centre de l'écran, sur son geste "
                    + "principal. Le port en avait dessiné un, `disabled`.",
                modifier = Modifier.padding(top = 16.dp),
                hauteur = 4,
            )
        }

        /* Le module est déjà nommé sous le titre ; ce sourcil-ci annonce la LISTE. */
        Eyebrow("Le programme", Modifier.padding(top = 22.dp))
        if (lecon != null) {
            Surface(
                Niveau.FLAT,
                Modifier.padding(top = 10.dp).fillMaxWidth(),
                rembourrage = 16.dp,
            ) {
                Column {
                    lecon.programme.forEachIndexed { rang, ligne ->
                        /* ⛔ LA CLÉ EST L'IDENTIFIANT DE LA LEÇON. Deux leçons peuvent porter
                           le même titre dans deux modules, et `key = titre` ferait s'effondrer
                           l'une sur l'autre — c'est le défaut qu'a déjà connu ce dépôt sur les
                           publications d'auteurs homonymes. */
                        key(ligne.id) {
                            LessonRow(
                                titre = ligne.titre,
                                etat = etatDeLigne(ligne.etat),
                                meta = ligne.meta,
                                derniere = rang == lecon.programme.lastIndex,
                                /* Une ressource écrite se lit sans réseau ; le dire change la
                                   décision de quelqu'un qui n'a plus de forfait. */
                                queue = { if (ligne.doc) Tag("Document") },
                                /*
                                 * ⛔ UNE LIGNE NE S'OUVRE PAS, ET C'EST LE CONTRAT QUI LE DIT.
                                 * `appLecon` ne prend AUCUN identifiant de leçon : elle sert
                                 * toujours le module en cours de l'inscription. Rendre les
                                 * lignes pressables pousserait un écran identique à celui-ci,
                                 * autant de fois qu'il y a de leçons — un contrôle qui a l'air
                                 * vivant et ne mène nulle part.
                                 */
                            )
                        }
                    }
                }
            }
            /*
             * ⛔ NI BARRE DE PROGRESSION NI POURCENTAGE, ET LA RAISON A CHANGÉ DE NATURE.
             * `appLecon` ne rend aucun compte : ni total, ni fait. Le pourcentage vit dans
             * `appEspace`, qui décrit LA DERNIÈRE INSCRIPTION TOUCHÉE — la même qu'ici tant
             * qu'un seul chemin pousse cet écran, mais rien dans les deux réponses ne permet
             * de le VÉRIFIER : `Lecon` ne porte pas de slug à comparer à `Espace.slug`. Une
             * barre tirée d'une vue qu'on ne peut pas apparier à celle-ci afficherait la
             * progression d'une autre formation le jour où le second chemin existera.
             */
            Body(
                "Le programme est celui du module en cours. Le pourcentage du kit n'est pas "
                    + "dessiné : il vient d'une autre vue, et rien ici ne permet de vérifier "
                    + "qu'elle parle bien de cette formation.",
                Modifier.padding(top = 10.dp),
                grain = GrainCorps.CHAPO,
            )
        } else {
            SansDonnees(
                etat = etat,
                quoi = "Le programme du module et ta progression",
                origine = "La vue « ${Vues.Noms.APP_LECON} » du serveur, pour la formation "
                    + "« $slug »",
                degat = "Une leçon inventée est une leçon qu'on croit avoir à regarder, et son "
                    + "poids en mégaoctets déciderait de charger ou pas, sur un forfait compté.",
                modifier = Modifier.padding(top = 10.dp),
                hauteur = 5,
                reprise = lu.reprendre,
            )
        }

        EncartDeVerite(
            sourcil = "Ce que cet écran ne fait pas encore",
            texte = "Cocher une leçon s'écrit par « marquerLecon », qui existe côté serveur et "
                + "n'a pas encore de chemin depuis ici. Tant que la coche n'est pas branchée, "
                + "elle n'est pas dessinée : une coche qui revient en arrière au prochain "
                + "lancement fait douter de tout le reste.",
            modifier = Modifier.padding(top = 14.dp),
        )
    }
}

/**
 * L'état d'une ligne du programme, traduit dans celui du design system.
 *
 * ⛔ `INCONNU` NE DEVIENT PAS `TODO`. C'est le repli que le contrat pose pour qu'une valeur
 * ajoutée côté serveur ne fasse pas tomber une version déjà installée ; la traduire en « à
 * faire » affirmerait un état qu'on n'a pas compris. `PLAIN` ne dessine aucune pastille — la
 * ligne se lit, elle ne se prononce pas.
 */
private fun etatDeLigne(etat: LeconLigneEtat): EtatLecon = when (etat) {
    LeconLigneEtat.DONE -> EtatLecon.DONE
    LeconLigneEtat.CURRENT -> EtatLecon.CURRENT
    LeconLigneEtat.TODO -> EtatLecon.TODO
    LeconLigneEtat.INCONNU -> EtatLecon.PLAIN
}
