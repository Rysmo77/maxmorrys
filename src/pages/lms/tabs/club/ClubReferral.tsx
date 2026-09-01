import { useEffect, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button, GlassPanel, Icon, Num, Skeleton, Tag, TruthPanel } from '@ds';
import { getOrCreateReferralCode, getMyReferrals } from '../../../../lib/firestore';
import { getGamificationProfile } from '../../../../lib/gamification';
import { CLUB_PRICE_XOF, clubReferralPrice } from '../../../../lib/club/pricing';
import type { Referral } from '../../../../types';
import type { useClubData } from '../../hooks/useClubData';
import { slideUp } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

/**
 * LE PARRAINAGE — écran `ClubParrainage` du kit, tenu à ce que le produit fait vraiment.
 *
 * LE KIT AFFICHE DEUX COMPTEURS, « Partages 7 » et « Inscrits 0 ». Le produit n'en a qu'un :
 * `getMyReferrals` compte les filleuls CONVERTIS. Rien ne mesure les partages — un lien copié
 * ne laisse aucune trace côté serveur, et un compteur de partages serait donc inventé. La
 * seconde case dit ce qu'elle sait : le badge Ambassadeur, décroché ou pas.
 *
 * LES DEUX PRIX SORTENT DE `lib/club/pricing.ts`, jamais recopiés. Ce fichier existe parce que
 * le montant avait dérivé : les CGV annonçaient 10 000 F pendant que le code en débitait
 * 19 900, sur un abonnement engageant douze mois. La remise, elle, est calculée CÔTÉ SERVEUR —
 * le client n'envoie jamais de montant — et c'est pour ça que les deux nombres portent la
 * source `server` plutôt que `db`.
 *
 * L'ENCART DE VÉRITÉ EST CELUI DU KIT, à une correction près. Le kit écrit « Rien en argent,
 * et je ne vais pas te faire croire le contraire ». C'est vrai ici aussi — mais le produit
 * donne 100 XP et un badge, et les taire pour garder la phrase du kit serait mentir dans
 * l'autre sens.
 */
export default function ClubReferral({ data }: { data: ClubData }) {
  const { t } = useTranslation('club');
  const { user } = data;
  const [code, setCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const asOf = useRef(new Date()).current;

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getOrCreateReferralCode(user.uid),
      getMyReferrals(user.uid),
      getGamificationProfile(user.uid),
    ]).then(([c, refs, gam]) => {
      setCode(c);
      setReferrals(refs);
      setIsAmbassador(!!gam?.badges?.includes('ambassadeur'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const link = code ? `${window.location.origin}/inscription?ref=${code}` : '';

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => null);
  };

  const shareText = encodeURIComponent(t('referral.shareMessage', { link }));

  /* Un squelette à la forme de l'écran, jamais un rond qui tourne : il ne dit ni ce qui se
     passe, ni combien de temps, et il fait sauter la mise en page à l'arrivée du contenu. */
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 lg:mx-0">
        <Skeleton height={132} radius="var(--r-l)" label={t('referral.yourLink')} />
        <Skeleton height={104} radius="var(--r-l)" label={t('referral.yourLink')} />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton height={86} radius="var(--r-l)" label={t('referral.ambassador')} />
          <Skeleton height={86} radius="var(--r-l)" label={t('referral.ambassador')} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-2xl space-y-4 lg:mx-0"
      variants={slideUp}
      initial="hidden"
      animate="visible"
    >
      {/* Le titre et le pourquoi — la moitié haute de `ClubParrainage`. */}
      <div>
        <h3 className="font-display text-dsp-xs text-ink">{t('referral.heroTitle')}</h3>
        <p className="mt-2 text-meta leading-relaxed text-ink-2">
          {/* Interpolation par INDEX, comme `referral.heroText` juste en dessous : c'est la
              forme déjà éprouvée dans ce fichier, et les deux nombres restent des <Num>
              plutôt que des chaînes recopiées dans la traduction. */}
          <Trans
            i18nKey="referral.priceLine"
            t={t}
            components={[
              <Num value={CLUB_PRICE_XOF} source="server" asOf={asOf} unit="F" />,
              <Num value={clubReferralPrice()} source="server" asOf={asOf} unit="F" />,
            ]}
          />
        </p>
        <p className="mt-2 text-meta leading-relaxed text-ink-2">
          <Trans
            i18nKey="referral.heroText"
            t={t}
            components={[
              <span className="font-bold text-ink" />,
              <span className="font-bold text-ink" />,
              <span className="font-bold text-ink" />,
            ]}
          />
        </p>
      </div>

      {/* Le code, puis le lien qui le porte. */}
      <GlassPanel level="hero" padding={22}>
        <p className="mm-eyebrow m-0">{t('referral.yourCode')}</p>
        <p className="mt-1.5 text-[31px] tracking-[.1em]">
          <Num value={code} source="db" asOf={asOf} fallback={t('referral.noCode')} />
        </p>

        <label htmlFor="club-referral-link" className="mt-4 block text-meta-2 font-semibold text-ink-2">
          {t('referral.yourLink')}
        </label>
        <input
          id="club-referral-link"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1.5 w-full truncate rounded-m border border-[color:var(--line)] bg-[color:var(--field-bg)] px-3 py-2 text-meta text-ink-2"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <Button tone="transforme" size="sm" onClick={copy}>
            {copied ? <Icon name="check" size={15} /> : <Icon name="copy" size={15} />}
            {copied ? t('referral.copied') : t('referral.copy')}
          </Button>
          <Button tone="quiet" size="sm" href={`https://wa.me/?text=${shareText}`} target="_blank">
            <Icon name="chat" size={15} /> WhatsApp
          </Button>
          <Button tone="quiet" size="sm" href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank">
            <Icon name="send" size={15} /> X
          </Button>
          <Button tone="quiet" size="sm" href={`https://t.me/share/url?url=${encodeURIComponent(link)}`} target="_blank">
            <Icon name="send" size={15} /> Telegram
          </Button>
        </div>
      </GlassPanel>

      {/* Deux cases — et la seconde n'est pas un compteur, parce qu'il n'y a rien à compter. */}
      <div className="grid grid-cols-1 gap-3 stack:grid-cols-2">
        <GlassPanel level="flat" padding={16}>
          <p className="mm-eyebrow m-0">{t('referral.convertedTitle')}</p>
          <p className="mt-1 text-[27px]">
            <Num value={referrals.length} source="db" asOf={asOf} />
          </p>
          <p className="text-small text-ink-2">{t('referral.convertedReferrals', { count: referrals.length })}</p>
        </GlassPanel>

        <GlassPanel level="flat" padding={16}>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className={isAmbassador ? 'text-informe-txt' : 'text-ink-2'}>
              <Icon name="trophy" size={26} />
            </span>
            <div className="min-w-0">
              <p className="font-bold text-ink">{t('referral.ambassador')}</p>
              <p className="text-small text-ink-2">
                {isAmbassador ? t('referral.badgeUnlocked') : t('referral.refer1Member')}
              </p>
            </div>
            {isAmbassador && <Tag tone="ok" className="ml-auto">{t('referral.unlockedTag')}</Tag>}
          </div>
        </GlassPanel>
      </div>

      <TruthPanel
        provenTitle={t('referral.truth.provenTitle')}
        withheldTitle={t('referral.truth.withheldTitle')}
        proven={[t('referral.truth.proven1'), t('referral.truth.proven2')]}
        withheld={[t('referral.truth.withheld1'), t('referral.truth.withheld2')]}
      />
    </motion.div>
  );
}
