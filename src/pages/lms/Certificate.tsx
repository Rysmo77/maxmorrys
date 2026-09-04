import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, GlassPanel, Icon, Mesh, Num, Skeleton, Tag, Wordmark } from '@ds';
import { getCertificateByCode } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { SiteDisplay, SiteEyebrow, useReveal } from '../../components/site';
import DsNavHost from '../../components/layout/DsNavHost';
import type { CertificateLookup } from '../../types';
import { trackCertificateEarned, trackShare } from '../../lib/tracking';
import ShareButtons from '../../components/shared/ShareButtons';
import { shareLink } from '../../lib/share/links';
import SEOHead from '../../components/seo/SEOHead';

/**
 * LE CERTIFICAT — LE SECOND DES DEUX SEULS MOMENTS SCÉNARISÉS DU SYSTÈME.
 *
 * Le kit (`ScreensPay.js` · `Certificat`) pose `.sheen` sur le panneau héros : une brillance
 * qui balaie la carte DEUX FOIS, à 0,9 s, puis s'arrête. Elle ne se rejoue pas au défilement,
 * et elle n'existe nulle part ailleurs dans le produit. C'est une licence, pas un motif :
 * le seul autre endroit qui y a droit est l'attente de paiement (`.pulse`).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CET ÉCRAN NE RECOPIE PAS DU KIT
 *
 * La maquette écrit « Les 47 leçons ont été recomptées côté serveur ». `CertificateLookup`
 * ne porte PAS de nombre de leçons — il porte le code, le titre, la date et le nom. Le 47 est
 * une donnée de démonstration, et un nombre de démonstration finit toujours en production
 * (règle 6). L'encart de vérité dit donc la même chose SANS le chiffre : c'est la phrase qui
 * porte la preuve, et elle reste vraie — `issueCertificate` re-dérive la complétion depuis
 * l'ensemble réel des leçons, pas depuis le pourcentage envoyé par le navigateur.
 *
 * Le kit met aussi le prénom en titre d'affichage (« C'EST FAIT, AÏSSATOU. »). Un titre
 * d'affichage est en `white-space: nowrap` par contrat (AD-13) : un nom de vingt caractères
 * déborderait l'écran de 390 px. Le nom garde sa place dans la carte, où il est cadré.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function Certificate() {
  const { t } = useTranslation('lms');
  const { formatDate } = useFormat();
  const path = useLocalizedPath();
  const { code } = useParams();
  const reveal = useReveal<HTMLDivElement>();
  const [certificate, setCertificate] = useState<CertificateLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) { setNotFound(true); setLoading(false); return; }
    getCertificateByCode(code)
      .then((cert) => {
        if (cert) {
          setCertificate(cert);
          trackCertificateEarned(cert.formationTitle, cert.certificateCode);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [code]);

  /*
   * ── LE PARTAGE EST PASSÉ AU COMPOSANT MUTUALISÉ ──────────────────────────────────────
   *
   * `handleShare` et `handleCopyLink` vivaient ici, en copie locale. Trois défauts que
   * `ShareButtons` avait déjà réglés pour les cinq autres pages qui le montent :
   *
   *   · `window.location.href` n'est pas canonique — le site répond aussi sur l'origine
   *     Firebase, et un certificat partagé depuis là porte un domaine que le destinataire
   *     ne reconnaît pas. `shareLink()` passe par `SITE_URL`.
   *   · pas de Facebook, alors qu'il pèse ici ;
   *   · pas de feuille de partage NATIVE, qui est le geste réel sur un mobile ouest-africain.
   *
   * Le titre partagé reste celui de cette page : c'est le seul endroit qui connaît la
   * formation.
   */
  const shareTitle = t('certificate.shareText', { title: certificate?.formationTitle });

  /*
   * PAS DE ROND QUI TOURNE PENDANT LE CHARGEMENT — c'est le contrat de `Button`, et il vaut
   * pour l'écran entier. Un squelette à la forme de la carte : rien ne saute quand elle
   * arrive. Le maillage est posé dès la première image, donc la page n'est jamais blanche.
   */
  if (loading) {
    return (
      <div className="relative min-h-screen isolate overflow-hidden flex items-center justify-center px-[18px] py-16">
        <Mesh territory="forme" />
        <div className="relative z-[3] w-full max-w-[520px]">
          <GlassPanel level="hero" padding={24}>
            <Skeleton width="34%" height={27} label={t('certificate.loadingAria')} />
            <Skeleton width="82%" height={34} style={{ marginTop: '24px' }} />
            <Skeleton width="42%" height={19} style={{ marginTop: '12px' }} />
            <div className="h-px bg-[color:var(--border-hair)] my-5" />
            <Skeleton width="60%" height={24} />
          </GlassPanel>
        </div>
      </div>
    );
  }

  if (notFound || !certificate) {
    return (
      <div className="relative min-h-screen isolate overflow-hidden flex items-center justify-center px-[18px] py-16">
        <Mesh territory="forme" />
        <DsNavHost className="relative z-[3] w-full max-w-[440px]">
          <SiteDisplay lines={t('certificate.notFoundLines', { returnObjects: true }) as string[]} size={30} />
          <GlassPanel level="flat" padding={20} className="mt-[18px]">
            <EmptyState
              glyph={<Icon name="medal" size={26} color="var(--text-muted)" />}
              title={t('certificate.notFoundTitle')}
              body={t('certificate.notFoundText')}
              action={<Button tone="quiet" fullWidth href={path('/')}>{t('certificate.backHome')}</Button>}
              style={{ padding: 0 }}
            />
          </GlassPanel>
        </DsNavHost>
      </div>
    );
  }

  const issuedAt = new Date(certificate.issuedAt);

  return (
    <div className="relative min-h-screen isolate overflow-hidden px-[18px] py-16 flex items-center justify-center">
      <SEOHead
        title={t('certificate.seoTitle', { title: certificate.formationTitle })}
        description={t('certificate.seoDescription', { title: certificate.formationTitle })}
        noIndex
      />
      <Mesh territory="forme" />

      <DsNavHost className="relative z-[3] w-full max-w-[520px]">
        <div ref={reveal}>
          <SiteEyebrow>{t('certificate.issuedOn', { date: formatDate(certificate.issuedAt) })}</SiteEyebrow>
          <SiteDisplay lines={[t('certificate.doneLine')]} size={30} from={1} />

          {/*
            `.sheen` — la brillance qui passe deux fois. Elle vit sur `.glass-hero`, qui ne
            porte AUCUN flou : le kit y mettait un `blur(30px)`, et cette carte défile sur un
            écran étroit. Le voile de .58 tient le contraste sans lui.
          */}
          <GlassPanel level="hero" padding={24} className="sheen rv-s mt-5" style={{ ['--i' as string]: 4 }}>
            <div className="flex items-start justify-between gap-3">
              <Wordmark brand="signature" size={26} />
              <Tag tone="ok">{t('certificate.verified')}</Tag>
            </div>

            <SiteEyebrow style={{ marginTop: '22px' }}>{t('certificate.certificateOf')}</SiteEyebrow>
            <p className="font-display text-dsp-xs text-ink m-0">{certificate.formationTitle}</p>

            {certificate.holderName && (
              <p className="text-body text-ink-2 mt-2.5 mb-0">
                {t('certificate.deliveredTo')} <b className="text-ink">{certificate.holderName}</b>
              </p>
            )}

            <div className="h-px bg-[color:var(--border-hair)] my-[19px]" />

            <SiteEyebrow style={{ margin: 0 }}>{t('certificate.verificationCode')}</SiteEyebrow>
            {/* Le code de vérification passe par <Num> : il vient de la base, il porte donc
                sa provenance au survol et sa face tabulaire. C'est le seul chemin autorisé
                vers la monospace (règle 6). */}
            <p className="mt-1 mb-0" style={{ fontSize: '19px', letterSpacing: '.06em' }}>
              <Num value={certificate.certificateCode} source="db" asOf={issuedAt} />
            </p>
            <p className="text-small text-ink-2 mt-2.5 mb-0 leading-[1.5]">{t('certificate.verifiableBy')}</p>
          </GlassPanel>

          {/*
            LINKEDIN GARDE SON BOUTON PROPRE, ET C'EST DÉLIBÉRÉ.

            Le kit dessine UN partage mis en avant, et c'est le seul réseau où un certificat a
            une valeur professionnelle. Il passe simplement par `shareLink()` au lieu du
            gabarit local : `SITE_URL` y remplace `window.location.href`, qui pouvait produire
            l'origine Firebase — un lien partagé sur un domaine que personne ne reconnaît.
          */}
          <Button
            tone="forme"
            href={shareLink('linkedin', `/certificat/${certificate.certificateCode}`, shareTitle)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShare('linkedin', 'certificate', certificate.certificateCode)}
            className="rv mt-[17px]"
            style={{ ['--i' as string]: 6 }}
          >
            <Icon name="share" size={17} color="var(--paper-fixed)" />
            {t('certificate.shareLinkedin')}
          </Button>

          {/*
            Le reste passe au composant mutualisé, monté sur cinq autres pages. Trois choses
            que l'implémentation locale n'avait pas : Facebook, le bouton de copie qu'elle
            portait déjà mais en double, et surtout la FEUILLE DE PARTAGE NATIVE — celle qui
            compte sur un mobile ouest-africain, où l'on partage dans WhatsApp sans passer par
            un bouton de site.
          */}
          <ShareButtons
            className="rv mt-2.5"
            url={`/certificat/${certificate.certificateCode}`}
            title={shareTitle}
            contentType="certificate"
            contentId={certificate.certificateCode}
          />

          <GlassPanel level="truth" className="rv mt-[18px]" style={{ ['--i' as string]: 8 }}>
            <SiteEyebrow style={{ marginBottom: '6px' }}>{t('certificate.whyItCounts')}</SiteEyebrow>
            <p className="text-meta-2 text-ink-2 leading-[1.5] m-0">{t('certificate.whyItCountsBody')}</p>
          </GlassPanel>

          <p className="rv text-center mt-5" style={{ ['--i' as string]: 9 }}>
            <a href={path('/')} className="text-meta text-ink-2">{t('certificate.backToSite')}</a>
          </p>
        </div>
      </DsNavHost>
    </div>
  );
}
