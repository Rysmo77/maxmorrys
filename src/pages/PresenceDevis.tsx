import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, GlassPanel, Num, PriceBlock, Skeleton, Tag } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import { SITE_URL } from '../components/seo/seo-config';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { getAgencyQuote } from '../lib/firestore';
import { useFormat } from '../hooks/useFormat';
import { captureError } from '../lib/sentry';
import {
  QUOTE_VALIDITY_DAYS, balanceAmount, computeTotals, depositAmount, findPack, findPlan,
} from '../lib/presence/offer';
import { whatsappUrl } from '../lib/presence/whatsapp';
import type { AgencyQuote } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE DEVIS PARTAGEABLE — un DOCUMENT, consultable sans compte.
 *
 * Ce que la page était : une feuille A4 simulée — carte blanche de 3 colonnes centrée, en-tête
 * en aplat corail, titres en `tracking-[0.25em]`, listes à coches, quatre grilles d'échéancier.
 * Elle ne partageait rien avec le reste du site : ni sa gouttière, ni son verre, ni sa cascade
 * d'entrée, ni ses primitives. C'était une seizième mise en page pour quinze pages.
 *
 * Ce qu'elle est : `DocLine`, `PriceBlock`, `Tag` et `GlassPanel` — les primitives que le
 * système a écrites POUR un document. Le lien circule sur WhatsApp et se lit sur un téléphone
 * d'entrée de gamme : le kit le dessine en 390 px, et cette page se lit d'abord là.
 *
 * TROIS CORRECTIONS QUI NE SONT PAS COSMÉTIQUES :
 *
 * 1. LE TERRITOIRE. La page lisait `universeThemes.agency` — le corail, la practice BUILD —
 *    alors que son maillage de fond, posé par `PageMesh` depuis la route, est celui de
 *    `presence`, c'est-à-dire `digitalise`. Encre corail sur fond turquoise : deux promesses
 *    sur un même écran. Le devis est une offre Présence Digitale, il porte le teal.
 *
 * 2. LE ROND QUI TOURNE. `<Loader2 animate-spin>` centré sur toute la hauteur : il ne dit ni
 *    ce qui charge, ni combien de temps. Remplacé par un squelette à la forme du document.
 *
 * 3. L'ENCART DE VÉRITÉ dit ce que ce document fait RÉELLEMENT — voir son texte : il ne recopie
 *    pas la promesse du kit, parce que cette implémentation ne la tient pas encore. Le kit
 *    écrit « son contenu est figé à l'émission » ; ici `computeTotals()` relit la grille
 *    courante à chaque ouverture. Les deux ne peuvent pas être vrais en même temps, et c'est
 *    la page qui doit s'aligner sur le code — pas l'inverse, tant que le code n'a pas changé.
 *
 * `noIndex` : un devis client n'a rien à faire dans les résultats de recherche. La règle de
 * confidentialité tient toujours — aucune donnée personnelle n'est écrite dans le document
 * (cf. `agency_quotes` dans `firestore.rules`) : le lien se transfère sans exposer le
 * téléphone ni l'e-mail du prospect.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export default function PresenceDevis() {
  const { ref } = useParams<{ ref: string }>();
  const { t } = useTranslation('presence');
  const { formatDate } = useFormat();
  const path = useLocalizedPath();

  const [quote, setQuote] = useState<AgencyQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ref) { setLoading(false); return; }
    let active = true;
    getAgencyQuote(ref)
      .then((q) => { if (active) { setQuote(q); setLoading(false); } })
      .catch((error: unknown) => {
        captureError(error, { context: 'Load agency quote failed' });
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [ref]);

  /*
   * Le chargement est un SQUELETTE À LA FORME du document attendu — un titre, une adresse, un
   * panneau de lignes, deux boutons — pour que rien ne saute quand il arrive.
   */
  if (loading) {
    return (
      <PageSite>
        <div className="mx-auto grid max-w-doc gap-4">
          <Skeleton width={210} height={12} label={t('quote.loading')} />
          <Skeleton height={44} width="70%" />
          <Skeleton height={12} width={260} />
          <Skeleton height={320} radius="var(--r-l)" style={{ marginTop: '8px' }} />
          <Skeleton height={48} radius="var(--r-pill)" />
        </div>
      </PageSite>
    );
  }

  if (!quote) {
    return (
      <DsNavHost>
        <SEOHead title={t('quote.notFound.title')} description={t('quote.notFound.text')} noIndex />
        <PageSite>
          <SiteDisplay lines={t('quote.notFound.titleLines', { returnObjects: true }) as string[]} size={34} />
          {/*
            Motif réel, conséquence, sortie — dans cet ordre. Jamais d'excuse, jamais « oups ».
          */}
          <p className="mm-prose mt-4 max-w-[46ch] text-[15px] leading-[1.6] text-ink-2">
            {t('quote.notFound.text')}
          </p>
          <Button href={path('/presence-digitale')} tone="digitalise" size="sm" fullWidth={false} className="mt-5">
            {t('quote.notFound.cta')}
          </Button>
        </PageSite>
      </DsNavHost>
    );
  }

  const pack = findPack(quote.pack);
  const plan = findPlan(quote.plan);
  /*
   * Recalcul depuis la grille courante plutôt que depuis les montants stockés — comportement
   * conservé tel quel, et NOMMÉ dans l'encart de vérité plus bas. Ce n'est pas ce que le design
   * system prescrit pour un devis (« un devis émis est figé »), et le type `AgencyQuote` porte
   * déjà `packPrice`, `planSetup` et `planMonthly` pour le permettre. Le changer touche à ce
   * qu'un client a sous les yeux au moment de payer : ça se décide, ça ne se glisse pas dans
   * une passe de mise en page.
   */
  const totals = computeTotals(quote.pack, quote.plan);
  const issuedAt = new Date(quote.createdAt);
  const expiresAt = new Date(quote.expiresAt);
  const expired = expiresAt < new Date();

  /* Chaque montant porte sa source : la grille tarifaire, relue à l'ouverture. */
  const grid = { source: { cite: t('quote.gridCite') }, asOf: issuedAt } as const;

  const packFeatures = pack ? (t(`packs.${quote.pack}.features`, { returnObjects: true }) as string[]) : [];
  const planFeatures = plan ? (t(`plans.${quote.plan}.features`, { returnObjects: true }) as string[]) : [];

  const quotePath = path(`/presence-digitale/devis/${quote.ref}`);
  const quoteUrl = `${SITE_URL}${quotePath}`;
  const whatsappHref = whatsappUrl(`${t('whatsapp.quoteIntro')} ${quote.ref} — ${quote.businessName}`);

  const packName = pack ? t(`packs.${quote.pack}.name`) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(quoteUrl).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => null,
    );
  };

  return (
    <DsNavHost>
      <SEOHead title={t('quote.seoTitle')} description={t('quote.title')} noIndex />

      <PageSite>
        {/* La colonne de document — 76 caractères, jamais plus (AD-14, `--measure-doc`). */}
        <div className="mx-auto max-w-doc">
          <SiteEyebrow>{t('quote.eyebrowDs')}</SiteEyebrow>
          {/* Écrit ligne par ligne : seule la ligne 2 porte le nom du pack (AD-13). */}
          <SiteDisplay
            lines={[
              t('quote.titleLine1'),
              packName ? t('quote.titleLine2', { name: packName }) : t('quote.titleNoPack'),
            ]}
            size={44}
            from={1}
            style={{ marginTop: '6px' }}
          />

          {/*
            L'ADRESSE DU DOCUMENT, en monospace. Ce n'est pas un nombre : c'est une URL, et
            l'espacement fixe y porte du sens — elle se recopie et se dicte au téléphone.
          */}
          <p className="mm-num rv mt-[10px] break-all text-[11.5px] text-ink-2" style={{ ['--i' as string]: 4 }}>
            {quoteUrl.replace(/^https?:\/\//, '')}
          </p>

          <GlassPanel level="flat" padding={24} className="rv mt-4" style={{ ['--i' as string]: 5 }}>
            <DocLine label={t('quote.forBusiness')} value={`${quote.businessName}${quote.city ? `, ${quote.city}` : ''}`} />

            {pack && (
              <>
                <SiteEyebrow style={{ margin: '18px 0 4px' }}>{t('quote.setupSection')}</SiteEyebrow>
                <DocLine
                  label={<b className="font-semibold text-ink">{packName}</b>}
                  value={<Num value={totals.packPrice} source={grid.source} asOf={grid.asOf} unit="FCFA" />}
                />
                {packFeatures.map((feature, i) => (
                  <DocLine
                    key={feature}
                    label={feature}
                    value={t('quote.included')}
                    last={!plan && i === packFeatures.length - 1}
                  />
                ))}
              </>
            )}

            {plan && (
              <>
                <SiteEyebrow style={{ margin: '18px 0 4px' }}>{t('quote.planSection')}</SiteEyebrow>
                <DocLine
                  label={<b className="font-semibold text-ink">{t(`plans.${quote.plan}.name`)}</b>}
                  value={<Num value={totals.planSetup} source={grid.source} asOf={grid.asOf} unit="FCFA" />}
                />
                <DocLine
                  label={t('quote.monthlyLine')}
                  value={<Num value={totals.planMonthly} source={grid.source} asOf={grid.asOf} unit="FCFA" />}
                />
                {planFeatures.map((feature) => (
                  <DocLine key={feature} label={feature} value={t('quote.included')} />
                ))}
                {totals.commitmentMonths !== undefined && totals.commitmentTotal !== undefined && (
                  <DocLine
                    label={t('quote.commitmentLine', { months: totals.commitmentMonths })}
                    value={<Num value={totals.commitmentTotal} source={grid.source} asOf={grid.asOf} unit="FCFA" />}
                    last
                  />
                )}
              </>
            )}

            {/* Le filet : au-dessus le détail, en dessous ce qu'il y a à payer. */}
            <div className="my-[14px] h-px bg-[color:var(--fill-3)]" />

            <div className="flex flex-wrap items-end justify-between gap-3">
              <PriceBlock
                size={29}
                amount={{ value: totals.upfront, source: grid.source, asOf: grid.asOf }}
                note={t('quote.upfrontTotal')}
              />
              <Tag tone={expired ? 'warn' : 'ok'}>
                {expired ? t('quote.expiredTag') : (
                  <>
                    {t('quote.validFor')}{' '}
                    <Num
                      value={QUOTE_VALIDITY_DAYS}
                      source={{ cite: t('quote.gridCite') }}
                      asOf={issuedAt}
                      unit={t('quote.daysUnit')}
                    />
                  </>
                )}
              </Tag>
            </div>

            {totals.upfront > 0 && (
              <div className="mt-[14px]">
                <DocLine
                  label={t('quote.deposit')}
                  value={<Num value={depositAmount(totals.upfront)} source="server" asOf={grid.asOf} unit="FCFA" />}
                />
                <DocLine
                  label={t('quote.balance')}
                  value={<Num value={balanceAmount(totals.upfront)} source="server" asOf={grid.asOf} unit="FCFA" />}
                  last
                />
              </div>
            )}

            <p className="mt-[10px] mb-0 text-[11.5px] text-ink-2">
              {t('quote.issuedOnLabel')}{' '}
              <Num value={formatDate(quote.createdAt)} source="db" asOf={issuedAt} />
              {' · '}
              {t('quote.validUntilLabel')}{' '}
              <Num value={formatDate(quote.expiresAt)} source="db" asOf={expiresAt} />
            </p>
            {expired && (
              <p className="mm-prose mt-2 mb-0 max-w-[52ch] text-[12.5px] leading-[1.5] text-ink-2">
                {t('quote.expired')}
              </p>
            )}
            <p className="mm-prose mt-[10px] mb-0 max-w-[58ch] text-[11.5px] leading-[1.5] text-ink-2">
              {t('quote.notIncluded')}
            </p>
          </GlassPanel>

          {/* Les actions sortent de l'impression : elles ne servent à rien sur du papier. */}
          <div className="print:hidden">
            {/* `_blank` : le document reste ouvert derrière la conversation. `rel` est forcé
                par la primitive — `_blank` sans lui laisse la page ouverte accéder à `opener`. */}
            <Button
              href={whatsappHref}
              target="_blank"
              tone="digitalise"
              className="rv mt-[18px]"
              style={{ ['--i' as string]: 6 }}
            >
              {t('quote.cta')}
            </Button>
            {/*
              Le libellé change, la largeur ne bouge pas de façon perceptible et l'anneau reste
              sur le même élément : on ne remplace pas le bouton, on le fait parler.
            */}
            <Button
              tone="quiet"
              onClick={handleCopy}
              className="rv mt-[10px]"
              style={{ ['--i' as string]: 7 }}
            >
              {copied ? t('quote.copied') : t('quote.copy')}
            </Button>
            <Button
              tone="quiet"
              onClick={() => window.print()}
              className="rv mt-[10px]"
              style={{ ['--i' as string]: 8 }}
            >
              {t('quote.print')}
            </Button>
          </div>

          {/*
            L'ENCART DE VÉRITÉ. Il dit ce que ce document ne contient pas — aucune donnée
            personnelle — ET ce qu'il fait vraiment de ses montants. Voir l'en-tête du fichier.
          */}
          <GlassPanel level="truth" className="rv mt-[18px]" style={{ ['--i' as string]: 9 }}>
            <SiteEyebrow style={{ marginBottom: '6px' }}>{t('quote.truthTitle')}</SiteEyebrow>
            <p className="mm-prose m-0 max-w-[62ch] text-[12.5px] leading-[1.5] text-ink-2">{t('quote.truthBody')}</p>
          </GlassPanel>

          <p className="mm-prose mt-4 mb-0 max-w-[62ch] text-[11.5px] leading-[1.5] text-ink-2">
            {t('quote.disclaimer')}
          </p>

          <Button
            href={path('/presence-digitale')}
            tone="quiet"
            size="sm"
            fullWidth={false}
            className="mt-5 print:hidden"
          >
            {t('quote.backToOffer')}
          </Button>
        </div>
      </PageSite>
    </DsNavHost>
  );
}
