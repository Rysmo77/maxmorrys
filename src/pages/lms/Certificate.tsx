import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import LocalizedLink from '../../components/shared/LocalizedLink';
import { Award, CheckCircle, Loader2, Share2, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import { getCollection } from '../../lib/firestore';
import { useFormat } from '../../hooks/useFormat';
import type { Certificate as CertificateType } from '../../types';
import { trackCertificateEarned, trackShare } from '../../lib/tracking';
import SEOHead from '../../components/seo/SEOHead';
import { where } from 'firebase/firestore';

export default function Certificate() {
  const { t } = useTranslation('lms');
  const { formatDate } = useFormat();
  const { code } = useParams();
  const [certificate, setCertificate] = useState<CertificateType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) { setNotFound(true); setLoading(false); return; }
    getCollection<CertificateType>('certificates', where('certificateCode', '==', code))
      .then((certs) => {
        if (certs.length > 0) {
          setCertificate(certs[0]);
          trackCertificateEarned(certs[0].formationTitle, certs[0].certificateCode);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [code]);

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(t('certificate.shareText', { title: certificate?.formationTitle }));
    const url = encodeURIComponent(window.location.href);
    let shareUrl = '';
    if (platform === 'linkedin') shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${url}`;
    else if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${text}%20${url}`;
    else if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
    if (certificate) trackShare(platform, 'certificate', certificate.certificateCode);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" aria-label={t('certificate.loadingAria')} />
      </div>
    );
  }

  if (notFound || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Award className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t('certificate.notFoundTitle')}</h1>
          <p className="text-neutral-500 mb-6">{t('certificate.notFoundText')}</p>
          <LocalizedLink to="/">
            <Button icon={<ArrowLeft className="w-4 h-4" />}>{t('certificate.backHome')}</Button>
          </LocalizedLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-50/30 dark:from-neutral-950 dark:to-brand-950/20 flex items-center justify-center px-4 py-16">
      <SEOHead
        title={t('certificate.seoTitle', { title: certificate.formationTitle })}
        description={t('certificate.seoDescription', { title: certificate.formationTitle })}
        noIndex
      />
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Certificate card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-800 p-8 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 border-2 border-white rounded-full" />
              <div className="absolute bottom-4 right-4 w-24 h-24 border-2 border-white rounded-full" />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <p className="text-brand-200 text-xs font-bold tracking-[0.3em] uppercase mb-2">{t('certificate.badge')}</p>
              <h1 className="text-2xl sm:text-3xl font-black">{t('certificate.academy')}</h1>
            </div>
          </div>

          {/* Certificate body */}
          <div className="p-8 sm:p-12 text-center">
            <p className="text-sm text-neutral-500 mb-2">{t('certificate.attests')}</p>
            <div className="py-4 border-b border-neutral-200 dark:border-neutral-700 mb-4">
              <p className="text-xs text-neutral-400 mb-1">{t('certificate.certifiedStudent')}</p>
            </div>

            <p className="text-sm text-neutral-500 mb-2">{t('certificate.completedFormation')}</p>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mb-6">
              {certificate.formationTitle}
            </h2>

            <div className="flex items-center justify-center gap-2 text-success-600 dark:text-success-400 mb-8">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">{t('certificate.completed100')}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-neutral-500">
              <div className="text-center">
                <p className="text-xs text-neutral-400 mb-0.5">{t('certificate.issuedDate')}</p>
                <p className="font-medium text-neutral-700 dark:text-neutral-300">{formatDate(certificate.issuedAt)}</p>
              </div>
              <div className="hidden sm:block w-px h-8 bg-neutral-200 dark:bg-neutral-700" />
              <div className="text-center">
                <p className="text-xs text-neutral-400 mb-0.5">{t('certificate.verificationCode')}</p>
                <p className="font-mono font-medium text-neutral-700 dark:text-neutral-300">{certificate.certificateCode}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-6 bg-neutral-50 dark:bg-neutral-800/50">
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare('linkedin')}
                icon={<Share2 className="w-3.5 h-3.5" />}
              >
                LinkedIn
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare('whatsapp')}
                icon={<Share2 className="w-3.5 h-3.5" />}
              >
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare('twitter')}
                icon={<Share2 className="w-3.5 h-3.5" />}
              >
                Twitter
              </Button>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <LocalizedLink to="/" className="text-sm text-neutral-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            {t('certificate.backToSite')}
          </LocalizedLink>
        </div>
      </motion.div>
    </div>
  );
}
