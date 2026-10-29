import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button, Icon, Num, Switch, Tag } from '@ds';
import LocalizedLink from '../../../../components/shared/LocalizedLink';
import { CLUB_MEMBER_FORMATION_DISCOUNT, CLUB_PRICE_XOF, LIVE_SESSIONS_PER_MONTH } from '../../../../lib/club/pricing';
import type { useClubData } from '../../hooks/useClubData';
import type { EnrolledFormation } from '../../hooks/useStudentData';
import { slideUp } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubSubscriptionGateProps {
  data: ClubData;
  /** Gardé pour l'appelant : le mur v3 n'affiche plus le renvoi vers les formations. */
  enrolledFormations?: EnrolledFormation[];
}

/**
 * LE MUR D'ABONNEMENT — maquette `Club-Mur.dc.html` (+ `-mobile`), passe 2, lot C.
 *
 * Une carte centrée sur un fond de tuiles floutées : l'aperçu verrouillé de la maquette. Les
 * tuiles sont des AplATS — aucune publication, aucun nom, aucun compteur n'est flouté
 * derrière (FR-281 : « l'écran verrouillé ne floute rien » de réel). Deux titres selon le
 * cas : adhésion échue (la maquette) ou jamais prise.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE COMPOSANT EST UN GARDE CLIENT : IL CACHE, IL N'INTERDIT PAS.
 *
 * Le vrai cloisonnement est dans `firestore.rules` : `hasActiveClubSub()` garde la lecture
 * de toutes les collections `club_*`, et personne ne se rend membre depuis le navigateur
 * (`club_subscriptions` ne se crée qu'en `pending`). Le bouton ouvre la page de paiement
 * sécurisée du prestataire (`handleActivateClub`), seul chemin réel vers l'adhésion.
 *
 * Ni nombre de membres, ni témoignage, ni note : le kit les interdit nommément. Ce qui en
 * tient lieu, ce sont les deux panneaux « Garanti / En construction ».
 */
export default function ClubSubscriptionGate({ data }: ClubSubscriptionGateProps) {
  const { t } = useTranslation('club');
  const {
    isClubPending, clubSubscription,
    clubAutoRenew, setClubAutoRenew,
    activatingClub, handleActivateClub,
  } = data;
  const asOf = useRef(new Date()).current;
  const expired = clubSubscription?.status === 'expired'
    || (clubSubscription?.status === 'active' && new Date(clubSubscription.expiresAt).getTime() < asOf.getTime());
  const discountPct = Math.round(CLUB_MEMBER_FORMATION_DISCOUNT * 100);

  return (
    <motion.div variants={slideUp} initial="hidden" animate="visible" className="relative min-h-[760px] overflow-hidden">
      {/* L'aperçu verrouillé : des aplats, rien de réel derrière le flou. */}
      <div aria-hidden="true" className="pointer-events-none grid grid-cols-2 gap-3.5 opacity-[.55] blur-[6px] wide:grid-cols-3">
        {[
          ['320px', 'radial-gradient(90% 90% at 30% 30%, var(--mm-orange), var(--mm-corail) 45%, var(--mm-violet) 100%)'],
          ['220px', 'var(--bento)'],
          ['280px', 'radial-gradient(90% 90% at 40% 60%, var(--mm-bleu), var(--mm-violet) 55%, var(--ink) 100%)'],
          ['240px', 'var(--bento)'],
          ['300px', 'radial-gradient(90% 90% at 60% 40%, var(--mm-orange), var(--mm-orange-t) 50%, var(--ink) 100%)'],
          ['200px', 'var(--bento)'],
        ].map(([h, bg], i) => (
          <div key={i} className="rounded-card border border-[color:var(--line)]" style={{ height: h, background: bg }} />
        ))}
      </div>

      <section
        className="absolute left-1/2 top-[52%] w-[calc(100%-8px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[color:var(--line)] bg-bento p-6 stack:p-[34px]"
        style={{ boxShadow: '0 40px 80px -30px color-mix(in srgb, var(--ink) 30%, transparent)' }}
        aria-labelledby="club-gate-title"
      >
        <span
          aria-hidden="true"
          className="grid h-[52px] w-[52px] place-items-center rounded-m text-transforme"
          style={{ background: 'color-mix(in srgb, var(--mm-violet) 12%, transparent)' }}
        >
          <Icon name="lock" size={22} />
        </span>
        <h1 id="club-gate-title" className="mm-d mb-2 mt-[18px] text-[30px] text-ink stack:text-[38px]">
          {expired ? t('v3.wall.titleExpired') : t('v3.wall.titleNew')}
        </h1>
        <p className="m-0 mb-[18px] text-ink-2">{expired ? t('v3.wall.bodyExpired') : t('v3.wall.bodyNew')}</p>

        <div className="mb-[18px] grid gap-2.5 text-[13.5px] stack:grid-cols-2">
          <div className="rounded-m p-3.5 text-ink" style={{ background: 'color-mix(in srgb, var(--mm-violet) 7%, transparent)' }}>
            <b className="mb-1.5 block">{t('subscriptionGate.guaranteed.tag')}</b>
            {t('v3.wall.guaranteed', { n: LIVE_SESSIONS_PER_MONTH, pct: discountPct })}
          </div>
          <div className="rounded-m border-[1.5px] border-dashed border-[color:var(--line)] p-3.5 text-ink-2">
            <b className="mb-1.5 block">{t('subscriptionGate.building.tag')}</b>
            {t('v3.wall.building')}
          </div>
        </div>

        {isClubPending ? (
          <div className="rounded-m border border-[color:var(--line)] p-4">
            <Tag tone="warn">{t('subscriptionGate.pendingTag')}</Tag>
            <p className="mt-3 font-bold text-ink">{t('subscriptionGate.pendingTitle')}</p>
            <p className="mt-1 text-meta leading-relaxed text-ink-2">
              {t('subscriptionGate.pendingText')}
              <LocalizedLink to="/contact" className="font-semibold text-transforme underline">
                {t('subscriptionGate.contactUs')}
              </LocalizedLink>.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3.5 flex items-start justify-between gap-4">
              <span className="text-meta text-ink-2">
                {t('subscriptionGate.autoRenewLabel')}
                <span className="block text-small text-ink-2">{t('subscriptionGate.autoRenewHint')}</span>
              </span>
              <Switch on={clubAutoRenew} label={t('subscriptionGate.autoRenewLabel')} onChange={(on) => setClubAutoRenew(on)} />
            </div>
            <Button tone="transforme" loading={activatingClub} onClick={handleActivateClub}>
              {expired ? t('v3.wall.renew') : t('v3.wall.join')} · <Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} />{' '}
              {t('v3.wall.forYear')}
            </Button>
          </>
        )}
        <span className="mt-2.5 block text-center text-[12px] text-ink-3">
          {t('v3.wall.noDebit')} ·{' '}
          <LocalizedLink to="/mon-espace/tableau-de-bord" className="text-transforme underline">{t('v3.wall.backEdu')}</LocalizedLink>
        </span>
      </section>
    </motion.div>
  );
}
