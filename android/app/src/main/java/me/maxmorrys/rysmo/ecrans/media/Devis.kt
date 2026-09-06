package me.maxmorrys.rysmo.ecrans.media

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.Icon
import me.maxmorrys.rysmo.ds.IconButton
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.ecrans.apprentissage.SITE_PUBLIC
import me.maxmorrys.rysmo.systeme.aOuvert
import me.maxmorrys.rysmo.systeme.ouvrirUneAdresse
import me.maxmorrys.rysmo.systeme.partagerUnTexte

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LE DEVIS — kit `NatDevis` (`ScreensNatifMedia.js:298-330`).
 *
 * ⛔ AUCUNE VUE DU CONTRAT NE SERT UN DEVIS, ET CE N'EST PAS UN OUBLI DE BRANCHEMENT.
 * Les vingt vues natives sont énumérées dans le contrat ; aucune ne s'appelle `appDevis` ni
 * n'accepte une référence de devis. Côté web, la page lit le document DIRECTEMENT dans la
 * base (`getAgencyQuote`), ce qu'aucun code Kotlin ne peut faire ici : le projet Android ne
 * déclare aucune dépendance à cette base — pas de client, pas de règles, pas de session.
 *
 * ⚠️ LA CONSÉQUENCE EST QU'UN DEVIS NE SE LIT PAS DANS L'APPLICATION AUJOURD'HUI. L'écran ne
 * fabrique donc ni lignes, ni montant, ni dates : il porte la RÉFÉRENCE — qui est vraie, elle
 * vient de la personne — et il ouvre le document là où il est servi. Ce n'est pas une
 * dégradation cosmétique : un devis d'exemple serait un document commercial inventé, avec des
 * prestations et un prix, montré à quelqu'un qui s'apprête à signer.
 *
 * ── ⛔ ET DEUX PHRASES DU KIT NE SONT PAS VRAIES ────────────────────────────────────────
 *
 * 1 · L'ADRESSE. Le kit écrit `maxmorrys.me/devis/MM-D-4831`. Le site ne sert pas ce chemin
 *     — il sert `presence-digitale/devis/<référence>` — et `MM-D-4831` n'a pas la forme
 *     d'une référence : la validation exige `DV-` suivi de douze caractères hexadécimaux.
 *     Recopiée, cette adresse serait un lien mort imprimé sur un document commercial.
 *
 * 2 · « FIGÉ À L'ÉMISSION ». Le kit en fait son encart de vérité ; la page web qui rend ce
 *     document dit le contraire d'elle-même, noir sur blanc : elle recalcule les totaux
 *     depuis la grille COURANTE à chaque ouverture. Les deux ne peuvent pas être vrais en
 *     même temps, et c'est la copie qui doit s'aligner sur le code, pas l'inverse. L'encart
 *     ci-dessous dit donc ce qui se passe réellement.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
@Composable
fun EcranDevis(
    code: String,
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    var adresseOrpheline by remember { mutableStateOf<String?>(null) }

    val adresse = SITE_PUBLIC + TermesDeLOffre.CHEMIN_DEVIS + code
    val formeConnue = TermesDeLOffre.FORME_REFERENCE.matches(code)

    Screen(
        territoire = Territoire.DIGITALISE,
        modifier = modifier,
        retour = "Offre",
        onRetour = onRetour,
        titre = "Ton devis",
        droite = {
            /*
             * ⭐ CE QUI PART EST UN LIEN, JAMAIS UNE CAPTURE. Un devis se transfère : le
             * destinataire doit pouvoir l'ouvrir et le lire à jour, pas regarder une image
             * de ce qu'il disait ce jour-là.
             */
            IconButton(libelle = "Partager le devis", onPress = {
                partagerUnTexte(contexte, "Mon devis Présence Digitale", adresse)
            }) {
                Icon("share", description = null, taille = 17.dp, epaisseur = 2f)
            }
        },
    ) {
        Eyebrow("Devis · consultable sans compte", Modifier.padding(top = 6.dp))
        Display(listOf("TON DEVIS."), cran = CranDisplay.SM, modifier = Modifier.padding(top = 8.dp))
        AdresseMono(adresse, Modifier.padding(top = 10.dp))

        if (!formeConnue) {
            /*
             * ⛔ TROIS RÉPONSES DISTINCTES, ET C'EST LE MÊME PRINCIPE QUE LA VÉRIFICATION D'UN
             * CERTIFICAT : « cette référence n'a pas la bonne forme », « ce devis n'existe
             * pas » et « la lecture n'a pas abouti » sont trois choses. Les confondre ferait
             * conclure à un document annulé là où il n'y a qu'une faute de frappe.
             */
            Surface(Niveau.TRUTH, Modifier.padding(top = 18.dp).fillMaxWidth()) {
                Column {
                    Eyebrow("Cette référence n'a pas la forme attendue")
                    Body(
                        "Une référence de devis commence par DV- et compte douze caractères "
                            + "ensuite. Celle-ci n'en a pas la forme : ce n'est pas un devis "
                            + "introuvable, c'est une référence qui n'a pas pu être lue. "
                            + "Vérifie le document, la référence y est imprimée en haut.",
                        Modifier.padding(top = 6.dp),
                        attenue = true,
                    )
                }
            }
        }

        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Le contenu de ce devis",
            origine = "Aucune vue par identifiant n'est servie — le contrat n'a pas de "
                + "vue de devis du tout, et le site lit le document directement dans la "
                + "base, ce que l'application ne sait pas faire",
            degat = "Des lignes et un montant fabriqués formeraient un document commercial "
                + "inventé, présenté à quelqu'un qui s'apprête à s'engager dessus. C'est le "
                + "seul écran de ce lot où une donnée d'exemple coûterait de l'argent réel à "
                + "quelqu'un.",
            modifier = Modifier.padding(top = 18.dp),
            hauteur = 4,
        )

        /*
         * ⛔ CE BOUTON EST HORS DE `SansDonnees`, ET C'EST DÉLIBÉRÉ. Le composant rend des
         * squelettes — sans son emplacement d'action — pendant les deux phases d'attente.
         * Or ouvrir le document sur le site est la SEULE chose que cet écran sache faire :
         * la faire disparaître le temps d'un chargement laisserait un écran sans issue.
         */
        Button(
            "Ouvrir le devis sur le site",
            {
                adresseOrpheline = if (ouvrirUneAdresse(contexte, adresse).aOuvert) null else adresse
            },
            Modifier.padding(top = 16.dp),
            ton = TonBouton.DIGITALISE,
            glypheQueue = "external",
        )

        Body(
            "Le document est consultable sans compte et reste valable "
                + "${TermesDeLOffre.VALIDITE_JOURS} jours après son émission. Il ne contient "
                + "aucune donnée personnelle : le lien se transfère sans exposer ton numéro "
                + "ni ton adresse.",
            Modifier.padding(top = 16.dp),
            grain = GrainCorps.CHAPO,
        )

        adresseOrpheline?.let { orpheline ->
            Surface(Niveau.TRUTH, Modifier.padding(top = 14.dp).fillMaxWidth()) {
                Column {
                    Eyebrow("Aucun navigateur n'a répondu")
                    Body(
                        "Ce téléphone n'a pas d'application capable d'ouvrir une adresse web. "
                            + "Le devis reste lisible depuis n'importe quel autre appareil, à "
                            + "cette adresse :",
                        Modifier.padding(top = 6.dp),
                        attenue = true,
                    )
                    AdresseMono(orpheline, Modifier.padding(top = 8.dp))
                }
            }
        }

        Button(
            "Continuer sur WhatsApp",
            {
                val message = "Bonjour Max-Morrys, je te contacte à propos du devis $code."
                adresseWhatsApp(message).let { url ->
                    adresseOrpheline = if (ouvrirUneAdresse(contexte, url).aOuvert) null else url
                }
            },
            Modifier.padding(top = 16.dp),
            ton = TonBouton.QUIET,
            glypheQueue = "external",
        )

        EncartDeVerite(
            sourcil = "Ce que ce document fait, et ce qu'il ne fait pas encore",
            texte = "Le kit promet ici qu'un devis est « figé à l'émission ». Ce n'est pas ce "
                + "que fait le code : le document recalcule ses totaux depuis la grille "
                + "COURANTE à chaque ouverture. Tant que ce n'est pas corrigé côté serveur, "
                + "une révision de la grille peut donc changer un devis déjà envoyé — et "
                + "cette phrase-ci est la seule des deux qui soit vraie.",
            modifier = Modifier.padding(top = 18.dp),
        )
    }
}
