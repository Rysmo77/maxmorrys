import type { ReactNode } from 'react';
import { Stack, router } from 'expo-router';
import { Body, Display, Eyebrow, Icon, IconButton, Screen, Surface, isIOS, useToken } from '../../ds';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * LA CONSOLE — UN SOUS-ENSEMBLE ASSUMÉ : **CINQ ÉCRANS SUR DIX-NEUF.**
 *
 * Ceux du rôle SUPPORT, c'est-à-dire ceux qu'on traite DEBOUT : un message à répondre, un
 * rendez-vous à confirmer, un prospect à qualifier. Les quatorze autres écrans
 * d'administration — publication, transactions, contenu, réglages — restent au tableau de bord
 * desktop 1440 px, qui existe déjà.
 *
 * **CE N'EST PAS UNE DETTE.** Dix-neuf écrans de gestion sur un téléphone, pour un opérateur
 * unique qui travaille au clavier sur deux ou trois colonnes, seraient une régression déguisée
 * en couverture. Le pied de chaque écran le dit — dans l'application, pas seulement ici.
 *
 * ── LE MOTIF EN TROIS ZONES, IDENTIQUE SUR LES CINQ ─────────────────────────────────────
 *   1 · LE FILTRE PAR STATUT, avec le compte de chaque étape — un zéro s'affiche.
 *   2 · UNE SEULE ACTION PAR LIGNE. Deux boutons sur une ligne de 44 px, c'est une erreur de
 *       manipulation par jour et par personne.
 *   3 · UN PIED QUI DIT CE QUE L'ÉCRAN NE COUVRE PAS. C'est ce qui empêche de chercher.
 *
 * ── ET L'ÉCRAN EST NUIT SUR UN TÉLÉPHONE EN MODE CLAIR ──────────────────────────────────
 * `dark` ouvre une portée de thème, l'équivalent natif du `.dk` du web. La console est un
 * outil de travail : elle porte la nuit du document, pas le mode du téléphone.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function ConsoleLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

export function ConsoleScreen({
  titre, sourcil, lignes, children,
}: {
  titre: string;
  sourcil: string;
  /** Le titre d'affichage, ligne par ligne — il ne se replie jamais tout seul. */
  lignes: string[];
  children: ReactNode;
}) {
  const t = useToken();

  return (
    <Screen
      territory="nuit"
      dark
      retour="Console"
      onRetour={() => (router.canGoBack() ? router.back() : router.replace('/console'))}
      titre={isIOS ? undefined : titre}
      droite={
        <IconButton label="Notifications" badge>
          <Icon name="bell" size={17} color={t('textBody')} strokeWidth={2} />
        </IconButton>
      }
    >
      <Eyebrow style={{ marginTop: 6 }}>{sourcil}</Eyebrow>
      <Display size={27} lines={lignes} style={{ marginTop: 8 }} />
      {children}
    </Screen>
  );
}

/** Le pied commun. Il est un COMPOSANT pour que les cinq écrans ne puissent pas l'oublier. */
export function PiedDePortee({ quoi }: { quoi: string }) {
  return (
    <Surface level="night" style={{ marginTop: 14, padding: 16 }}>
      <Eyebrow style={{ fontSize: 10 }}>Ce que cet écran ne couvre pas</Eyebrow>
      <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
        {quoi} Les quatorze autres écrans d'administration restent au{' '}
        <Body style={{ fontWeight: '700', fontSize: 12.5 }}>tableau de bord desktop</Body> : ils
        se travaillent au clavier, sur deux ou trois colonnes, et les porter sur un téléphone
        serait une régression déguisée en couverture.
      </Body>
    </Surface>
  );
}
