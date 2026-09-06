package me.maxmorrys.rysmo.navigation

import kotlinx.serialization.Serializable

/*
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LES DESTINATIONS, TYPÉES — ET LE DÉFAUT QU'ELLES EXISTENT POUR RENDRE IMPOSSIBLE.
 *
 * ⛔ DANS LE PORT REACT NATIVE, 14 ROUTES SUR 51 N'ÉTAIENT ATTEINTES PAR RIEN.
 *
 * Parmi elles, la chaîne de première ouverture au complet : `lancement → onboarding →
 * permissions`. Elle était entièrement écrite, et jamais exécutée — il n'existait pas
 * d'`app/index.tsx`, donc le routeur par fichiers servait « / » depuis l'onglet Espace.
 * Un nouvel utilisateur tombait directement sur « Bonsoir. » et un écran vide.
 *
 * ⛔ ET LE TEST CENSÉ FERMER LA CARTE NE LE VOYAIT PAS. Il cherchait toute chaîne
 * littérale commençant par « / » dans n'importe quel fichier ; or la planche d'atelier
 * écrivait les 48 adresses en dur. Toute route y était donc « citée », et la porte restait
 * verte alors qu'aucun écran de production n'y menait.
 *
 * Deux choses changent ici, et elles ne se substituent pas l'une à l'autre :
 *
 *   1. Les destinations sont des TYPES. Naviguer vers un écran qui n'existe pas ne compile
 *      pas, et un argument oublié ne compile pas non plus. Le premier sens de la carte
 *      — « tout lien mène à un écran qui existe » — est tenu par le compilateur.
 *   2. Le second sens — « tout écran est atteint par un lien » — ne l'est PAS, et aucun
 *      type ne peut le tenir. C'est le travail d'une porte, qui devra exclure les surfaces
 *      qui ne sont pas des destinations (liste plus bas) et la variante `debug`.
 *
 * ⚠️ CE QUI N'EST PAS UNE DESTINATION, et n'a rien à faire dans le graphe :
 *   · l'écran verrouillé du lecteur   → `MediaSessionService`
 *   · le widget d'accueil             → `AppWidgetProvider`
 *   · le partage                      → `Intent.ACTION_SEND`
 *   · le mini-lecteur                 → surface persistante au-dessus de la barre d'onglets
 *   · chargement, vide, hors-connexion → des ÉTATS d'une destination, pas des écrans
 *   · le sas biométrique              → une couche AU-DESSUS du graphe
 *
 * Source : `_bmad-output/implementation-artifacts/spec-ecrans-natif.md` § C et § D.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

/* ── Première ouverture ─────────────────────────────────────────────────────────────── */

/**
 * ⛔ LE POINT D'ENTRÉE, ET IL N'Y EN A QU'UN.
 *
 * `startDestination = Lancement`. Sans cela le kit perd trois écrans d'un coup, exactement
 * comme dans le port RN. Cet écran n'affiche rien de durable : il aiguille sur l'état de
 * session, et rien d'autre.
 *
 *   session en restauration → attendre
 *   session connectée       → Espace, en dépilant Lancement
 *   session anonyme
 *     · premier lancement   → Onboarding
 *     · déjà onboardé       → Espace   (le catalogue se parcourt sans compte)
 */
@Serializable object Lancement

@Serializable object Onboarding

@Serializable object Permissions

/** Aussi atteignable depuis le profil : ce n'est pas qu'une étape d'accueil. */
@Serializable object Biometrie

/* ── Les cinq onglets ───────────────────────────────────────────────────────────────── */

@Serializable object Espace

@Serializable object Catalogue

@Serializable object Repetiteur

/**
 * La racine du Club. Rend le mur pour qui n'est pas membre, l'onglet par défaut sinon.
 * ⚠️ Les huit onglets sont des destinations SŒURS : passer de l'une à l'autre remplace,
 * ne pousse pas. Le port RN n'avait pas de bande d'onglets du tout — il fallait revenir
 * au hub entre chaque onglet.
 */
@Serializable object ClubRoot

@Serializable object Profil

/* ── Apprentissage ──────────────────────────────────────────────────────────────────── */

@Serializable data class Formation(val slug: String, val titre: String? = null)

@Serializable data class Lecon(val slug: String, val leconId: String? = null)

/**
 * ⚠️ Le seul écran en PAYSAGE. L'activité est déclarée `portrait` au manifeste, parce que
 * tous les autres écrans ne sont dessinés qu'en portrait ; `requestedOrientation` posé à
 * l'exécution prime sur le manifeste. Déverrouiller l'activité entière ferait pivoter des
 * écrans qui n'ont pas de mise en page pour ça.
 */
@Serializable data class PleinEcran(val leconId: String)

@Serializable data class Notes(val leconId: String? = null)

@Serializable object Certificats

@Serializable data class Certificat(
    val code: String,
    val titulaire: String,
    val formation: String,
    val emisLe: String,
    val lecons: Int,
)

/**
 * ⛔ LA DESTINATION DU LIEN PROFOND `/verifier`, ET LE KIT NE LA DESSINE PAS.
 *
 * `AndroidManifest.xml` et `public/.well-known/assetlinks.json` déclarent le préfixe
 * `/verifier` des deux côtés, avec `autoVerify`. Un préfixe déclaré sans destination
 * s'ouvre en SILENCE dans le navigateur : rien n'échoue, l'application a simplement l'air
 * de ne pas gérer ses propres liens.
 *
 * Deux issues étaient possibles — dessiner l'écran, ou retirer le préfixe des deux
 * manifestes. C'est dessiner, parce que la vérification de certificat est une fonction
 * réelle (son chemin serveur a été réparé le 05/09/2026, il était cassé en production).
 */
@Serializable data class Verification(val code: String? = null)

@Serializable object Memoire

@Serializable object Telechargements

/* ── Club ───────────────────────────────────────────────────────────────────────────── */

/**
 * L'ordre est celui du kit (`NativeShell.js:221`, `CLUB_ORDRE`) et il est PORTEUR : c'est
 * l'ordre de la bande d'onglets, que l'utilisateur apprend par la position.
 */
enum class OngletClub {
    Fil, Discussions, Membres, Agenda, Classement, Opportunites, Informations, Parrainage,
}

/**
 * ⚠️ L'ÉCRAN VERROUILLÉ EST UNE BRANCHE DE CET ÉCRAN, PAS UNE DESTINATION.
 *
 * `NatClubVerrouille` est paramétré par l'onglet — c'est la seule information qu'il porte
 * en plus. En faire une destination obligerait à repasser l'onglet en argument et à espérer
 * qu'on ne l'oublie pas ; en faire une branche le garantit.
 *
 * Le port RN rendait à la place un état vide GÉNÉRIQUE : l'écran conçu n'a jamais été porté.
 */
@Serializable data class ClubOnglet(val onglet: OngletClub)

/** ⛔ Le kit ne dessine pas cet écran. Au moins un des deux identifiants est requis. */
@Serializable data class ClubMembre(val membreId: String? = null, val messageId: String? = null)

/** ⛔ Le kit ne dessine pas cet écran. */
@Serializable object ClubBloques

/* ── Compte ─────────────────────────────────────────────────────────────────────────── */

@Serializable object Connexion

@Serializable object Creation

/** ⛔ Le kit ne dessine pas cet écran. */
@Serializable object MotDePasse

@Serializable object Suppression

/** ⛔ Le kit ne dessine pas cet écran. Atteint aussi depuis la connexion et la création. */
@Serializable object Legal

/* ── Média et agence ────────────────────────────────────────────────────────────────── */

@Serializable object Media

@Serializable data class Episode(val episodeId: String)

/** ⛔ Le kit ne dessine pas cet écran — il ne dessine que l'épisode audio. */
@Serializable data class Video(val videoId: String)

@Serializable object Presence

@Serializable data class Devis(val code: String)

/* ── Support ────────────────────────────────────────────────────────────────────────── */

/**
 * Les cinq portées que le rôle support atteint sur téléphone, nommées par le kit lui-même
 * (`ScreensNatifMedia.js:361`). ⚠️ Les quatorze autres écrans d'administration restent au
 * tableau de bord de bureau, et c'est une décision du kit, pas un oubli : « les porter sur
 * un téléphone serait une régression déguisée en couverture ».
 */
enum class PorteeSupport { Messages, Temoignages, RendezVous, Prospects, Projets }

@Serializable object Console

/** ⛔ Le kit ne dessine aucun de ces cinq écrans. */
@Serializable data class ConsoleEcran(val ecran: PorteeSupport)

@Serializable object Interdit

/* ── Transverse ─────────────────────────────────────────────────────────────────────── */

/**
 * La seule destination d'état, parce qu'elle est la cible d'un lien profond invalide —
 * les autres (chargement, vide, hors-connexion) sont des états d'une destination.
 */
@Serializable data class Erreur(
    val titre: String? = null,
    val motif: String? = null,
    val consequence: String? = null,
    val reference: String? = null,
    val libelle: String? = null,
    val sortie: String? = null,
)
