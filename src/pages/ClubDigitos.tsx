import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, CheckLine, GlassPanel, Icon, MediaCard, Num, SubNav, Tag, TruthPanel, type IconName } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { PriceApprox, PriceFootnote } from '../components/shared/PriceApprox';
import { CLUB_PRICE_XOF, clubReferralPrice } from '../lib/club/pricing';
import { RYSMO_BASE_DAILY, RYSMO_CLUB_DAILY } from '../lib/rysmo/quota';
import { getPublishedPodcasts } from '../lib/firestore/content';
import { queryKeys } from '../lib/queryClient';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /club-des-digitos — LA PAGE PUBLIQUE DU CLUB.  Kit : `site-public/Pages.js` § Transforme.
 *
 * C'était le dernier écran du site public à n'exister que dans le kit. Le pôle média pointait
 * déjà vers lui (`MediaPole`, sous-navigation du territoire) : le lien tombait sur la page 404.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CETTE PAGE VEND, ET CE QU'ELLE REFUSE DE VENDRE
 *
 * Le Club est le seul produit du catalogue dont la valeur dépend en partie d'AUTRES GENS —
 * la densité du fil, la qualité de l'entraide, le nombre de missions que les membres
 * partagent. Une page de vente ordinaire réglerait ça avec un compteur de membres et trois
 * témoignages. Ici les deux sont interdits, et pas par pudeur : le Club a ouvert cette année,
 * le nombre serait faible, et la personne le vérifie AU PREMIER ÉCRAN APRÈS AVOIR PAYÉ.
 *
 * La page fait donc l'inverse : elle sépare explicitement ce qu'une personne peut tenir seule
 * de ce qui dépend des membres, et ne vend que le premier. C'est l'écran `ClubGaranti` du kit,
 * et c'est le même découpage que le mur d'abonnement de l'espace apprenant
 * (`lms/tabs/club/ClubSubscriptionGate`) — d'où la réutilisation littérale de ses deux
 * panneaux : le même engagement ne se reformule pas d'un écran à l'autre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES NOMBRES DE CETTE PAGE, UN PAR UN
 *
 * Tout ce qui s'affiche en monospace ici est une PROMESSE FAITE AVANT PAIEMENT, donc
 * vérifiable après. Chacun porte sa source :
 *
 *   • le prix, le mensuel et le prix parrainé  → `lib/club/pricing`, la constante que le
 *     serveur débite (le mensuel est l'annuel divisé par douze, et la page le dit) ;
 *   • 5 questions par jour au lieu de 2        → `lib/rysmo/quota`, miroir vérifié des deux
 *     backends par `tests/unit/rysmo-quota.test.ts` ;
 *   • 2 sessions en direct par mois            → engagement éditorial de l'offre, cité comme
 *     tel. Ce n'est pas une mesure, et ça ne se présente pas comme une mesure.
 *
 * Aucun autre chiffre. Pas de nombre de membres, pas de note, pas de témoignage.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** L'engagement éditorial du Club, cité là où il s'affiche. Ce n'est pas un relevé. */
const LIVE_SESSIONS_PER_MONTH = 2;

/**
 * Les huit onglets — et ce sont bien les huit du produit, pas huit du kit.
 * Les libellés sont lus dans `club.tab.nav`, la table que l'espace apprenant utilise pour sa
 * propre barre : la page de vente et l'écran vendu nomment donc les mêmes choses des mêmes
 * mots, ce qu'une seconde liste de libellés aurait perdu au premier renommage.
 */
const TABS: { key: string; glyph: IconName; tint: string; ink: string }[] = [
  { key: 'feed', glyph: 'list', tint: 'var(--mm-violet)', ink: 'var(--mm-violet-t)' },
  { key: 'discussions', glyph: 'chat', tint: 'var(--mm-violet)', ink: 'var(--mm-violet-t)' },
  { key: 'members', glyph: 'users', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)' },
  { key: 'agenda', glyph: 'calendar', tint: 'var(--mm-bleu)', ink: 'var(--mm-bleu)' },
  { key: 'leaderboard', glyph: 'bars', tint: 'var(--mm-teal)', ink: 'var(--mm-teal-t)' },
  { key: 'opportunities', glyph: 'case', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)' },
  { key: 'infos', glyph: 'info', tint: 'var(--mm-orange)', ink: 'var(--mm-orange-t)' },
  { key: 'referral', glyph: 'plus', tint: 'var(--mm-corail)', ink: 'var(--mm-corail-t)' },
];

/** Le fond d'un puits d'icône : la teinte du territoire, très diluée. */
const well = (tint: string) => ({ background: `color-mix(in srgb, ${tint} 14%, transparent)` });

export default function ClubDigitos() {
  const { t } = useTranslation('club');
  /* Les six libellés de navigation ne sont pas traduits, ils sont ÉCRITS, et ils vivent dans
     `nav` — la même table que la barre haute. Les renvois vers les trois autres territoires
     les reprennent mot pour mot plutôt que d'en réécrire une variante. */
  const { t: tNav } = useTranslation('nav');
  const path = useLocalizedPath();

  /*
   * La date de relevé des montants. `useRef` et non `new Date()` dans le corps : sans cela
   * elle change à chaque rendu, et un `<Num>` mémoïsé sur `asOf` se recalculerait pour rien.
   */
  const asOf = useRef(new Date()).current;

  /** Le mensuel n'est PAS un prix débité : c'est l'annuel divisé par douze, et c'est écrit. */
  const monthly = Math.round(CLUB_PRICE_XOF / 12);

  /*
   * « Avant de payer, écoute-les » — le vrai premier épisode, ou rien. Le kit y met un
   * épisode de démonstration avec sa durée et son poids ; un média inventé sur une page de
   * vente est exactement ce que la règle 6 interdit, et l'état vide dit la vérité à sa place.
   */
  const { data: podcasts = [] } = useQuery({
    queryKey: queryKeys.publishedPodcasts,
    queryFn: () => getPublishedPodcasts(),
  });
  const firstEpisode = podcasts[0];

  /*
   * `returnObjects` rend la CLÉ, une chaîne, tant que le namespace n'est pas là — et
   * `.map` sur une chaîne fait tomber la page. Le chargement par route le garantit avant le
   * montage, mais pas pendant une bascule de langue, où les bundles se rechargent.
   */
  const faqRaw = t('publicPage.faq', { returnObjects: true });
  const faq: { q: string; a: string }[] = Array.isArray(faqRaw) ? faqRaw : [];

  return (
    <DsNavHost>
      <SEOHead title={t('publicPage.seoTitle')} description={t('publicPage.seoDescription')} />
      {/*
        Les quatre questions de la page sont les mêmes pour un moteur que pour un lecteur.
        Aucune donnée structurée d'offre ni d'avis : `AggregateRating` sur un club fermé sans
        avis vérifiable est précisément le chiffre inventé que le système refuse.
      */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }} />

      <PageSite>
        {/*
          LES DEUX ÉTAGES DU TERRITOIRE, montrés ensemble — garde-fou n° 1 du violet.
          « Je te transforme » mêle du gratuit ouvert et du payant fermé ; sans cette
          séparation visible, quelqu'un croit le podcast derrière le mur et ne clique pas.
          La même sous-navigation ouvre le pôle média, avec l'autre entrée active.
        */}
        <SubNav
          label={t('publicPage.subnavLabel')}
          active={t('publicPage.subnavClub')}
          items={[
            { label: t('publicPage.subnavFree'), href: path('/podcast-et-videos'), territory: 'transforme' },
            { label: t('publicPage.subnavClub'), href: path('/club-des-digitos'), territory: 'transforme' },
          ]}
        />

        {/* ── 1 · Le héros, et ce que l'abonnement contient exactement ─────────── */}
        <div className="mm-arc-host mt-[26px] grid items-center gap-12 wide:grid-cols-[1.08fr_.92fr]">
          <div>
            <SiteEyebrow>{t('publicPage.eyebrow')}</SiteEyebrow>
            <SiteDisplay arc lines={t('publicPage.titleLines', { returnObjects: true }) as string[]} size={58} from={1} />

            <p className="rv mt-[18px] max-w-[44ch] text-[17px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 4 }}>
              {t('publicPage.lede')}
            </p>

            <div className="rv mt-[26px] flex flex-wrap items-center gap-3" style={{ ['--i' as string]: 5 }}>
              {/*
                « Je rejoins le Club » NAVIGUE vers l'onglet du Club de l'espace apprenant.
                C'est le seul endroit où l'abonnement se crée, et il est gardé : une personne
                déconnectée passe par la connexion et revient ici. Aucun tunnel de paiement
                n'est ouvert depuis une page publique — le montant se recalcule côté serveur.
              */}
              <Button href={path('/mon-espace/club')} tone="transforme" fullWidth={false}>
                {t('publicPage.cta')}
              </Button>
              <span className="text-meta text-ink-2">
                <b className="text-[16px] text-ink"><Num value={monthly} unit="F" source="server" asOf={asOf} /></b>
                {' '}{t('publicPage.perMonth')}
                <br />
                {t('publicPage.billedPre')}{' '}
                <b><Num value={CLUB_PRICE_XOF} unit="F" source="server" asOf={asOf} /></b>{' '}
                {t('publicPage.billedPost')}
                <br />
                <PriceApprox xof={CLUB_PRICE_XOF} />
              </span>
            </div>

            <p className="rv mt-[14px] text-small text-ink-2" style={{ ['--i' as string]: 6 }}>
              {t('publicPage.referralPre')}{' '}
              <b><Num value={clubReferralPrice()} unit="F" source="server" asOf={asOf} /></b>.
            </p>
          </div>

          {/* Faux verre : le flou est réservé au chrome en position fixe (AD-4). */}
          <GlassPanel level="flat" padding={26} className="rv" style={{ ['--i' as string]: 6 }}>
            <SiteEyebrow style={{ margin: 0 }}>{t('publicPage.includedTitle')}</SiteEyebrow>
            <div className="mt-3">
              <CheckLine>
                <Num
                  value={LIVE_SESSIONS_PER_MONTH}
                  source={{ cite: t('publicPage.sessionsCite') }}
                  asOf={asOf}
                />{' '}
                {t('publicPage.included.sessionsPost')}
              </CheckLine>
              <CheckLine>{t('publicPage.included.missions')}</CheckLine>
              <CheckLine>{t('publicPage.included.workshops')}</CheckLine>
              <CheckLine>{t('publicPage.included.answer')}</CheckLine>
              <CheckLine>
                {t('publicPage.included.tutorPre')}{' '}
                <Num value={RYSMO_CLUB_DAILY} source="server" asOf={asOf} />{' '}
                {t('publicPage.included.tutorMid')}{' '}
                <Num value={RYSMO_BASE_DAILY} source="server" asOf={asOf} />
              </CheckLine>
            </div>
            <div className="my-[18px] h-px bg-[color:var(--border-hair)]" />
            <p className="m-0 text-meta leading-[1.55] text-ink-2">{t('publicPage.includedNote')}</p>
          </GlassPanel>
        </div>

        {/* ── 2 · Garanti / En construction ────────────────────────────────────── */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={t('publicPage.guaranteeTitle', { returnObjects: true }) as string[]} size={34} />

          <div className="mt-6 grid gap-4 stack:grid-cols-2">
            {/*
              Les deux panneaux sont ceux du mur d'abonnement, mot pour mot. Le kit les dessine
              une fois (`ClubGaranti`) et le produit les montre deux fois — avant l'achat et
              après. Deux rédactions du même engagement, c'est une occasion de le contredire.
            */}
            <GlassPanel level="flat" padding={24} className="rv" style={{ ['--i' as string]: 1 }}>
              <Tag tone="ok">{t('subscriptionGate.guaranteed.tag')}</Tag>
              <p className="mt-3 mb-0 font-display text-[20px] font-black tracking-[-.03em] text-ink">
                {t('subscriptionGate.guaranteed.title')}
              </p>
              <p className="mt-[9px] mb-0 text-[14.5px] leading-[1.6] text-ink-2">
                {t('subscriptionGate.guaranteed.body')}
              </p>
            </GlassPanel>
            <GlassPanel level="flat" padding={24} className="rv" style={{ ['--i' as string]: 2 }}>
              <Tag tone="warn">{t('subscriptionGate.building.tag')}</Tag>
              <p className="mt-3 mb-0 font-display text-[20px] font-black tracking-[-.03em] text-ink">
                {t('subscriptionGate.building.title')}
              </p>
              <p className="mt-[9px] mb-0 text-[14.5px] leading-[1.6] text-ink-2">
                {t('subscriptionGate.building.body')}
              </p>
            </GlassPanel>
          </div>

          <GlassPanel level="truth" className="rv mt-5 max-w-[74ch]" style={{ ['--i' as string]: 3 }}>
            <SiteEyebrow style={{ margin: '0 0 7px' }}>{t('publicPage.guaranteeTruthTitle')}</SiteEyebrow>
            <p className="m-0 text-meta-2 leading-[1.6] text-ink-2">{t('publicPage.guaranteeTruthBody')}</p>
          </GlassPanel>
        </div>

        {/* ── 3 · Les huit onglets ─────────────────────────────────────────────── */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={t('publicPage.tabsTitle', { returnObjects: true }) as string[]} size={34} />
          <div className="mt-6 grid gap-[14px] stack:grid-cols-2 wide:grid-cols-4">
            {TABS.map((tab, i) => (
              <GlassPanel key={tab.key} level="flat" padding={18} className="rv" style={{ ['--i' as string]: (i % 4) + 1 }}>
                <span aria-hidden="true" className="grid h-[34px] w-[34px] place-items-center rounded-[11px]" style={well(tab.tint)}>
                  <Icon name={tab.glyph} size={18} color={tab.ink} />
                </span>
                <p className="mt-[11px] mb-0 text-[14.5px] font-bold text-ink">{t(`tab.nav.${tab.key}`)}</p>
                <p className="mt-[5px] mb-0 text-meta-2 leading-[1.5] text-ink-2">{t(`publicPage.tabs.${tab.key}`)}</p>
              </GlassPanel>
            ))}
          </div>
        </div>

        {/* ── 4 · Un prix, dit des deux façons ─────────────────────────────────── */}
        <div className="mm-section grid items-center gap-10 wide:grid-cols-2">
          <div>
            <SiteDisplay as="h2" lines={t('publicPage.priceTitle', { returnObjects: true }) as string[]} size={34} />
            <p className="rv mt-[14px] max-w-[44ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 4 }}>
              {t('publicPage.priceBody')}
            </p>
            <GlassPanel level="flat" padding={22} className="rv mt-[22px] max-w-[46ch]" style={{ ['--i' as string]: 5 }}>
              <SiteEyebrow style={{ margin: 0 }}>{t('publicPage.renewalTitle')}</SiteEyebrow>
              {/*
                CE PARAGRAPHE RESTE UN AVEU, MAIS IL A CHANGÉ D'OBJET.

                Il disait « le préavis que promettent les conditions générales n'est pas
                encore implémenté ». Il l'est désormais : cron quotidien sur le Worker,
                e-mail à J-15 (`worker/apps/api/src/lib/renewal.ts`).

                Ce qui n'existe toujours pas, et n'existera pas sur ces rails, c'est le
                PRÉLÈVEMENT automatique. Bictorys n'expose aucun endpoint de récurrent, sa
                tokenisation est réservée aux cartes et redemande le CVV à chaque charge, et
                Wave n'a pas de mandat récurrent du tout. Un prélèvement automatique ne
                serait donc possible qu'en carte — pour la minorité, en excluant le marché
                pour lequel le produit existe.

                La page nomme donc la contrainte au lieu de la masquer : rien n'est prélevé,
                et on prévient à temps. C'est le maximum honnête, et le dire vaut mieux que
                laisser quelqu'un le découvrir le jour où son accès s'arrête.
              */}
              <p className="mt-2 mb-0 text-[14.5px] leading-[1.6] text-ink-2">{t('publicPage.renewalBody')}</p>
            </GlassPanel>
          </div>

          <GlassPanel level="hero" padding={30} className="rv" style={{ ['--i' as string]: 6 }}>
            <p className="m-0 flex flex-wrap items-baseline gap-[10px]">
              <b className="text-[52px] tracking-[-.045em] text-transforme">
                <Num value={monthly} source="server" asOf={asOf} />
              </b>
              <span className="text-[16px] font-semibold text-ink">{t('publicPage.priceUnit')}</span>
            </p>
            <p className="mt-2 mb-0 text-[14.5px] text-ink-2">
              {t('publicPage.priceBilledPre')}{' '}
              <b className="text-ink"><Num value={CLUB_PRICE_XOF} unit="FCFA" source="server" asOf={asOf} /></b>
              {t('publicPage.priceBilledPost')}
            </p>
            {/* La contrevaleur porte l'ANNUEL, pas le mensuel affiché en 52 px au-dessus :
                c'est l'annuel qui est prélevé, et c'est lui que quelqu'un qui compte en euros
                ou en dollars a besoin de reconnaître sur son relevé bancaire. */}
            <p className="mt-1 mb-0 text-[13px] font-semibold text-ink-2">
              <PriceApprox xof={CLUB_PRICE_XOF} />
            </p>

            <Button href={path('/mon-espace/club')} tone="transforme" style={{ marginTop: '20px' }}>
              {t('publicPage.cta')}
            </Button>

            <div className="mt-[14px] flex flex-wrap gap-2">
              <Tag>{t('publicPage.payWave')}</Tag>
              <Tag>{t('publicPage.payOrange')}</Tag>
              <Tag>{t('publicPage.payCard')}</Tag>
            </div>

            <div className="my-5 h-px bg-[color:var(--border-hair)]" />

            <div className="flex items-center justify-between gap-3">
              <span className="text-meta text-ink-2">{t('publicPage.referralRow')}</span>
              <b className="text-[16px] text-ink"><Num value={clubReferralPrice()} unit="F" source="server" asOf={asOf} /></b>
            </div>
            <p className="mt-[9px] mb-0 text-small text-ink-2">{t('publicPage.referralNote')}</p>
            <PriceFootnote className="mt-[9px] mb-0" />
          </GlassPanel>
        </div>

        {/* ── 5 · Et si ce n'est pas pour toi ──────────────────────────────────── */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={t('publicPage.fitTitle', { returnObjects: true }) as string[]} size={34} />
          <div className="mt-6 grid gap-4 stack:grid-cols-2">
            <GlassPanel level="flat" padding={24} className="rv" style={{ ['--i' as string]: 1 }}>
              <p className="m-0 font-display text-[19px] font-black tracking-[-.03em] text-ink">
                {t('publicPage.fitYesTitle')}
              </p>
              <CheckLine tone="ok">{t('publicPage.fitYes1')}</CheckLine>
              <CheckLine tone="ok">{t('publicPage.fitYes2')}</CheckLine>
              <CheckLine tone="ok">{t('publicPage.fitYes3')}</CheckLine>
            </GlassPanel>

            {/*
              LE RENVOI VERS LES AUTRES TERRITOIRES — et il est complet, pas décoratif : les
              trois lignes couvrent les trois autres verbes. Une page de vente qui ne nomme
              aucune sortie fait payer des gens à qui elle ne convient pas, qui demandent un
              remboursement, et qui ne reviennent pas.
            */}
            <GlassPanel level="flat" padding={24} className="rv" style={{ ['--i' as string]: 2 }}>
              <p className="m-0 font-display text-[19px] font-black tracking-[-.03em] text-ink">
                {t('publicPage.fitNoTitle')}
              </p>
              <CheckLine tone="neutre" dash>
                {t('publicPage.fitNo1')}{' '}
                <a className="font-semibold text-forme underline" href={path('/formations')}>{tNav('formations')}</a>
              </CheckLine>
              <CheckLine tone="neutre" dash>
                {t('publicPage.fitNo2')}{' '}
                <a className="font-semibold text-digitalise-txt underline" href={path('/presence-digitale')}>{tNav('presence')}</a>
              </CheckLine>
              <CheckLine tone="neutre" dash>
                {t('publicPage.fitNo3')}{' '}
                <a className="font-semibold text-informe-txt underline" href={path('/blog')}>{tNav('blog')}</a>
                {t('publicPage.fitNo3End')}
              </CheckLine>
            </GlassPanel>
          </div>
        </div>

        {/* ── 6 · Les questions qu'on me pose ──────────────────────────────────── */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={t('publicPage.faqTitle', { returnObjects: true }) as string[]} size={34} />
          <GlassPanel level="flat" padding="8px 26px" className="rv mt-[22px]" style={{ ['--i' as string]: 4 }}>
            {faq.map((item, i) => (
              <div key={item.q} className={i === 0 ? 'py-4' : 'border-t border-[color:var(--border-hair)] py-4'}>
                <p className="m-0 text-[14.5px] font-bold text-ink">{item.q}</p>
                <p className="mt-[6px] mb-0 text-meta leading-[1.6] text-ink-2">{item.a}</p>
              </div>
            ))}
          </GlassPanel>
        </div>

        {/* ── 7 · Avant de payer, écoute-les ───────────────────────────────────── */}
        <div className="mm-section">
          <SiteDisplay as="h2" lines={t('publicPage.listenTitle', { returnObjects: true }) as string[]} size={34} />
          <p className="rv mt-[14px] max-w-[62ch] text-[15.5px] leading-[1.6] text-ink-2" style={{ ['--i' as string]: 4 }}>
            {t('publicPage.listenLede')}
          </p>

          <div className="mt-6 grid items-center gap-4 wide:grid-cols-[1.1fr_.9fr]">
            {firstEpisode ? (
              <div className="rv" style={{ ['--i' as string]: 5 }}>
                <MediaCard
                  format="audio"
                  artHeight={150}
                  titleSize={21}
                  eyebrow={firstEpisode.duration}
                  title={firstEpisode.title}
                  playHref={path(`/podcasts/${firstEpisode.slug}`)}
                  playLabel={`${t('publicPage.listenCta')} — ${firstEpisode.title}`}
                  actions={
                    <Button href={path('/podcast-et-videos')} tone="quiet" size="sm" fullWidth={false}>
                      {t('publicPage.listenCta')}
                    </Button>
                  }
                />
              </div>
            ) : (
              /* L'état vide dit ce qui manque et où ça arrivera. Jamais un cadre gris muet. */
              <p className="rv max-w-prose text-lede text-ink-2" style={{ ['--i' as string]: 5 }}>
                {t('publicPage.listenEmpty')}
              </p>
            )}

            <GlassPanel level="truth" className="rv" style={{ ['--i' as string]: 6 }}>
              <SiteEyebrow style={{ margin: '0 0 7px' }}>{t('publicPage.listenTruthTitle')}</SiteEyebrow>
              <p className="m-0 text-meta leading-[1.6] text-ink-2">{t('publicPage.listenTruthBody')}</p>
            </GlassPanel>
          </div>
        </div>

        {/* ── 8 · Ce que la page n'affiche pas, nommé ──────────────────────────── */}
        <TruthPanel
          className="mt-[22px]"
          provenTitle={t('publicPage.truthProvenTitle')}
          withheldTitle={t('subscriptionGate.truth.withheldTitle')}
          proven={[t('subscriptionGate.truth.proven2'), t('subscriptionGate.truth.proven3')]}
          withheld={[t('subscriptionGate.truth.withheld1'), t('subscriptionGate.truth.withheld2')]}
        />

        {/* ── 9 · La dalle d'encre finale ──────────────────────────────────────── */}
        {/*
          `.dk` posé sur la dalle : le thème est une PORTÉE, jamais une prop (AD-3). Les 78
          jetons basculent d'un coup — l'encre, le verre, le violet qui prend sa variante nuit
          lisible — et aucune couleur n'est écrite dans ce fichier.
        */}
        <div className="dk rv-s mm-section rounded-xl bg-night p-[34px] text-[color:var(--text-body)]">
          <div className="grid items-center gap-10 wide:grid-cols-[1.2fr_.8fr]">
            <div>
              <h2 className="m-0 font-display text-[34px] font-black leading-[1.05] tracking-[-.03em] text-ink">
                {t('publicPage.finalPre')}{' '}
                <b className="font-bold"><Num value={monthly} unit="F" source="server" asOf={asOf} /></b>{' '}
                {t('publicPage.finalPost')}
                <br />
                {t('publicPage.finalSecondLine')}
              </h2>
              <p className="mt-3 mb-0 max-w-[48ch] text-[14px] leading-[1.6] text-ink-2">
                {t('publicPage.finalBody')}
              </p>
            </div>
            <div className="flex flex-col gap-[10px]">
              <Button href={path('/mon-espace/club')} tone="transforme">{t('publicPage.cta')}</Button>
              <Button href={path('/contact')} tone="ghost">{t('publicPage.finalCtaSecondary')}</Button>
            </div>
          </div>
        </div>
      </PageSite>
    </DsNavHost>
  );
}
