import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../../../../hooks/useFormat';
import { motion } from 'framer-motion';
import { Button, GlassPanel, Icon, Num, Switch, Tag, TruthPanel, type IconName } from '@ds';
import LocalizedLink from '../../../../components/shared/LocalizedLink';
import { PriceApprox } from '../../../../components/shared/PriceApprox';
import { CLUB_OPENED_AT, CLUB_PRICE_XOF, clubReferralPrice } from '../../../../lib/club/pricing';
import { CLUB_CATEGORIES } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';
import type { EnrolledFormation } from '../../hooks/useStudentData';
import { slideUp } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubSubscriptionGateProps {
  data: ClubData;
  enrolledFormations: EnrolledFormation[];
}

const FEATURES: { icon: IconName; titleKey: string; descKey: string }[] = [
  { icon: 'list', titleKey: 'feedTitle', descKey: 'feedDesc' },
  { icon: 'chat', titleKey: 'forumTitle', descKey: 'forumDesc' },
  { icon: 'video', titleKey: 'liveTitle', descKey: 'liveDesc' },
  { icon: 'bell', titleKey: 'infosTitle', descKey: 'infosDesc' },
  { icon: 'calendar', titleKey: 'eventsTitle', descKey: 'eventsDesc' },
  { icon: 'send', titleKey: 'rysmoTitle', descKey: 'rysmoDesc' },
  { icon: 'users', titleKey: 'communityTitle', descKey: 'communityDesc' },
];

/**
 * LE MUR D'ABONNEMENT — et ce qu'il est exactement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE COMPOSANT EST UN GARDE CLIENT : IL CACHE, IL N'INTERDIT PAS.
 *
 * C'est la formulation que `/403` porte déjà mot pour mot (`pages/Forbidden403.tsx`,
 * `errors.forbidden.truthBody`), et elle est aussi vraie ici. Le vrai cloisonnement est dans
 * `firestore.rules`, et il a été relu ligne à ligne avant d'écrire l'encart de vérité :
 *
 *   • `hasActiveClubSub()` — abonnement EXISTANT et `status == 'active'` — garde la LECTURE de
 *     `club_posts`, `club_events`, `club_sessions`, `club_infos`, `club_profiles`,
 *     `club_opportunities` et `club_challenges`. Sans lui, la requête est refusée par le
 *     serveur : contourner cet écran ne donne rien à lire.
 *   • `club_subscriptions/{userId}` : la personne ne peut créer son abonnement qu'avec
 *     `status == 'pending'`, et une mise à jour est refusée si elle change `status`. Seul
 *     l'administration active. Personne ne se rend membre depuis le navigateur.
 *
 * L'écran dit donc ce qui est vrai, et rien de plus.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TROIS BLOCS ONT ÉTÉ SUPPRIMÉS, ET LE KIT LES INTERDIT NOMMÉMENT.
 *
 * 1. « Rejoins {{count}} membres actifs ». La page publique du Club, dans le kit, écrit son
 *    contraire en toutes lettres : « je ne t'annoncerai pas un nombre de membres, parce qu'il
 *    serait faux, et parce que tu le vérifieras au premier écran après avoir payé ». Un
 *    compteur de membres sur un mur de vente est exactement le chiffre que le visiteur prend
 *    en défaut trente secondes après avoir payé.
 * 2. LES TÉMOIGNAGES et 3. LES NOTES EN ÉTOILES. `TruthPanel` les liste dans ses « interdits
 *    absolus, sans exception » — témoignage, note en étoiles, nombre d'avis — et il existe
 *    précisément POUR les remplacer. Les cinq étoiles étaient d'ailleurs rendues pleines
 *    quelle que soit la note, ce qui en faisait un décor, pas une mesure.
 *
 * Ce qui prend leur place : les deux panneaux « Garanti » / « En construction » de l'écran
 * `ClubGaranti` du kit, qui séparent ce qu'une personne peut tenir seule de ce qui dépend des
 * membres — et ne vendent que le premier.
 */
export default function ClubSubscriptionGate({ data, enrolledFormations }: ClubSubscriptionGateProps) {
  const { t } = useTranslation('club');
  /* La même clé que la page publique, donc la même valeur : deux écrans, une seule date. */
  const { formatMonth } = useFormat();
  const {
    isClubPending,
    clubAutoRenew, setClubAutoRenew,
    activatingClub, handleActivateClub,
  } = data;

  const asOf = useRef(new Date()).current;
  /** Le mensuel n'est PAS un prix débité : c'est l'annuel divisé par douze, et c'est écrit. */
  const monthly = Math.round(CLUB_PRICE_XOF / 12);

  return (
    <motion.div className="space-y-5" variants={slideUp} initial="hidden" animate="visible">
      {/* ── Ce que c'est, et ce que ça coûte ────────────────────────────────── */}
      <GlassPanel level="hero" padding={24}>
        <p className="mm-eyebrow m-0">{t('subscriptionGate.eyebrow')}</p>
        <h2 className="mt-2 font-display text-dsp-xs text-ink">{t('subscriptionGate.title')}</h2>
        <p className="mt-3 max-w-prose text-lede text-ink-2">{t('subscriptionGate.intro')}</p>

        <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="m-0 text-[27px] text-ink">
            <Num value={monthly} unit="F" source="server" asOf={asOf} />
            <span className="ml-1 text-meta font-normal text-ink-2">{t('subscriptionGate.perMonth')}</span>
          </p>
          <p className="m-0 text-meta text-ink-2">
            {t('subscriptionGate.billedOnce')}{' '}
            <Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} />
            <span className="block font-semibold"><PriceApprox xof={CLUB_PRICE_XOF} /></span>
          </p>
        </div>
        <p className="mt-2 text-small text-ink-2">
          {t('subscriptionGate.referredHint')}{' '}
          <Num value={clubReferralPrice()} unit="F" source="server" asOf={asOf} />
        </p>
      </GlassPanel>

      {/* ── Ce que l'abonnement ouvre ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 stack:grid-cols-2 wide:grid-cols-3">
        {FEATURES.map((feat) => (
          <GlassPanel key={feat.titleKey} level="flat" padding={18}>
            <span
              aria-hidden="true"
              className="mb-3 grid h-10 w-10 place-items-center rounded-m bg-[color-mix(in_srgb,var(--mm-violet)_12%,transparent)] text-transforme"
            >
              <Icon name={feat.icon} size={19} />
            </span>
            <p className="text-meta font-bold text-ink">{t(`subscriptionGate.features.${feat.titleKey}`)}</p>
            <p className="mt-1 text-meta-2 leading-relaxed text-ink-2">{t(`subscriptionGate.features.${feat.descKey}`)}</p>
          </GlassPanel>
        ))}
      </div>

      {/* ── Ce qui s'y échange, sans en montrer le contenu ──────────────────── */}
      <GlassPanel level="flat" padding={18}>
        <p className="text-meta font-bold text-ink">{t('subscriptionGate.trendingTitle')}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CLUB_CATEGORIES.map((c) => (
            <Tag key={c.id}>
              <Icon name={c.icon} size={13} /> {t(c.labelKey)}
            </Tag>
          ))}
        </div>
      </GlassPanel>

      {/* ── Garanti / En construction — écran `ClubGaranti` du kit ──────────── */}
      <div className="grid grid-cols-1 gap-3 stack:grid-cols-2">
        <GlassPanel level="flat" padding={20}>
          <Tag tone="ok">{t('subscriptionGate.guaranteed.tag')}</Tag>
          <p className="mt-3 font-display text-[19px] font-black leading-tight tracking-[-.03em] text-ink">
            {t('subscriptionGate.guaranteed.title')}
          </p>
          <p className="mt-2 text-meta leading-relaxed text-ink-2">{t('subscriptionGate.guaranteed.body')}</p>
        </GlassPanel>
        <GlassPanel level="flat" padding={20}>
          <Tag tone="warn">{t('subscriptionGate.building.tag')}</Tag>
          <p className="mt-3 font-display text-[19px] font-black leading-tight tracking-[-.03em] text-ink">
            {t('subscriptionGate.building.title')}
          </p>
          <p className="mt-2 text-meta leading-relaxed text-ink-2">{t('subscriptionGate.building.body')}</p>
        </GlassPanel>
      </div>

      {/* ── Ce que cet écran est, exactement ────────────────────────────────── */}
      <TruthPanel
        provenTitle={t('subscriptionGate.truth.provenTitle')}
        withheldTitle={t('subscriptionGate.truth.withheldTitle')}
        proven={[
          t('subscriptionGate.truth.proven1'),
          t('subscriptionGate.truth.proven2'),
          t('subscriptionGate.truth.proven3'),
        ]}
        withheld={[
          t('subscriptionGate.truth.withheld1', { opened: formatMonth(CLUB_OPENED_AT) }),
          t('subscriptionGate.truth.withheld2'),
        ]}
      />

      {/* ── Le renvoi doux, quand rien n'est encore commencé ────────────────── */}
      {enrolledFormations.length === 0 && !isClubPending && (
        <GlassPanel level="flat" padding={16}>
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 flex-none text-transforme"><Icon name="info" size={19} /></span>
            <div>
              <p className="text-meta font-semibold text-ink">{t('subscriptionGate.tipTitle')}</p>
              <p className="mt-0.5 text-meta-2 text-ink-2">
                {t('subscriptionGate.tipText')}{' '}
                <LocalizedLink to="/formations" className="font-semibold text-transforme underline">
                  {t('subscriptionGate.seeFormations')}
                </LocalizedLink>
              </p>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* ── L'activation ───────────────────────────────────────────────────── */}
      {isClubPending ? (
        <GlassPanel level="flat" padding={20}>
          <Tag tone="warn">{t('subscriptionGate.pendingTag')}</Tag>
          <p className="mt-3 font-bold text-ink">{t('subscriptionGate.pendingTitle')}</p>
          <p className="mt-1 max-w-prose text-meta leading-relaxed text-ink-2">
            {t('subscriptionGate.pendingText')}
            <LocalizedLink to="/contact" className="font-semibold text-transforme underline">
              {t('subscriptionGate.contactUs')}
            </LocalizedLink>.
          </p>
        </GlassPanel>
      ) : (
        <GlassPanel level="flat" padding={20}>
          <h3 className="font-bold text-ink">{t('subscriptionGate.activateTitle')}</h3>
          <p className="mt-1 text-meta text-ink-2">
            <Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} /> {t('subscriptionGate.perYear')}
          </p>

          <div className="mt-5 flex items-start justify-between gap-4">
            <span className="text-meta text-ink-2">
              {t('subscriptionGate.autoRenewLabel')}
              <span className="block text-small text-ink-2">{t('subscriptionGate.autoRenewHint')}</span>
            </span>
            <Switch
              on={clubAutoRenew}
              label={t('subscriptionGate.autoRenewLabel')}
              onChange={(on) => setClubAutoRenew(on)}
            />
          </div>

          <Button
            tone="transforme"
            loading={activatingClub}
            onClick={handleActivateClub}
            style={{ marginTop: '20px' }}
          >
            <Icon name="crown" size={17} /> {t('subscriptionGate.joinCta')}
          </Button>
        </GlassPanel>
      )}
    </motion.div>
  );
}
