import { useTranslation } from 'react-i18next';
import PopupHeading from './PopupHeading';
import NewsletterForm from '../shared/NewsletterForm';
import { DISMISS, BODY } from './popupStyles';

/**
 * Fin d'article : capture email.
 *
 * ⚠️ **Elle propose l'email et JAMAIS une formation.** `FormationCTA` occupe déjà le bas de chaque
 * article et recommande une formation contextuelle : présenter la même offre deux secondes plus
 * tard, dans une fenêtre, ferait doublon et donnerait l'impression d'être poursuivi. Deux
 * sollicitations ne se justifient que si elles proposent deux choses différentes.
 *
 * ⚠️ Surface `sheet` sous `lg`, imposée par le registre : le trafic blog est très majoritairement
 * organique, et une modale y tomberait sous la pénalité « interstitiel intrusif » de Google.
 */

interface BlogEndPopupProps {
  onDismiss: () => void;
}

export default function BlogEndPopup({ onDismiss }: BlogEndPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <PopupHeading
        eyebrow={t('popups.blogEnd.eyebrow')}
        title={t('popups.blogEnd.title')}
        sticker={t('popups.blogEnd.sticker')}
        tone="brand"
      />

      <p className={BODY}>{t('popups.blogEnd.text')}</p>

      {/*
        `source` distingue ces inscriptions de celles du pied de page : sans quoi on ne saurait
        jamais si cette fenêtre apporte des abonnés ou si elle capte ceux qui se seraient inscrits
        de toute façon.
      */}
      <div className="mt-4 lg:mt-6">
        <NewsletterForm variant="inline" source="popup-blog-end" />
      </div>

      <button type="button" onClick={onDismiss} className={`mt-3 ${DISMISS}`}>
        {t('popups.blogEnd.dismiss')}
      </button>
    </div>
  );
}
