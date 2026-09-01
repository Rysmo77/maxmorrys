import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DocLine, Field, GlassPanel, Icon, Num } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import DsNavHost from '../components/layout/DsNavHost';
import { PageSite, SiteDisplay, SiteEyebrow } from '../components/site';
import { useLocalizedPath } from '../contexts/LanguageContext';
import { useFormat } from '../hooks/useFormat';
import { getCertificateByCode } from '../lib/firestore';
import { captureError } from '../lib/sentry';
import type { CertificateLookup } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /verifier — LE CONTRÔLE D'UN CODE.  Kit : `site-public/PagesUtiles.js` § Verifier,
 * et `plateforme/ScreensNotes.js` § Verification pour la version 390 px.
 *
 * LE PIED DE PAGE ANNONÇAIT « Vérifier un certificat » DEPUIS LE DÉBUT, et la page n'existait
 * pas. Seule `/certificat/:code` existait : elle affiche un certificat dont on a déjà le lien.
 * Ce n'est pas la même chose — un employeur a un PDF entre les mains, pas une URL.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI REND CETTE PAGE DIFFÉRENTE DE TOUTES LES AUTRES DU SITE : LE LECTEUR.
 *
 * Partout ailleurs, la voix s'adresse à l'apprenante — tutoiement, première personne, « je te
 * forme ». Ici c'est un TIERS qui lit : un employeur, un client, un jury. Il ne connaît pas la
 * marque, ne lui doit rien, et cherche une réponse binaire. Le kit règle ça par un ton neutre
 * et par ce qu'il n'affiche pas : aucune vente, aucun lien vers le catalogue, aucune bannière.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS RÉPONSES SONT DISTINCTES, ET C'EST LE CŒUR DE L'ÉCRAN.
 *
 * « authentique », « aucun certificat à ce code » et « la vérification n'a pas abouti » sont
 * TROIS choses. Les deux dernières se ressemblent à l'écran et n'ont rien à voir : une panne
 * réseau rendue en « certificat introuvable » fait conclure à un faux document. C'est le seul
 * défaut de cette page qui puisse coûter un emploi à quelqu'un, donc l'échec technique le dit
 * en toutes lettres — « ce n'est PAS une réponse sur le certificat ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LA PAGE NE MONTRE PAS, ET POURQUOI CE N'EST PAS UN OUBLI
 *
 * Le kit affiche une ligne « Leçons validées · 47 / 47 ». `CertificateLookup` ne porte pas de
 * nombre de leçons — il porte le code, le titre, la date et le nom. Le 47 est une donnée de
 * démonstration, et un nombre de démonstration finit en production (règle 6). La ligne n'est
 * donc pas rendue, exactement comme sur `lms/Certificate`.
 *
 * Et la recherche ne remonte à aucun compte : `certificate_lookups` est un miroir indexé PAR
 * LE CODE, sans UID. C'est ce qui permet à cette page d'être publique sans exposer personne —
 * l'encart de vérité dit précisément cela.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Les trois réponses possibles, plus les deux états d'attente. */
type Result =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'found'; certificate: CertificateLookup }
  | { kind: 'unknown' }
  | { kind: 'failed' };

export default function VerifyCertificate() {
  const { t } = useTranslation('lms');
  const { formatDate } = useFormat();
  const path = useLocalizedPath();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<Result>({ kind: 'idle' });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    /*
     * Les codes sont émis en capitales et sans espace (`crypto` puis mise en forme, voir
     * `issueCertificate`). Quelqu'un qui recopie depuis un PDF colle souvent une espace de
     * fin, ou saisit en minuscules : normaliser ici évite un « introuvable » qui serait une
     * erreur de saisie présentée comme un verdict sur le document.
     */
    const cleaned = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleaned) {
      setError(t('verify.emptyError'));
      setResult({ kind: 'idle' });
      return;
    }

    setError(undefined);
    setResult({ kind: 'searching' });
    try {
      const certificate = await getCertificateByCode(cleaned);
      setResult(certificate ? { kind: 'found', certificate } : { kind: 'unknown' });
    } catch (err: unknown) {
      // L'échec part chez Sentry : côté écran il ne doit surtout pas ressembler à un verdict.
      captureError(err, { context: 'Certificate verification failed' });
      setResult({ kind: 'failed' });
    }
  }

  return (
    <DsNavHost>
      <SEOHead title={t('verify.seoTitle')} description={t('verify.seoDescription')} />

      <PageSite>
        <div className="grid items-center gap-11 wide:grid-cols-[.95fr_1.05fr]">
          {/* ── La colonne de gauche : le code, et ce que la page ne fait pas ──── */}
          <div>
            <SiteDisplay lines={t('verify.titleLines', { returnObjects: true }) as string[]} size={50} />

            <p className="rv mt-[14px] max-w-[42ch] text-[16px] leading-[1.55] text-ink-2" style={{ ['--i' as string]: 3 }}>
              {t('verify.lede')}
            </p>

            {/*
              UN VRAI <form>. Entrée valide depuis le champ, sans qu'on ait à câbler la touche :
              c'est le geste de quelqu'un qui vient de coller un code, et le seul geste qu'il
              fera sur cette page.
            */}
            {/*
              ── UNE SEULE LIGNE DE 62 PX, comme le kit (`PagesUtiles.js:115`) ─────────────
              Le kit dessine ici une barre : `padding="0 18px"`, hauteur 62, le code en
              monospace à gauche et le bouton collé à droite. La production empilait un champ
              étiqueté, son indice, puis un bouton pleine largeur — un bloc environ trois fois
              plus haut, pour le seul geste que quelqu'un fera sur cette page : coller un code.

              LE LIBELLÉ N'EST PAS SUPPRIMÉ, il est masqué à l'œil (`hideLabel`) : le contrôle
              garde son `<label for>` pour un lecteur d'écran. L'indice et l'erreur descendent
              SOUS la barre — ils ne peuvent pas tenir dans une ligne de 62 px sans la faire
              grandir, et c'est la hauteur fixe qui fait la silhouette.
            */}
            <form onSubmit={onSubmit} noValidate>
              <GlassPanel
                level="flat"
                padding="0 18px"
                className="rv mt-[22px] flex items-center gap-3"
                style={{ ['--i' as string]: 4, height: '62px' }}
              >
                <Field
                  label={t('verify.codeLabel')}
                  hideLabel
                  value={code}
                  onChange={(value) => { setCode(value); if (error) setError(undefined); }}
                  placeholder={t('verify.codePlaceholder')}
                  autoComplete="off"
                  className="min-w-0 flex-1"
                  style={{ marginTop: 0 }}
                />
                <Button type="submit" tone="primary" size="sm" fullWidth={false} loading={result.kind === 'searching'}>
                  {t('verify.submit')}
                </Button>
              </GlassPanel>

              <p className="mt-2 mb-0 text-small leading-[1.5] text-ink-2">{t('verify.codeHint')}</p>
              {error && (
                <p className="mt-1 mb-0 text-small leading-[1.5] text-stop" role="alert">{error}</p>
              )}
            </form>

            <GlassPanel level="truth" className="rv mt-5 max-w-[46ch]" style={{ ['--i' as string]: 5 }}>
              <SiteEyebrow style={{ margin: '0 0 6px' }}>{t('verify.truthTitle')}</SiteEyebrow>
              <p className="m-0 text-meta leading-[1.6] text-ink-2">{t('verify.truthBody')}</p>
            </GlassPanel>
          </div>

          {/* ── La colonne de droite : la réponse, quelle qu'elle soit ─────────── */}
          {/*
            `aria-live="polite"` — la réponse arrive SANS changement de page ni déplacement du
            focus. Sans cette région, un lecteur d'écran ne dit rien du tout : la personne
            appuie sur « Vérifier » et le silence est la seule chose qu'elle obtient.
          */}
          <div aria-live="polite">
            {result.kind === 'found' ? (
              <ValidCertificate certificate={result.certificate} formatDate={formatDate} href={path(`/certificat/${result.certificate.certificateCode}`)} />
            ) : result.kind === 'unknown' ? (
              <GlassPanel level="hero" padding={30} className="rv-s">
                <div className="flex items-start gap-[13px]">
                  <span aria-hidden="true" className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full" style={{ background: 'color-mix(in srgb, var(--warn) 16%, transparent)' }}>
                    <Icon name="alert" size={21} color="var(--warn)" />
                  </span>
                  <div>
                    <p className="m-0 text-[17px] font-bold text-warn">{t('verify.notFoundTitle')}</p>
                    <p className="mt-[6px] mb-0 max-w-[44ch] text-meta leading-[1.6] text-ink-2">{t('verify.notFoundBody')}</p>
                  </div>
                </div>
                <Button href={path('/contact')} tone="quiet" size="sm" fullWidth={false} className="mt-5">
                  {t('verify.contact')}
                </Button>
              </GlassPanel>
            ) : result.kind === 'failed' ? (
              <GlassPanel level="hero" padding={30} className="rv-s">
                <div className="flex items-start gap-[13px]">
                  <span aria-hidden="true" className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full" style={{ background: 'color-mix(in srgb, var(--stop) 16%, transparent)' }}>
                    <Icon name="alert" size={21} color="var(--stop)" />
                  </span>
                  <div>
                    <p className="m-0 text-[17px] font-bold text-stop">{t('verify.failedTitle')}</p>
                    <p className="mt-[6px] mb-0 max-w-[44ch] text-meta leading-[1.6] text-ink-2">{t('verify.failedBody')}</p>
                  </div>
                </div>
              </GlassPanel>
            ) : (
              /* Avant toute recherche : ce qui s'affichera, et ce qui ne s'affichera pas. */
              <GlassPanel level="flat" padding={30} className="rv" style={{ ['--i' as string]: 6 }}>
                <SiteEyebrow style={{ margin: 0 }}>{t('verify.idleTitle')}</SiteEyebrow>
                <p className="mt-2 mb-0 max-w-[42ch] text-meta leading-[1.6] text-ink-2">{t('verify.idleBody')}</p>
              </GlassPanel>
            )}
          </div>
        </div>
      </PageSite>
    </DsNavHost>
  );
}

/**
 * LA CARTE DE RÉPONSE POSITIVE.
 *
 * Bordure verte et glyphe : le verdict se lit avant la lecture. La ligne « Leçons validées »
 * du kit n'y est pas — voir l'en-tête du fichier.
 */
function ValidCertificate({
  certificate,
  formatDate,
  href,
}: {
  certificate: CertificateLookup;
  formatDate: (value: string) => string;
  href: string;
}) {
  const { t } = useTranslation('lms');
  const issuedAt = new Date(certificate.issuedAt);

  return (
    <GlassPanel level="hero" padding={30} className="rv-s" style={{ borderColor: 'color-mix(in srgb, var(--ok) 34%, transparent)' }}>
      <div className="flex items-start gap-[13px]">
        <span aria-hidden="true" className="grid h-[42px] w-[42px] flex-none place-items-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ok) 16%, transparent)' }}>
          <Icon name="check" size={21} color="var(--ok)" />
        </span>
        <div>
          <p className="m-0 text-[17px] font-bold text-ok">{t('verify.validTitle')}</p>
          <p className="mt-[3px] mb-0 text-meta text-ink-2">{t('verify.validIssuer')}</p>
        </div>
      </div>

      <div className="my-5 h-px bg-[color:var(--border-hair)]" />

      {/* Les quatre lignes que le miroir porte réellement. Chaque valeur vient de la base. */}
      <DocLine label={t('verify.holder')} value={certificate.holderName} />
      <DocLine label={t('verify.formation')} value={certificate.formationTitle} />
      <DocLine label={t('verify.issuedOn')} value={<Num value={formatDate(certificate.issuedAt)} source="db" asOf={issuedAt} />} />
      <DocLine label={t('verify.code')} value={<Num value={certificate.certificateCode} source="db" asOf={issuedAt} />} last />

      <Button href={href} tone="quiet" size="sm" fullWidth={false} className="mt-5">
        {t('verify.openCertificate')}
      </Button>
    </GlassPanel>
  );
}
