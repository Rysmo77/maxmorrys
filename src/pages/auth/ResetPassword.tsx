import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, GlassPanel, Icon } from '@ds';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { localizeAuthError } from '../../lib/auth-errors';
import { AuthPage, SiteEyebrow } from '../../components/site';
import { useLocalizedPath } from '../../contexts/LanguageContext';

/**
 * /mot-de-passe-oublie — l'écran qui refuse de rendre service.
 *
 * Il ne dit JAMAIS si une adresse a un compte. C'est délibéré, et le kit prend la peine de
 * l'expliquer à la personne plutôt que de la laisser trouver la réponse évasive :
 *
 *   « Ça paraît moins serviable, mais ça évite qu'un inconnu puisse tester des adresses pour
 *     savoir qui est inscrit. »
 *
 * ⚠️ ET IL AVOUE UNE DETTE. Le produit n'a AUCUN canal d'envoi d'e-mail. Le lien de
 * réinitialisation part par Firebase Auth, pas par le produit — mais tout ce qui relève du
 * produit lui-même (relances, notifications, lettres d'information) n'a pas de canal, et le
 * système interdit de promettre le contraire. La note en pied le dit au lieu de le taire.
 */
export default function ResetPassword() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { addToast } = useToast();
  const path = useLocalizedPath();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      addToast('success', t('reset.successToast'));
    } catch (error: unknown) {
      /*
       * `auth/user-not-found` EST UNE RÉUSSITE SUR CET ÉCRAN.
       *
       * L'encart de vérité juste en dessous s'intitule « Pourquoi ce "si" » et promet : « Je
       * ne te dirai jamais si une adresse a un compte ou non. » Le chemin d'erreur faisait
       * exactement l'inverse : Firebase levait `auth/user-not-found` et l'écran affichait
       * « Aucun compte ne correspond à cet email » en toast. Autrement dit, l'énumération de
       * comptes que la page jure d'empêcher était servie par la page elle-même — il suffisait
       * d'essayer des adresses une par une.
       *
       * On rend donc la MÊME réponse dans les deux cas. Les autres erreurs (réseau, trop de
       * tentatives, adresse malformée) restent dites : elles ne révèlent rien sur qui est
       * inscrit, et les taire empêcherait de corriger une faute de frappe.
       */
      const code = (error as { code?: string } | null)?.code;
      if (code === 'auth/user-not-found') {
        setSent(true);
        addToast('success', t('reset.successToast'));
      } else {
        addToast('error', localizeAuthError(error, t));
      }
    }
    setLoading(false);
  };

  return (
    <AuthPage
      titleLines={t('reset.titleLines', { returnObjects: true }) as string[]}
      seoTitle={t('reset.title')}
      noIndex
      footer={
        <>
          <GlassPanel level="truth" className="rv mt-[14px]" style={{ ['--i' as string]: 6 }}>
            <SiteEyebrow style={{ marginBottom: '6px' }}>{t('reset.truthTitle')}</SiteEyebrow>
            <p className="m-0 text-meta-2 text-ink-2 leading-[1.5]">{t('reset.truthBody')}</p>
          </GlassPanel>

          {/* La dette, écrite. Ne jamais promettre un canal que le produit n'a pas. */}
          <p className="mt-3 text-center text-small text-ink-2 leading-[1.5]">
            {t('reset.debtNote')}
          </p>

          <p className="mt-4 text-center text-meta">
            <a href={path('/connexion')} className="text-ink-2">{t('reset.back')}</a>
          </p>
        </>
      }
    >
      <p className="m-0 mb-[14px] text-lede text-ink-2">
        {sent ? t('reset.subtitleSent') : t('reset.subtitleDefault')}
      </p>

      {sent ? (
        /*
          La carte de confirmation. Bordure verte plutôt qu'un fond vert : sur un panneau qui
          est déjà du verre, un second aplat serait le troisième fond que le système interdit.
        */
        <div
          className="rounded-m border p-4 flex gap-3 items-start"
          style={{ borderColor: 'color-mix(in srgb, var(--ok) 28%, transparent)' }}
        >
          <span
            aria-hidden="true"
            className="shrink-0 w-[30px] h-[30px] rounded-full grid place-items-center"
            style={{ background: 'color-mix(in srgb, var(--ok) 16%, transparent)' }}
          >
            <Icon name="check" size={15} color="var(--ok)" strokeWidth={3.2} />
          </span>
          <div>
            <p className="m-0 font-bold text-meta" style={{ color: 'var(--ok)' }}>
              {t('reset.sentTitle')}
            </p>
            <p className="m-0 mt-1 text-meta-2 text-ink-2 leading-[1.5]">
              {t('reset.subtitleSent')}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Field
            label={t('reset.emailLabel')}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t('reset.emailPlaceholder')}
            inputMode="email"
            autoComplete="email"
            required
            style={{ marginTop: 0 }}
          />
          <Button type="submit" tone="forme" loading={loading} disabled={loading} style={{ marginTop: '17px' }}>
            {loading ? t('reset.submitting') : t('reset.submit')}
          </Button>
        </form>
      )}
    </AuthPage>
  );
}
