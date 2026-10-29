import type { ReactElement } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@ds';
import type { StudentLayoutContext } from '../../../../components/layout/StudentLayout';
import { ClubLocked } from '../../tabs/club/ClubScreen';

/**
 * L'ACCÈS AUX ÉCRANS NEUFS DU CLUB (Défis, Live, Profil, Publication).
 *
 * Ils sont servis hors de `ClubTab`, donc hors de son mur : sans ce garde, un compte sans
 * adhésion verrait un écran vide après un refus des règles, sans comprendre pourquoi. Le
 * garde lit l'abonnement que la coquille a déjà chargé (`StudentLayoutContext`) — aucune
 * lecture de plus. Il CACHE, il n'interdit pas : `firestore.rules` refuse la lecture de
 * toute collection `club_*` sans adhésion active.
 *
 * Renvoie `'member'`, ou l'élément à afficher à la place (chargement, ou renvoi vers le mur).
 */
export function useClubAccess(): 'member' | ReactElement {
  const ctx = useOutletContext<StudentLayoutContext | undefined>();
  const { t } = useTranslation('ecrans');
  if (!ctx || ctx.clubSubscription === undefined) {
    return <Skeleton height={320} radius="var(--r-l)" label={t('club.locked.title')} />;
  }
  if (!ctx.isClubActive) {
    return (
      <ClubLocked
        title={t('club.locked.title')}
        body={t('club.locked.body')}
        cta={t('club.locked.cta')}
        to="/mon-espace/club"
      />
    );
  }
  return 'member';
}

/** Le contexte de la coquille, pour les écrans neufs qui en lisent plus que l'adhésion. */
export function useClubShell(): StudentLayoutContext | undefined {
  return useOutletContext<StudentLayoutContext | undefined>();
}
