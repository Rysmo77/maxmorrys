import { useTranslation } from 'react-i18next';
import PopupHeading from './PopupHeading';
import { SITE_URL } from '../seo/seo-config';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { DISMISS, BODY, NOTE } from './popupStyles';

/**
 * Fin d'article. ⚠️ Le contenu reste la CAPTURE (flux, compte), jamais une formation :
 * `FormationCTA` occupe déjà le bas de l'article.
 *
 * Les deux actions sont des `mm-btn is-quiet` : sur la surface nuit d'avant, le ton discret du
 * kit rendait du noir sur du noir ; sur la tuile `bento` qui suit le thème, il redevient juste.
 */
interface BlogEndPopupProps {
  onDismiss: () => void;
}

function Canal({ label, action, href, last }: { label: string; action: string; href: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-3 ${last ? '' : 'border-b border-[color:var(--line)]'}`}>
      <b className="text-[14.5px] text-ink">{label}</b>
      <a href={href} className="mm-btn is-quiet is-sm shrink-0">{action}</a>
    </div>
  );
}

export default function BlogEndPopup({ onDismiss }: BlogEndPopupProps) {
  const { t } = useTranslation('shared');
  const path = useLocalizedPath();

  return (
    <div>
      <PopupHeading
        tone="hub"
        eyebrow={t('popups.blogEnd.eyebrow')}
        title={t('popups.blogEnd.title')}
        highlight={t('popups.blogEnd.sticker')}
      />
      <p className={BODY}>{t('popups.blogEnd.text')}</p>

      <div className="mt-4 wide:mt-6">
        <Canal label={t('popups.blogEnd.rss')} action={t('popups.blogEnd.rssAction')} href={`${SITE_URL}/rss.xml`} />
        <Canal label={t('popups.blogEnd.alert')} action={t('popups.blogEnd.alertAction')} href={path('/inscription')} last />
        <p className={NOTE}>{t('popups.blogEnd.noEmail')}</p>
      </div>

      <button type="button" onClick={onDismiss} className={`mt-4 ${DISMISS}`}>
        {t('popups.blogEnd.dismiss')}
      </button>
    </div>
  );
}
