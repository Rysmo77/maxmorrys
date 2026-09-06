package me.maxmorrys.rysmo.ecrans.club

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES TERMES DU CLUB — ANNONCÉS, JAMAIS MESURÉS. ⛔ ET C'EST UN MIROIR DE PLUS.
 *
 * `src/lib/club/pricing.ts` est la source de vérité côté client web, et il porte lui-même la
 * raison de son existence : « Le prix a longtemps été recopié à treize endroits sans point de
 * contact. Résultat : les CGV ont annoncé 10 000 FCFA/an pendant que le code en débitait
 * 19 900 — sur un abonnement engageant douze mois. » Il liste ses miroirs à synchroniser à la
 * main : `worker/.../bictorys.ts`, `src/i18n/locales/{fr,en}/legal.json`, `finance/model.py`,
 * trois documents.
 *
 * ⛔ ANDROID N'EST PAS DANS CETTE LISTE, ET CE FICHIER L'Y AJOUTE DE FAIT. Les trois projets
 * TypeScript ne peuvent déjà pas s'importer entre eux ; un module Gradle encore moins. Toute
 * modification de ces valeurs doit désormais passer ici AUSSI, et la liste de `pricing.ts`
 * doit être complétée en conséquence. C'est un coût réel, assumé pour une raison précise :
 * l'alternative était d'écrire « 15 % » en toutes lettres dans deux écrans, c'est-à-dire de
 * créer deux miroirs au lieu d'un.
 *
 * ⚠️ AUCUN MONTANT ICI. La position retenue par défaut est que l'application ne vend pas
 * (`deferred-work.md`, § F.1 de la spécification des écrans) : ni prix, ni nom de magasin, ni
 * bouton sortant. Seuls les termes qu'un écran doit dire sans vendre sont portés.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
internal object TermesDuClub {

    /**
     * La remise accordée au filleul, en pourcentage.
     * Source : `src/lib/club/pricing.ts` → `CLUB_REFERRAL_DISCOUNT` (0,15).
     */
    const val REMISE_FILLEUL_PCT: Int = 15

    /**
     * La date de dernière révision de ces termes.
     * Source : `src/lib/club/pricing.ts` → `CLUB_TERMS_REVISED_AT` (2026-09-04, midi UTC).
     * ⚠️ `Num` exige un `asOf` : ces valeurs ne viennent pas d'une requête, elles sont écrites.
     */
    const val REVISE_LE: String = "04/09/2026"

    /**
     * L'ouverture du Club, au MOIS près.
     *
     * ⛔ « LE CLUB A OUVERT CETTE ANNÉE » EST UNE PHRASE QUI SE MET À MENTIR. Le kit l'écrit au
     * relatif (`ScreensNatifClub.js:597`) ; le dépôt a déjà tranché ce point côté web —
     * `CLUB_OPENED_AT` vaut `2026-08`, et son commentaire explique pourquoi : « Vraies au
     * moment où on les écrit, fausses quelques mois plus tard, et RIEN ne le signale : une
     * phrase relative au temps ne casse pas, elle se met simplement à mentir. Sur les deux
     * écrans dont le métier est d'expliquer pourquoi aucun chiffre n'est annoncé, c'est le
     * pire endroit possible. » L'écran verrouillé du Club EST l'un de ces deux écrans.
     *
     * ⚠️ GRANULARITÉ AU MOIS, comme la source : le jour exact n'est pas connu, et l'inventer
     * serait la fabrication que tout ceci existe pour empêcher.
     */
    const val OUVERT_EN: String = "août 2026"
}
