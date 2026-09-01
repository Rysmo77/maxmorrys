import { useTranslation } from 'react-i18next';
import { Button } from '@ds';
import PopupHeading from './PopupHeading';
import { SITE_URL } from '../seo/seo-config';
import { useLocalizedPath } from '../../contexts/LanguageContext';
import { DISMISS, BODY } from './popupStyles';

/**
 * Fin d'article : ce qu'on peut suivre.
 *
 * ── CE QUE CETTE FENÊTRE NE DEMANDE PLUS, ET POURQUOI ────────────────────────────────────
 *
 * Elle servait un champ d'e-mail, un bouton « S'inscrire » et l'étiquette « 1 email /
 * semaine », à 90 % de lecture d'un article. Trois écrans plus haut, la même page écrit :
 * « Il n'y a pas encore de lettre par e-mail. Je ne te fais pas remplir un champ qui ne sert
 * à rien. » (`Blog.tsx`, bande « Suivre les publications »). Le produit disait donc deux
 * choses opposées au même visiteur, sur le même article.
 *
 * Et la promesse était fausse des deux côtés : **il n'existe aucun expéditeur d'e-mail dans
 * le produit** — ni nodemailer, ni SendGrid, ni Mailgun, ni MailChannels, ni Resend. Le seul
 * e-mail qui parte réellement est celui de réinitialisation de Firebase Auth. « Reçois chaque
 * semaine » était donc un engagement que rien ne pouvait tenir, sur le registre de pop-ups le
 * plus large du site. R-13 : « Ne jamais promettre un e-mail. »
 *
 * La fenêtre propose désormais les DEUX canaux qui existent vraiment, ceux-là mêmes que la
 * maquette met dans la bande du blog : le flux RSS, et l'alerte dans l'espace personnel —
 * qui est, elle, réellement branchée (centre de notifications applicatif).
 *
 * `NewsletterForm` et la collection Firestore `newsletter` ne sont pas supprimés : les
 * adresses déjà recueillies restent, et le formulaire redeviendra montable le jour où un
 * canal d'envoi existera. Il n'est simplement plus servi — voir le commentaire d'en-tête de
 * `components/shared/NewsletterForm.tsx`.
 *
 * ⚠️ **Elle ne propose JAMAIS une formation.** `FormationCTA` occupe déjà le bas de chaque
 * article et recommande une formation contextuelle : présenter la même offre deux secondes
 * plus tard, dans une fenêtre, ferait doublon et donnerait l'impression d'être poursuivi.
 * Deux sollicitations ne se justifient que si elles proposent deux choses différentes.
 *
 * ⚠️ Surface `sheet` sous `lg`, imposée par le registre : le trafic blog est très
 * majoritairement organique, et une modale y tomberait sous la pénalité « interstitiel
 * intrusif » de Google.
 */

interface BlogEndPopupProps {
  onDismiss: () => void;
}

/** Une ligne « ce canal · l'action qui l'ouvre ». Filet sauf sur la dernière. */
function Canal({ label, action, href, last }: { label: string; action: string; href: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-[11px] ${
        last ? '' : 'border-b border-white/10'
      }`}
    >
      <b className="text-[14px] text-white/90">{label}</b>
      <Button href={href} tone="quiet" size="sm" fullWidth={false}>
        {action}
      </Button>
    </div>
  );
}

export default function BlogEndPopup({ onDismiss }: BlogEndPopupProps) {
  const { t } = useTranslation('shared');
  const path = useLocalizedPath();

  return (
    <div>
      <PopupHeading
        eyebrow={t('popups.blogEnd.eyebrow')}
        title={t('popups.blogEnd.title')}
        sticker={t('popups.blogEnd.sticker')}
        tone="brand"
      />

      <p className={BODY}>{t('popups.blogEnd.text')}</p>

      <div className="mt-4 lg:mt-6">
        <Canal
          label={t('popups.blogEnd.rss')}
          action={t('popups.blogEnd.rssAction')}
          href={`${SITE_URL}/rss.xml`}
        />
        <Canal
          label={t('popups.blogEnd.alert')}
          action={t('popups.blogEnd.alertAction')}
          href={path('/inscription')}
          last
        />
        {/* La contrainte, nommée — exactement comme sur la page qui porte cette fenêtre. */}
        <p className="mt-2 mb-0 text-xs leading-[1.5] text-white/50">{t('popups.blogEnd.noEmail')}</p>
      </div>

      <button type="button" onClick={onDismiss} className={`mt-3 ${DISMISS}`}>
        {t('popups.blogEnd.dismiss')}
      </button>
    </div>
  );
}
