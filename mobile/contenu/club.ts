import type { IconName } from '../ds';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LES HUIT ONGLETS DU CLUB — une seule liste, lue par le hub ET par la bande.
 *
 * ⛔ LA BANDE N'AVAIT JAMAIS ÉTÉ PORTÉE. `club/_layout.tsx` rendait un `<Stack>` nu : passer
 * d'un onglet à l'autre exigeait un retour au hub, et cinq onglets sur huit n'étaient
 * atteignables par aucun geste. C'est le défaut que le lot 5 du kit existait pour corriger
 * (`DS_Final/ui_kits/native/NativeShell.js`, `BandeClub`). Trouvé par la réécriture Kotlin
 * (abandonnée), reporté ici.
 *
 * L'ORDRE EST CELUI DU KIT (`CLUB_ORDRE`), ET IL EST PORTEUR : c'est la position que la
 * personne apprend. `tests/unit/mobile-club.test.ts` compare les libellés au kit, dans l'ordre.
 *
 * C'est de la STRUCTURE, pas de la donnée : comme `portee.ts`, elle ne passe pas par
 * l'interrupteur de démonstration — ce qui route reste, ce qui raconte disparaît.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export const ONGLETS_CLUB = [
  { libelle: 'Fil', href: '/club/fil', icon: 'comment', ligne: 'Ce qui se passe cette semaine, et ton échéance en tête.' },
  { libelle: 'Discussions', href: '/club/discussions', icon: 'chat', ligne: 'La question bête se pose ici, par catégorie.' },
  { libelle: 'Membres', href: '/club/membres', icon: 'users', ligne: "L'annuaire — pas encore servi, et l'écran le dit." },
  { libelle: 'Agenda', href: '/club/agenda', icon: 'calendar', ligne: 'Sessions en ligne, ateliers à Dakar.' },
  { libelle: 'Classement', href: '/club/classement', icon: 'medal', ligne: "Par vague d'arrivée, jamais absolu." },
  { libelle: 'Opportunités', href: '/club/opportunites', icon: 'case', ligne: "Missions et appels d'offres, budget annoncé." },
  { libelle: 'Informations', href: '/club/infos', icon: 'info', ligne: "Ce qui est garanti, et ce qui ne l'est pas." },
  { libelle: 'Parrainage', href: '/club/parrainage', icon: 'gift', ligne: 'La remise va au filleul, pas à toi.' },
] as const satisfies ReadonlyArray<{ libelle: string; href: string; icon: IconName; ligne: string }>;

export type OngletClub = (typeof ONGLETS_CLUB)[number];

/** L'onglet actif d'une adresse, ou `null` (une fiche de membre, les comptes bloqués). */
export function ongletDe(chemin: string): OngletClub | null {
  return ONGLETS_CLUB.find((o) => chemin === o.href || chemin.startsWith(`${o.href}?`)) ?? null;
}
