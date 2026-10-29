import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Icon, LogoMark, Num, Skeleton, useToast } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { useFormat } from '../hooks/useFormat';
import { PriceApprox, PriceFootnote } from '../components/shared/PriceApprox';
import { useTranslatedContent, useTranslatedText } from '../hooks/useTranslatedContent';
import { getFormationBySlug } from '../lib/firestore';
import { estAVenir, estPrecommandable, ouverture, preuveSociale } from '../types/formationRelease';
import { useWaitlist } from '../hooks/useWaitlist';
import { useAuth } from '../contexts/AuthContext';
import type { Formation } from '../types';
import { trackViewItem, trackAddToCart } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import { contentPath } from '../lib/contentPath';
import JsonLd from '../components/seo/JsonLd';
import { SITE_NAME, buildCanonical } from '../components/seo/seo-config';
import EduCover from '../components/edu/g2/EduCover';
import EduPreFooter from '../components/edu/g2/EduPreFooter';
import { splitTitle } from '../components/edu/g2/coverTint';
import { CLUB_MEMBER_FORMATION_DISCOUNT } from '../lib/club/pricing';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /formations/:slug — LA FICHE, au gabarit de la maquette `Edu-Fiche` (passe 2, lot B).
 *
 * Ordre de la maquette : héros de nuit (retour, script niveau, titre en capitales, faits,
 * action, couverture flottante + aperçu de la leçon 1), bande de prix `mm-count`, panneau
 * orange « À la fin, tu sauras faire », programme en accordéon + certificat + formateur,
 * « Questions avant d'acheter », puis le bas de page éditorial d'Edu.
 *
 * CE QUI N'EST PAS REPRIS DE LA MAQUETTE, ET POURQUOI
 *  · Tous les nombres sont COMPTÉS dans la formation (leçons, modules, missions = leçons de
 *    type `mission`, leçons libres). « FR·EN sous-titres » n'a aucune donnée : retiré.
 *  · « À la fin, tu sauras faire » : le modèle n'a pas de liste de compétences. Les cases sont
 *    les MODULES réels, dans leur ordre — rien n'est écrit à la main.
 *  · « Cohorte du mois · un live par mois » : aucun producteur de cohorte ni de live. Retiré
 *    de la bande de prix et de la FAQ (la question « C'est quoi, la cohorte ? » attendra).
 *  · Le certificat montre le titre réel ; le nom est celui du compte connecté, sinon « Ton
 *    nom » en clair (jamais un trou `[…]`), et aucun faux code d'exemple.
 *  · « Et si la formation ne me convient pas ? » : AUCUNE promesse de remboursement (CGV
 *    art. 6) — les leçons libres, et les CGV qui font foi.
 *  · Le prix membre du Club se DÉDUIT de la constante serveur (`CLUB_MEMBER_FORMATION_DISCOUNT`
 *    = 0,2, `worker/apps/api/src/lib/bictorys.ts`) ; le montant débité reste recalculé au
 *    paiement. Contrevaleur EUR/USD sous le prix.
 *  · La description longue et les boutons de partage ne figurent pas sur la maquette : ils
 *    sont retirés de la page (la description reste dans les données structurées et le SEO).
 *  · Une formation à venir (« Bientôt ») n'a ni leçons ni tunnel : liste d'attente — ou
 *    précommande si elle est ouverte pour CETTE formation —, modules sans dépliage.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export default function FormationDetail() {
  const { t } = useTranslation('formations');
  const { slug } = useParams();
  const { language } = useLanguage();
  const { formatDate } = useFormat();
  const [formation, setFormation] = useState<Formation | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    getFormationBySlug(slug, language).then((data) => {
      setFormation(data);
      if (data) {
        trackViewItem({
          id: data.id,
          name: data.title,
          category: data.category,
          content_type: 'formation',
          price: data.promoPrice ?? data.price,
          currency: 'XOF',
        });
      }
    }).catch(() => setFormation(null));
  }, [slug, language]);

  const tFormation = useTranslatedContent(
    formation as (Formation & Record<string, unknown>) | null | undefined,
    ['title', 'description', 'longDescription', 'category'],
  ) as Formation | null | undefined;
  const seoTitle = useTranslatedText(formation ? formation.metaTitle || formation.title : '');
  const seoDescription = useTranslatedText(formation ? formation.metaDescription || formation.description : '');

  const path = useLocalizedPath();
  const { user, userData } = useAuth();
  const { addToast } = useToast();

  const aVenir = Boolean(formation && estAVenir(formation));
  const attente = useWaitlist(aVenir ? formation?.id : undefined, language, formation?.waitlistCount ?? 0);

  const rejoindreListe = async () => {
    const r = await attente.rejoindre();
    if (r === 'ok') addToast('success', t('comingSoon.toastJoined'));
    else if (r === 'deja') addToast('info', t('comingSoon.toastAlready'));
    else addToast('error', t('comingSoon.toastError'));
  };

  if (formation === undefined) {
    return (
      <section className="dk px-6" style={{ background: 'var(--night)', borderRadius: '0 0 36px 36px', paddingTop: 'calc(var(--header-h) + 40px)', paddingBottom: '60px' }}>
        <div className="mx-auto grid max-w-[1360px] gap-4">
          <Skeleton width={180} height={12} />
          <Skeleton height={90} width="70%" />
          <Skeleton height={20} width="50%" />
        </div>
      </section>
    );
  }

  if (!formation) {
    return (
      <div className="mx-auto max-w-[1360px] px-6" style={{ paddingTop: 'calc(var(--header-h) + 56px)', paddingBottom: '96px' }}>
        <h1 className="mm-d m-0 text-[44px]">{t('detail.notFoundTitle')}</h1>
        <Link className="mm-pill is-plain mt-6" to={path('/formations')}>{t('detail.notFoundLink')}</Link>
      </div>
    );
  }

  const title = tFormation?.title || formation.title;
  const category = tFormation?.category || formation.category;
  const description = tFormation?.description || formation.description;
  const { s: tail } = splitTitle(title);
  const head = title.split(/\s[:–—-]\s/)[0].trim();
  const modules = formation.modules ?? [];
  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const lessons = allLessons.length;
  const freeLessons = allLessons.filter((l) => l.isFree).length;
  const missions = allLessons.filter((l) => l.type === 'mission').length;
  const firstFree = allLessons.find((l) => l.isFree);
  const price = formation.promoPrice ?? formation.price;
  const clubPrice = Math.round(price * (1 - CLUB_MEMBER_FORMATION_DISCOUNT));
  const asOf = new Date();
  const onBuy = () => trackAddToCart({ id: formation.id, name: formation.title, category: formation.category, price, currency: 'XOF' });
  const levelLabel = t(`level.${formation.level}`, { defaultValue: formation.level });

  const precommande = estPrecommandable(formation);
  const dateOuverture = ouverture(formation);
  const attendus = preuveSociale({ ...formation, waitlistCount: attente.compte });
  const ouvertureTexte = dateOuverture
    ? (dateOuverture.kind === 'date' ? formatDate(dateOuverture.value) : dateOuverture.value)
    : null;
  const muted = 'text-[color:color-mix(in_srgb,var(--paper-fixed)_62%,transparent)]';

  const facts: { n: number; label: string }[] = [
    ...(!aVenir ? [{ n: lessons, label: t('sheet.factLessons') }] : []),
    { n: modules.length, label: t('sheet.factModules') },
    ...(!aVenir && missions > 0 ? [{ n: missions, label: t('v3.sheet.factMissions') }] : []),
  ];

  return (
    <DsNavHost>
      <SEOHead title={seoTitle} description={seoDescription} ogImage={formation.coverImage} />
      {/* Ni note ni nombre d'avis : `AggregateRating` reste retiré (aucune vente, aucun avis réel). */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: formation.title,
        description: formation.description,
        url: buildCanonical(contentPath('formations', formation, language)),
        provider: { '@type': 'Organization', name: SITE_NAME },
        offers: {
          '@type': 'Offer', price, priceCurrency: 'XOF',
          availability: aVenir ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
        },
      }} />

      {/* ── LE HÉROS DE NUIT ─────────────────────────────────────────────────── */}
      <section
        className="dk relative isolate overflow-hidden px-4 stack:px-6"
        style={{ background: 'var(--night)', borderRadius: '0 0 36px 36px', paddingTop: 'calc(var(--header-h) + 28px)' }}
      >
        <div className="mm-mesh m-edu" style={{ opacity: 0.55 }}><b /><b /><b /></div>
        <div className="relative z-[2] mx-auto grid max-w-[1360px] items-center gap-12 wide:grid-cols-[1.2fr_.8fr]">
          <div className="min-w-0">
            <Link to={path('/formations')} className="text-[13px] text-[color:var(--mm-bleu-c)] no-underline">
              {`← ${t('v3.sheet.back')} · ${category}`}
            </Link>
            {aVenir && (
              <p className="m-0 mt-4">
                <span className="mm-tag is-soon">
                  {ouvertureTexte ? t('comingSoon.tagWithDate', { date: ouvertureTexte }) : t('comingSoon.tag')}
                </span>
              </p>
            )}
            <span className="mm-script mt-5 block text-[24px] wide:text-[30px]">
              {tail ? `${levelLabel} · ${tail}` : levelLabel}
            </span>
            <h1
              className="mm-up m-0 mb-5 mt-1 text-[color:var(--paper-fixed)]"
              style={{ fontSize: head.length > 18 ? 'clamp(32px, 8.4vw, 76px)' : 'clamp(56px, 9vw, 120px)' }}
            >
              {`${head}.`}
            </h1>
            <p className="m-0 mb-6 max-w-[50ch] text-[17px] leading-[1.55] text-[color:color-mix(in_srgb,var(--paper-fixed)_80%,transparent)]">
              {description}
            </p>
            <dl className="m-0 mb-7 flex flex-wrap gap-7 text-[color:var(--paper-fixed)]">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="sr-only">{f.label}</dt>
                  <dd className="m-0">
                    <b className="block text-[28px]"><Num value={f.n} source="db" asOf={asOf} showAsOf={false} /></b>
                    <span className={`text-[12px] ${muted}`}>{f.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-4">
              {!aVenir && (
                <Link className="mm-pill" to={path(`/checkout/${formation.slug}`)} onClick={onBuy}>
                  {t('sheet.buy')} · <Num value={price} source="db" asOf={asOf} unit="F" showAsOf={false} />
                  <i aria-hidden="true"><Icon name="arrow-up-right" size={16} /></i>
                </Link>
              )}
              {aVenir && precommande && (
                <Link className="mm-pill" to={path(`/checkout/${formation.slug}`)} onClick={onBuy}>
                  {t('comingSoon.preorder')}
                  <i aria-hidden="true"><Icon name="arrow-up-right" size={16} /></i>
                </Link>
              )}
              {aVenir && (user ? (
                <button
                  type="button"
                  className={precommande ? 'mm-pill is-plain' : 'mm-pill'}
                  onClick={() => void rejoindreListe()}
                  disabled={attente.envoi || attente.inscrit === true}
                >
                  {attente.inscrit === true ? t('comingSoon.alreadyIn') : t('comingSoon.notifyMe')}
                </button>
              ) : (
                <Link className={precommande ? 'mm-pill is-plain' : 'mm-pill'} to={path('/inscription')}>
                  {t('comingSoon.notifyMeSignedOut')}
                </Link>
              ))}
              {!aVenir && firstFree && (
                <Link to={path(`/cours/${formation.slug}`)} className="text-[14px] font-semibold text-[color:var(--paper-fixed)] underline underline-offset-4">
                  {t('v3.sheet.readFree')}
                </Link>
              )}
            </div>
            {aVenir && (
              <p className={`m-0 mt-3 max-w-[52ch] text-[13px] ${muted}`}>
                {ouvertureTexte ? t('comingSoon.opensOn', { date: ouvertureTexte }) : t('comingSoon.noDateYet')}
                {' '}{t('comingSoon.promise')}
                {attendus !== null && <> {t('comingSoon.waiting', { count: attendus })}</>}
              </p>
            )}
          </div>

          <div className="relative hidden h-[460px] wide:block" aria-hidden="true">
            <div className="mm-floaty overflow-hidden" style={{ ['--r' as string]: '-4deg', position: 'absolute', inset: '20px 40px 40px 30px', borderRadius: '24px' }}>
              <EduCover
                title={title}
                category={formation.category}
                slug={formation.slug}
                id={formation.id}
                kicker={`${t('sheet.coverKicker')} · ${category}`}
                tag={!aVenir && freeLessons > 0 ? t('index.cardFree', { count: freeLessons }) : aVenir ? t('comingSoon.tag') : undefined}
                titleSize={64}
                titleWidth={360}
                style={{ height: '400px' }}
              />
            </div>
            {!aVenir && firstFree && (
              <div className="absolute bottom-0 right-0 z-[2] flex items-center gap-3 rounded-[18px] py-3 pl-3 pr-4" style={{ background: 'var(--paper-fixed)', color: 'var(--ink-fixed)' }}>
                <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: 'var(--mm-orange-f)' }}>
                  <Icon name="play" size={16} />
                </span>
                <div>
                  <b className="block text-[14px]">{t('v3.sheet.previewOf', { title: firstFree.title })}</b>
                  {firstFree.duration ? <span className="text-[12px] text-ink-2">{firstFree.duration}</span> : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── LA BANDE DE PRIX ─────────────────────────────────────────────── */}
        <div className="relative z-[2] mx-auto mt-10 max-w-[1360px] pb-[34px]">
          <div className="mm-count flex-wrap" style={{ justifyContent: 'space-between' }}>
            <div>
              <span className="mm-eyebrow" style={{ color: 'var(--mm-orange-c)' }}>{t('sheet.cardKicker')}</span>
              <b className="mt-1.5 block text-[22px] leading-[1.2]">
                <Num value={price} source="db" asOf={asOf} unit="F" showAsOf={false} />
                {formation.promoPrice ? (
                  <s className={`ml-2 text-[14px] ${muted}`}><Num value={formation.price} source="db" asOf={asOf} showAsOf={false} /></s>
                ) : null}
                {!aVenir && (
                  <small className={`ml-1 text-[13px] font-medium ${muted}`}>
                    {` · ${t('v3.sheet.clubPrice')} `}<Num value={clubPrice} source="db" asOf={asOf} unit="F" showAsOf={false} />
                  </small>
                )}
              </b>
              <span className={`block text-[12px] ${muted}`}><PriceApprox xof={price} /></span>
            </div>
            <span className="mm-count__sep hidden wide:block" />
            <div className="text-[13.5px]">
              {t('v3.sheet.methods')}<br />
              <span className={muted}>{t('v3.sheet.methodsNote')}</span>
            </div>
            {!aVenir && freeLessons > 0 && (
              <>
                <span className="mm-count__sep hidden wide:block" />
                <div className="text-[13.5px]">
                  {t('index.cardFree', { count: freeLessons })}<br />
                  <span className={muted}>{t('v3.sheet.noAccount')}</span>
                </div>
              </>
            )}
            {formation.certificateEnabled && (
              <>
                <span className="mm-count__sep hidden wide:block" />
                <div className="text-[13.5px]">
                  {t('v3.sheet.certTitle')}<br />
                  <span className={muted}>{t('v3.sheet.certNote')}</span>
                </div>
              </>
            )}
          </div>
          <PriceFootnote className={`m-0 mt-2 ${muted}`} />
        </div>
      </section>

      {/* ── À LA FIN, TU SAURAS FAIRE — les modules réels ─────────────────────── */}
      {modules.length > 0 && (
        <section>
          <div className="mx-auto max-w-[1360px] px-4 pt-16 stack:px-6 wide:pt-24">
            <div className="rounded-[34px] p-6 stack:p-11" style={{ background: 'var(--mm-orange-f)', color: 'var(--ink-fixed)' }}>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
                <h2 className="mm-d m-0 text-[36px] text-[color:var(--ink-fixed)] wide:text-[52px]">{t('v3.sheet.learnTitle')}</h2>
                <span className="max-w-[30ch] text-[15px]">{t('v3.sheet.learnNote', { count: modules.length })}</span>
              </div>
              <div className="mm-learn [&>div]:min-h-0 [&>div]:flex-row [&>div]:items-baseline stack:[&>div]:min-h-[170px] stack:[&>div]:flex-col stack:[&>div]:items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {modules.map((m, i) => (
                  <div key={m.id}>
                    <b className="n">{`${String(i + 1).padStart(2, '0')}.`}</b>
                    <b className="t">{m.title}</b>
                    {!aVenir && <span>{t('sheet.moduleMeta', { count: m.lessons?.length ?? 0 })}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── PROGRAMME + CERTIFICAT + FORMATEUR ───────────────────────────────── */}
      <section>
        <div className="mx-auto grid max-w-[1360px] items-start gap-10 px-4 pt-16 stack:px-6 wide:grid-cols-[1.25fr_.75fr] wide:pt-[104px]">
          <div className="min-w-0">
            <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3">
              <h2 className="mm-d m-0 text-[34px] wide:text-[48px]">
                {aVenir
                  ? t('v3.sheet.programSoon', { count: modules.length })
                  : t('v3.sheet.program', { lessons, count: modules.length })}
              </h2>
              {!aVenir && freeLessons > 0 && (
                <span className="mm-tag is-ok">{t('v3.sheet.freeTag', { count: freeLessons })}</span>
              )}
            </div>
            <div className="mm-acc">
              {modules.map((module, mi) => {
                const n = String(mi + 1).padStart(2, '0');
                if (aVenir) {
                  return (
                    <div key={module.id} className="mm-acc__item">
                      <div className="flex items-center gap-4 px-5 py-[18px] font-semibold">
                        <span className="mm-acc__n">{n}</span>
                        <span className="min-w-0 flex-1">{module.title}</span>
                        <Icon name="lock" size={15} color="var(--ink-2)" />
                      </div>
                    </div>
                  );
                }
                return (
                  <details key={module.id} className="mm-acc__item" open={mi === 0 ? true : undefined}>
                    <summary>
                      <span className="mm-acc__n">{n}</span>
                      <span className="min-w-0 flex-1">{module.title}</span>
                      <span className="mr-3 text-[12px] opacity-70">{t('sheet.moduleMeta', { count: module.lessons?.length ?? 0 })}</span>
                      <span className="mm-acc__plus" aria-hidden="true"><Icon name="plus" size={15} /></span>
                    </summary>
                    <ul className="mm-acc__body m-0 list-none">
                      {(module.lessons ?? []).map((lesson, li) => (
                        <li key={lesson.id} className="flex items-baseline gap-3 py-[6px]">
                          <span className="text-[12px] opacity-60">{`${mi + 1}.${li + 1}`}</span>
                          <span className="min-w-0 flex-1">{lesson.title}</span>
                          {lesson.isFree && <span className="mm-tag is-ok">{t('v3.sheet.free')}</span>}
                          {lesson.duration ? <span className="text-[12px] opacity-70">{lesson.duration}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          </div>

          <aside className="flex flex-col gap-4 wide:sticky wide:top-[calc(var(--header-h)+1rem)]">
            {formation.certificateEnabled && (
              <>
                <div className="relative overflow-hidden rounded-[24px] p-[30px]" style={{ border: '1.5px solid var(--ink-fixed)', background: 'linear-gradient(135deg, var(--paper-fixed), var(--paper-2))', color: 'var(--ink-fixed)' }}>
                  <div className="absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full" style={{ background: 'radial-gradient(circle, var(--mm-bleu-c), transparent 70%)' }} />
                  <span className="mm-eyebrow relative">{t('v3.sheet.certEyebrow')}</span>
                  <b className="relative mb-1.5 mt-3.5 block font-display font-black leading-[1.05]" style={{ fontSize: title.length > 40 ? '22px' : '30px' }}>{title}</b>
                  <span className="relative font-display text-[20px] font-semibold italic leading-none text-[color:var(--mm-bleu-f)]">
                    {userData?.displayName || t('v3.sheet.yourName')}
                  </span>
                  <div className="relative mt-[26px] flex items-end justify-between">
                    <span className="text-[12px] text-ink-2">{t('v3.sheet.certCode')}</span>
                    <LogoMark size={40} />
                  </div>
                </div>
                <p className="m-0 text-[13px] text-ink-2">{t('v3.sheet.certRule')}</p>
              </>
            )}
            <div className="mm-card">
              <div className="flex items-center gap-3">
                <span className="mm-photo" style={{ width: '56px', height: '56px', minHeight: 0, borderRadius: '16px', background: 'linear-gradient(160deg, var(--mm-bleu-f), var(--mm-violet-f))' }} />
                <div>
                  <b className="block">Max-Morrys</b>
                  <span className="text-[13px] text-ink-2">{t('v3.sheet.trainerRole')}</span>
                </div>
              </div>
              <p className="m-0 mt-3 text-[14px] text-ink-2">{t('v3.sheet.trainerBio')}</p>
            </div>
          </aside>
        </div>
      </section>

      {/* ── QUESTIONS AVANT D'ACHETER ────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-[1360px] px-4 pb-[200px] pt-16 stack:px-6 wide:pt-24">
          <h2 className="mm-d m-0 mb-[18px] text-[34px] wide:text-[44px]">{t('v3.sheet.faqTitle')}</h2>
          <div className="mm-acc max-w-[900px]">
            {/* Deux questions propres à la maquette (paiement, téléphone), deux déjà écrites pour
                la fiche (`sheet.q2`, `sheet.q1`) — citées, pas recopiées (garde `copie-doublons`). */}
            {([
              ['v3.sheet.faq.q1', 'v3.sheet.faq.a1'],
              ['v3.sheet.faq.q2', 'v3.sheet.faq.a2'],
              ['sheet.q2', 'sheet.a2'],
              ['sheet.q1', 'sheet.a1'],
            ] as const).map(([q, a], i) => (
              <details key={q} className="mm-acc__item">
                <summary>
                  <span className="mm-acc__n">{String(i + 1).padStart(2, '0')}</span>
                  {t(q)}
                  <span className="mm-acc__plus" aria-hidden="true"><Icon name="plus" size={15} /></span>
                </summary>
                <div className="mm-acc__body">{t(a)}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <EduPreFooter source="formation-detail" />
    </DsNavHost>
  );
}
