import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@ds';
import SEOHead from '../../components/seo/SEOHead';
import JsonLd from '../../components/seo/JsonLd';
import { SITE_URL, buildCanonical } from '../../components/seo/seo-config';
import DsNavHost from '../../components/layout/DsNavHost';
import { Eyebrow, KitButton, KitH2, KitSection, NightHero, Photo, type PhotoTone } from '../../components/site/v3/kit';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { categoryKey, clientCategories, clientProjects, legalName, corporateUrl } from '../../lib/brand';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RÉALISATIONS — LA MAQUETTE `Site-Realisations` (bureau) / `-mobile` (390 px), PASSE 2.
 *
 * ⚠️ DÉCISIONS LEVÉES (porteur, 29/10/2026 — « maquettes + DS + PRD rév. 6 font foi ») :
 * la sous-navigation de piste, la carte `ClientWorkCard` et le bandeau `SiteExit` cèdent la
 * place à la grille de la planche (première carte sur deux colonnes) et à sa dalle d'appel.
 *
 * Ce qui reste tenu :
 * - LE COMPTE DU TITRE EST DÉRIVÉ (`clientProjects.length`), jamais écrit en toutes lettres ;
 * - SEULS LES VRAIS PROJETS s'affichent : pas de `[Client 4]`, pas de `[Type de projet]` —
 *   le sous-titre de carte est la catégorie réelle du projet ;
 * - LA VIGNETTE est la capture publique du site du client (même service que la fiche) ;
 *   tant qu'elle n'est pas arrivée, ou si elle échoue, c'est le dégradé du kit, sans libellé ;
 * - aucun résultat ni chiffre client (`CLIENT_PUBLICATION_WITHHELD`) ;
 * - la piste Conception vouvoie (`voix-tutoiement.test.ts`) : l'appel de la planche
 *   « c'est le tien ? » s'écrit donc « c'est le vôtre ? ».
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const PARAM_CATEGORIE = 'categorie';
/** La planche mobile montre sept cartes, puis « Voir les N autres ». */
const MOBILE_VISIBLES = 7;
const TONES: PhotoTone[] = ['studio', 'edu', 'club', 'informe'];

const shotUrl = (url: string) => `https://s.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=820`;

/** La capture du site, posée sur le dégradé : elle n'apparaît que chargée. */
function Capture({ url, alt, tone }: { url: string; alt: string; tone: PhotoTone }) {
  const [etat, setEtat] = useState<'attente' | 'ok' | 'echec'>('attente');
  return (
    <Photo tone={tone} className="h-[180px] !min-h-0 !rounded-card stack:h-[300px]">
      {etat !== 'echec' && (
        <img
          src={shotUrl(url)}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={1280}
          height={820}
          onLoad={() => setEtat('ok')}
          onError={() => setEtat('echec')}
          className={`object-top transition-opacity duration-scene ${etat === 'ok' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </Photo>
  );
}

export default function Realisations() {
  const { t } = useTranslation('realisations');
  const { t: ts } = useTranslation('shared');
  const path = useLocalizedPath();
  const [params, setParams] = useSearchParams();
  const [tout, setTout] = useState(false);

  const active = params.get(PARAM_CATEGORIE);
  const categorieValide = active && clientCategories.includes(active) ? active : null;

  const setActive = (categorie: string | null) => {
    const suivant = new URLSearchParams(params);
    if (categorie) suivant.set(PARAM_CATEGORIE, categorie);
    else suivant.delete(PARAM_CATEGORIE);
    setParams(suivant, { replace: true });
  };

  const filtres = useMemo(
    () => (categorieValide ? clientProjects.filter((p) => p.category === categorieValide) : clientProjects),
    [categorieValide],
  );
  const caches = Math.max(0, filtres.length - MOBILE_VISIBLES);

  const jsonLd = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: t('seo.title'),
        description: t('seo.description'),
        url: buildCanonical(path('/conception/realisations')),
        about: { '@type': 'Organization', name: legalName, url: corporateUrl },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: clientProjects.map((project, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: project.name,
          url: `${SITE_URL}${path(`/conception/realisations/${project.slug}`)}`,
        })),
      },
    ],
    [t, path],
  );

  const count = clientProjects.length;

  return (
    <DsNavHost>
      <SEOHead title={t('seo.title')} description={t('seo.description')} />
      <JsonLd data={jsonLd} />

      <NightHero mesh="hub" className="pb-[30px] stack:pb-16">
        <div className="relative z-[1] mx-auto box-border w-full max-w-[1360px] px-5 pt-9 stack:px-10 stack:pt-[110px]">
          <Eyebrow className="text-[color:var(--mm-orange-c)]">{t('index.eyebrow')}</Eyebrow>
          <h1 className="mm-d mb-[14px] mt-[14px] text-[52px] leading-[.9] stack:mb-[22px] stack:mt-5 stack:text-[clamp(56px,7.4vw,112px)] stack:leading-[.88] stack:tracking-[-.05em]">
            {(t('index.titleLines', { returnObjects: true, count }) as string[]).map((l, i) => (
              <span key={i}>
                {i > 0 && <br className="hidden stack:inline" />}
                {i > 0 && ' '}
                {l.split(/\[([^\]]+)\]/).map((part, j) =>
                  j % 2 === 1 ? <span key={j} className="text-[color:var(--mm-orange)]">{part}</span> : part,
                )}
              </span>
            ))}
          </h1>
          <p className="m-0 text-[15.5px] leading-[1.55] text-ink-2 stack:hidden">{t('index.ledeShort')}</p>
          <p className="m-0 hidden max-w-[52ch] text-[18px] leading-[1.55] text-ink-2 stack:block">{t('index.lede')}</p>
        </div>
      </NightHero>

      <KitSection className="pt-11 stack:pt-16">
        <div role="group" aria-label={t('index.filterAria')} className="mm-chips mb-[14px] flex-nowrap overflow-x-auto stack:mb-5 stack:flex-wrap">
          <button className="mm-chip" type="button" aria-pressed={!categorieValide} onClick={() => setActive(null)}>
            {t('index.filterAll', { count })}
          </button>
          {clientCategories.map((c) => (
            <button key={c} className="mm-chip" type="button" aria-pressed={categorieValide === c} onClick={() => setActive(c)}>
              {ts(`realisations.categories.${categoryKey(c)}`)}
            </button>
          ))}
        </div>

        <ul aria-label={t('index.gridAria')} className="m-0 grid list-none gap-3 p-0 stack:grid-cols-2 stack:gap-4 wide:grid-cols-3">
          {filtres.map((project, i) => (
            <li
              key={project.slug}
              className={[
                i === 0 ? 'wide:col-span-2' : '',
                !tout && i >= MOBILE_VISIBLES ? 'hidden stack:block' : '',
              ].join(' ')}
            >
              <a
                href={path(`/conception/realisations/${project.slug}`)}
                aria-label={t('index.cardAria', { name: project.name })}
                className="mm-bento flex h-full flex-col gap-[10px] !rounded-xl p-[14px] text-ink no-underline"
              >
                <Capture url={project.website} alt={t('index.shotAlt', { name: project.name })} tone={TONES[i % TONES.length]} />
                <span className="flex items-center justify-between gap-[10px] px-[6px] py-1">
                  <span>
                    <b className="block font-display text-[24px] font-black leading-none">{project.name}</b>
                    <span className="mt-1 block text-[13.5px] text-ink-2">{ts(`realisations.categories.${categoryKey(project.category)}`)}</span>
                  </span>
                  <span className="mm-iconbtn h-10 w-10 flex-none" aria-hidden="true">
                    <Icon name="arrow-up-right" size={16} />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        {!tout && caches > 0 && (
          <KitButton tone="ghost" className="mt-3 w-full stack:hidden" onClick={() => setTout(true)}>
            {t('index.more', { count: caches })}
          </KitButton>
        )}
        <p className="m-0 mt-[18px] hidden text-[13px] text-ink-2 stack:block">{t('index.note')}</p>
      </KitSection>

      {/* La dalle d'appel de la planche — la sortie vers `/contact` de la page. */}
      <KitSection className="hidden pt-24 stack:block">
        <div className="dk relative isolate flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-xl bg-night px-12 py-14 text-ink">
          <div aria-hidden="true" className="mm-mesh m-hub" style={{ opacity: 0.6 }}>
            <b />
            <b />
            <b />
          </div>
          <KitH2 className="relative m-0 max-w-[16ch]">{t('index.ctaTitle')}</KitH2>
          <KitButton href={path('/contact?rdv=1')} tone="highlight" arrow className="relative">
            {t('index.ctaButton')}
          </KitButton>
        </div>
      </KitSection>
    </DsNavHost>
  );
}
