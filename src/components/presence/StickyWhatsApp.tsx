import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@ds';
import { whatsappUrl } from '../../lib/presence/whatsapp';

interface Props {
  /** Message pré-rempli, construit à partir du pack sélectionné le cas échéant. */
  message?: string;
}

/**
 * Bouton WhatsApp collant, mobile uniquement.
 *
 * La cible vit dans WhatsApp : lui imposer de remonter jusqu'au formulaire pour
 * poser une question fait perdre le contact. Le bouton n'apparaît qu'après le hero,
 * pour ne pas recouvrir le premier écran.
 */
export default function StickyWhatsApp({ message }: Props) {
  const { t } = useTranslation('presence');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  const href = whatsappUrl(message);

  /*
   * Chrome fixe — donc l'un des trois seuls endroits où le flou est autorisé (règle 1).
   * Il n'en porte pourtant pas : ce bouton est plein, opaque, posé sur du contenu qui
   * défile dessous. Un voile flouté derrière un aplat ne se verrait pas, et coûterait
   * une couche de composition à chaque image sur les téléphones que cette offre vise.
   */
  return (
    <div
      className="fixed inset-x-4 bottom-4 z-40 lg:hidden"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Button href={href} tone="digitalise" target="_blank">
        {t('stickyCta')}
      </Button>
    </div>
  );
}
