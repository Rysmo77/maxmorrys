package me.maxmorrys.rysmo.ecrans.compte

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import me.maxmorrys.rysmo.donnees.CodeErreur
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.Field
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.identite.ErreurIdentite
import me.maxmorrys.rysmo.identite.authOuNull
import me.maxmorrys.rysmo.identite.configurationDIdentite
import me.maxmorrys.rysmo.identite.reinitialiser
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.CranDisplay
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.GrainCorps
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * MOT DE PASSE OUBLIÉ — ⛔ LE KIT NE DESSINE PAS CET ÉCRAN, ET IL EST POURTANT OBLIGATOIRE.
 *
 * `NatConnexion` écrit « Mot de passe oublié ? » sans lui donner de destination
 * (`ScreensNatifCompte.js:56`). Le port a dû l'inventer, et il a bien fait : le site propose
 * déjà Google, donc des gens inscrits par Google N'ONT JAMAIS CHOISI DE MOT DE PASSE. Sans
 * cet écran, ils essaient des mots de passe qui n'ont jamais existé.
 *
 * ⭐ L'INVARIANT DE CET ÉCRAN, ET IL SURVIT À LA TECHNOLOGIE : IL N'A QU'UNE SEULE SORTIE.
 *
 * Pas de `if`, pas de second message, pas d'état d'erreur. Le résultat de l'envoi N'EST PAS
 * LU. La raison n'est pas esthétique : distinguer « adresse inconnue » de « lien envoyé »
 * rendrait cet écran capable de répondre « inscrit / pas inscrit » à qui lui soumet une liste
 * d'adresses. Une page qui écrit « SI un compte existe à cette adresse » puis affiche
 * « adresse inconnue » sur le chemin d'erreur sert elle-même l'énumération qu'elle jure
 * d'empêcher — et elle la sert MIEUX qu'un silence, puisqu'elle répond franchement à chaque
 * essai.
 *
 * ⛔ À QUI BRANCHERA CET ÉCRAN : NE PAS AJOUTER D'EMBRANCHEMENT ICI. L'envoi doit arriver
 * dans un `try` dont le `catch` est vide et le `finally` unique. Ce n'est pas une
 * négligence, c'est la mesure.
 *
 * ── POURQUOI RIEN N'EST DESSINÉ AUJOURD'HUI ─────────────────────────────────────────────
 * L'envoi du lien est le travail du fournisseur d'identité — dans le port, Firebase
 * Authentication, depuis son propre domaine. Aucun n'est en dépendance ici, et aucun
 * producteur de jeton n'est choisi.
 *
 * ⚠️ ET C'EST L'ÉCRAN OÙ UN FAUX ACCUSÉ DE RÉCEPTION COÛTE LE PLUS CHER. Dessiner le champ
 * et le bouton donnerait « Si un compte existe à cette adresse, le lien y est déjà » alors
 * que rien n'est parti : quelqu'un attendrait un message qui ne viendra jamais, vérifierait
 * ses indésirables, recommencerait — et conclurait que son compte n'existe plus. Le seul
 * état de sortie de cet écran étant un accusé de réception, un écran non branché ne peut
 * rien afficher d'autre qu'un aveu.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⚠️ PAS D'`onAller` : cet écran n'a aucune destination. Sa seule sortie est le retour, et
 * c'est vrai aussi de la version branchée — l'accusé de réception ne mène nulle part, il
 * renvoie à la boîte de courrier.
 */
@Composable
fun EcranMotDePasse(
    onRetour: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    val portee = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var erreur by remember { mutableStateOf<String?>(null) }
    var enCours by remember { mutableStateOf(false) }
    var envoye by remember { mutableStateOf(false) }

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Connexion",
        onRetour = onRetour,
        titre = "Mot de passe oublié",
    ) {
        Eyebrow("Ton compte", Modifier.padding(top = 6.dp))
        Display(
            listOf("On te remet", "dedans."),
            cran = CranDisplay.SM,
            modifier = Modifier.padding(top = 10.dp),
        )
        Body(
            "Le jour où cet écran enverra, il demandera ton e-mail et rien d'autre, et le "
                + "lien de réinitialisation vaudra une heure.",
            Modifier.padding(top = 12.dp),
            grain = GrainCorps.CHAPO,
        )

        /*
         * ⛔ LA MÊME RÉPONSE POUR UNE ADRESSE CONNUE ET POUR UNE INCONNUE.
         *
         * Firebase ne lève pas d'erreur sur une adresse inexistante, et c'est voulu :
         * répondre différemment ferait de cet écran un outil pour savoir qui est inscrit.
         * `reinitialiser` avale donc tout SAUF la panne de transport, et l'accusé ci-dessous
         * s'affiche dans les deux cas.
         */
        val auth = authOuNull(contexte)
        if (auth == null) {
            SansDonnees(
                etat = Etat.Panne(
                    motif = configurationDIdentite().motifManquant()
                        ?: "L'identification n'est pas disponible.",
                    code = CodeErreur.FAILED_PRECONDITION,
                    reprenable = false,
                ),
                quoi = "T'envoyer un lien de réinitialisation",
                origine = "Les clés de construction Firebase",
                degat = "Un champ et un bouton afficheraient « le lien y est déjà » sans que "
                    + "rien ne parte. On attendrait un message qui ne vient pas, on "
                    + "fouillerait ses indésirables, et on finirait par croire son compte "
                    + "disparu.",
                modifier = Modifier.padding(top = 20.dp),
            )
        } else if (envoye) {
            EncartDeVerite(
                sourcil = "C'est parti",
                texte = "Si un compte existe avec cette adresse, le lien vient d'y être "
                    + "envoyé. Regarde aussi tes indésirables — et sache qu'on ne te dira "
                    + "pas si l'adresse est inscrite : ce serait un moyen de le découvrir "
                    + "pour n'importe qui.",
                modifier = Modifier.padding(top = 20.dp),
            )
        } else {
            Field(
                libelle = "Adresse e-mail",
                valeur = email,
                onChange = { email = it; erreur = null },
                modifier = Modifier.padding(top = 20.dp),
                erreur = erreur,
                clavier = KeyboardType.Email,
            )
            Button(
                libelle = if (enCours) "Un instant…" else "M'envoyer le lien",
                onPress = {
                    if (!enCours) {
                        enCours = true
                        erreur = null
                        portee.launch {
                            val echec = withContext(Dispatchers.IO) {
                                runCatching { reinitialiser(auth, email) }.exceptionOrNull()
                            }
                            enCours = false
                            val motif = (echec as? ErreurIdentite)?.motif
                            erreur = motif
                            /* ⚠️ On n'affiche l'accusé QUE si rien n'a échoué en transport.
                               L'afficher malgré une panne de réseau ferait attendre un
                               message qui n'est jamais parti. */
                            envoye = motif == null
                        }
                    }
                },
                modifier = Modifier.padding(top = 16.dp),
                ton = TonBouton.FORME,
                desactive = email.isBlank() || enCours,
            )
        }

        EncartDeVerite(
            sourcil = "Pourquoi ce « si »",
            texte = "Cet écran ne dira jamais si une adresse a un compte ou non. Ça paraît "
                + "moins serviable, mais ça évite qu'un inconnu puisse tester des adresses "
                + "pour savoir qui est inscrit. Une adresse sans compte recevra la même "
                + "réponse, au mot près, que la tienne.",
            modifier = Modifier.padding(top = 16.dp),
        )

        EncartDeVerite(
            sourcil = "Pourquoi cet écran existe séparément",
            texte = "Sur le site, on peut s'inscrire par Google. Quelqu'un qui l'a fait n'a "
                + "jamais choisi de mot de passe : c'est par ici qu'il s'en donnera un, et "
                + "pas en essayant des mots de passe qui n'ont jamais existé.",
            modifier = Modifier.padding(top = 12.dp),
        )

        EncartDeVerite(
            sourcil = "D'où viendra le message",
            texte = "D'un domaine du fournisseur d'identité, pas d'une adresse en "
                + "maxmorrys.me — le produit n'a pas de canal d'e-mail à lui, et il n'en a "
                + "pas besoin pour celui-ci. Il faudra chercher « noreply ».",
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}
