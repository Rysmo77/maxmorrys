package me.maxmorrys.rysmo.ecrans.media

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import me.maxmorrys.rysmo.ds.Body
import me.maxmorrys.rysmo.ds.Eyebrow
import me.maxmorrys.rysmo.ds.Niveau
import me.maxmorrys.rysmo.ds.Surface
import me.maxmorrys.rysmo.ds.Typo
import me.maxmorrys.rysmo.ds.jetons

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * CE QUE LES SEPT ÉCRANS DE MÉDIA, D'AGENCE ET DE SUPPORT PARTAGENT.
 *
 * ⛔ AUCUNE DONNÉE D'EXEMPLE. La règle du lot est celle des lots précédents, et elle a été
 * payée : le port React Native affichait « Série 3 j » et « Niveau 4 » à de vraies personnes
 * connectées, jusqu'au 05/09/2026. Le kit est une MAQUETTE — ses « 34:20 », « 31 Mo »,
 * « MM-D-4831 » et ses quatre lignes de transcription horodatées montrent une mise en page.
 * Aucun n'entre ici.
 *
 * ⛔ ET CE LOT PORTE DEUX SURFACES QUE LE CONTENU NE PERMET PAS ENCORE DE RENDRE.
 *
 *   1 · LE MÉDIA N'EST PAS HÉBERGÉ. La vidéo de leçon est une intégration tierce, l'audio
 *       d'épisode pointe sur Spotify — le champ `lien` d'un épisode vaut
 *       `episode.external_urls.spotify`. La décision de ré-hébergement est prise, le contenu
 *       n'est pas déposé, et la seule porte d'écriture du stockage ne connaît ni les cours ni
 *       les certificats. Le constat complet est écrit une fois pour toutes dans
 *       `_bmad-output/implementation-artifacts/constat-hors-ligne.md`.
 *   2 · AUCUN LECTEUR N'EST DÉCLARÉ. `media3-exoplayer` et `media3-session` sont au catalogue
 *       de versions, et `app/build.gradle.kts` ne les déclare PAS en dépendance. Il n'existe
 *       donc ni lecture, ni session média, ni écran verrouillé, ni mini-lecteur persistant.
 *       ⚠️ C'ÉTAIT AUSSI LE CAS D'`androidx.browser`, ET CE NE L'EST PLUS : le lot 5 l'a
 *       déclaré, et l'ouverture d'une adresse passe désormais par `systeme/Sortie.kt`, en
 *       onglet personnalisé quand le téléphone en sert un. `media3` reste dehors, lui, parce
 *       qu'un lecteur qui ne lit rien n'est pas une fonction.
 *
 * ⚠️ LA CONSÉQUENCE EST UNE DÉCISION DE RENDU, PAS UN OUBLI. Un rond de pause, un « −15 » et
 * un curseur de piste qui ne bougent pas ne sont pas une fonction dégradée : ce sont
 * exactement les six contrôles éteints que la porte des contrôles morts du port avait
 * attrapés. Les écrans de ce paquet DISENT ce qu'ils ne peuvent pas encore faire, et
 * n'exposent que les gestes qui partent vraiment : la feuille de partage du système, et
 * l'ouverture d'une adresse hors de l'application.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ⛔ LES TERMES DE L'OFFRE PRÉSENCE DIGITALE — UN MIROIR DE PLUS, ET IL EST GARDÉ.
 *
 * `src/lib/presence/offer.ts` est la source de vérité, et son en-tête liste lui-même ses
 * miroirs à tenir à la main : le prérendu du Worker, le document commercial, la mémoire des
 * agents commerciaux, le modèle financier. Android n'y figurait pas ; ce fichier l'y ajoute
 * de fait, comme `ecrans/club/Termes.kt` l'a fait pour le Club.
 *
 * ⚠️ LA DIFFÉRENCE AVEC LES QUATRE AUTRES MIROIRS EST QU'IL EXISTE UNE PORTE :
 * `tests/unit/natif-miroirs.test.ts` compare chacune des valeurs ci-dessous à la source
 * TypeScript et rougit si l'une bouge sans l'autre. C'est ce que la spécification demandait
 * — citer d'où viennent les montants, et fermer l'écart plutôt que l'annoncer.
 *
 * ⛔ POURQUOI DES MONTANTS ICI ALORS QUE `TermesDuClub` N'EN PORTE AUCUN. Ce n'est pas une
 * inconséquence : le Club et les formations sont du contenu numérique consommé DANS
 * l'application, et la position retenue par défaut est que l'application ne les vend pas.
 * Un pack d'agence se contracte HORS de l'application — c'est une prestation du monde réel,
 * expressément hors du champ des règles de magasin, et le port React Native l'écrivait déjà
 * dans sa propre porte : sa liste de mots interdits exemptait nommément ses deux écrans
 * d'agence. Le prix est ici la promesse même de l'offre, dont le titre public est
 * « Trois packs. Les prix sont affichés. »
 */
internal object TermesDeLOffre {

    /**
     * Le pack d'entrée — celui auquel appartiennent les deux montants.
     *
     * ⛔ ET C'EST LA PREMIÈRE CONTRADICTION DU KIT, MESURÉE. `ScreensNatifMedia.js:281`
     * dessine une carte « Pack Visible » portant 250 000 barré 295 000. Or la grille ne
     * connaît aucun « Pack Visible » : elle a « Présence Locale » (295 000, promotion de
     * lancement 250 000), « Commerce Visible » (495 000, sans promotion) et « Boutique
     * Digitale » (895 000). La carte du kit porte donc le NOM de l'un et le PRIX de l'autre.
     * Reproduire cette carte telle quelle afficherait 250 000 sous un nom facturé 495 000.
     */
    const val PACK_CLE: String = "presence"

    /** Source : les libellés i18n `packs.presence.name`. */
    const val PACK_NOM: String = "Présence Locale"

    /** Source : `PACKS` → `presence.price`. Le prix de liste, celui qui se fait barrer. */
    const val PACK_PRIX_LISTE: Int = 295_000

    /**
     * Source : `PACKS` → `presence.promoPrice`, lu par `packEffectivePrice()`.
     * C'est le montant RÉELLEMENT PRATIQUÉ — le web a déjà payé la confusion des deux :
     * la page affichait 250 000 et le devis ouvert derrière le même bouton en annonçait
     * 295 000.
     */
    const val PACK_PRIX_PRATIQUE: Int = 250_000

    /** Source : `PACKS` → `presence.supportDays`. */
    const val PACK_SUPPORT_JOURS: Int = 30

    /**
     * ⛔ LES MONTANTS SONT HORS TAXES DEPUIS LE 03/09/2026, et ce n'est pas une nuance
     * comptable : l'article 5.1 des CGV annonçait « toutes taxes comprises » jusqu'à cette
     * date. La prestation d'agence est TAXABLE au taux normal — les formations et le Club,
     * eux, sont exonérés au titre de l'enseignement. Source : `src/lib/tax/senegal.ts`.
     */
    const val TVA_TAUX_PCT: Int = 18

    /** Source : `DEPOSIT_RATE` (0,6). L'échéancier porte sur la mise en place, et sur elle seule. */
    const val ACOMPTE_PCT: Int = 60

    /** Source : `QUOTE_VALIDITY_DAYS`. */
    const val VALIDITE_JOURS: Int = 30

    /**
     * La date de dernière révision de la grille.
     * Source : `CATALOGUE_REVISED_AT` (2026-08-02, midi UTC).
     * ⚠️ `Num` et `PriceBlock` exigent un `asOf` : ces prix ne viennent pas d'une requête,
     * ils sont écrits. La date de leur révision est le seul relevé honnête qu'on ait.
     */
    const val REVISE_LE: String = "02/08/2026"

    /** Le chemin public de l'offre. Il n'est PAS déclaré en lien profond : il sort vraiment. */
    const val CHEMIN_OFFRE: String = "/presence-digitale"

    /**
     * Le chemin public d'un devis.
     *
     * ⛔ DEUXIÈME CONTRADICTION DU KIT. `ScreensNatifMedia.js:303` écrit l'adresse
     * `maxmorrys.me/devis/MM-D-4831`. Le site ne sert pas ce chemin — il sert
     * `presence-digitale/devis/<référence>` — et `MM-D-4831` n'a pas la forme d'une
     * référence : `isValidQuoteRef` exige `DV-` suivi de douze chiffres hexadécimaux
     * majuscules, soit une adresse non devinable. Recopier celle du kit produirait un lien
     * qui ne s'ouvre sur rien, imprimé sur un document commercial.
     */
    const val CHEMIN_DEVIS: String = "/presence-digitale/devis/"

    /** La forme d'une référence de devis, telle que `isValidQuoteRef` la valide. */
    val FORME_REFERENCE: Regex = Regex("^DV-[0-9A-F]{12}$")

    /**
     * Le numéro WhatsApp, au format `wa.me` — indicatif sans signe ni séparateur.
     * Source : `src/lib/brand/company.ts` → `contact.phoneRaw`.
     *
     * ⚠️ CE NUMÉRO A DÉJÀ ÉTÉ RECOPIÉ DANS NEUF FICHIERS SOUS TROIS FORMATS, et son
     * commentaire d'origine dit ce qu'il en est advenu : « un numéro de téléphone dupliqué
     * finit toujours par diverger ». Celui-ci est le dixième — et le premier qu'une porte
     * compare à la source.
     */
    const val WHATSAPP_NUMERO: String = "221776041985"

    /** Le montant toutes taxes comprises d'une base hors taxes, arrondi comme le fait le web. */
    fun ttc(ht: Int): Int = ht + (ht * TVA_TAUX_PCT + 50) / 100
}

/**
 * Un montant en francs CFA, groupé par milliers.
 *
 * ⚠️ ESPACE ORDINAIRE, PAS ESPACE INSÉCABLE. La typographie française voudrait la seconde ;
 * ce dépôt a déjà cassé son propre linter avec des insécables recopiées dans des fichiers de
 * test, et un caractère invisible dans un montant est la dernière chose qu'on veut avoir à
 * déboguer. Le franc CFA n'a pas de centimes : la valeur est entière par construction.
 */
internal fun montantXof(valeur: Int): String =
    valeur.toString().reversed().chunked(3).joinToString(" ").reversed()

/**
 * L'adresse `wa.me`, avec un message pré-rempli.
 *
 * ⛔ ET C'EST WHATSAPP QUI DOIT LA RECEVOIR, PAS UN ONGLET. `wa.me` est une adresse web, et
 * WhatsApp la déclare en lien applicatif : un onglet personnalisé — qui porte le paquet d'un
 * NAVIGATEUR — servirait la page web à la place de la conversation. `systeme/Sortie.kt`
 * essaie donc l'application installée AVANT l'onglet, et c'est pour ce geste-ci que cet
 * ordre existe.
 *
 * ⚠️ ELLE PEUT N'OUVRIR AUCUNE APPLICATION. Si WhatsApp n'est pas installé, c'est le
 * navigateur qui sert `wa.me` et qui propose l'installation. Si aucun navigateur n'existe non
 * plus, `ouvrirUneAdresse` ne rend rien d'ouvert, et l'écran le dit.
 */
internal fun adresseWhatsApp(message: String): String =
    "https://wa.me/${TermesDeLOffre.WHATSAPP_NUMERO}?text=" +
        java.net.URLEncoder.encode(message, "UTF-8")

/**
 * L'encart de vérité du kit, en portée NUIT.
 *
 * ⚠️ `EncartDeVerite` (paquet `ecrans.apprentissage`) pose `Niveau.TRUTH`, qui est une
 * surface CLAIRE. La console et le /403 sont sombres sur un téléphone en mode clair : le kit
 * y pose `level="night"`, et le même encart en verre clair y serait du papier sur du noir.
 * D'où cette variante, et d'où son seul écart : le niveau.
 */
@Composable
internal fun EncartDeNuit(
    sourcil: String,
    texte: String,
    modifier: Modifier = Modifier,
) {
    Surface(Niveau.NIGHT, modifier.fillMaxWidth()) {
        Column {
            Eyebrow(sourcil)
            Body(texte, Modifier.padding(top = 6.dp), attenue = true)
        }
    }
}

/** Une adresse affichée telle quelle, en monospace — c'est un identifiant, pas une phrase. */
@Composable
internal fun AdresseMono(adresse: String, modifier: Modifier = Modifier) {
    Text(
        text = adresse,
        style = Typo.code,
        color = jetons.textFaint,
        modifier = modifier,
    )
}
