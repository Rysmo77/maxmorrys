import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChipRow, GlassPanel, Icon, IconButton, Skeleton, Tag, type IconName } from '@ds';
import { useFormat } from '../../../hooks/useFormat';
import { slideUp } from '../../../lib/animations';
import { useClubData } from '../hooks/useClubData';
import type { ClubSubTab } from '../hooks/useClubData';
import type { EnrolledFormation } from '../hooks/useStudentData';
import ClubSubscriptionGate from './club/ClubSubscriptionGate';
import ClubFeed from './club/ClubFeed';
import ClubLeaderboard from './club/ClubLeaderboard';
import ClubMembers from './club/ClubMembers';
import ClubDiscussions from './club/ClubDiscussions';
import ClubOpportunities from './club/ClubOpportunities';
import ClubReferral from './club/ClubReferral';
import ClubEvents from './club/ClubEvents';
import ClubSessions from './club/ClubSessions';
import ClubInfos from './club/ClubInfos';
import { ClubSectionHeader } from './club/_shared';

interface ClubTabProps {
  enrolledFormations: EnrolledFormation[];
}

interface NavItem { id: ClubSubTab; icon: IconName; labelKey: string }

/** Les huit onglets du kit, dans l'ordre de `club-huit-onglets.html`. */
const NAV: NavItem[] = [
  { id: 'feed', icon: 'list', labelKey: 'tab.nav.feed' },
  { id: 'discussions', icon: 'chat', labelKey: 'tab.nav.discussions' },
  { id: 'agenda', icon: 'calendar', labelKey: 'tab.nav.agenda' },
  { id: 'members', icon: 'users', labelKey: 'tab.nav.members' },
  { id: 'leaderboard', icon: 'trophy', labelKey: 'tab.nav.leaderboard' },
  { id: 'opportunities', icon: 'case', labelKey: 'tab.nav.opportunities' },
  { id: 'infos', icon: 'bell', labelKey: 'tab.nav.infos' },
  { id: 'referral', icon: 'gift', labelKey: 'tab.nav.referral' },
];

/**
 * LE CLUB — l'un des cinq écrans du produit qui portent la barre d'onglets, et ses huit
 * sous-onglets.
 *
 * TROIS CHOSES ONT DISPARU DE CET EN-TÊTE, ET AUCUNE N'ÉTAIT COSMÉTIQUE.
 *
 * 1. LE NOMBRE DE MEMBRES ACTIFS. `TruthPanel` le range dans ses « interdits absolus, sans
 *    exception », et la page publique du Club, dans le kit, écrit pourquoi : « je ne
 *    t'annoncerai pas un nombre de membres, parce qu'il serait faux ». L'appel à
 *    `getClubActiveMemberCount()` part avec lui — une lecture Firestore de moins à chaque
 *    ouverture du Club, sur un appareil à 2 Go de mémoire qui EST le marché visé.
 * 2. LA PASTILLE DE RANG. Elle déclenchait un `getClubLeaderboard()` complet rien que pour
 *    lire un numéro déjà affiché, en entier, sur l'onglet Classement. Deuxième lecture
 *    évitée, zéro information perdue.
 * 3. LE MENU « PLUS ». Quatre onglets visibles et quatre cachés derrière un menu déroulant,
 *    avec son écouteur de clic global et sa fermeture au clic extérieur — pour un contrôle
 *    que `ChipRow` fait défiler nativement. Les huit sont désormais atteignables au geste,
 *    dans l'ordre du kit, sans qu'aucun ne soit relégué.
 *
 * ⚠️ CE QUE LE KIT MONTRE ICI ET QUE LE PRODUIT N'A PAS : son panneau `Bilan` (« ce que ton
 * abonnement t'a apporté : 6 sessions suivies, 14 opportunités vues, 2 missions décrochées »)
 * n'a aucun équivalent en base — rien ne compte les sessions suivies ni les missions
 * décrochées. Il n'est pas maquetté avec des zéros : trois compteurs à zéro qui ne bougeront
 * jamais disent quelque chose de faux sur le produit, pas sur l'abonnement.
 */
export default function ClubTab({ enrolledFormations }: ClubTabProps) {
  const { t } = useTranslation('club');
  const { locale } = useFormat();
  const data = useClubData();
  const { loadingClub, isClubActive, clubSubscription, clubTab, setClubTab, handleRefresh } = data;

  const labels = useMemo(() => NAV.map((it) => t(it.labelKey)), [t]);
  const activeIndex = Math.max(0, NAV.findIndex((it) => it.id === clubTab));

  if (loadingClub) {
    return (
      <div className="space-y-5">
        <Skeleton height={82} radius="var(--r-l)" label={t('tab.memberActive')} />
        <Skeleton height={40} radius="var(--r-pill)" label={t('tab.navLabel')} />
        <Skeleton height={260} radius="var(--r-l)" label={t('tab.memberActive')} />
      </div>
    );
  }

  if (!isClubActive) {
    return <ClubSubscriptionGate data={data} enrolledFormations={enrolledFormations} />;
  }

  const expiresAt = new Date(clubSubscription!.expiresAt);

  return (
    <motion.div className="space-y-5" variants={slideUp} initial="hidden" animate="visible">
      {/* ── L'état de l'abonnement ─────────────────────────────────────────── */}
      <GlassPanel level="flat" padding={18}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 flex-none place-items-center rounded-m bg-[image:var(--action-transforme)]"
            >
              <Icon name="crown" size={19} color="var(--paper-fixed)" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{t('tab.memberActive')}</p>
              <p className="truncate text-meta-2 text-ink-2">
                {t('tab.expiresOn', {
                  date: expiresAt.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
                })}
                {clubSubscription!.autoRenew ? t('tab.autoRenew') : t('tab.manual')}
              </p>
            </div>
          </div>
          <div className="flex flex-none items-center gap-2">
            <Tag tone="ok">{t('tab.statusActive')}</Tag>
            <IconButton label={t('tab.refresh')} onClick={handleRefresh}>
              <Icon name="repeat" size={17} />
            </IconButton>
          </div>
        </div>
      </GlassPanel>

      {/* ── Les huit onglets, tous atteignables ────────────────────────────── */}
      <ChipRow
        label={t('tab.navLabel')}
        options={labels}
        value={labels[activeIndex]}
        onChange={(option) => {
          const idx = labels.indexOf(option);
          if (idx >= 0) setClubTab(NAV[idx].id);
        }}
      />

      {/* ── Le contenu ─────────────────────────────────────────────────────── */}
      {clubTab === 'feed' && <ClubFeed data={data} />}
      {clubTab === 'members' && <ClubMembers data={data} />}
      {clubTab === 'discussions' && <ClubDiscussions data={data} />}
      {clubTab === 'agenda' && (
        <div className="space-y-8">
          <div>
            <ClubSectionHeader icon="calendar" title={t('tab.upcomingEvents')} />
            <ClubEvents data={data} />
          </div>
          <div>
            <ClubSectionHeader icon="video" title={t('tab.liveSessions')} />
            <ClubSessions data={data} />
          </div>
        </div>
      )}
      {clubTab === 'leaderboard' && <ClubLeaderboard data={data} />}
      {clubTab === 'opportunities' && <ClubOpportunities data={data} />}
      {clubTab === 'infos' && <ClubInfos data={data} />}
      {clubTab === 'referral' && <ClubReferral data={data} />}
    </motion.div>
  );
}
