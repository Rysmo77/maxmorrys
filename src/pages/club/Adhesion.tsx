import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import DsNavHost from '../../components/layout/DsNavHost';
import { SiteBand } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import {
  CLUB_MEMBER_FORMATION_DISCOUNT, CLUB_REFERRAL_DISCOUNT, LIVE_SESSIONS_PER_MONTH,
} from '../../lib/club/pricing';
import { RYSMO_CLUB_BONUS } from '../../lib/rysmo/quota';
import { CheckDot, HERO_TOP, PriceCard } from './parts';

/**
 * /club-des-digitos/adhesion — maquette `Club-Adhesion.dc.html` (+ `-mobile`), lot C.
 *
 * Deux colonnes : ce que l'adhésion ouvre (garanti / en construction / charte), et la carte
 * de prix. La maquette y pose un sélecteur de moyen de paiement et un champ « Numéro Wave » :
 * le produit ne les a pas sur cette page — l'abonnement se crée depuis l'espace connecté, qui
 * ouvre la page de paiement sécurisée du prestataire, où le moyen se choisit. Recopier ces
 * contrôles ferait des boutons qui n'écrivent rien. Les trois moyens sont donc ÉNONCÉS, sans
 * rien de cliquable, et le bouton mène à l'endroit où l'adhésion se crée réellement.
 */
const METHODS: { key: 'wave' | 'orange' | 'card'; mark: string; tint: string }[] = [
  { key: 'wave', mark: 'W', tint: 'var(--mm-bleu)' },
  { key: 'orange', mark: 'OM', tint: 'var(--mm-orange)' },
  { key: 'card', mark: 'CB', tint: 'var(--ink-2)' },
];

export default function ClubAdhesionPage() {
  const { t } = useTranslation('ecrans');
  const path = useLocalizedPath();
  const asOf = useRef(new Date()).current;
  const k = (s: string) => `club.adhesion.${s}`;
  const discountPct = Math.round(CLUB_MEMBER_FORMATION_DISCOUNT * 100);
  const referralPct = Math.round(CLUB_REFERRAL_DISCOUNT * 100);

  const guaranteed = [
    t(k('guaranteed.feed')),
    t(k('guaranteed.sessions'), { n: LIVE_SESSIONS_PER_MONTH }),
    t(k('guaranteed.opportunities')),
    t(k('guaranteed.discount'), { pct: discountPct }),
    t(k('guaranteed.rysmo'), { n: RYSMO_CLUB_BONUS }),
  ];
  const building = [t(k('building.replays')), t(k('building.digest')), t(k('building.circles'))];
  const charterRaw = t(k('charter.items'), { returnObjects: true });
  const charter: string[] = Array.isArray(charterRaw) ? charterRaw : [];

  return (
    <DsNavHost>
      <SEOHead title={t(k('title'))} description={t(k('seoDescription'))} noIndex />

      <section className="mm-lhero px-[18px] pb-14 stack:px-11" style={HERO_TOP}>
        <span className="mm-kick">{t(k('kick'))}</span>
        <h1 className="!text-[36px] stack:!text-[78px]">{t(k('heroA'))} <em>{t(k('heroEm'))}</em></h1>
        <p className="mm-lhero__sub !text-[16px] stack:!text-[18px]">{t(k('sub'))}</p>
      </section>

      <SiteBand style={{ paddingTop: 56, paddingBottom: 90 }}>
        <div className="grid items-start gap-12 wide:grid-cols-[minmax(0,1fr)_460px] wide:gap-14">
          <div>
            <span className="mm-kick">{t(k('opensKick'))}</span>
            <h2 className="mm-d mb-[18px] mt-3 text-[30px] text-ink stack:text-[40px]">{t(k('guaranteedTitle'))}</h2>
            <ul className="m-0 list-none p-0">
              {guaranteed.map((g) => (
                <li key={g} className="flex items-center gap-3 border-t border-[color:var(--line)] py-3.5 text-[16px] text-ink">
                  <span aria-hidden="true" className="grid h-[26px] w-[26px] flex-none place-items-center rounded-pill bg-transforme text-[color:var(--paper-fixed)]">
                    <Icon name="check" size={13} />
                  </span>
                  {g}
                </li>
              ))}
            </ul>

            <h2 className="mm-d mb-3 mt-9 text-[24px] text-ink-2 stack:text-[28px]">{t(k('buildingTitle'))}</h2>
            <ul className="m-0 list-none p-0">
              {building.map((b) => (
                <li key={b} className="flex items-center gap-3 border-t border-dashed border-[color:var(--line)] py-3 text-[15px] text-ink-2">
                  <CheckDot muted />
                  {b}
                </li>
              ))}
            </ul>

            <div
              className="mt-9 rounded-card p-[26px]"
              style={{
                background: 'color-mix(in srgb, var(--mm-violet) 6%, var(--bento))',
                border: '1px solid color-mix(in srgb, var(--mm-violet) 18%, transparent)',
              }}
            >
              <span className="mm-kick">{t(k('charter.kick'))}</span>
              <ol className="m-0 mt-3.5 flex list-decimal flex-col gap-2 pl-5 text-[15px] text-ink">
                {charter.map((c) => <li key={c}>{c}</li>)}
              </ol>
            </div>
          </div>

          <div className="order-first wide:order-none">
            <PriceCard
              asOf={asOf}
              copy={{
                title: t(k('price.title')),
                tag: t(k('price.tag')),
                perYear: t(k('price.perYear')),
                monthlyPre: t(k('price.monthlyPre')),
                monthlyPost: t(k('price.monthlyPost')),
                referralPost: t(k('price.referralPost'), { pct: referralPct }),
                items: [],
                note: t(k('price.note')),
              }}
            >
              <p className="m-0 mb-2.5 mt-5 text-[13px] font-semibold text-ink-2">{t(k('methodsTitle'))}</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {METHODS.map((m) => (
                  <li key={m.key} className="flex items-center gap-3 rounded-m border border-[color:var(--line)] bg-bento px-3.5 py-[11px]">
                    <span aria-hidden="true" className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xs text-[12px] font-black text-[color:var(--paper-fixed)]" style={{ background: m.tint }}>
                      {m.mark}
                    </span>
                    <b className="text-[14.5px] text-ink">{t(k(`methods.${m.key}`))}</b>
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-3 text-[12.5px] leading-[1.5] text-ink-3">{t(k('methodsNote'))}</p>
              <a className="mm-btn-club mt-3 w-full" href={path('/mon-espace/club')}>{t(k('cta'))}</a>
            </PriceCard>
            <p className="m-0 mt-3.5 text-center text-[13px] text-ink-3">{t(k('honesty'))}</p>
          </div>
        </div>
      </SiteBand>
    </DsNavHost>
  );
}
