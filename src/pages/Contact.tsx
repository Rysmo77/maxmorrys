import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Avatar, Button, CheckLine, DocLine, Field, GlassPanel, Icon, type IconName } from '@ds';
import DsNavHost from '../components/layout/DsNavHost';
import { GlyphTile, PageSite, SiteBand, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import {
  SITE_URL, DEFAULT_OG_IMAGE, SOCIAL_URLS,
  CONTACT_EMAIL, CONTACT_PHONE_E164, CONTACT_PHONE_DISPLAY, WHATSAPP_BASE_URL,
} from '../components/seo/seo-config';
import { corporateUrl, practices } from '../lib/brand';
import { trackContact } from '../lib/tracking';
import {
  BRANCHES, MESSAGE_MAX, SUBJECTS_BY_BRANCH, useContactMessage, type Branch,
} from './contact/useContactMessage';
import { useAppointment } from './contact/useAppointment';
import { BookingDialog } from './contact/BookingDialog';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /contact — LA QUESTION D'AIGUILLAGE VIENT AVANT TOUT LE RESTE (CDC § 4.5).
 *
 * La page TRIAIT DÉJÀ, mais après coup : un formulaire unique, et trois encarts autour qui
 * expliquaient ce qui n'aurait pas dû y entrer — un paiement en attente, une question de FAQ,
 * un projet d'agence. Trois avertissements à lire avant d'écrire, et rien n'empêchait
 * d'écrire quand même. Le CDC inverse l'ordre : on choisit d'abord de quoi il s'agit, et tout
 * le reste de la page découle de ce choix.
 *
 * TROIS BRANCHES, ET LA TROISIÈME N'ÉCRIT RIEN.
 *
 *   · `learn` — formation ou communauté   → le formulaire, sujets de la piste Apprendre
 *   · `build` — site ou plateforme        → le formulaire, sujets de la piste Conception
 *   · `grow`  — direction marketing       → SORT DU SITE, vers MY ONOMA
 *
 * ⚠️ POURQUOI LA TROISIÈME SORT, ET NE SE CONTENTE PAS D'UN MARQUEUR. `practices.ts` décrit
 * un `GROWTH_ROUTING_TAG` : le lead est enregistré, tagué, et on propose Cléa. Ça suppose un
 * transfert inter-entités que le même fichier déclare inexistant — donc, en pratique, une
 * demande recopiée à la main par une personne qui doit y penser. Le CDC tranche l'inverse :
 * on renvoie vers le formulaire de MY ONOMA plutôt que de collecter ici. L'URL n'est pas
 * écrite en dur : elle se compose de `corporateUrl` et du `corporatePath` de la practice.
 *
 * ── DEUX ÉCARTS DE COPIE CORRIGÉS AU PASSAGE ─────────────────────────────────────────
 *
 * 1. L'ENCART DE VÉRITÉ MENTAIT À L'ENVERS. Il disait « un message envoyé depuis un compte
 *    connecté n'est pas rattaché à son auteur ». C'était vrai ; ça ne l'est plus —
 *    `useContactMessage` écrit `userId`, et `firestore.rules` le borne à l'UID de l'émetteur.
 *    Une phrase qui nie ce que le code fait est le défaut le plus coûteux du dépôt : elle ne
 *    casse rien, et elle décourage exactement la personne qu'elle décrit.
 *
 * 2. L'ENCART « POUR UN PROJET SUR MESURE » POINTAIT SUR `/agence`. Cette route est devenue
 *    une redirection, et surtout le besoin qu'elle décrivait EST maintenant la branche 2 :
 *    deux dispositifs pour le même aiguillage, dont l'un renvoyait ailleurs.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const rv = (i: number): CSSProperties => ({ ['--i' as string]: i });

/**
 * Le glyphe et l'encre de chaque branche. Les deux qui écrivent portent la teinte de LEUR
 * piste — le bleu de « Je te forme » pour Apprendre, le corail de Conception, qui vit hors
 * des quatre verbes (`universeFromPath('/conception')` rend l'univers `agency`).
 *
 * LA TROISIÈME EST NEUTRE, ET C'EST LE POINT. Elle ne mène à aucune piste de ce site : lui
 * donner une teinte de marque l'annoncerait comme une troisième offre d'ici. Le gris de
 * l'encre secondaire dit exactement ce qu'elle est — une sortie.
 *
 * Le corail plein fait 2,70:1 et ne porte jamais de texte : c'est sa variante `-t` qui est
 * lue ici, comme partout ailleurs dans le dépôt (AD-20).
 */
const BRANCH: Record<Branch, { glyph: IconName; ink: string }> = {
  learn: { glyph: 'book', ink: 'var(--mm-bleu)' },
  build: { glyph: 'globe', ink: 'var(--mm-corail-t)' },
  grow: { glyph: 'bars', ink: 'var(--ink-2)' },
};

/** Le formulaire de MY ONOMA, composé — jamais recopié. */
const MY_ONOMA_FORM = `${corporateUrl}${practices.grow.corporatePath}`;

export default function Contact() {
  const { t } = useTranslation('contact');
  const path = useLocalizedPath();

  /*
   * ── `?rdv=1` — LE PIED DE PAGE AVAIT DEUX ENTRÉES POUR UNE SEULE DESTINATION ──────────
   *
   * « Contact » et « Prendre rendez-vous » visaient tous deux `/contact`, sans paramètre.
   * Le second ne tenait donc pas sa promesse : le dialogue de rendez-vous n'est atteignable
   * qu'APRÈS avoir choisi une branche, et rien sur la page d'arrivée ne le disait.
   *
   * Le paramètre présélectionne la branche `learn` — celle qui porte le créneau du soir — et
   * ouvre le dialogue au montage. Les deux entrées cessent d'être un doublon parce qu'elles
   * mènent désormais à deux ÉTATS de la même page.
   *
   * ⚠️ LA BRANCHE EST UN ÉTAT INITIAL, PAS UN VERROU. Une fois la page ouverte, changer de
   * branche ne doit pas rouvrir le dialogue ni réécrire l'URL : `rdv` n'est lu qu'à
   * l'initialisation de l'état et dans un effet calé sur lui seul.
   */
  const [params] = useSearchParams();
  const rdv = params.get('rdv') === '1';

  const [branch, setBranch] = useState<Branch | null>(rdv ? 'learn' : null);

  /*
   * La branche QUI ÉCRIT. `grow` n'en est pas une : passer `null` au formulaire est ce qui
   * garantit qu'aucun état de saisie ne survit à un choix qui sort du site.
   */
  const writing = branch === 'grow' ? null : branch;
  const message = useContactMessage(writing);
  const booking = useAppointment();

  /* `booking.openDialog` est reconstruit à chaque rendu : le mettre en dépendance rouvrirait
     le dialogue en boucle, y compris après une fermeture. La dépendance réelle est `rdv`. */
  useEffect(() => {
    if (rdv) booking.openDialog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rdv]);

  /* Le tri du kit : deux lignes, une pastille chacune, et une SORTIE — le mot en relief du
     kit est ici un vrai lien, parce que c'est exactement ce qu'il désignait. */
  const triage = [
    {
      key: 'payment',
      before: t('page.triage.paymentBefore'),
      label: t('page.triage.paymentLink'),
      after: t('page.triage.paymentAfter'),
      href: path('/mon-espace/cours'),
    },
    {
      key: 'faq',
      before: t('page.triage.faqBefore'),
      label: t('page.triage.faqLink'),
      after: t('page.triage.faqAfter'),
      href: path('/faq'),
    },
  ];

  /*
   * Les canaux directs. Ils ne sont pas au kit, et ils restent : ce sont les seules adresses
   * réellement joignables du produit, et le suivi `trackContact` y était accroché. Le kit
   * dessine une page où tout passe par le formulaire ; le produit, lui, vend aussi par
   * WhatsApp. Supprimer la ligne aurait supprimé le canal.
   */
  const channels = [
    { key: 'whatsapp', label: t('info.whatsapp'), value: t('info.whatsappValue'), href: WHATSAPP_BASE_URL, external: true },
    { key: 'email', label: t('info.email'), value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, external: false },
    { key: 'phone', label: t('info.phone'), value: CONTACT_PHONE_DISPLAY, href: `tel:${CONTACT_PHONE_E164}`, external: false },
  ];

  /*
   * Les trois cases de la bande. AUCUNE N'EST EN MONOSPACE, et c'est une correction du kit :
   * il met « ≤ 48 h » en `.mm-num`, or la monospace est réservée aux nombres qui viennent de
   * la base ou d'une source citée (AD-5). Un délai de réponse est un ENGAGEMENT, pas un
   * relevé — il se tient en corps, comme les deux autres.
   */
  const facts = [
    { key: 'reply', label: t('page.facts.replyLabel'), value: t('page.facts.replyValue'), note: t('page.facts.replyNote') },
    { key: 'reader', label: t('page.facts.readerLabel'), value: t('page.facts.readerValue'), note: t('page.facts.readerNote') },
    { key: 'langs', label: t('page.facts.langsLabel'), value: t('page.facts.langsValue'), note: t('page.facts.langsNote') },
  ];

  return (
    <DsNavHost>
      <SEOHead title={t('seoTitle')} description={t('seoDescription')} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Max-Morrys',
        url: `${SITE_URL}/contact`,
        mainEntity: {
          '@type': 'Organization',
          name: 'Max-Morrys',
          telephone: CONTACT_PHONE_E164,
          email: CONTACT_EMAIL,
          address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
        },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Max-Morrys',
        image: DEFAULT_OG_IMAGE,
        telephone: CONTACT_PHONE_E164,
        email: CONTACT_EMAIL,
        url: SITE_URL,
        address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
        priceRange: '€€',
        sameAs: [WHATSAPP_BASE_URL, ...SOCIAL_URLS],
      }} />

      <PageSite>
        {/* ── LA PREMIÈRE QUESTION ────────────────────────────────────────── */}
        <div className="mm-arc-host">
          <SiteDisplay arc lines={t('page.titleLines', { returnObjects: true }) as string[]} size={52} />

          {/* 46ch : le chapô se lit d'un regard, il ne se parcourt pas. */}
          <p className="rv mt-[14px] max-w-[46ch] text-[16px] leading-[1.55] text-ink-2" style={rv(3)}>
            {t('page.lede')}
          </p>

          <GlassPanel
            level="hero"
            padding={26}
            className="rv mt-[22px]"
            style={rv(4)}
            role="group"
            aria-labelledby="mm-contact-route"
          >
            <SiteEyebrow style={{ margin: 0 }}>{t('page.route.eyebrow')}</SiteEyebrow>
            <p
              id="mm-contact-route"
              className="mt-[9px] mb-0 font-display text-[22px] font-black tracking-[-.03em] text-ink"
            >
              {t('page.route.question')}
            </p>

            <div className="mt-4 grid gap-3 stack:grid-cols-3">
              {BRANCHES.map((key) => (
                /*
                  UN BOUTON, PAS UN LIEN — même pour `grow`. La troisième branche SORT du site,
                  mais elle sort en expliquant pourquoi : envoyer directement sur un autre
                  domaine au clic ferait quitter maxmorrys.me sans qu'on ait dit à la personne
                  chez qui elle atterrit, ni ce qu'on ne fait pas ici. Le lien sortant est dans
                  le panneau que ce bouton révèle.

                  `aria-pressed` et non `aria-checked` : ce sont trois bascules, pas un groupe
                  de radios — on peut en changer autant de fois qu'on veut, et rien n'est
                  soumis tant que le formulaire ne l'est pas.
                */
                /*
                  ⚠️ LA SURFACE EST UNE PRIMITIVE, PLUS UNE CLASSE CSS PRISE À LA MAIN. Le
                  bouton portait `glass-flat` écrit dans son `className` — ce que l'en-tête de
                  `src/design-system/index.ts` interdit nommément : une classe du kit lue hors
                  de son composant est un niveau de verre que rien ne re-vérifie, et que
                  `ds:check` ne voit pas. `GlassPanel` accepte maintenant `as="button"` avec
                  `type`, `onClick` et `aria-pressed` ; la géométrie passe par `padding`.
                */
                <GlassPanel
                  key={key}
                  as="button"
                  type="button"
                  level="flat"
                  padding={18}
                  aria-pressed={branch === key}
                  onClick={() => setBranch(key)}
                  className="mm-press mm-touch-extend min-w-0 text-left"
                  style={branch === key
                    ? { borderColor: BRANCH[key].ink, boxShadow: `0 0 0 1px ${BRANCH[key].ink}` }
                    : undefined}
                >
                  {/* La pastille était la SIXIÈME écrite à la main du dépôt, et la seule hors
                      famille : 34 px de côté pour un rayon de 10, quand les cinq autres
                      suivaient 0,32 × côté. `GlyphTile` le calcule — 11 px ici. */}
                  <GlyphTile icon={BRANCH[key].glyph} tint={BRANCH[key].ink} ink={BRANCH[key].ink} />
                  <span className="mt-[11px] block font-display text-[16px] font-black tracking-[-.03em] text-ink">
                    {t(`page.route.${key}Title`)}
                  </span>
                  <span className="mt-1.5 block text-meta leading-[1.5] text-ink-2">
                    {t(`page.route.${key}Body`)}
                  </span>
                </GlassPanel>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/*
          ── CE QUI DÉCOULE DU CHOIX ──────────────────────────────────────────
          Rien n'est monté tant qu'aucune branche n'est choisie : un formulaire visible sous
          une question non répondue est une question décorative.
        */}
        {branch && (
          <div className="mm-section grid items-start gap-11 wide:grid-cols-[.95fr_1.05fr]">
            <div>
              <GlassPanel level="flat" padding={22} className="rv" style={rv(1)}>
                <SiteEyebrow style={{ margin: 0 }}>{t('page.triage.title')}</SiteEyebrow>
                {/*
                  ⚠️ CES LIGNES REDESSINAIENT `CheckLine` À LA MAIN, ET AVAIENT DÉJÀ DÉRIVÉ.
                  Pastille de 22 px, `color-mix` du voile, glyphe centré, écart de 11 px : la
                  géométrie exacte de la primitive, recopiée pour la seule raison qu'aucun ton
                  ne portait une alerte. La copie avait pris 18 % de voile au lieu de 15 et un
                  corps de 14 px au lieu de 14,5 — le mode de dérive habituel d'une primitive
                  qu'on contourne. Le ton `alerte` et la marque `alert` existent depuis le
                  18/09/2026 ; il n'y a plus rien à retaper.
                */}
                {triage.map((row) => (
                  <CheckLine key={row.key} tone="alerte" mark="alert">
                    <span className="text-ink-2">
                      {row.before}{' '}
                      <a href={row.href} className="font-bold text-forme">{row.label}</a>{' '}
                      {row.after}
                    </span>
                  </CheckLine>
                ))}
              </GlassPanel>

              <GlassPanel level="flat" padding={22} className="rv mt-[14px]" style={rv(2)}>
                <SiteEyebrow style={{ margin: 0 }}>{t('page.channels.title')}</SiteEyebrow>
                <div className="mt-2">
                  {channels.map((channel, i) => (
                    <DocLine
                      key={channel.key}
                      label={channel.label}
                      last={i === channels.length - 1}
                      value={
                        <a
                          href={channel.href}
                          target={channel.external ? '_blank' : undefined}
                          rel={channel.external ? 'noopener noreferrer' : undefined}
                          onClick={() => trackContact(channel.key)}
                          className="text-forme"
                        >
                          {channel.value}
                        </a>
                      }
                    />
                  ))}
                </div>
                <p className="mt-3 mb-0 text-small leading-[1.5] text-ink-2">{t('page.channels.bookingBody')}</p>
                <Button
                  tone="quiet"
                  size="sm"
                  fullWidth={false}
                  className="mt-3"
                  onClick={() => { trackContact('appointment_cta'); booking.openDialog(); }}
                >
                  <Icon name="calendar" size={16} strokeWidth={2.4} />
                  {t('booking.cardButton')}
                </Button>
              </GlassPanel>
            </div>

            <div>
              {writing ? (
                <>
                  <GlassPanel level="hero" padding={28} className="rv" style={rv(3)}>
                    {message.account && (
                      /* Panneau plat IMBRIQUÉ dans le panneau héros — c'est la composition du
                         kit, et aucun des deux ne porte de flou : le héros est du faux verre. */
                      <GlassPanel level="flat" padding={14} className="mb-2 flex items-center gap-3">
                        <Avatar initials={message.account.initials} size={36} />
                        <div className="flex-1">
                          <p className="m-0 text-[13.5px] font-semibold text-ink">{t('page.account.title')}</p>
                          <p className="m-0 text-meta-2 text-ink-2">{t('page.account.body')}</p>
                        </div>
                        <Icon name="check" size={15} color="var(--ok)" strokeWidth={3.2} title={t('page.account.signedIn')} />
                      </GlassPanel>
                    )}

                    <form onSubmit={message.handleSubmit} noValidate>
                      {/* Piège à robots — invisible à l'œil, retiré de l'arbre d'accessibilité, et
                          exclu de la charge envoyée. Ce n'est pas un `Field` : un champ que personne
                          ne doit remplir n'a pas d'étiquette à annoncer. */}
                      <div aria-hidden="true" className="hidden">
                        <input
                          type="text"
                          name="_hp"
                          tabIndex={-1}
                          autoComplete="off"
                          value={message.form._hp}
                          onChange={(e) => message.update('_hp', e.target.value)}
                        />
                      </div>

                      <Field
                        label={t('form.nameLabel')}
                        value={message.form.name}
                        onChange={(v) => message.update('name', v)}
                        error={message.errors.name}
                        placeholder={t('form.namePlaceholder')}
                        autoComplete="name"
                        required
                        style={{ marginTop: 0 }}
                      />

                      <Field
                        label={t('form.emailLabel')}
                        type="email"
                        value={message.form.email}
                        onChange={(v) => message.update('email', v)}
                        error={message.errors.email}
                        placeholder={t('form.emailPlaceholder')}
                        /* Sans `inputMode` ni `autoComplete`, aucun clavier adapté ne s'ouvre et rien
                           ne se pré-remplit — ce qui coûte cher au pouce sur le marché visé. */
                        inputMode="email"
                        autoComplete="email"
                        required
                      />

                      {/* Les sujets sont ceux de la branche : le catalogue unique reposait la
                          question déjà tranchée par le bouton du dessus. */}
                      <Field
                        as="select"
                        label={t('page.form.subjectLabel')}
                        value={message.form.subjectKey}
                        onChange={(v) => message.update('subjectKey', v)}
                        error={message.errors.subjectKey}
                        placeholder={t('page.form.subjectPlaceholder')}
                        options={SUBJECTS_BY_BRANCH[writing].map((key) => ({ value: key, label: t(`subjects.${key}`) }))}
                        required
                      />

                      <Field
                        as="textarea"
                        label={t('form.messageLabel')}
                        value={message.form.message}
                        onChange={(v) => message.update('message', v)}
                        error={message.errors.message}
                        placeholder={t(`page.form.messagePlaceholder${writing === 'build' ? 'Build' : 'Learn'}`)}
                        rows={5}
                        /* Le plafond de `firestore.rules`. Le navigateur arrête la frappe au bon
                           endroit plutôt que de laisser l'écriture échouer après l'envoi. */
                        maxLength={MESSAGE_MAX}
                        required
                      />

                      {/*
                        ⚠️ LE BOUTON D'ENVOI ÉTAIT EN `forme` — LE BLEU DE « JE TE FORME ».
                        `/contact` sert les DEUX pistes : le même formulaire est soumis par
                        quelqu'un qui demande un cours et par quelqu'un qui décrit un projet
                        de site. Teindre l'action du bleu d'une seule piste choisissait pour
                        le visiteur, sur l'écran dont le métier est justement de le laisser
                        choisir — et contredisait le bouton qu'il venait de presser. Le ton
                        par défaut (`primary`) est le seul qui n'appartienne à personne.
                      */}
                      <Button type="submit" loading={message.loading} style={{ marginTop: '18px' }}>
                        {t('form.submit')}
                      </Button>
                    </form>

                    {/* Sur `--ink-2`, jamais sur `--text-faint` : l'encre tertiaire ne porte pas de
                        texte (AD-18), et c'est ici la phrase la plus honnête de la page. */}
                    <p className="mt-[10px] mb-0 text-center text-small leading-[1.5] text-ink-2">
                      {t('page.form.note')}
                    </p>
                  </GlassPanel>

                  <GlassPanel level="truth" className="rv mt-[14px]" style={rv(4)}>
                    <SiteEyebrow style={{ marginBottom: '6px' }}>{t('page.truth.title')}</SiteEyebrow>
                    <p className="m-0 text-meta-2 leading-[1.55] text-ink-2">{t('page.truth.body')}</p>
                  </GlassPanel>
                </>
              ) : (
                /*
                  LA BRANCHE QUI SORT. Aucun champ, aucune collecte : la demande part d'ici et
                  arrive là-bas, sans étape manuelle entre les deux. Le panneau dit CE QU'ON NE
                  FAIT PAS avant de dire où aller — c'est ce qui distingue un renvoi d'un rejet.
                */
                <GlassPanel level="hero" padding={28} className="rv" style={rv(3)}>
                  <SiteEyebrow style={{ margin: 0 }}>{t('page.myonoma.eyebrow')}</SiteEyebrow>
                  <p className="mt-[9px] mb-0 font-display text-[22px] font-black tracking-[-.03em] text-ink">
                    {t('page.myonoma.title')}
                  </p>
                  <p className="mm-prose mt-3 mb-0 max-w-[48ch] text-[14.5px] leading-[1.6] text-ink-2">
                    {t('page.myonoma.body')}
                  </p>
                  <div className="mt-5">
                    <Button
                      href={MY_ONOMA_FORM}
                      target="_blank"
                      rel="noopener noreferrer"
                      tone="primary"
                      fullWidth={false}
                      onClick={() => trackContact('myonoma_grow')}
                    >
                      {t('page.myonoma.cta')}
                      <Icon name="forward" size={15} strokeWidth={2.6} />
                    </Button>
                  </div>
                  <p className="mt-3 mb-0 text-small leading-[1.5] text-ink-2">{t('page.myonoma.note')}</p>
                </GlassPanel>
              )}
            </div>
          </div>
        )}
      </PageSite>

      <SiteBand>
        <div className="grid gap-4 stack:grid-cols-3">
          {facts.map((fact, i) => (
            <GlassPanel level="flat" key={fact.key} padding={22} className="rv" style={rv(i)}>
              <SiteEyebrow style={{ margin: 0 }}>{fact.label}</SiteEyebrow>
              {/* LA PREMIÈRE CASE DOMINE — 26 px contre 20, comme dans le kit
                  (`PagesUtiles.js:96`). Les trois étaient uniformisées, et la bande n'avait
                  plus de point d'accroche : le délai de réponse est ce que la personne vient
                  chercher avant d'écrire. C'est la TAILLE du kit qui est reprise, pas sa
                  monospace — voir le bloc au-dessus de `facts`. */}
              <p className={`m-0 mt-[5px] font-bold text-ink ${i === 0 ? 'text-[26px]' : 'text-[20px]'}`}>
                {fact.value}
              </p>
              <p className="m-0 mt-1 text-meta text-ink-2">{fact.note}</p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>

      <BookingDialog booking={booking} />
    </DsNavHost>
  );
}
