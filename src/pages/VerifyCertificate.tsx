import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon, LogoMark, Num } from '@ds';
import SEOHead from '../components/seo/SEOHead';
import LocalizedLink from '../components/shared/LocalizedLink';
import { EduNightHero } from '../components/edu/g1/EduPublic';
import EduPreFooter from '../components/edu/g2/EduPreFooter';
import { useFormat } from '../hooks/useFormat';
import { getCertificateByCode } from '../lib/firestore';
import { captureError } from '../lib/sentry';
import type { CertificateLookup } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * /verifier — LE CONTRÔLE D'UN CODE.  Passe 2 : maquettes `Edu-Certificat.dc.html` (+ mobile) —
 * héros de nuit qui porte le champ, puis le certificat à gauche et « Comment ça marche » à droite.
 *
 * ⚠️ DÉCISION LEVÉE (passe 2) : la page n'affichait « aucune vente, aucun lien vers le
 * catalogue ». La maquette, qui fait foi, la termine par le pré-pied Edu : il est rendu. Le
 * VERDICT, lui, reste neutre et sans vente.
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
 * La maquette affiche « Leçons validées · 24 / 24 » et une carte « Compétences validées ».
 * `CertificateLookup` ne porte ni nombre de leçons ni compétences — il porte le code, le titre,
 * la date et le nom. Ces éléments de démonstration ne sont donc pas rendus (règle 6).
 *
 * Et la recherche ne remonte à aucun compte : `certificate_lookups` est un miroir indexé PAR
 * LE CODE, sans UID. C'est ce qui permet à cette page d'être publique sans exposer personne.
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

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<Result>({ kind: 'idle' });
  const [params] = useSearchParams();
  /* `/verifier/:code` — l'adresse des maquettes (`edu.maxmorrys.me/verifier/MM-7K2Q-9F`). */
  const { code: codeDuChemin } = useParams<{ code?: string }>();
  const lienSuivi = useRef(false);

  /*
   * ⛔ LE LIEN PARTAGÉ DEPUIS L'APPLICATION VÉRIFIE TOUT DE SUITE. L'application partage
   * `/verifier?code=…` : le préfixe `/verifier` est celui que déclarent les liens profonds
   * (`assetlinks.json`, `apple-app-site-association`), donc le lien ouvre l'application chez
   * qui l'a, et CETTE page chez qui ne l'a pas — un employeur, un jury.
   */
  useEffect(() => {
    const recu = codeDuChemin ?? params.get('code');
    if (!recu || lienSuivi.current) return;
    lienSuivi.current = true;
    setCode(recu);
    void verifier(recu);
    // Une seule fois, à l'arrivée par un lien : la saisie suivante passe par le formulaire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, codeDuChemin]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await verifier(code);
  }

  async function verifier(brut: string) {
    /*
     * Les codes sont émis en capitales : « MM- » suivi de DIX caractères d'un seul tenant.
     * Quelqu'un qui recopie depuis un PDF colle une espace de fin, saisit en minuscules ou
     * ajoute des tirets : normaliser ici évite un « introuvable » qui serait une erreur de
     * saisie présentée comme un verdict sur le document.
     */
    const nu = brut.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleaned = nu.startsWith('MM') ? `MM-${nu.slice(2)}` : nu;
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

  const busy = result.kind === 'searching';

  return (
    <div className="eg1">
      <SEOHead title={t('verify.seoTitle')} description={t('verify.seoDescription')} />

      <EduNightHero
        center
        size="m"
        script={t('verify.script')}
        title={t('verify.titleLines', { returnObjects: true }) as string[]}
        lede={t('verify.lede')}
      >
        {/* UN VRAI <form> : Entrée valide depuis le champ — le seul geste de cette page. */}
        <form onSubmit={onSubmit} noValidate>
          <div className="eg1-codeform">
            <label htmlFor="verify-code" className="sr-only">{t('verify.codeLabel')}</label>
            <input
              id="verify-code"
              value={code}
              onChange={(e) => { setCode(e.target.value); if (error) setError(undefined); }}
              placeholder={t('verify.codeLabel')}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="verify-code-hint"
            />
            <button className="mm-pill" type="submit" disabled={busy} aria-busy={busy}>
              {t('verify.submit')}
              <i><Icon name="arrow-up-right" size={14} strokeWidth={2.2} /></i>
            </button>
          </div>
          <p id="verify-code-hint" className="eg1-codehelp">{t('verify.codeHint')}</p>
          {error && <p className="eg1-codeerr" role="alert">{error}</p>}
        </form>
      </EduNightHero>

      <section className="eg1-wrap is-last" style={{ paddingTop: '56px' }}>
        <div className="eg1-result">
          {/*
            `aria-live="polite"` — la réponse arrive SANS changement de page ni déplacement du
            focus. Sans cette région, un lecteur d'écran ne dit rien du tout.
          */}
          <div aria-live="polite">
            {result.kind === 'found' ? (
              <ValidCertificate certificate={result.certificate} formatDate={formatDate} />
            ) : result.kind === 'unknown' ? (
              <Verdict tone="warn" title={t('verify.notFoundTitle')} body={t('verify.notFoundBody')} contact />
            ) : result.kind === 'failed' ? (
              <Verdict tone="stop" title={t('verify.failedTitle')} body={t('verify.failedBody')} />
            ) : (
              <div className="eg1-cert is-idle">
                <span className="mm-eyebrow">{t('verify.idleTitle')}</span>
                <p className="m-0 mt-3 max-w-[44ch] text-[15px] leading-[1.6] text-ink-2">{t('verify.idleBody')}</p>
              </div>
            )}
          </div>

          <div className="eg1-side">
            <div className="mm-card is-soft">
              <h3>{t('verify.howTitle')}</h3>
              <p>{t('verify.howBody')}</p>
            </div>
            <div className="mm-card">
              <h3>{t('verify.truthTitle')}</h3>
              <p>{t('verify.truthBody')}</p>
            </div>
            <div className="eg1-miss">
              <b>{t('verify.missTitle')}</b>
              <span>{t('verify.missBody')}</span>
            </div>
          </div>
        </div>
      </section>

      <EduPreFooter source="edu-verifier" />
    </div>
  );
}

interface VerdictProps {
  tone: 'warn' | 'stop';
  title: string;
  body: string;
  contact?: boolean;
}

/** Les deux réponses négatives : distinctes, et jamais confondues (voir l'en-tête). */
function Verdict({ tone, title, body, contact = false }: VerdictProps) {
  const { t } = useTranslation('lms');
  const color = tone === 'warn' ? 'var(--warn)' : 'var(--stop)';
  return (
    <div className="eg1-cert is-bad" style={{ borderColor: color }}>
      <div className="flex items-start gap-[13px]">
        <span aria-hidden="true" className="grid h-[42px] w-[42px] flex-none place-items-center rounded-pill" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
          <Icon name="alert" size={21} color={color} />
        </span>
        <div>
          <p className="m-0 text-[19px] font-bold" style={{ color }}>{title}</p>
          <p className="mt-[6px] mb-0 max-w-[48ch] text-[14.5px] leading-[1.6] text-ink-2">{body}</p>
        </div>
      </div>
      {contact && (
        <LocalizedLink to="/contact" className="mm-pill is-sm is-plain mt-5" style={{ display: 'inline-flex' }}>
          {t('verify.contact')}
        </LocalizedLink>
      )}
    </div>
  );
}

interface ValidCertificateProps {
  certificate: CertificateLookup;
  formatDate: (value: string) => string;
}

/**
 * LE CERTIFICAT AUTHENTIQUE, au gabarit de la maquette. Chaque valeur vient de la base ; la
 * ligne « Leçons validées » n'y est pas — voir l'en-tête du fichier.
 */
function ValidCertificate({ certificate, formatDate }: ValidCertificateProps) {
  const { t } = useTranslation('lms');
  const issuedAt = new Date(certificate.issuedAt);

  return (
    <div className="eg1-cert">
      <span className="mm-tag is-ok"><i />{t('verify.validTitle')}</span>
      <span className="mm-eyebrow" style={{ display: 'flex', marginTop: '22px' }}>{t('verify.kind')}</span>
      <b className="eg1-cert__title">{certificate.formationTitle}</b>
      <span className="eg1-cert__who">{certificate.holderName}</span>
      <div className="eg1-cert__facts">
        <div>
          <span>{t('verify.issuedOn')}</span>
          <b><Num value={formatDate(certificate.issuedAt)} source="db" asOf={issuedAt} /></b>
        </div>
        <div>
          <span>{t('verify.code')}</span>
          <b><Num value={certificate.certificateCode} source="db" asOf={issuedAt} /></b>
        </div>
      </div>
      <div className="eg1-cert__foot">
        <span>{t('verify.validIssuer')}</span>
        <LogoMark size={40} />
      </div>
      <LocalizedLink to={`/certificat/${certificate.certificateCode}`} className="mm-pill is-sm mt-5" style={{ display: 'inline-flex' }}>
        {t('verify.openCertificate')}
        <i><Icon name="arrow-up-right" size={14} strokeWidth={2.2} /></i>
      </LocalizedLink>
    </div>
  );
}
