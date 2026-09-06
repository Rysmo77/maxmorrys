package me.maxmorrys.rysmo.ecrans.apprentissage

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.donnees.Vues
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.DocLine
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.MotSymbole
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Num
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Tag
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ds.TonTag
import me.maxmorrys.rysmo.ds.Typo
import me.maxmorrys.rysmo.ds.Wordmark
import me.maxmorrys.rysmo.ds.jetons
import me.maxmorrys.rysmo.navigation.Verification
import me.maxmorrys.rysmo.systeme.partagerUnTexte

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE CERTIFICAT — kit `NatCertificat` (`ScreensNatifApp.js:302-339`).
 *
 * ⛔ « VÉRIFIABLE », ET PAS « VÉRIFIÉ ». Le kit écrit `Tag tone="ok"` « Vérifié ». Cet écran
 * ne vérifie RIEN : il affiche ce qu'on lui passe, et une destination typée peut lui passer
 * n'importe quoi — un lien profond, une version antérieure, un appelant distrait. Ce qui rend
 * le document opposable, c'est le CODE, contrôlable par quelqu'un d'autre, ailleurs, sans
 * compte. « Vérifiable » est ce que l'application peut réellement affirmer, et la correction
 * vient du port, qui l'avait déjà faite.
 *
 * ⭐ ET LA VÉRIFICATION EST MAINTENANT À UN GESTE. Le port renvoyait vers la page web par un
 * navigateur ; ici, `Verification(code)` est une destination du produit, servie par la seule
 * vue publique du contrat. C'est aussi ce qui donne à cet écran une arête SORTANTE vers un
 * écran que seul un lien profond atteignait.
 *
 * ⛔ AUCUN REPLI SUR UN CONTENU DE DÉMONSTRATION. Le port en avait un : faute de paramètres,
 * il montait le certificat de `contenu/demo`. Un certificat rempli de valeurs d'exemple est
 * un FAUX, et un faux se montre à un employeur. Les cinq champs arrivent ensemble ou l'écran
 * dit qu'il n'a rien à montrer.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranCertificat(
    code: String,
    titulaire: String,
    formation: String,
    emisLe: String,
    lecons: Int,
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    val complet = code.isNotBlank() && titulaire.isNotBlank()
        && formation.isNotBlank() && emisLe.isNotBlank()

    if (!complet) {
        Screen(
            territoire = Territoire.FORME,
            modifier = modifier,
            retour = "Espace",
            onRetour = onRetour,
        ) {
            Display(
                listOf("AUCUN CERTIFICAT", "À AFFICHER."),
                cran = CranDisplay.SM,
                modifier = Modifier.padding(top = 10.dp),
            )
            SansDonnees(
                etat = Etat.NonBranche,
                quoi = "Ce certificat",
                origine = "La vue « ${Vues.Noms.APP_CERTIFICATS} », qui l'a émis",
                degat = "Un certificat rempli de valeurs d'exemple est un faux, et un faux se "
                    + "montre à un employeur. Les quatre champs — titulaire, formation, date, "
                    + "code — arrivent ensemble ou pas du tout.",
                modifier = Modifier.padding(top = 20.dp),
            )
        }
        return
    }

    val lien = "$SITE_PUBLIC/verifier/$code"
    /* Le PRÉNOM seul sur sa ligne : un titre d'affichage ne se replie pas, et un nom complet
       déborderait d'un écran de 360 px sans que rien ne le signale. */
    val prenom = titulaire.trim().split(" ").first()

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Espace",
        onRetour = onRetour,
        droite = {
            IconButton(
                libelle = "Partager mon certificat",
                onPress = {
                    partagerUnTexte(
                        contexte = contexte,
                        titre = "Mon certificat — $formation",
                        texte = "Mon certificat — $formation",
                        lien = lien,
                    )
                },
            ) { Icon("share", description = null, taille = 17.dp) }
        },
    ) {
        Row(
            Modifier.padding(top = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Eyebrow("Formation terminée ·")
            /*
             * ⭐ `asOf` EST LA DATE D'ÉMISSION, ET C'EST EXACT. `Num` refuse un nombre sans
             * provenance ; le port passait ici les constantes d'un fichier de démonstration,
             * c'est-à-dire exactement la fausse citation que `Num` existe pour interdire.
             *
             * Un certificat est FIGÉ À L'ÉMISSION : son contenu a été relevé ce jour-là et ne
             * bougera plus. `emisLe` n'est donc pas un pis-aller de relevé — c'est le relevé.
             */
            Num(
                valeur = dateLisible(emisLe),
                source = Vues.Noms.APP_CERTIFICATS,
                asOf = emisLe,
                taille = 11.sp,
            )
        }
        Display(
            listOf("C'EST FAIT,", "${prenom.uppercase()}."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 8.dp),
        )

        /*
         * ⚠️ LA BRILLANCE DU KIT N'EST PAS REPRISE — « le second moment scénarisé », une bande
         * claire qui traverse la carte deux fois puis plus jamais. Elle est reportée, pas
         * oubliée : elle n'a de sens que si elle se TAIT sous mouvement réduit, et le signal à
         * lire côté Android est `Settings.Global.ANIMATOR_DURATION_SCALE` (le port passait par
         * `AccessibilityInfo.isReduceMotionEnabled`, qui n'a pas d'équivalent direct en
         * Compose). Une décoration qui ignore ce réglage n'est pas une décoration ratée : elle
         * déclenche des nausées chez qui l'a activé pour cette raison.
         */
        Surface(Niveau.HERO, Modifier.padding(top = 20.dp).fillMaxWidth(), rembourrage = 20.dp) {
            Column {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Wordmark(MotSymbole.SIGNATURE, taille = 27.sp)
                    Tag("Vérifiable", TonTag.OK)
                }
                Eyebrow("Certificat de fin de formation", Modifier.padding(top = 18.dp))
                Display(formation, cran = CranDisplay.XS, modifier = Modifier.padding(top = 6.dp))
                Body(
                    "Délivré à $titulaire",
                    Modifier.padding(top = 10.dp),
                    grain = GrainCorps.CHAPO,
                )
                /*
                 * ⛔ `Typo.code`, PAS `Num`. Un code de certificat n'est pas un nombre relevé :
                 * c'est un IDENTIFIANT, et le kit lui donne une approche POSITIVE pour qu'il se
                 * lise caractère par caractère au moment de le recopier. `Num` exigerait une
                 * provenance qui n'aurait pas de sens ici — le code ne se mesure pas.
                 */
                Text(
                    text = code,
                    style = Typo.code,
                    color = jetons.textBody,
                    modifier = Modifier.padding(top = 14.dp),
                )
            }
        }

        Button(
            libelle = "Partager mon certificat",
            onPress = {
                partagerUnTexte(
                    contexte = contexte,
                    titre = "Mon certificat — $formation",
                    texte = "Mon certificat — $formation",
                    lien = lien,
                )
            },
            modifier = Modifier.padding(top = 18.dp),
            ton = TonBouton.FORME,
            glypheTete = "share",
        )
        Body(
            "Ce qui part est le lien de vérification, pas une image.",
            Modifier.padding(top = 10.dp).fillMaxWidth(),
            grain = GrainCorps.CHAPO,
            couleur = jetons.textFaint,
        )

        /*
         * ⭐ L'ARÊTE QUI MANQUAIT. Le kit ne dessine aucun écran de vérification, et le lien
         * profond `/verifier` — déclaré `autoVerify` des deux côtés — n'avait donc pas de
         * destination. Elle en a une, et elle est atteignable d'ici : le titulaire peut
         * contrôler lui-même ce que verra la personne à qui il envoie le lien.
         */
        Button(
            libelle = "Vérifier ce certificat",
            onPress = { onAller(Verification(code)) },
            modifier = Modifier.padding(top = 10.dp),
            ton = TonBouton.QUIET,
            glypheQueue = "forward",
        )

        EncartDeVerite(
            sourcil = "Ce que ce code prouve",
            texte = "Les leçons ont été recomptées côté serveur au moment de l'émission. Ce "
                + "n'est pas une image : c'est un enregistrement que ton futur employeur "
                + "contrôle lui-même, sans compte et sans passer par cette application.",
            modifier = Modifier.padding(top = 18.dp),
        )

        Surface(Niveau.FLAT, Modifier.padding(top = 12.dp).fillMaxWidth(), rembourrage = 17.dp) {
            Column {
                DocLine("Titulaire", titulaire)
                DocLine("Émis le", dateLisible(emisLe))
                /*
                 * ⛔ `0` VEUT DIRE « NON RELEVÉ », ET LE CONTRAT LE DIT : les certificats émis
                 * avant le correctif du 05/09/2026 n'ont pas ce compte, et il ne s'invente pas.
                 * `Num` rend alors son repli — jamais un tiret, qui confondrait « c'est zéro »
                 * et « je ne sais pas ». Écrire « 0 / 0 » sur un diplôme serait la pire des
                 * deux lectures.
                 */
                DocLineComptee(lecons, emisLe)
            }
        }
    }
}

/** La ligne « Leçons validées », qui refuse de compter ce qui n'a pas été compté. */
@Composable
private fun DocLineComptee(lecons: Int, emisLe: String) {
    Row(
        Modifier.fillMaxWidth().padding(top = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Body("Leçons validées", grain = GrainCorps.CHAPO)
        Num(
            valeur = if (lecons > 0) "$lecons / $lecons" else null,
            source = Vues.Noms.APP_CERTIFICATS,
            asOf = emisLe,
            repli = "non relevé à l'émission",
            taille = 13.5.sp,
        )
    }
}
