import { useTranslation } from 'react-i18next';
import type { TagTone } from '@ds';
import { Avatar, Button, DocLine, GlassPanel, Num, Tag } from '@ds';
import { SiteEyebrow } from '../../../components/site';
import { useFormat } from '../../../hooks/useFormat';
import { tutorName } from '../../../lib/naming';
import type { User } from '../../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA FICHE DE COMPTE — troisième colonne de l'écran des utilisateurs.
 *
 * `handoff_tableaux_de_bord/dashboards-console.jsx` § UtilisateursDesktop.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE PANNEAU LIT. IL N'ÉDITE PAS — même partage des rôles que `LeadPanel`.
 *
 * `UserEditModal` porte déjà quatre onglets d'édition : informations, formations,
 * Club, répétiteur. Recopier ne serait-ce qu'un champ ici donnerait deux éditeurs
 * pour la même personne, à désynchroniser au premier enregistrement. Le panneau
 * montre ce que le DOCUMENT utilisateur contient déjà — donc sans une seule lecture
 * de plus — et renvoie vers la fiche complète pour tout le reste.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUATRE LIGNES DE LA MAQUETTE NE SONT PAS RENDUES, ET C'EST LA MÊME RAISON
 *
 * La maquette affiche « Inscriptions · 2 · progression 34 % », « Club · actif jusqu'au
 * 14/02/2027 », « Certificats · 0 » et « Quota répétiteur · 5 / jour ». Aucune de ces
 * quatre valeurs n'est sur le document utilisateur : elles vivent dans `enrollments`,
 * `club_subscriptions`, `certificates` et un appel serveur de quota. Les relever ici
 * ferait QUATRE lectures supplémentaires à chaque changement de sélection, dans un
 * écran dont tout l'intérêt est de faire défiler la file.
 *
 * `useAdminUsers` les charge déjà — mais seulement à l'ouverture de la fiche, et
 * c'est le bon moment : on les consulte quand on traite, pas quand on parcourt.
 * Le panneau nomme donc ce qu'il ne montre pas et dit où c'est.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * « CE QUE LA CONSOLE NE VOIT PAS » N'EST PAS UNE NOTE DE BAS DE PANNEAU.
 *
 * Les notes de la personne, la mémoire de son répétiteur et le contenu de ses messages
 * privés ne sont accessibles à AUCUN rôle d'administration. L'écrire à côté de la fiche
 * est ce qui empêche de le redemander tous les six mois — et ce qui rend visible, le
 * jour où quelqu'un l'ajoute, qu'il change quelque chose de contractuel.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const ROLE_TONE: Record<User['role'], TagTone> = {
  admin: 'stop',
  support: 'warn',
  student: 'neutral',
};

interface UserPanelProps {
  user: User | null;
  /** Vrai tant que la table n'est pas relevée : on n'annonce pas « aucun » avant de savoir. */
  loading: boolean;
  /** Date de la lecture qui a produit `user`. */
  asOf: Date;
  /**
   * Ouvre la fiche complète — c'est un RAPPEL, pas un `href` : `Button href` rend un `<a>`
   * brut, donc un rechargement de la coque et un cache de requêtes jeté.
   */
  onOpenFull: () => void;
}

export default function UserPanel({ user, loading, asOf, onOpenFull }: UserPanelProps) {
  const { t } = useTranslation('admin');
  const { formatDate } = useFormat();

  const ROLE_LABELS: Record<User['role'], string> = {
    admin: t('users.roleAdmin'),
    support: t('users.roleSupport'),
    student: t('users.roleStudent'),
  };

  if (loading) {
    return (
      <GlassPanel level="night" padding={18}>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('users.panelLoading')}</p>
      </GlassPanel>
    );
  }

  if (!user) {
    return (
      <GlassPanel level="night" padding={18}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('users.panelEyebrow')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('users.panelNone')}</p>
      </GlassPanel>
    );
  }

  const name = user.displayName || user.email || t('users.noName');
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <div className="flex items-center gap-3">
        {user.photoURL
          ? <img src={user.photoURL} alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
          : <Avatar initials={initials} size={44} />}
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-meta font-bold text-ink">{name}</p>
          <p className="m-0 truncate text-meta-2 text-ink-2">
            <Num value={user.email} source="db" asOf={asOf} />
          </p>
        </div>
        <Tag tone={ROLE_TONE[user.role]}>{ROLE_LABELS[user.role]}</Tag>
      </div>

      <GlassPanel level="night" padding={18} className="rv mt-4" style={{ ['--i' as string]: 1 }}>
        <DocLine label={t('users.docRole')} value={ROLE_LABELS[user.role]} />
        <DocLine
          label={t('users.docCreated')}
          value={<Num value={user.createdAt ? formatDate(user.createdAt) : null} source="db" asOf={asOf} />}
        />
        <DocLine label={t('users.docCity')} value={user.city || <Num value={null} source="db" asOf={asOf} />} />
        {/* Le nom du répétiteur vient de `tutorName`, jamais d'une constante : c'est un
            réglage de la personne, et la console le LIT sans jamais l'écrire. */}
        <DocLine label={t('users.docTutor')} value={tutorName(user)} />
        <DocLine
          label={t('users.docOnboarding')}
          value={user.onboardingCompleted === undefined
            ? <Num value={null} source="db" asOf={asOf} />
            : user.onboardingCompleted ? t('users.onboardingDone') : t('users.onboardingPending')}
          last
        />
      </GlassPanel>

      {/* UNE action : ouvrir la fiche complète. Le rôle s'y change, avec les trois autres
          onglets — le panneau trie, la fiche traite. */}
      <Button size="sm" tone="quiet" fullWidth onClick={onOpenFull} style={{ marginTop: '14px' }}>
        {t('users.panelOpenFull')}
      </Button>

      <GlassPanel level="night" padding={16} className="rv mt-4" style={{ ['--i' as string]: 2 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('users.panelDeferredTitle')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('users.panelDeferredBody')}</p>
      </GlassPanel>

      <GlassPanel level="night" padding={16} className="rv mt-3.5" style={{ ['--i' as string]: 3 }}>
        <SiteEyebrow style={{ marginBottom: '6px' }}>{t('users.panelBlindTitle')}</SiteEyebrow>
        <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('users.panelBlindBody')}</p>
      </GlassPanel>
    </>
  );
}
