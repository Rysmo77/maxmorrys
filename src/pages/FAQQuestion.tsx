import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Button, GlassPanel, Icon, LessonRow, Skeleton } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteDisplay, SiteEyebrow } from '../components/site';
import ShareButtons from '../components/shared/ShareButtons';
import TranslatedText from '../components/shared/TranslatedText';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useTranslatedText } from '../hooks/useTranslatedContent';
import { getAllFAQ } from '../lib/firestore';
import { faqSlug, findFaqBySlug } from '../lib/faq/slug';
import { queryKeys } from '../lib/queryClient';
import { SITE_URL } from '../components/seo/seo-config';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /faq/:slug — UNE PAGE PAR QUESTION.  Kit : `ScreensEditorial.js` § FaqQuestion.
 *
 * C'est le seul écran du kit qui dit explicitement ce qu'il corrige, et il le dit dans son
 * propre encart de vérité : « aujourd'hui la FAQ n'a qu'un index : aucune question n'a d'URL
 * partageable ni de position propre en recherche ». L'index, lui, ouvrait la réponse en
 * accordéon — utile pour parcourir, inutile pour tout le reste :
 *
 *   • on ne peut envoyer à quelqu'un QUE la réponse qui le concerne ;
 *   • un moteur voit une page unique portant TOUTES les questions, jamais une page qui répond
 *     à la sienne ;
 *   • la réponse la plus gênante du produit — « Combien de membres y a-t-il dans le Club ? » —
 *     n'a aucune adresse à laquelle renvoyer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CETTE PAGE NE REPREND PAS DU KIT, ET POURQUOI
 *
 * Le kit place sous la réponse : « Cette réponse t'a aidé ? · Oui · Non ». Il n'existe AUCUN
 * enregistrement de ce vote — ni collection, ni règle, ni écran d'administration qui le lise.
 * Deux boutons qui ne mènent nulle part demandent un geste et n'en font rien : c'est la même
 * famille que le champ de lettre d'information sans canal d'envoi, que le système refuse
 * nommément. La question revient le jour où le vote est stocké et lu quelque part.
 *
 * L'adresse affichée sous le titre, elle, EST reprise : c'est le sujet de l'écran. Elle est
 * réelle et copiable — pas une décoration monospace.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export default function FAQQuestion() {
  const { t } = useTranslation('faq');
  const path = useLocalizedPath();
  const { slug = '' } = useParams();

  /*
   * La collection entière, et la même clé de cache que l'index : un seul aller chez Firestore
   * pour les deux écrans. C'est aussi ce qui donne les questions voisines sans
   * requête supplémentaire — une requête par catégorie coûterait plus que tout charger.
   */
  const { data: faqs, isLoading } = useQuery({
    queryKey: queryKeys.faq,
    queryFn: () => getAllFAQ(),
  });

  const item = useMemo(() => (faqs ? findFaqBySlug(faqs, slug) : undefined), [faqs, slug]);

  /** Les autres questions de la même catégorie, dans l'ordre d'affichage. */
  const neighbours = useMemo(
    () => (faqs && item ? faqs.filter((f) => f.category === item.category && f.id !== item.id).slice(0, 5) : []),
    [faqs, item],
  );

  const question = useTranslatedText(item?.question);
  const answer = useTranslatedText(item?.answer);

  if (isLoading) {
    return (
      <DsNavHost>
        <PageSite>
          <span className="sr-only">{t('question.loading')}</span>
          <Skeleton height={28} width="40%" radius="var(--r-s)" />
          <div className="mt-4"><Skeleton height={54} radius="var(--r-m)" /></div>
          <div className="mt-4"><Skeleton height={140} radius="var(--r-l)" /></div>
        </PageSite>
      </DsNavHost>
    );
  }

  if (!item) {
    return (
      <DsNavHost>
        {/* `noIndex` : une adresse qui ne désigne rien ne doit pas entrer en index. */}
        <SEOHead title={t('seoTitle')} description={t('seoDescription')} noIndex />
        <PageSite>
          <SiteDisplay lines={t('question.notFoundTitle', { returnObjects: true }) as string[]} size={34} />
          <p className="rv mt-4 max-w-prose text-lede text-ink-2" style={{ ['--i' as string]: 3 }}>
            {t('question.notFoundBody')}
          </p>
          <Button href={path('/faq')} tone="primary" fullWidth={false} className="mt-5">
            {t('question.backToIndex')}
          </Button>
        </PageSite>
      </DsNavHost>
    );
  }

  const canonicalSlug = faqSlug(item);
  const address = `${SITE_URL.replace(/^https?:\/\//, '')}${path(`/faq/${canonicalSlug}`)}`;

  return (
    <DsNavHost>
      <SEOHead title={question} description={answer.slice(0, 155)} />
      {/*
        UNE SEULE question par `FAQPage`, et c'est le but : l'index en déclare 46 sur une seule
        adresse, ce qu'un moteur ne peut pas proposer en réponse à une question précise.
      */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [{
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        }],
      }} />

      <PageSite>
        <Breadcrumb
          label={t('question.breadcrumbRoot')}
          items={[
            { label: t('question.breadcrumbRoot'), href: path('/faq') },
            ...(item.category ? [{ label: item.category }] : []),
          ]}
        />

        {/*
          La colonne de lecture ne s'élargit jamais (AD-14) : la question, la réponse et les
          voisines tiennent dans la même mesure, à 390 px comme à 1400.
        */}
        <div className="mt-4 max-w-prose">
          <SiteEyebrow>{t('index.eyebrow')}</SiteEyebrow>
          {/*
            `wrap` : le titre vient de la base, personne n'en a écrit les coupures. Sans lui,
            `nowrap` ferait déborder une question de soixante caractères hors de l'écran.
          */}
          <SiteDisplay wrap lines={[question]} size={38} from={1} />

          {/* L'adresse elle-même — le sujet de la page. Sélectionnable, donc copiable. */}
          <p className="mm-num rv mt-3 mb-0 select-all text-small text-ink-2" style={{ ['--i' as string]: 4 }}>
            {address}
          </p>

          {/*
            PAS DE BANDEAU DE TRADUCTION ICI, ET C'EST UN CHOIX ARGUMENTÉ.

            `TranslationNotice` exige une DATE, et son type le dit sans détour : « tout le
            poids du bandeau tient à ce que cette date soit vraie ». Le type `FAQ` ne porte ni
            date de publication ni date de mise à jour — il n'y a donc rien de vrai à mettre
            dedans. Un bandeau daté d'aujourd'hui parce qu'on rend la page aujourd'hui est
            précisément le nombre inventé que le système refuse, et il serait ici sur la
            surface qui prétend garantir l'origine du texte.

            La réponse reste traduite par `useTranslatedText`, comme dans l'index. Le jour où
            une question porte une date de révision, le bandeau se pose en trois lignes.
          */}

          <GlassPanel level="hero" padding={22} className="rv mt-4" style={{ ['--i' as string]: 5 }}>
            <p className="m-0 whitespace-pre-line text-[15px] leading-[1.6] text-ink">{answer}</p>
          </GlassPanel>

          {/*
            ENVOYER LA RÉPONSE À QUELQU'UN — c'est la raison d'être de cette page.

            Le kit la formule ainsi : « on ne peut envoyer à quelqu'un QUE la réponse qui le
            concerne ». L'adresse était affichée et sélectionnable, mais rien ne permettait de
            l'envoyer sans la copier à la main.
          */}
          <ShareButtons
            className="rv mt-4"
            url={`/faq/${slug}`}
            title={question}
            contentType="faq"
            contentId={item.id}
          />

          <div className="rv mt-4" style={{ ['--i' as string]: 6 }}>
            <Button href={path('/contact')} tone="quiet" size="sm" fullWidth={false}>
              {t('index.contactCta')}
            </Button>
          </div>

          {/* ── Questions voisines ─────────────────────────────────────────── */}
          <SiteEyebrow style={{ marginTop: '30px' }}>{t('question.neighboursTitle')}</SiteEyebrow>
          {neighbours.length > 0 ? (
            <GlassPanel level="flat" padding="6px 18px" className="rv" style={{ ['--i' as string]: 7 }}>
              {neighbours.map((other, i) => (
                <LessonRow
                  key={other.id}
                  state="plain"
                  href={path(`/faq/${faqSlug(other)}`)}
                  title={<TranslatedText text={other.question} />}
                  trailing={<Icon name="forward" size={16} color="var(--ink-2)" strokeWidth={2.4} />}
                  last={i === neighbours.length - 1}
                />
              ))}
            </GlassPanel>
          ) : (
            <p className="m-0 text-meta text-ink-2">{t('question.neighboursEmpty')}</p>
          )}

          <GlassPanel level="truth" className="rv mt-[18px]" style={{ ['--i' as string]: 8 }}>
            <SiteEyebrow style={{ marginBottom: '6px' }}>{t('question.truthTitle')}</SiteEyebrow>
            <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('question.truthBody')}</p>
          </GlassPanel>

          <p className="rv mt-6" style={{ ['--i' as string]: 9 }}>
            <a href={path('/faq')} className="text-meta text-ink-2">{t('question.backToIndex')}</a>
          </p>
        </div>
      </PageSite>
    </DsNavHost>
  );
}
