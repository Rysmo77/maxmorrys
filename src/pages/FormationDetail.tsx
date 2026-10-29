import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Breadcrumb, Button, CheckLine, GlassPanel, Icon, Num, PriceBlock, Skeleton, TranslationNotice } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import ShareButtons from '../components/shared/ShareButtons';
import { useLanguage, useLocalizedPath } from '../contexts/LanguageContext';
import { useFormat } from '../hooks/useFormat';
import { PriceApprox } from '../components/shared/PriceApprox';
import { useTranslatedContent, useTranslatedText } from '../hooks/useTranslatedContent';
import { getFormationBySlug } from '../lib/firestore';
import { estAVenir, estPrecommandable, ouverture, preuveSociale } from '../types/formationRelease';
import { useWaitlist } from '../hooks/useWaitlist';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@ds';
import { markdownToHtml } from '../lib/markdown';
import type { Formation } from '../types';
import { trackViewItem, trackAddToCart } from '../lib/tracking';
import SEOHead from '../components/seo/SEOHead';
import { contentPath } from '../lib/contentPath';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL, SITE_NAME } from '../components/seo/seo-config';
import CourseCover from '../components/formations/CourseCover';




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


  /* Traduction du contenu dynamique Firestore (FR -> EN selon langue active). */
  const tFormation = useTranslatedContent(
    formation as (Formation & Record<string, unknown>) | null | undefined,
    ['title', 'description', 'longDescription', 'category'],
  ) as Formation | null | undefined;
  const seoTitleSource = formation ? formation.metaTitle || formation.title : '';
  const seoDescSource = formation ? formation.metaDescription || formation.description : '';
  const seoTitle = useTranslatedText(seoTitleSource);
  const seoDescription = useTranslatedText(seoDescSource);
  const longDescriptionBody = useTranslatedText(formation?.longDescription);

  const path = useLocalizedPath();
  const { user } = useAuth();
  const { addToast } = useToast();

  /*
   * ⚠️ LES HOOKS AVANT LES RETOURS ANTICIPÉS. Ce composant rend trois écrans (chargement,
   * introuvable, fiche) : appeler `useWaitlist` plus bas, près de son bouton, le placerait
   * après deux `return` et casserait l'ordre des hooks au premier changement d'état.
   */
  const aVenir = Boolean(formation && estAVenir(formation));
  const attente = useWaitlist(
    aVenir ? formation?.id : undefined,
    language,
    formation?.waitlistCount ?? 0,
  );

  const rejoindreListe = async () => {
    const r = await attente.rejoindre();
    if (r === 'ok') addToast('success', t('comingSoon.toastJoined'));
    else if (r === 'deja') addToast('info', t('comingSoon.toastAlready'));
    else addToast('error', t('comingSoon.toastError'));
  };

  if (formation === undefined) {
    return (
      <PageSite>
        <div className="grid items-start gap-11 wide:grid-cols-[1.1fr_.9fr]">
          <div className="grid gap-4">
            <Skeleton width={180} height={12} />
            <Skeleton height={40} width="80%" />
            <Skeleton height={210} radius="var(--r-media)" />
          </div>
          <Skeleton height={280} radius="var(--r-xl)" />
        </div>
      </PageSite>
    );
  }

  if (!formation) {
    return (
      <PageSite>
        <SiteDisplay lines={[t('detail.notFoundTitle')]} size={34} />
        <p className="mt-4">
          <Button href={path('/formations')} tone="quiet" size="sm" fullWidth={false}>
            {t('detail.notFoundLink')}
          </Button>
        </p>
      </PageSite>
    );
  }

  /*
   * Les compteurs de l'encart de vérité viennent du CONTENU RÉEL de la formation, pas d'une
   * constante. C'est ce qui les rend affichables : « un nombre en monospace vient de la base
   * ou d'une source citée ».
   */
  const modules = formation.modules ?? [];
  /**
   * Une leçon marquée gratuite existe-t-elle ? C'est ce qui autorise à parler d'aperçu.
   *
   * ⚠️ Toujours faux sur une formation à venir : la couche d'accès aux données lui a retiré
   * ses leçons. C'est voulu — la promesse « le module d'ouverture est gratuit, tu juges avant
   * de payer » est SUSPENDUE jusqu'à l'ouverture, pas cassée, et la fiche le dit.
   */
  const freeLessons = modules.reduce((n, m) => n + (m.lessons ?? []).filter((l) => l.isFree).length, 0);
  const hasFreeLesson = freeLessons > 0;
  const lessons = modules.reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
  const price = formation.promoPrice ?? formation.price;
  const asOf = new Date();
  const onBuy = () => trackAddToCart({ id: formation.id, name: formation.title, category: formation.category, price, currency: 'XOF' });

  const precommande = estPrecommandable(formation);
  const dateOuverture = ouverture(formation);
  const attendus = preuveSociale({ ...formation, waitlistCount: attente.compte });
  /** La date, dite comme on la dirait à voix haute — ou la période libre, telle quelle. */
  const ouvertureTexte = dateOuverture
    ? (dateOuverture.kind === 'date' ? formatDate(dateOuverture.value) : dateOuverture.value)
    : null;

  return (
    <DsNavHost>
      <SEOHead title={seoTitle} description={seoDescription} ogImage={formation.coverImage} />
      {/*
        ═══════════════════════════════════════════════════════════════════════════
        L'`AggregateRating` A ÉTÉ RETIRÉ DES DONNÉES STRUCTURÉES.
        Il injectait `ratingValue: formation.rating` et `ratingCount: formation.students || 1`
        — c'est-à-dire qu'il DÉCLARAIT À GOOGLE une note et un nombre d'avis sur un produit
        qui n'a jamais été vendu. La base compte 5 comptes, 2 inscriptions à 0 % et 0
        certificat émis.
        Afficher un chiffre faux est une faute ; le publier en données structurées, c'est le
        faire répéter par un tiers. Les champs restent en base ; ils ne sortent plus d'ici.
        ═══════════════════════════════════════════════════════════════════════════
      */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: formation.title,
        description: formation.description,
        url: `${SITE_URL}${contentPath('formations', formation, language)}`,
        provider: { '@type': 'Organization', name: SITE_NAME },
        offers: {
          '@type': 'Offer', price, priceCurrency: 'XOF',
          // Annoncer « en stock » une formation dont le tunnel est fermé le ferait répéter
          // par les moteurs — la faute que l'`aggregateRating` retiré plus haut commettait.
          availability: aVenir ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
        },
      }} />

      {/*
        ── LE HÉROS DE LA FICHE (kit v3 `EduHero` + `CourseCover`) ──────────────────────
        Bande sombre en portée `.dk` locale. À gauche : catégorie en italique orange, titre
        en capitales, promesse, trois faits COMPTÉS dans la formation (leçons, modules,
        leçons libres) — aucun n'est saisi à la main — et l'action. À droite, la couverture
        « livre » de la formation (la photo `coverImage` y entre sous un voile, AD-24).

        L'étiquette « bientôt » reste posée AVANT le titre : c'est la première chose à
        savoir sur cette fiche, avant même de lire ce qu'elle vend.
      */}
      <section className="dk relative overflow-hidden bg-night text-[color:var(--text-body)]">
        <PageSite style={{ paddingBottom: '56px' }}>
          <Breadcrumb
            label={t('sheet.eyebrow')}
            items={[
              { label: t('sheet.eyebrow'), href: path('/formations') },
              { label: formation.category },
            ]}
          />
          <div className="mt-6 grid items-center gap-10 wide:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
            <div>
              {aVenir && (
                <p className="m-0 mb-3">
                  <span className="mm-tag is-soon">
                    {ouvertureTexte ? t('comingSoon.tagWithDate', { date: ouvertureTexte }) : t('comingSoon.tag')}
                  </span>
                </p>
              )}
              <span className="mm-script block text-[22px]">{tFormation?.category || formation.category}</span>
              <SiteDisplay
                wrap
                lines={[tFormation?.title || formation.title]}
                size={60}
                style={{ maxWidth: '16ch', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '-.045em', lineHeight: 0.9 }}
              />
              <p className="rv mt-5 max-w-[50ch] text-lede leading-[1.5] text-ink-2" style={{ ['--i' as string]: 3 }}>
                {tFormation?.description || formation.description}
              </p>

              {/* ⚠️ Sur une formation à venir, les leçons sont retirées à la lecture : on ne
                  compte que les modules, jamais « 0 leçon ». */}
              <dl className="rv m-0 mt-6 flex flex-wrap gap-x-8 gap-y-3" style={{ ['--i' as string]: 4 }}>
                {!aVenir && (
                  <div>
                    <dt className="sr-only">{t('sheet.factLessons')}</dt>
                    <dd className="m-0 flex items-baseline gap-2">
                      <b className="text-[28px] font-semibold text-ink"><Num value={lessons} source="db" asOf={asOf} /></b>
                      <span className="text-small text-ink-2">{t('sheet.factLessons')}</span>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="sr-only">{t('sheet.factModules')}</dt>
                  <dd className="m-0 flex items-baseline gap-2">
                    <b className="text-[28px] font-semibold text-ink"><Num value={modules.length} source="db" asOf={asOf} /></b>
                    <span className="text-small text-ink-2">{t('sheet.factModules')}</span>
                  </dd>
                </div>
                {freeLessons > 0 && !aVenir && (
                  <div>
                    <dt className="sr-only">{t('sheet.factFree')}</dt>
                    <dd className="m-0 flex items-baseline gap-2">
                      <b className="text-[28px] font-semibold text-ink"><Num value={freeLessons} source="db" asOf={asOf} /></b>
                      <span className="text-small text-ink-2">{t('sheet.factFree')}</span>
                    </dd>
                  </div>
                )}
              </dl>

              {!aVenir && (
                <div className="rv mt-7 flex flex-wrap items-center gap-4" style={{ ['--i' as string]: 5 }}>
                  {/* Le prix du bouton est celui de la base, promotionnel s'il existe ; le
                      montant débité reste recalculé côté serveur au paiement. */}
                  <Link className="mm-pill" to={path(`/checkout/${formation.slug}`)} onClick={onBuy}>
                    {t('sheet.buy')} · <Num value={price} source="db" asOf={asOf} unit="F" />
                    <i aria-hidden="true"><Icon name="arrow-up-right" size={16} /></i>
                  </Link>
                  {hasFreeLesson && (
                    <Link className="mm-ulink text-[14px] font-semibold text-ink" to={path(`/cours/${formation.slug}`)}>
                      {t('sheet.startFree')}
                    </Link>
                  )}
                </div>
              )}

              {/*
                PARTAGER UNE FORMATION — une formation se recommande de personne à personne,
                et sur ce marché cela veut dire WhatsApp.
              */}
              <ShareButtons
                className="rv mt-6"
                url={`/formations/${formation.slug}`}
                title={formation.title}
                contentType="formation"
                contentId={formation.id}
              />
            </div>

            <CourseCover
              title={tFormation?.title || formation.title}
              category={formation.category}
              slug={formation.slug}
              id={formation.id}
              coverImage={formation.coverImage}
              kicker={`${t('sheet.coverKicker')} · ${tFormation?.category || formation.category}`}
              tag={hasFreeLesson && !aVenir ? t('sheet.preview') : undefined}
              size="lg"
              transitionName={`course-${formation.slug}`}
              className="rv-s"
              style={{ ['--i' as string]: 4 }}
            />
          </div>
        </PageSite>
      </section>

      <PageSite>
        <div className="grid items-start gap-11 wide:grid-cols-[1.1fr_.9fr]">
          <div>
            {/*
              LE BANDEAU EST OBLIGATOIRE SUR TOUT CORPS TRADUIT À LA MACHINE.
              `updatedAt ?? publishedAt` : les deux seules dates que le modèle porte. Sans ni
              l'une ni l'autre, PAS de bandeau — un bandeau daté d'aujourd'hui serait le
              nombre inventé que la règle 6 refuse.
            */}
            {language === 'en' && formation.longDescription && (formation.updatedAt ?? formation.publishedAt) && (
              <TranslationNotice
                date={formatDate((formation.updatedAt ?? formation.publishedAt) as string)}
                href={`/formations/${formation.slug}`}
                originalLabel={t('sheet.translatedOriginal')}
                style={{ marginBottom: '18px', maxWidth: 'var(--measure-prose)' }}
              />
            )}

            {formation.longDescription && (
              <div
                className="mm-prose prose-article"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(longDescriptionBody || formation.longDescription) }}
              />
            )}

            {/*
              ── LE PROGRAMME (kit v3 `mm-acc`) ─────────────────────────────────────────
              LA GRATUITÉ EST UNE DONNÉE, PAS UN RANG : l'étiquette « libre » ne se pose que
              sur un module dont une leçon porte `isFree`.

              UNE FORMATION À VENIR MONTRE SES MODULES, ET RIEN DE PLUS : pas de dépliage (la
              couche d'accès a retiré les leçons), pas de « N leçons » en méta — le compte y
              vaut zéro et l'afficher annoncerait « 0 leçon » sur une formation qu'on vend.

              La durée n'est pas additionnée : `Lesson.duration` est une chaîne libre, et la
              somme serait un nombre que personne ne pourrait sourcer (règle 6).
            */}
            <h2 className="mm-d mb-5 mt-10 text-[34px] text-ink">{t('sheet.program')}</h2>
            <div className="mm-acc">
              {modules.map((module, mi) => {
                const moduleFree = (module.lessons ?? []).some((l) => l.isFree);
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
                      {moduleFree && <span className="mm-tag is-ok">{t('sheet.free')}</span>}
                      <span className="text-[12px] opacity-70">{t('sheet.moduleMeta', { count: module.lessons?.length ?? 0 })}</span>
                      <span className="mm-acc__plus" aria-hidden="true"><Icon name="plus" size={15} /></span>
                    </summary>
                    <ul className="mm-acc__body m-0 list-none">
                      {(module.lessons ?? []).map((lesson, li) => (
                        <li key={lesson.id} className="flex items-baseline gap-3 py-[6px]">
                          <span className="text-[12px] opacity-60">{`${mi + 1}.${li + 1}`}</span>
                          <span className="min-w-0 flex-1">{lesson.title}</span>
                          {lesson.isFree && <span className="mm-tag is-ok">{t('sheet.free')}</span>}
                          {lesson.duration ? <span className="text-[12px] opacity-70">{lesson.duration}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          </div>

          {/* LA CARTE DE PRIX, COLLANTE — le seul `hero` de la page. */}
          <aside className="grid gap-[14px] wide:sticky wide:top-[calc(var(--header-h)+1rem)]">
            <div className="mm-card rv" style={{ ['--i' as string]: 4, padding: '26px' }}>
              <p className="mm-eyebrow m-0 mb-3">{t('sheet.cardKicker')}</p>
              <PriceBlock
                size={36}
                amount={{ value: price, source: 'db', asOf }}
                strike={formation.promoPrice ? { value: formation.price, source: 'db', asOf } : undefined}
                currency="FCFA"
                approx={<PriceApprox xof={price} />}
                note={t('sheet.lifetime')}
              />
              {/*
                ── LE CTA POINTE SUR LE PAIEMENT, CONNECTÉ OU NON ────────────────────────
                Il envoyait les visiteurs déconnectés sur `/connexion` SANS état de retour.
                Or `Login.tsx:43` retombe alors sur son défaut, `/mon-espace` : quelqu'un
                qui venait de cliquer « S'inscrire » sur une formation atterrissait sur son
                tableau de bord, et devait retrouver la formation à la main. Six à sept clics
                au lieu de trois, au moment de la plus forte intention d'achat du site.

                Le mécanisme correct existait déjà et sert partout ailleurs : `/checkout/:slug`
                est sous `ProtectedRoute` (`App.tsx:455-457`), qui renvoie vers la connexion
                AVEC `state={{ from: location }}` — et `Login` lit ce `from`. Cette page était
                la seule à court-circuiter le garde en devinant la destination elle-même.

                Le `href` est conservé plutôt qu'un `navigate()` : c'est une page publique, et
                un CTA de vente doit rester ouvrable dans un nouvel onglet et copiable. Le
                rechargement complet que `Button href` provoque est un défaut réel, mais il est
                SYSTÉMIQUE au composant — le corriger ici seul, en dégradant le lien en bouton,
                échangerait un défaut contre un autre.
              */}
              {/*
                ── CE QU'ON PROPOSE DÉPEND DE CE QUI EST OUVERT ──────────────────────────
                Une formation à venir n'a pas de tunnel : `resolveCheckoutTotal` le refuse
                côté serveur, et `/checkout/:slug` s'y casserait. On propose donc la liste
                d'attente — sauf si la précommande a été ouverte POUR CETTE formation, auquel
                cas le tunnel accepte et devient l'action principale.

                UN SEUL BOUTON PRINCIPAL. Quand la précommande est ouverte, l'inscription à
                la liste passe en `quiet` juste dessous : deux actions de même poids côte à
                côte ne se partagent pas l'attention, elles l'annulent.
              */}
              {!aVenir && (
                <Button
                  href={path(`/checkout/${formation.slug}`)}
                  tone="forme"
                  onClick={onBuy}
                  style={{ marginTop: '15px' }}
                >
                  {t('sheet.enroll')}
                </Button>
              )}

              {aVenir && (
                <>
                  {ouvertureTexte
                    ? (
                      <p className="m-0 mt-3 text-meta-2 leading-[1.5] text-ink-2">
                        {t('comingSoon.opensOn', { date: ouvertureTexte })}
                      </p>
                    )
                    : (
                      /* Aucune date n'est posée, et on le DIT. Inventer « bientôt » sans
                         rien derrière serait la promesse creuse que cette page évite ailleurs. */
                      <p className="m-0 mt-3 text-meta-2 leading-[1.5] text-ink-2">
                        {t('comingSoon.noDateYet')}
                      </p>
                    )}

                  {precommande && (
                    <Button
                      href={path(`/checkout/${formation.slug}`)}
                      tone="forme"
                      onClick={onBuy}
                      style={{ marginTop: '13px' }}
                    >
                      {t('comingSoon.preorder')}
                    </Button>
                  )}

                  {/*
                    Le compte est requis : déconnecté, le bouton mène à l'inscription EN
                    GARDANT la fiche en destination — le même mécanisme que le tunnel, pour
                    que personne ne revienne à la main.
                  */}
                  {user ? (
                    <Button
                      tone={precommande ? 'quiet' : 'forme'}
                      onClick={rejoindreListe}
                      disabled={attente.envoi || attente.inscrit === true}
                      loading={attente.envoi}
                      style={{ marginTop: precommande ? '10px' : '13px' }}
                    >
                      {attente.inscrit === true ? t('comingSoon.alreadyIn') : t('comingSoon.notifyMe')}
                    </Button>
                  ) : (
                    <Button
                      href={path('/inscription')}
                      tone={precommande ? 'quiet' : 'forme'}
                      style={{ marginTop: precommande ? '10px' : '13px' }}
                    >
                      {t('comingSoon.notifyMeSignedOut')}
                    </Button>
                  )}

                  {/* LA PROMESSE, ÉCRITE SOUS LE BOUTON QUI L'ENGAGE. */}
                  <p className="m-0 mt-2 text-small leading-[1.5] text-ink-2">
                    {t('comingSoon.promise')}
                  </p>

                  {/* La preuve sociale ne s'affiche qu'au-dessus du seuil, et datée. */}
                  {attendus !== null && (
                    <p className="m-0 mt-2 text-small leading-[1.5] text-ink-2">
                      {t('comingSoon.waiting', { count: attendus })}
                    </p>
                  )}
                </>
              )}
              {/*
                « Commencer le module gratuit » MENAIT AU CATALOGUE — c'est-à-dire à la page
                d'où l'on vient. Le geste promis ne se produisait pas : la personne revenait
                en arrière en croyant avancer.

                Il ouvre maintenant le lecteur, qui sert l'aperçu des leçons marquées
                gratuites (voir `CoursePlayer`). Et il ne s'affiche QUE si une telle leçon
                existe : proposer d'ouvrir un module gratuit sur une formation qui n'en a
                aucun serait la même promesse creuse, un cran plus loin.
              */}
              {hasFreeLesson && !aVenir && (
                <Button href={path(`/cours/${formation.slug}`)} tone="quiet" style={{ marginTop: '10px' }}>
                  {t('sheet.startFree')}
                </Button>
              )}

              <div className="my-5 h-px bg-[color:var(--border-hair)]" />
              {(['c1', 'c2', 'c3'] as const).map((key, i) => (
                <CheckLine key={key} tone="ok" style={{ fontSize: '13.5px', marginTop: i === 0 ? 0 : undefined }}>
                  {t(`sheet.${key}`)}
                </CheckLine>
              ))}
              {/* LA PROMESSE SUSPENDUE, DITE PLUTÔT QUE TUE. Le bouton « Commencer le module
                  gratuit » a disparu plus haut : sans cette ligne, la personne conclurait que
                  l'accès libre n'existe pas sur cette formation, alors qu'il est seulement
                  reporté au jour de l'ouverture. */}
              {aVenir && (
                <CheckLine tone="neutre" dash style={{ fontSize: '13.5px' }}>
                  {t('comingSoon.freeLater')}
                </CheckLine>
              )}
            </div>

            {/*
              L'ENCART DE VÉRITÉ — ce qui remplace la note et le nombre d'inscrits. Ses deux
              nombres viennent du contenu réel de la formation, comptés à l'affichage.
            */}
            <GlassPanel level="truth" className="rv" style={{ ['--i' as string]: 5 }}>
              <SiteEyebrow style={{ marginBottom: '6px' }}>{t('sheet.truthTitle')}</SiteEyebrow>
              {/* ⚠️ Sur une formation à venir, `lessons` vaut ZÉRO — les leçons ont été
                  retirées à la lecture. Réutiliser la même phrase afficherait « 0 leçon »
                  au milieu d'un argumentaire de vente. On compte les modules, et on dit
                  que le reste s'écrit. */}
              <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">
                {aVenir
                  ? t('comingSoon.truthBody', { modules: modules.length })
                  : t('sheet.truthBody', { lessons, modules: modules.length })}
              </p>
            </GlassPanel>
          </aside>
        </div>
      </PageSite>

      <SiteBand>
        <SiteDisplay as="h2" lines={t('sheet.forWhoTitle', { returnObjects: true }) as string[]} size={34} />
        {/* Marge 22, pas 24 — `PagesFormations.js:109`. */}
        <div className="mt-[22px] grid gap-4 stack:grid-cols-2">
          <div className="mm-card" style={{ padding: '24px' }}>
            <p className="m-0 mb-3 font-display text-[19px] font-black tracking-[-.03em] text-ink">{t('sheet.forYes')}</p>
            {(['y1', 'y2', 'y3'] as const).map((k) => <CheckLine key={k} tone="ok">{t(`sheet.${k}`)}</CheckLine>)}
          </div>
          <div className="mm-card" style={{ padding: '24px' }}>
            <p className="m-0 mb-3 font-display text-[19px] font-black tracking-[-.03em] text-ink">{t('sheet.forNo')}</p>
            {(['n1', 'n2', 'n3'] as const).map((k) => (
              <CheckLine key={k} tone="neutre" dash>{t(`sheet.${k}`)}</CheckLine>
            ))}
          </div>
        </div>
      </SiteBand>

      <PageSite>
        <SiteDisplay as="h2" lines={t('sheet.faqTitle', { returnObjects: true }) as string[]} size={34} />
        <div className="mm-acc rv mt-5" style={{ ['--i' as string]: 2 }}>
          {(['1', '2', '3'] as const).map((n, i) => (
            <details key={n} className="mm-acc__item" open={i === 0 ? true : undefined}>
              <summary>
                <span className="mm-acc__n">{`0${n}`}</span>
                <span className="min-w-0 flex-1">{t(`sheet.q${n}`)}</span>
                <span className="mm-acc__plus" aria-hidden="true"><Icon name="plus" size={15} /></span>
              </summary>
              <div className="mm-acc__body max-w-prose">{t(`sheet.a${n}`)}</div>
            </details>
          ))}
        </div>
      </PageSite>
    </DsNavHost>
  );
}
