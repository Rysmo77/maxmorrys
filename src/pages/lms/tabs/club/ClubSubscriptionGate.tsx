import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../../../../hooks/useFormat';
import { motion } from 'framer-motion';
import { Button, Icon, Num, Switch, Tag, TruthPanel, type IconName } from '@ds';
import LocalizedLink from '../../../../components/shared/LocalizedLink';
import { PriceApprox } from '../../../../components/shared/PriceApprox';
import { CLUB_OPENED_AT, CLUB_PRICE_XOF, clubReferralPrice } from '../../../../lib/club/pricing';
import { CLUB_CATEGORIES } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';
import type { EnrolledFormation } from '../../hooks/useStudentData';
import { slideUp } from '../../../../lib/animations';
import { ClubCard } from './_shared';

type ClubData = ReturnType<typeof useClubData>;

/** Le kit écrit `#fff` en dur sur `mm-price` et `mm-offer__c` : la tuile bento bascule sous `.dk`, pas lui. */
const BENTO = { background: 'var(--bento)' };

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
  /* Le vocabulaire d'appel partagé : « Voir les formations » vivait dans huit clés de huit
     catalogues avant le 18/09/2026. */
  const { t: tc } = useTranslation('common');
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

  /* Kit v3 (`ClubOffer`) : « rien en construction ne se glisse dans les six cartes ». La
     communauté dépend des membres — elle passe au bandeau en pointillés, sous la grille. */
  const guaranteed = FEATURES.filter((f) => f.titleKey !== 'communityTitle');

  return (
    <motion.div className="space-y-5" variants={slideUp} initial="hidden" animate="visible">
      {/* ── Le mur, en aperçu verrouillé : le prix ET l'action au premier écran (`mm-price`) ── */}
      <section className="mm-price" style={BENTO} aria-labelledby="club-gate-title">
        <div className="grid gap-6 wide:grid-cols-[1.1fr_.9fr] wide:items-start">
          <div className="min-w-0">
            <p className="mm-kick m-0">{t('subscriptionGate.eyebrow')}</p>
            <h2 id="club-gate-title" className="mt-3 font-display text-dsp-xs text-ink">{t('subscriptionGate.title')}</h2>
            <p className="mt-3 max-w-prose text-lede text-ink-2">{t('subscriptionGate.intro')}</p>
          </div>

          <div className="min-w-0">
            <p className="m-0 flex flex-wrap items-baseline gap-2 text-ink">
              <b className="text-[40px] leading-none tracking-[-.04em] text-transforme">
                <Num value={CLUB_PRICE_XOF} source="server" asOf={asOf} />
              </b>
              <span className="text-meta font-semibold">F {t('subscriptionGate.perYear')}</span>
            </p>
            <p className="m-0 mt-2 text-meta text-ink-2">
              <Num value={monthly} unit="F" source="server" asOf={asOf} /> {t('subscriptionGate.perMonth')}
              <span className="block font-semibold"><PriceApprox xof={CLUB_PRICE_XOF} /></span>
            </p>
            <p className="m-0 mt-2 text-small text-ink-2">
              {t('subscriptionGate.referredHint')}{' '}
              <Num value={clubReferralPrice()} unit="F" source="server" asOf={asOf} />
            </p>

            {isClubPending ? (
              <div className="mt-5 rounded-m border border-[color:var(--line)] p-4">
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
                  style={{ marginTop: '18px' }}
                >
                  <Icon name="crown" size={17} /> {t('subscriptionGate.joinCta')}
                </Button>
                <p className="m-0 mt-2.5 text-small text-ink-3">{t('subscriptionGate.noDebit')}</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Ce que l'abonnement ouvre — six cartes, toutes garanties (`mm-offer__c`) ── */}
      <div>
        <h3 className="m-0 mb-3 font-display text-[22px] font-black tracking-[-.02em] text-ink">{t('subscriptionGate.activateTitle')}</h3>
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 stack:grid-cols-2 wide:grid-cols-3">
          {guaranteed.map((feat) => (
            <li key={feat.titleKey} className="mm-offer__c" style={BENTO}>
              <span aria-hidden="true" className="mm-offer__ic bg-[color-mix(in_srgb,var(--mm-violet)_12%,transparent)] text-transforme">
                <Icon name={feat.icon} size={20} />
              </span>
              <b>{t(`subscriptionGate.features.${feat.titleKey}`)}</b>
              <span>{t(`subscriptionGate.features.${feat.descKey}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mm-build mx-0">
          <Tag tone="warn">{t('subscriptionGate.building.tag')}</Tag>
          <span className="min-w-0 flex-1">
            <b className="text-ink">{t('subscriptionGate.features.communityTitle')}</b> — {t('subscriptionGate.features.communityDesc')}
          </span>
        </p>
      </div>

      {/* ── Ce qui s'y échange, sans en montrer le contenu ──────────────────── */}
      <ClubCard padding={18}>
        <p className="text-meta font-bold text-ink">{t('subscriptionGate.trendingTitle')}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CLUB_CATEGORIES.map((c) => (
            <span key={c.id} className="mm-chipd">
              <Icon name={c.icon} size={13} /> {t(c.labelKey)}
            </span>
          ))}
        </div>
      </ClubCard>

      {/* ── Garanti / En construction — écran `ClubGaranti` du kit ──────────── */}
      <div className="grid grid-cols-1 gap-3 stack:grid-cols-2">
        <ClubCard padding={20}>
          <Tag tone="ok">{t('subscriptionGate.guaranteed.tag')}</Tag>
          <p className="mt-3 font-display text-[19px] font-black leading-tight tracking-[-.03em] text-ink">
            {t('subscriptionGate.guaranteed.title')}
          </p>
          <p className="mt-2 text-meta leading-relaxed text-ink-2">{t('subscriptionGate.guaranteed.body')}</p>
        </ClubCard>
        <ClubCard padding={20} className="border-dashed">
          <Tag tone="warn">{t('subscriptionGate.building.tag')}</Tag>
          <p className="mt-3 font-display text-[19px] font-black leading-tight tracking-[-.03em] text-ink">
            {t('subscriptionGate.building.title')}
          </p>
          <p className="mt-2 text-meta leading-relaxed text-ink-2">{t('subscriptionGate.building.body')}</p>
        </ClubCard>
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
        <ClubCard padding={16}>
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 flex-none text-transforme"><Icon name="info" size={19} /></span>
            <div>
              <p className="text-meta font-semibold text-ink">{t('subscriptionGate.tipTitle')}</p>
              <p className="mt-0.5 text-meta-2 text-ink-2">
                {t('subscriptionGate.tipText')}{' '}
                <LocalizedLink to="/formations" className="font-semibold text-transforme underline">
                  {tc('cta.formations')}
                </LocalizedLink>
              </p>
            </div>
          </div>
        </ClubCard>
      )}
    </motion.div>
  );
}
