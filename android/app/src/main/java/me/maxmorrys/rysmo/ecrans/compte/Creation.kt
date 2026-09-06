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
import me.maxmorrys.rysmo.ds.Field
import me.maxmorrys.rysmo.identite.ErreurIdentite
import me.maxmorrys.rysmo.identite.PorteeIdentifiee
import me.maxmorrys.rysmo.identite.authOuNull
import me.maxmorrys.rysmo.identite.configurationDIdentite
import me.maxmorrys.rysmo.identite.creationEmail
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import me.maxmorrys.rysmo.donnees.Callables
import me.maxmorrys.rysmo.donnees.Etat
import me.maxmorrys.rysmo.ds.Button
import me.maxmorrys.rysmo.ds.Display
import me.maxmorrys.rysmo.ds.SansDonnees
import me.maxmorrys.rysmo.ds.Screen
import me.maxmorrys.rysmo.ds.Territoire
import me.maxmorrys.rysmo.ds.TonBouton
import me.maxmorrys.rysmo.ecrans.apprentissage.EncartDeVerite
import me.maxmorrys.rysmo.navigation.Legal

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CRÉATION DE COMPTE — kit `NatCreation` (`ScreensNatifCompte.js:78-128`).
 *
 * ⛔ LA CASE DE CONSENTEMENT N'EST PAS DESSINÉE, ET C'EST LA MÊME RÈGLE QUI L'EXIGEAIT
 * NON PRÉ-COCHÉE QUI L'INTERDIT AUJOURD'HUI.
 *
 * Le consentement à la lettre d'information est HORODATÉ, et la règle de la base refuse une
 * inscription sans lui. Une case ici ne serait écrite nulle part : on la cocherait, elle
 * retomberait au prochain lancement, et personne n'aurait consenti à quoi que ce soit. Une
 * case pré-cochée fabrique un consentement ; une case qui ne persiste pas en fabrique un
 * aussi, avec le geste de la personne en plus — donc en pire.
 *
 * ⛔ ET LE LIEN LÉGAL EST HORS DE TOUT CONTRÔLE À COCHER. C'est le défaut exact que le port
 * a livré puis corrigé : « politique de confidentialité » rendue en bleu et en gras — la
 * forme d'un lien — À L'INTÉRIEUR du contrôle de la case. La toucher cochait la case. Une
 * fausse affordance posée sur un contrôle de consentement, c'est-à-dire à l'endroit exact où
 * elle coûte le plus cher. Ici la ligne des textes est un bouton à elle seule, et elle ouvre
 * vraiment.
 *
 * ⚠️ DEUX ÉTAPES, ET LA SECONDE EST CELLE DU SERVEUR. `creerMonProfil` est au contrat, le
 * Worker la sert, elle est IDEMPOTENTE — et elle ne peut partir qu'APRÈS le compte
 * d'authentification, qui la précède et qui l'identifie. Les deux sont branchées ; c'est
 * leur ORDRE qui n'est pas rattrapable, et le bloc ci-dessous dit pourquoi.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * @param onAller une seule sortie, et elle est OBLIGATOIRE : App Store 5.1.1(i) veut les
 *   textes légaux au point de création du compte. C'est le seul écran du lot où ce lien
 *   n'est pas un confort.
 */
@Composable
fun EcranCreation(
    onRetour: () -> Unit,
    onAller: (Any) -> Unit,
    modifier: Modifier = Modifier,
) {
    val contexte = LocalContext.current
    val portee = rememberCoroutineScope()
    var nom by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var motDePasse by remember { mutableStateOf("") }
    var erreur by remember { mutableStateOf<String?>(null) }
    var enCours by remember { mutableStateOf(false) }

    Screen(
        territoire = Territoire.FORME,
        modifier = modifier,
        retour = "Connexion",
        onRetour = onRetour,
        titre = "Créer un compte",
    ) {
        Display(
            listOf("ON COMMENCE", "PAR TOI."),
            taille = 29.sp,
            modifier = Modifier.padding(top = 10.dp),
        )

        /*
         * ⛔ L'ORDRE DE CE QUI SE PASSE N'EST PAS RATTRAPABLE DANS L'AUTRE SENS.
         *
         * `creationEmail` crée le compte d'authentification, PUIS demande au serveur le
         * profil `users/{uid}`. Si la seconde étape échoue, la personne a un compte qui se
         * connecte et aucun profil à lire — et on ne peut pas défaire la première, car
         * supprimer un compte tout juste créé exige une ré-authentification.
         *
         * On ne fait donc pas semblant : la callable est IDEMPOTENTE côté serveur, et le
         * prochain lancement la rappellera sans rien écraser.
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
                quoi = "Créer ton compte",
                origine = "Les clés de construction Firebase",
                degat = "Trois champs et un bouton qui ne crée rien font saisir un nom, une "
                    + "adresse et un mot de passe pour rien — et font croire à un compte qui "
                    + "n'existe pas.",
                modifier = Modifier.padding(top = 20.dp),
            )
        } else {
            Field(
                libelle = "Ton prénom",
                valeur = nom,
                onChange = { nom = it; erreur = null },
                modifier = Modifier.padding(top = 20.dp),
                aide = "C'est le nom qui sera gravé sur tes certificats.",
            )
            Field(
                libelle = "Adresse e-mail",
                valeur = email,
                onChange = { email = it; erreur = null },
                modifier = Modifier.padding(top = 12.dp),
                clavier = KeyboardType.Email,
            )
            Field(
                libelle = "Mot de passe",
                valeur = motDePasse,
                onChange = { motDePasse = it; erreur = null },
                modifier = Modifier.padding(top = 12.dp),
                aide = "Six caractères au minimum.",
                erreur = erreur,
                secret = true,
            )
            Button(
                libelle = if (enCours) "Un instant…" else "Créer mon compte",
                onPress = {
                    if (!enCours) {
                        enCours = true
                        erreur = null
                        portee.launch {
                            val echec = withContext(Dispatchers.IO) {
                                runCatching { creationEmail(auth, appel, nom, email, motDePasse) }
                                    .exceptionOrNull()
                            }
                            enCours = false
                            /* Rien à faire en cas de succès : l'écouteur d'identité pose
                               `Connectee`, et le graphe referme cet écran. */
                            erreur = (echec as? ErreurIdentite)?.motif
                                ?: echec?.let { "La création a échoué." }
                        }
                    }
                },
                modifier = Modifier.padding(top = 16.dp),
                ton = TonBouton.FORME,
                desactive = nom.isBlank() || email.isBlank() || motDePasse.isBlank() || enCours,
            )
        }

        EncartDeVerite(
            sourcil = "Pourquoi la case n'est pas dessinée",
            texte = "Le consentement à la lettre d'information est horodaté, et la règle de "
                + "la base refuse une inscription sans lui. Une case qu'on coche ici ne "
                + "serait écrite nulle part : elle retomberait au prochain lancement. Une "
                + "case pré-cochée fabrique un consentement ; une case qui ne persiste pas "
                + "en fabrique un aussi, avec ton geste en plus.",
            modifier = Modifier.padding(top = 16.dp),
        )

        EncartDeVerite(
            sourcil = "Ce que créer un compte n'inscrira jamais à autre chose",
            texte = "Créer un compte n'inscrit à rien d'autre. La lettre d'information se "
                + "demandera séparément, et se quittera d'un geste.",
            modifier = Modifier.padding(top = 12.dp),
        )

        /* ⭐ HORS DE TOUTE CASE, ET AVANT LE BOUTON DE RETOUR : c'est la position que
           5.1.1(i) demande, et c'est celle où le regard passe avant de renoncer. */
        Button(
            "Lire les conditions et la politique de confidentialité",
            { onAller(Legal) },
            Modifier.padding(top = 18.dp),
            ton = TonBouton.QUIET,
        )
        Button(
            "J'ai déjà un compte",
            onRetour,
            Modifier.padding(top = 9.dp),
            ton = TonBouton.QUIET,
        )
    }
}
