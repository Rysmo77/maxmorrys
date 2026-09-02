import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { CTA_TRANSFORME, DISMISS, BODY, ACTIONS, LINK_TRANSFORME } from './popupStyles';
import { Icon } from '@ds';

/**
 * Fin d'un podcast ou d'une vidéo — la sortie que ces deux fiches n'ont pas.
 *
 * ⚠️ **CES PAGES SONT DES CULS-DE-SAC, et c'est le motif de cette fenêtre.** L'article de blog
 * porte `FormationCTA` en bas ; `VideoDetail` et `PodcastDetail` ne portent RIEN de comparable —
 * leur seul bouton, en tête, renvoie vers le pôle média d'où l'on vient. Quelqu'un qui termine
 * une vidéo n'a donc, aujourd'hui, aucune suite proposée. C'est l'inverse exact de la situation
 * du blog, où la fenêtre devait s'interdire de redire ce que la page disait déjà.
 *
 * ⚠️ **Elle ne propose PAS une formation.** Au relevé du 30 août 2026 la base porte 0 formation
 * publiée : le catalogue ne peut rien tenir. Le Club, lui, est adossé à ce qui existe vraiment —
 * sessions en direct, ateliers, quota de tuteur — et ne dépend pas du catalogue.
 *
 * ⚠️ **Elle mène à la page publique du Club, jamais à l'abonnement.** Quelqu'un qui vient de
 * regarder une vidéo gratuite n'est pas à un clic d'un engagement de douze mois. La page
 * publique explique, chiffre, et laisse décider — et `ClubExitPopup` prend le relais là-bas si
 * la personne repart. Le plafond d'une pop-up par session garantit qu'elle n'en verra pas deux.
 *
 * ⚠️ `MediaPole` pose une règle que cette fenêtre respecte plutôt qu'elle ne contourne : « le
 * passage vers le Club EN BAS, jamais devant ». Déclencheur `scroll` à 90 % de lecture — donc
 * en bas, et après le contenu, jamais pendant.
 */

interface MediaEndPopupProps {
  onAccept: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
}

export default function MediaEndPopup({ onAccept, onSecondary, onDismiss }: MediaEndPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <PopupHeading
        eyebrow={t('popups.mediaEnd.eyebrow')}
        title={t('popups.mediaEnd.title')}
        sticker={t('popups.mediaEnd.sticker')}
        tone="transforme"
      />

      <p className={BODY}>{t('popups.mediaEnd.text')}</p>

      <div className={ACTIONS}>
        <LocalizedLink to="/club-des-digitos" onClick={onAccept} className={CTA_TRANSFORME}>
          {t('popups.mediaEnd.cta')}
          <Icon name="forward" size={16} className="group-hover:translate-x-1 transition-transform" />
        </LocalizedLink>
        {/* La sortie gratuite reste offerte : tout le pôle média est en accès libre. */}
        <LocalizedLink to="/podcast-et-videos" onClick={onSecondary} className={LINK_TRANSFORME}>
          {t('popups.mediaEnd.secondary')}
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.mediaEnd.dismiss')}
        </button>
      </div>
    </div>
  );
}
