import { useTranslation } from 'react-i18next';
import LocalizedLink from '../shared/LocalizedLink';
import PopupHeading from './PopupHeading';
import { CTA_TRANSFORME, DISMISS, BODY, ACTIONS, LINK_TRANSFORME } from './popupStyles';
import { Icon } from '@ds';

/**
 * Retenue à la sortie de `/club-des-digitos`.
 *
 * ── CE QU'ELLE NE REDIT PAS, ET POURQUOI ─────────────────────────────────────────────────
 *
 * Ni le prix, ni le mensuel, ni le prix parrainé, ni ce que contient l'abonnement. La page les
 * affiche déjà — le prix trois fois, le contenu dans un panneau dédié. Une fenêtre qui les
 * répéterait deux secondes plus tard ferait exactement ce que `BlogEndPopup` documente avoir
 * arrêté de faire : proposer une seconde fois la même chose, et donner l'impression d'être
 * poursuivi. Deux sollicitations ne se justifient que si elles disent deux choses différentes.
 *
 * ── CE QU'ELLE DIT, ET QUE LA PAGE TAIT ──────────────────────────────────────────────────
 *
 * L'ÉTAPE SUIVANTE. Le bouton « Je rejoins le Club » de la page pointe vers `/mon-espace/club`,
 * et ce chemin est GARDÉ (`ProtectedRoute`). Un visiteur déconnecté qui l'active tombe sur un
 * mur de connexion qu'aucun texte ne lui avait annoncé — c'est le décrochage que cette fenêtre
 * adresse, et le seul. Elle nomme la marche, et propose de la monter : créer le compte, qui est
 * gratuit, puis l'abonnement depuis l'espace.
 *
 * ⚠️ **Aucune mention du prix parrainé.** `clubReferralPrice()` existe (16 915 F), mais la
 * remise s'applique côté serveur à un filleul PORTEUR d'un code, et les codes vivent dans
 * l'espace apprenant — où `PopupManager`, monté dans `PublicLayout`, ne va jamais. L'afficher
 * ici serait annoncer un tarif que le visiteur n'a aucun moyen d'obtenir.
 *
 * ⚠️ Registre : TUTOIEMENT, celui de la page qui la porte.
 */

interface ClubExitPopupProps {
  onAccept: () => void;
  onSecondary: () => void;
  onDismiss: () => void;
}

export default function ClubExitPopup({ onAccept, onSecondary, onDismiss }: ClubExitPopupProps) {
  const { t } = useTranslation('shared');

  return (
    <div>
      <PopupHeading
        eyebrow={t('popups.clubExit.eyebrow')}
        title={t('popups.clubExit.title')}
        sticker={t('popups.clubExit.sticker')}
        tone="transforme"
      />

      <p className={BODY}>{t('popups.clubExit.text')}</p>

      <div className={ACTIONS}>
        <LocalizedLink to="/inscription" onClick={onAccept} className={CTA_TRANSFORME}>
          {t('popups.clubExit.cta')}
          <Icon name="forward" size={16} className="group-hover:translate-x-1 transition-transform" />
        </LocalizedLink>
        {/*
          Sortie pour qui a DÉJÀ un compte : la fenêtre ne doit pas renvoyer vers une inscription
          quelqu'un qui n'en a pas besoin. Elle mène au seul endroit où l'abonnement se crée.
        */}
        <LocalizedLink to="/mon-espace/club" onClick={onSecondary} className={LINK_TRANSFORME}>
          {t('popups.clubExit.secondary')}
        </LocalizedLink>
        <button type="button" onClick={onDismiss} className={DISMISS}>
          {t('popups.clubExit.dismiss')}
        </button>
      </div>

      {/* La contrainte, nommée — le produit ne cache pas que la marche existe. */}
      <p className="mt-3 mb-0 text-xs leading-[1.5] text-white/50">{t('popups.clubExit.note')}</p>
    </div>
  );
}
