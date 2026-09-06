package me.maxmorrys.rysmo.atelier

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.ds.AppleMark
import me.maxmorrys.rysmo.ds.Avatar
import me.maxmorrys.rysmo.ds.BandeClub
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Breadcrumb
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.ChatBubble
import me.maxmorrys.rysmo.ds.CheckLine
import me.maxmorrys.rysmo.ds.ChipRow
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.donnees.CodeErreur
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Provenance
import me.maxmorrys.rysmo.donnees.SensDuVide
import me.maxmorrys.rysmo.donnees.Source
import me.maxmorrys.rysmo.ds.DispositionChips
import me.maxmorrys.rysmo.ds.DocLine
import me.maxmorrys.rysmo.ds.EmptyState
import me.maxmorrys.rysmo.ds.EntreeSubNav
import me.maxmorrys.rysmo.ds.EtatLecon
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Fab
import me.maxmorrys.rysmo.ds.Field
import me.maxmorrys.rysmo.ds.FormatMedia
import me.maxmorrys.rysmo.ds.GoogleMark
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.LessonRow
import me.maxmorrys.rysmo.ds.Locuteur
import me.maxmorrys.rysmo.ds.LogoMark
import me.maxmorrys.rysmo.ds.MediaCard
import me.maxmorrys.rysmo.ds.Mesh
import me.maxmorrys.rysmo.ds.Metrique
import me.maxmorrys.rysmo.ds.MiniPlayer
import me.maxmorrys.rysmo.ds.Mode
import me.maxmorrys.rysmo.ds.MotSymbole
import me.maxmorrys.rysmo.ds.NavBar
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.Onglet
import me.maxmorrys.rysmo.ds.PayOption
import me.maxmorrys.rysmo.ds.PillButton
import me.maxmorrys.rysmo.ds.Pipeline
import me.maxmorrys.rysmo.ds.Plateforme
import me.maxmorrys.rysmo.ds.PoseCarte
import me.maxmorrys.rysmo.ds.PriceBlock
import me.maxmorrys.rysmo.ds.ProgressBar
import me.maxmorrys.rysmo.ds.QuotaMeter
import me.maxmorrys.rysmo.ds.RysmoTheme
import me.maxmorrys.rysmo.ds.RysmoThemeBrut
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Segmented
import me.maxmorrys.rysmo.ds.Skeleton
import me.maxmorrys.rysmo.ds.StatTile
import me.maxmorrys.rysmo.ds.StepDots
import me.maxmorrys.rysmo.ds.SubNav
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Switch
import me.maxmorrys.rysmo.ds.TabBar
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.TailleBouton
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TerritoireCarte
import me.maxmorrys.rysmo.ds.TerritoryCard
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.TonCoche
import me.maxmorrys.rysmo.ds.TonTag
import me.maxmorrys.rysmo.ds.Wordmark
import me.maxmorrys.rysmo.ds.jetons

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA PLANCHE DE VÉRIFICATION.
 *
 * ⛔ ELLE VIT DANS `src/debug/`, ET C'EST LA MOITIÉ DU POINT.
 *
 * Le port React Native livrait sa planche d'atelier DANS LE PAQUET : elle avait sa route,
 * ses données d'exemple et son entrée de menu, et la porte censée l'attraper regardait
 * ailleurs. Une planche qui atteint la production n'est pas seulement du poids mort — c'est
 * un écran de démonstration accessible, avec des chiffres inventés dessus.
 *
 * Ici la question ne se pose plus au moment du build : Gradle ne compile pas `src/debug/`
 * pour `release`. L'arborescence tranche, pas une revue.
 *
 * Ce qu'elle sert à voir, et qu'aucun test ne dit :
 *  · que les cinq maillages rendent des CERCLES, pas des ellipses ;
 *  · que les six niveaux de verre se distinguent SANS flou ;
 *  · que la carte d'encre ouvre bien sa portée — son texte doit être clair sur une page
 *    claire, et c'est le seul endroit du produit où ça arrive ;
 *  · que les six dégradés d'action gardent leur teinte saturée en mode sombre.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
class AtelierActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent { RysmoTheme { Planche() } }
    }
}

@Composable
private fun Titre(texte: String) {
    Eyebrow(texte, modifier = Modifier.padding(top = 26.dp, bottom = 8.dp))
}

@Composable
fun Planche(modifier: Modifier = Modifier) {
    val p = jetons
    val haut = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

    /*
     * ⛔ 120 dp EN DUR NE SUFFISAIT PAS, et le défaut se voyait à l'endroit le plus
     * gênant : les deux derniers tons de bouton passaient SOUS la barre d'onglets.
     * Une planche de vérification dont on ne peut pas voir le bas ne vérifie pas le bas.
     *
     * La barre fait 80 dp (`tabbarH`), et la zone de geste s'y ajoute — elle vaut 0 sur un
     * appareil à boutons et une quarantaine de points sur un appareil à gestes. Un nombre
     * choisi à la main est juste sur l'émulateur de qui l'écrit, et faux ailleurs.
     *
     * ⚠️ `Screen`, lui, fait déjà ce calcul (`Chassis.kt`). Cette planche empile la barre
     * à la main pour pouvoir la MONTRER en même temps que le reste — c'est le seul écran
     * de l'application qui ait une raison de ne pas passer par le châssis.
     */
    val basGeste = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
    val basChrome = Metrique.tabbarH + basGeste + 24.dp
    var interrupteur by remember { mutableStateOf(true) }
    var segment by remember { mutableStateOf("Tout") }
    var pilule by remember { mutableStateOf("Audio") }
    var champ by remember { mutableStateOf("") }
    var paiement by remember { mutableStateOf("Wave") }
    var onglet by remember { mutableStateOf("Fil") }

    Box(modifier.fillMaxSize().background(p.surfacePage)) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = haut, bottom = basChrome),
        ) {
            /* ── 1 · Les cinq maillages, en vignettes carrées ───────────────────────── */
            Titre("1 · Maillage — cinq territoires, quinze lobes")
            Body(
                "Chaque lobe est un CERCLE de 460 dp, flouté par le profil erfc du kit. "
                    + "Les teintes sont fixes : elles ne basculent pas la nuit.",
                grain = GrainCorps.CHAPO,
            )
            Row(
                Modifier.padding(top = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Territoire.entries.forEach { t ->
                    Box(Modifier.weight(1f).height(96.dp)) { Mesh(t) }
                }
            }

            /* ── 2 · Les six niveaux de verre ───────────────────────────────────────── */
            Titre("2 · Surface — six niveaux, sans flou sur Android")
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Niveau.entries.forEach { n ->
                    Surface(n, Modifier.fillMaxWidth(), rembourrage = 14.dp) {
                        Column {
                            Body(n.name, grain = GrainCorps.CORPS)
                            /* ⛔ Sur `INK`, ce texte doit être CLAIR alors que la page est
                               claire : c'est la portée que le niveau ouvre. S'il est sombre,
                               le fournisseur est lu depuis le mauvais composable. */
                            Body("Encre de la portée courante", grain = GrainCorps.CHAPO)
                        }
                    }
                }
            }

            /* ── 3 · Typographie ────────────────────────────────────────────────────── */
            Titre("3 · Typographie — Fraunces, Schibsted, JetBrains Mono")
            Display("Display XS", cran = CranDisplay.XS)
            Display("Display SM", cran = CranDisplay.SM)
            Body("Corps 15 sp, interligne 1,45.")
            Body("Chapô 14 sp, en encre atténuée.", grain = GrainCorps.CHAPO)
            Body("Prose 15,5 sp, bornée à 68 caractères de large.", grain = GrainCorps.PROSE)
            Eyebrow("Sourcil monospace")
            Row(
                Modifier.padding(top = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.Bottom,
            ) {
                Num("1 240", source = "planche d'atelier", asOf = "2026-09-05", taille = 27.sp)
                /* Le repli : `null` ne rend PAS un tiret. */
                Num(null, source = "planche d'atelier", asOf = "2026-09-05")
            }

            /* ── 4 · Actions ────────────────────────────────────────────────────────── */
            Titre("4 · Button — huit tons, deux tailles")
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                TonBouton.entries.forEach { t ->
                    Button(t.name.lowercase(), {}, ton = t, glypheQueue = "forward")
                }
                Button("désactivé", {}, desactive = true)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button("petit", {}, taille = TailleBouton.SM, ton = TonBouton.GHOST)
                    Button("petit plein", {}, taille = TailleBouton.SM, ton = TonBouton.QUIET)
                }
            }
            Row(
                Modifier.padding(top = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton("Notifications", {}, pastille = true) {
                    Icon("bell", description = null, taille = 18.dp)
                }
                IconButton("Chercher", {}) { Icon("search", description = null, taille = 17.dp) }
                IconButton("Éteint", null, desactive = true) {
                    Icon("lock", description = null, taille = 17.dp)
                }
                PillButton("Menu", {})
            }

            /* ── 5 · Marque ─────────────────────────────────────────────────────────── */
            Titre("5 · Marque")
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Wordmark(MotSymbole.RYSMO, taille = 26.sp)
                Wordmark(MotSymbole.SIGNATURE, taille = 22.sp)
            }
            Row(
                Modifier.padding(top = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                LogoMark(taille = 44.dp)
                LogoMark(taille = 44.dp, pastille = false)
                GoogleMark()
                AppleMark()
            }

            /* ── 6 · Icônes ─────────────────────────────────────────────────────────── */
            Titre("6 · Icon — 109 glyphes, générés depuis icons.ts")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf("back", "search", "lock", "check", "play", "alert", "star", "dots", "bell")
                    .forEach { Icon(it, description = null) }
            }

            /* ── 7 · Formulaires ────────────────────────────────────────────────────── */
            Titre("7 · Formulaires")
            Field("Repos", champ, { champ = it }, substitut = "Ton adresse", aide = "On ne la partage pas.")
            Field("Erreur", "adresse@", {}, erreur = "Il manque le domaine.")
            Row(
                Modifier.padding(top = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Switch(interrupteur, { interrupteur = !interrupteur }, libelle = "Notifications")
                Switch(false, {}, libelle = "Inactif")
                Switch(true, {}, desactive = true, libelle = "Éteint")
            }
            Segmented(
                listOf("Tout", "Audio", "Vidéo"),
                segment,
                { segment = it },
                Modifier.padding(top = 14.dp),
            )
            ChipRow(
                listOf("Audio", "Vidéo", "Article", "Atelier"),
                pilule,
                { pilule = it },
                Modifier.padding(top = 12.dp),
                disposition = DispositionChips.SCROLL,
            )
            Column(
                Modifier.padding(top = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                listOf("Wave", "Orange Money").forEach {
                    PayOption(it, paiement == it, { paiement = it }, logo = it.take(1), note = "Sénégal")
                }
            }
            StepDots(3, 2, Modifier.padding(top = 14.dp))

            /* ── 8 · Données ────────────────────────────────────────────────────────── */
            Titre("8 · Données")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TonTag.entries.forEach { Tag(it.name.lowercase(), it) }
            }
            Column(Modifier.padding(top = 12.dp)) {
                LessonRow("Leçon terminée", etat = EtatLecon.DONE, meta = "07:12")
                LessonRow("Leçon en cours", etat = EtatLecon.CURRENT, meta = "12:40")
                LessonRow("Leçon à faire", etat = EtatLecon.TODO, meta = "05:00", derniere = true)
            }
            ProgressBar(0.62f, Modifier.padding(top = 14.dp))
            QuotaMeter(3, Modifier.padding(top = 12.dp), libelle = "3 / 5 aujourd'hui")
            Row(
                Modifier.padding(top = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Avatar("MM")
                Avatar("AB", taille = 32.dp)
            }
            Column(
                Modifier.padding(top = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                ChatBubble(Locuteur.IA) { Body("Une bulle du répétiteur.") }
                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                    ChatBubble(Locuteur.MOI) { Body("Une bulle à moi, sur dégradé.") }
                }
                ChatBubble(Locuteur.IA, saisie = true)
            }
            CheckLine(ton = TonCoche.VIOLET) { Body("Un engagement dû.") }
            CheckLine(ton = TonCoche.OK) { Body("Un engagement tenu.") }
            CheckLine(ton = TonCoche.NEUTRE, tiret = true) { Body("Un renvoi, jamais une croix.") }
            Column(Modifier.padding(top = 12.dp)) {
                DocLine("Référence", "MM-2026-0042")
                DocLine("Émis le", "05/09/2026", derniere = true)
            }
            PriceBlock(
                "45 000",
                source = "planche d'atelier",
                asOf = "2026-09-05",
                barre = "60 000",
                note = "Paiement en trois fois possible.",
                modifier = Modifier.padding(top = 14.dp),
            )
            Row(
                Modifier.padding(top = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                StatTile("Membres", "128", "planche", "2026-09-05", Modifier.weight(1f))
                StatTile("Revenus", null, "planche", "2026-09-05", Modifier.weight(1f))
            }
            MediaCard(
                titre = "Vendre sans budget pub",
                modifier = Modifier.padding(top = 14.dp),
                format = FormatMedia.AUDIO,
                sourcil = "Podcast · gratuit",
                corps = "L'onde dit que c'est du son ; le cadre 16:9 dirait que c'est une vidéo.",
                couts = listOf("34:20", "12 Mo"),
                badge = "Aperçu · 4 min",
                onLecture = {},
            )
            MediaCard(
                titre = "Une vidéo",
                modifier = Modifier.padding(top = 12.dp),
                format = FormatMedia.VIDEO,
                sourcil = "Vidéo",
                onLecture = {},
            )

            /* ── 9 · Surfaces ───────────────────────────────────────────────────────── */
            Titre("9 · TerritoryCard — la signature du système")
            Column(Modifier.padding(top = 20.dp)) {
                TerritoireCarte.entries.forEachIndexed { i, t ->
                    TerritoryCard(
                        territoire = t,
                        pose = PoseCarte.STACK,
                        premiere = i == 0,
                        meta = "TERRITOIRE",
                        titre = t.name,
                        grand = "0${i + 1}",
                        libelleGrand = "carte",
                    )
                }
            }
            Titre("10 · Skeleton, EmptyState, SansDonnees")
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Skeleton()
                Skeleton(largeur = 180.dp)
                Skeleton(hauteur = 40.dp)
            }
            EmptyState(
                titre = "RIEN ICI, POUR L'INSTANT.",
                glyphe = "inbox",
                corps = "Un écran vide est une invitation à agir.",
                action = { Button("Commencer", {}) },
            )
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SansDonnees(Etat.Charge, "Le fil", "Firestore", "—")
                SansDonnees(Etat.Anonyme, "Tes notes", "Ton compte", "Afficher des notes vides ferait croire qu'il n'y en a pas.")
                /* ⛔ LES DEUX PANNES SONT MONTRÉES ENSEMBLE, ET C'EST LE POINT DE CETTE
                   PLANCHE. Le port React Native posait `reessayer = {}` sur la panne de
                   configuration : l'écran offrait « Réessayer » et le geste ne faisait
                   RIEN. Ici la panne non reprenable n'affiche pas de bouton — et une panne
                   reprenable sans reprise fournie n'en affiche pas non plus. */
                SansDonnees(
                    Etat.Panne("Le réseau n'a pas répondu.", CodeErreur.UNAVAILABLE, reprenable = true),
                    "Le catalogue", "L'API des formations",
                    "Servir un cache muet ferait passer une panne pour un catalogue vide.",
                    reprise = {},
                )
                SansDonnees(
                    Etat.Panne("L'application n'est pas configurée.", CodeErreur.INTERNAL, reprenable = false),
                    "Le catalogue", "L'API des formations",
                    "Un bouton qui ne peut rien reprendre est un contrôle mort.",
                    reprise = {},
                )
                SansDonnees(
                    Etat.Vide(Provenance(Source.SERVEUR, "2026-09-05"), SensDuVide.SANS_DONNEE),
                    "Tes certificats", "Le serveur", "—",
                )
            }

            /* ── 11 · Navigation secondaire ─────────────────────────────────────────── */
            Titre("11 · SubNav, Pipeline, Breadcrumb")
            SubNav(
                listOf(
                    EntreeSubNav("Écouter & regarder"),
                    EntreeSubNav("Le Club", jetons.mmViolet),
                ),
                "Écouter & regarder",
                {},
            )
            /* ⛔ `Pipeline` vit sur une surface NUIT : on le montre dans sa portée. */
            Surface(Niveau.INK, Modifier.padding(top = 12.dp).fillMaxWidth(), rembourrage = 14.dp) {
                Column {
                    Pipeline(listOf("Reçu", "Qualifié", "Devis", "Signé"), "Qualifié", {})
                    Breadcrumb(
                        listOf("Console", "Dossiers", "MM-0042"),
                        Modifier.padding(top = 10.dp),
                    )
                }
            }

            /* ── 12 · Chrome ────────────────────────────────────────────────────────── */
            Titre("12 · NavBar et BandeClub")
            Surface(Niveau.FLAT, Modifier.fillMaxWidth()) {
                NavBar(retour = "l'accueil", onRetour = {}, titre = "Un titre de barre") {
                    IconButton("Chercher", {}) { Icon("search", description = null, taille = 17.dp) }
                }
            }
            BandeClub(onglet, { onglet = it }, Modifier.padding(top = 12.dp), verrou = true)
            MiniPlayer(
                titre = "Vendre sans budget pub",
                position = "08:12",
                duree = "34:20",
                enLecture = true,
                onPress = {},
                onBascule = {},
                modifier = Modifier.padding(top = 12.dp),
            )

            Spacer(Modifier.height(24.dp))
        }

        /* Le bouton flottant et la barre d'onglets, à leur vraie place. */
        Box(
            Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 18.dp, bottom = Metrique.tabbarH + basGeste + 18.dp),
        ) {
            Fab("Écrire une note", {}, Territoire.FORME) {
                Icon("plus", description = null, taille = 22.dp, epaisseur = 2.6f)
            }
        }
        Box(Modifier.align(Alignment.BottomCenter)) {
            TabBar(
                onglets = listOf(
                    Onglet("Accueil", "home"),
                    Onglet("Cours", "book"),
                    Onglet("Club", "users"),
                    Onglet("Médias", "bars"),
                    Onglet("Moi", "user"),
                ),
                actif = "Accueil",
                onSelect = {},
            )
        }
    }
}

/* ═══ LES APERÇUS — ils ne compilent QUE dans la variante debug ═══════════════════════ */

@Preview(name = "Planche · clair", heightDp = 2400, showBackground = true)
@Composable
private fun ApercuPlancheClaire() {
    RysmoThemeBrut(Mode.CLAIR, Plateforme(estAndroid = true, flouOk = false)) { Planche() }
}

@Preview(name = "Planche · sombre", heightDp = 2400, showBackground = true)
@Composable
private fun ApercuPlancheSombre() {
    RysmoThemeBrut(Mode.SOMBRE, Plateforme(estAndroid = true, flouOk = false)) { Planche() }
}

/**
 * ⚠️ LE MÊME ÉCRAN, EN CHÂSSIS iOS. Il n'y a pas de simulateur ici : cet aperçu est le seul
 * endroit d'où l'on voit que la barre haute passe à 44 dp et que son titre se centre.
 */
@Preview(name = "NavBar · les deux châssis", showBackground = true)
@Composable
private fun ApercuNavBar() {
    Column {
        RysmoThemeBrut(Mode.CLAIR, Plateforme(estAndroid = true, flouOk = false)) {
            Box(Modifier.background(jetons.surfacePage)) {
                NavBar(retour = "l'accueil", onRetour = {}, titre = "Android · 64 dp")
            }
        }
        RysmoThemeBrut(Mode.CLAIR, Plateforme(estAndroid = false, flouOk = true)) {
            Box(Modifier.background(jetons.surfacePage)) {
                NavBar(retour = "Accueil", onRetour = {}, titre = "iOS · 44 dp")
            }
        }
    }
}

@Preview(name = "Maillage · les cinq", heightDp = 400, showBackground = true)
@Composable
private fun ApercuMaillages() {
    RysmoThemeBrut(Mode.CLAIR, Plateforme(estAndroid = true, flouOk = false)) {
        Row(Modifier.fillMaxSize()) {
            Territoire.entries.forEach { t ->
                Box(Modifier.weight(1f).fillMaxSize()) { Mesh(t) }
            }
        }
    }
}

@Preview(name = "Verre · six niveaux, deux modes", heightDp = 700, showBackground = true)
@Composable
private fun ApercuVerre() {
    Row {
        listOf(Mode.CLAIR, Mode.SOMBRE).forEach { m ->
            RysmoThemeBrut(m, Plateforme(estAndroid = true, flouOk = false)) {
                Box(Modifier.width(190.dp).background(jetons.surfacePage)) {
                    Column(
                        Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Niveau.entries.forEach { n ->
                            Surface(n, Modifier.fillMaxWidth(), rembourrage = 12.dp) {
                                Body(n.name, grain = GrainCorps.CORPS)
                            }
                        }
                    }
                }
            }
        }
    }
}
