package me.maxmorrys.rysmo.ecrans.compte

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
 * ⚠️ CE QUE LE SERVEUR SAIT DÉJÀ FAIRE, ET CE QUI MANQUE. `creerMonProfil` est au contrat,
 * le Worker la sert, elle est IDEMPOTENTE. Ce qui manque n'est pas la création : c'est
 * l'identification qui doit la précéder — le compte d'authentification, que seul un
 * producteur de jeton peut créer, et qu'aucune dépendance de ce module ne fournit.
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

        SansDonnees(
            etat = Etat.NonBranche,
            quoi = "Créer ton compte",
            origine = "La création du profil existe côté serveur — « "
                + "${Callables.CREER_MON_PROFIL} » — mais elle suppose un compte "
                + "d'authentification déjà créé, et aucun producteur de jeton d'identité "
                + "n'est branché dans l'application",
            degat = "Trois champs, une case et un bouton « Crée mon compte » qui ne crée "
                + "rien font saisir un nom, une adresse et un mot de passe pour rien — et "
                + "font croire à un compte qui n'existe pas.",
            modifier = Modifier.padding(top = 20.dp),
        )

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
